"""
Regras comportamentais do AgroSec SIEM-Lite.

Cada regra recebe um evento normalizado (dict) e o histórico recente de
eventos do mesmo nó, e retorna um alerta (dict) ou None. As regras cobrem
os cenários citados na pesquisa de modelo de negócio: varredura de portas
na rede de automação, alterações imprevistas em rotinas de pesagem, e
indícios de ransomware de dupla extorsão.
"""

from datetime import datetime, timedelta

PORT_SCAN_THRESHOLD = 5
PORT_SCAN_WINDOW_SECONDS = 60

RANSOMWARE_EVENT_TYPES = {
    "file_mass_encryption",
    "shadow_copy_deletion",
    "unusual_outbound_exfiltration",
}

WEIGHING_ANOMALY_TYPES = {
    "weighing_value_tampered",
    "weighing_route_bypassed",
}


def _parse_ts(value):
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def rule_port_scan(event, node_history):
    if event.get("event_type") != "port_probe":
        return None

    occurred_at = _parse_ts(event["occurred_at"])
    window_start = occurred_at - timedelta(seconds=PORT_SCAN_WINDOW_SECONDS)
    recent_probes = [
        e
        for e in node_history
        if e.get("event_type") == "port_probe" and window_start <= _parse_ts(e["occurred_at"]) <= occurred_at
    ]

    if len(recent_probes) >= PORT_SCAN_THRESHOLD:
        return {
            "title": "Varredura de portas detectada na rede de automação",
            "description": (
                f"{len(recent_probes)} tentativas de conexão a portas distintas em "
                f"{PORT_SCAN_WINDOW_SECONDS}s a partir de {event.get('source_ip')}."
            ),
            "severity": "high",
        }
    return None


def rule_ransomware_indicators(event, node_history):
    if event.get("event_type") in RANSOMWARE_EVENT_TYPES:
        return {
            "title": "Indício de ransomware de dupla extorsão",
            "description": (
                f"Evento crítico '{event.get('event_type')}' detectado — possível sequestro "
                "de dados com ameaça de vazamento. Contenção Zero Trust recomendada."
            ),
            "severity": "critical",
        }
    return None


def rule_weighing_tampering(event, node_history):
    if event.get("event_type") in WEIGHING_ANOMALY_TYPES:
        return {
            "title": "Alteração imprevista na rotina de pesagem",
            "description": (
                "Divergência detectada no fluxo de recebimento de commodities "
                "(balança/ERP). Pode indicar fraude ou comprometimento do sistema."
            ),
            "severity": "high",
        }
    return None


RULES = [rule_port_scan, rule_ransomware_indicators, rule_weighing_tampering]


def evaluate_event(event, node_history):
    """Executa todas as regras contra um evento; retorna a primeira detecção."""
    for rule in RULES:
        result = rule(event, node_history)
        if result:
            return result
    return None
