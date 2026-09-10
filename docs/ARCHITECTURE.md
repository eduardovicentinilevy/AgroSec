# Arquitetura Técnica — AgroSec Edge & Cloud

Este documento detalha as decisões técnicas do MVP e o caminho de evolução
para a arquitetura de produção descrita na pesquisa de modelo de negócio
(`Pesquisa de Modelo AgTech`).

## Visão geral dos três componentes

```
┌─────────────────────┐        HTTPS (sync em lote)      ┌──────────────────────────┐
│   Edge Gateway       │ ───────────────────────────────▶ │   Backend (Node/Express)  │
│   Node.js + SQLite    │                                  │   PostgreSQL              │
│   Offline-First        │ ◀─────────────────────────────  │   API RESTful              │
└─────────────────────┘        (ack / conflito)           └───────────┬──────────────┘
                                                                         │ eventos pendentes
                                                                         │ (polling HTTP interno)
                                                              ┌──────────▼──────────────┐
                                                              │  Security Engine (Python) │
                                                              │  Correlação de IoCs /      │
                                                              │  regras de anomalia        │
                                                              └────────────────────────────┘
```

### Por que essa divisão

O currículo de referência combina três frentes: (1) APIs RESTful em
Node.js/Express com PostgreSQL, (2) regras analíticas de segurança em
Python, e (3) arquitetura serverless orientada a eventos no GCP. O MVP
reproduz exatamente essa separação de responsabilidades, mas roda tudo
localmente via `docker-compose` para que o fluxo completo possa ser
validado sem depender de uma conta GCP:

| Papel no MVP (local) | Equivalente em produção (GCP) |
|---|---|
| `POST /api/events` (ingestão síncrona) | Cloud Run / Cloud Functions atrás de um Load Balancer |
| Fila `events.processed = false` no Postgres | Tópico GCP Pub/Sub `agrosec-events` |
| Polling HTTP do `security-engine` | Assinatura push do Pub/Sub disparando Cloud Function (2ª geração) |
| `POST /api/alerts/internal` (callback) | Cloud Function gravando o resultado da correlação de volta no Postgres (Cloud SQL) |
| SQLite no `edge-gateway` | SQLite (gateway Linux) ou Room (app Android) — inalterado, já é o design final |
| `POST /api/sync/batch` | Mesmo endpoint, exposto via Cloud Run |

Essa escolha permite que a migração para GCP seja uma troca de
infraestrutura (deploy do backend em Cloud Run, do security-engine como
Cloud Function assinante do Pub/Sub) **sem reescrever a lógica de
negócio**, que é o objetivo de uma arquitetura serverless orientada a
eventos bem desenhada.

## SIEM-Lite & Incident Correlation

O `security-engine` roda um ciclo de correlação (`run_correlation_cycle`)
que:

1. Busca eventos ainda não processados (`GET /api/events/internal/pending`).
2. Cruza cada evento com a lista de IoCs cadastrados (`GET /api/iocs`).
3. Aplica regras comportamentais (`rules/anomaly_rules.py`): varredura de
   portas na rede de automação, adulteração de rotina de pesagem, e
   indícios de ransomware de dupla extorsão (criptografia em massa,
   exclusão de shadow copies, exfiltração incomum).
4. Publica alertas correlacionados (`POST /api/alerts/internal`).
5. Marca os eventos como processados.

O tempo entre a chegada do evento e a criação do alerta é registrado como
`mttd_seconds` em cada alerta — a métrica de Tempo Médio de Detecção
citada tanto no currículo (redução de 30% no MTTD) quanto na pesquisa de
mercado.

Contenção automatizada (Zero Trust): `POST /api/alerts/:id/contain`
isola o nó afetado (`nodes.status = 'isolated'`) e registra a ação em
`containment_actions`, sem interromper os demais nós da planta — reflete
o isolamento de VLAN descrito na pesquisa para dispositivos legados.

## Offline-First Secure Gateway

Segue o padrão **Local-First, Sync-Later**:

- Toda leitura de campo é gravada primeiro no SQLite local
  (`edge-gateway/src/db.js`), nunca depende de uma chamada de rede bem
  sucedida para ser "aceita".
- Um monitor de conectividade (simulado em `sync.js`) decide quando
  tentar sincronizar.
- O envio é feito em lotes (`sync_batches`) identificados por
  `client_batch_id`, garantindo idempotência: reenviar o mesmo lote após
  uma falha de rede não duplica eventos no backend.
- Resolução de conflito: o MVP usa uma estratégia Last-Write-Wins
  simplificada (cada registro do lote é inserido como evento
  independente, ordenado por `occurred_at`). O caminho de evolução natural
  é adotar CRDTs quando o modelo de dados exigir merge de estado
  compartilhado (não apenas append de eventos).

## LGPD & Data Privacy Automation

O módulo (`backend/src/controllers/lgpd.controller.js`) cobre os quatro
pilares citados na pesquisa:

- **Data Mapping**: `data_mapping` registra onde cada categoria de dado
  pessoal é armazenada, por quanto tempo (`retention_period_days`) e sob
  qual base legal.
- **Gestão de consentimento**: `consents` — concessão e revogação por
  titular (produtor rural), com propósito e categorias de dados
  explícitos.
- **RBAC**: papéis `admin`, `analyst`, `viewer`, `field_operator`
  aplicados via middleware (`requireRole`).
- **Atendimento a solicitações de titulares**: `data_requests` +
  `POST /api/lgpd/requests/:id/fulfill` — exporta os dados do titular ou
  os anonimiza (mantendo o histórico operacional para auditabilidade).

## Monetização refletida no modelo de dados

A tabela `subscriptions` já modela os três formatos de cobrança da
pesquisa: por hectare monitorado, por nó operacional protegido, e o
adicional de governança/conformidade — preparando o backend para a
lógica de billing sem exigir uma nova migração quando essa etapa for
implementada.

## Roteiro de evolução (fases da pesquisa)

1. **Fase 1 (este MVP)**: núcleo da API, modelagem PostgreSQL,
   sincronização offline-first em SQLite.
2. **Fase 2**: substituir o polling do `security-engine` por uma
   assinatura real do GCP Pub/Sub + Cloud Functions; mover eventos brutos
   de alta vazão para um banco NoSQL (Firestore/BigQuery) mantendo o
   Postgres para dados estruturados/transacionais.
3. **Fase 3**: dashboards executivos, faturamento com flexibilidade
   sazonal, e pilotos comerciais com cooperativas.
