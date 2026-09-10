"""
AgroSec Security Engine — motor de correlação de IoCs e detecção de
anomalias, escrito em Python para o processamento das regras analíticas
de segurança (conforme currículo: SIEM, correlação de eventos, IoCs).

Em produção este serviço roda como GCP Cloud Functions (2ª geração)
disparadas por mensagens do GCP Pub/Sub. Para o MVP local, o mesmo
motor de correlação é exposto via FastAPI e também roda um loop de
polling em background que simula o consumo assíncrono do tópico de
eventos, mantendo a mesma lógica de negócio que seria usada na nuvem.
"""

import asyncio
import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI

from rules.anomaly_rules import evaluate_event

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
INTERNAL_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "change-me-internal-token")
POLL_INTERVAL_SECONDS = float(os.getenv("POLL_INTERVAL_SECONDS", "5"))

HEADERS = {"x-internal-token": INTERNAL_TOKEN}

# Estatísticas simples para observabilidade do MTTD (tempo médio de detecção),
# citado como métrica-chave na proposta de negócio do AgroSec SIEM-Lite.
stats = {
    "cycles_run": 0,
    "events_processed": 0,
    "alerts_created": 0,
    "last_cycle_at": None,
}


async def fetch_pending_events(client: httpx.AsyncClient):
    resp = await client.get(f"{BACKEND_URL}/api/events/internal/pending", headers=HEADERS, params={"limit": 200})
    resp.raise_for_status()
    return resp.json()


async def fetch_iocs(client: httpx.AsyncClient):
    resp = await client.get(f"{BACKEND_URL}/api/iocs", headers=HEADERS)
    resp.raise_for_status()
    return resp.json()


async def publish_alert(client: httpx.AsyncClient, org_id, node_id, event_id, ioc_id, finding, mttd_seconds):
    payload = {
        "orgId": org_id,
        "nodeId": node_id,
        "eventId": event_id,
        "iocId": ioc_id,
        "title": finding["title"],
        "description": finding["description"],
        "severity": finding["severity"],
        "mttdSeconds": mttd_seconds,
    }
    resp = await client.post(f"{BACKEND_URL}/api/alerts/internal", headers=HEADERS, json=payload)
    resp.raise_for_status()
    return resp.json()


async def mark_processed(client: httpx.AsyncClient, event_ids):
    if not event_ids:
        return
    resp = await client.post(
        f"{BACKEND_URL}/api/events/internal/mark-processed",
        headers=HEADERS,
        json={"eventIds": event_ids},
    )
    resp.raise_for_status()


def match_ioc(event, iocs):
    source_ip = event.get("source_ip")
    if not source_ip:
        return None
    for ioc in iocs:
        if ioc["ioc_type"] == "ip" and ioc["value"] == source_ip:
            return ioc
    return None


async def run_correlation_cycle(client: httpx.AsyncClient):
    """Um ciclo completo: busca eventos pendentes, correlaciona com IoCs e
    regras comportamentais, publica alertas e marca eventos como processados.
    Equivale ao corpo de uma Cloud Function acionada por uma mensagem Pub/Sub."""

    cycle_start = time.monotonic()
    events = await fetch_pending_events(client)
    if not events:
        stats["last_cycle_at"] = time.time()
        return

    iocs = await fetch_iocs(client)

    events_by_node = defaultdict(list)
    for event in events:
        events_by_node[event.get("node_id")].append(event)

    processed_ids = []

    for event in events:
        node_history = events_by_node.get(event.get("node_id"), [])
        ioc_match = match_ioc(event, iocs)
        finding = evaluate_event(event, node_history)

        if not finding and ioc_match:
            finding = {
                "title": f"Tráfego correlacionado a IoC conhecido ({ioc_match['ioc_type']})",
                "description": f"Origem {event.get('source_ip')} corresponde ao indicador: {ioc_match.get('description') or ioc_match['value']}",
                "severity": ioc_match.get("severity", "medium"),
            }

        if finding:
            mttd_seconds = int(time.monotonic() - cycle_start) + 1
            await publish_alert(
                client,
                org_id=event["org_id"],
                node_id=event.get("node_id"),
                event_id=event["id"],
                ioc_id=ioc_match["id"] if ioc_match else None,
                finding=finding,
                mttd_seconds=mttd_seconds,
            )
            stats["alerts_created"] += 1

        processed_ids.append(event["id"])

    await mark_processed(client, processed_ids)

    stats["cycles_run"] += 1
    stats["events_processed"] += len(events)
    stats["last_cycle_at"] = time.time()


async def polling_loop():
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            try:
                await run_correlation_cycle(client)
            except httpx.HTTPError as exc:
                print(f"[security-engine] erro ao consultar o backend: {exc}")
            await asyncio.sleep(POLL_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(polling_loop())
    yield
    task.cancel()


app = FastAPI(title="AgroSec Security Engine", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "agrosec-security-engine"}


@app.get("/stats")
async def get_stats():
    return stats


@app.post("/run-cycle")
async def trigger_cycle():
    """Dispara um ciclo de correlação manualmente (útil para testes/demo)."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        await run_correlation_cycle(client)
    return stats
