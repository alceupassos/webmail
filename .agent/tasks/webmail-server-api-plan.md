# Plano de Implementação: Webmail Server API

## Objetivo

Expor o webmail como um **servidor REST API** acessível por outros sistemas (WhatsApp, mobile apps, automações) com autenticação via **API Key**.

***

## 📊 Estado Atual

### ✅ Já Implementado

| Componente | Status | Descrição |
|------------|--------|-----------|
| MCP Server | ✅ Completo | `mcp-server.ts` - Protocolo stdio para AI assistants |
| Gmail Driver | ✅ Completo | `lib/google/gmail.ts` - Listagem e detalhes |
| Microsoft Driver | ✅ Completo | `lib/microsoft/microsoft.ts` - OAuth + Graph API |
| IMAP Driver | ✅ Completo | `lib/imap/imap.ts` - Conexão genérica |
| Supabase Persistence | ✅ Completo | Contas de email multi-provider |

### ⚠️ Pendente

| Componente | Status | Descrição |
|------------|--------|-----------|
| REST API pública | ❌ Não existe | Endpoints HTTP para acesso externo |
| Autenticação API Key | ❌ Não existe | Verificação de credenciais |
| Rate Limiting | ❌ Não existe | Proteção contra abuso |

***

## 🎯 Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────┐
│                    Sistemas Externos                         │
│  (WhatsApp Bot, Mobile App, ERP, Automações)                │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS + API Key
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  /api/v1/webmail/*                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Auth Guard  │→ │ Rate Limit  │→ │   Handler   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Email Providers Layer                          │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐              │
│  │  Gmail   │  │  Microsoft   │  │   IMAP   │              │
│  └──────────┘  └──────────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────────┘
```

***

## 📋 Tarefas de Implementação

### Fase 1: Infraestrutura de Autenticação

* \[ ] **1.1** Criar tabela `api_keys` no Supabase
* \[ ] **1.2** Criar middleware de autenticação `lib/api-auth.ts`
* \[ ] **1.3** Criar endpoint de geração de API Key `/api/v1/keys`

### Fase 2: Endpoints REST

* \[ ] **2.1** `GET /api/v1/webmail/emails` - Listar emails
* \[ ] **2.2** `GET /api/v1/webmail/emails/:id` - Detalhes do email
* \[ ] **2.3** `GET /api/v1/webmail/search` - Buscar emails
* \[ ] **2.4** `GET /api/v1/webmail/accounts` - Listar contas
* \[ ] **2.5** `POST /api/v1/webmail/test` - Testar conexão

### Fase 3: Segurança

* \[ ] **3.1** Implementar rate limiting (100 req/min)
* \[ ] **3.2** Logging de acessos
* \[ ] **3.3** CORS configurável

***

## 🔐 Esquema de Autenticação

### Tabela `api_keys` (Supabase)

```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL, -- Primeiros 8 caracteres para identificação
    permissions JSONB DEFAULT '["read"]',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own keys" ON api_keys
    FOR ALL USING (auth.uid() = user_id);
```

### Formato da API Key

```
wm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
│   │    └── 32 caracteres aleatórios (base64url)
│   └── Ambiente (live/test)
└── Prefixo do produto (webmail)
```

***

## 📡 Endpoints da API

### Autenticação

Todas as requisições devem incluir:

```
Authorization: Bearer wm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Endpoints Disponíveis

#### `GET /api/v1/webmail/emails`

Lista emails da caixa de entrada.

**Query Params:**

* `provider`: `gmail` | `microsoft` | `imap` (default: gmail)
* `limit`: número máximo de emails (default: 25, max: 100)
* `account_id`: ID da conta específica (opcional)

**Response:**

```json
{
    "success": true,
    "data": {
        "emails": [...],
        "total": 150,
        "hasMore": true
    }
}
```

#### `GET /api/v1/webmail/emails/:id`

Retorna detalhes completos de um email.

**Response:**

```json
{
    "success": true,
    "data": {
        "id": "abc123",
        "subject": "Reunião amanhã",
        "from": "joao@empresa.com",
        "to": ["voce@email.com"],
        "date": "2026-01-11T10:00:00Z",
        "body": "Conteúdo completo...",
        "attachments": []
    }
}
```

#### `GET /api/v1/webmail/search?q=termo`

Busca emails por termo.

**Query Params:**

* `q`: termo de busca (obrigatório)
* `limit`: limite de resultados (default: 10)

#### `GET /api/v1/webmail/accounts`

Lista contas de email configuradas.

#### `POST /api/v1/webmail/test`

Testa conexão com provedor.

***

## 📦 Credenciais para Acesso Externo

Após implementação, você receberá:

```
┌─────────────────────────────────────────────────────────────┐
│  🔑 CREDENCIAIS DE ACESSO À API                             │
├─────────────────────────────────────────────────────────────┤
│  Base URL:     http://localhost:3000/api/v1/webmail         │
│                ou http://192.168.100.20:7000/api/v1/webmail │
│                                                             │
│  API Key:      wm_live_[SERÁ GERADA NA IMPLEMENTAÇÃO]       │
│                                                             │
│  Header:       Authorization: Bearer <API_KEY>              │
└─────────────────────────────────────────────────────────────┘
```

### Exemplo de Uso (curl)

```bash
curl -X GET "http://localhost:3000/api/v1/webmail/emails?limit=10" \
     -H "Authorization: Bearer wm_live_xxxx..."

curl -X GET "http://localhost:3000/api/v1/webmail/emails/abc123" \
     -H "Authorization: Bearer wm_live_xxxx..."
```

### Exemplo de Uso (JavaScript)

```javascript
const response = await fetch('http://localhost:3000/api/v1/webmail/emails', {
    headers: {
        'Authorization': 'Bearer wm_live_xxxx...'
    }
});

const { data } = await response.json();
console.log(data.emails);
```

***

## ⏱️ Estimativa de Tempo

| Fase | Duração | Dependências |
|------|---------|--------------|
| Fase 1: Auth | 15 min | - |
| Fase 2: Endpoints | 20 min | Fase 1 |
| Fase 3: Segurança | 10 min | Fase 2 |
| **Total** | **~45 min** | - |

***

## ✅ Checklist de Entrega

* \[ ] API funcionando em localhost:3000
* \[ ] API Key gerada e testada
* \[ ] Documentação de endpoints
* \[ ] Exemplo de integração funcionando
* \[ ] Deploy no VPS (quando acessível)

***

## 🚀 Próximo Passo

Confirme este plano e eu inicio a implementação!
