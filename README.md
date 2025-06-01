# INDT Modbus API

API para comunicação Modbus e leitura de dispositivos IoT desenvolvida com NestJS.

## 📋 Descrição

Aplicação para comunicação com dispositivos IoT via protocolo Modbus TCP que oferece:

- 🔌 **Conexão automática** com simuladores/dispositivos Modbus
- 📊 **Leitura contínua** de registradores (voltagem, corrente, temperatura)
- 💾 **Armazenamento** de dados em PostgreSQL
- 🔄 **Reconexão automática** em caso de falhas
- 📡 **WebSocket** para dados em tempo real
- 📖 **API REST** para consulta histórica
- 🏥 **Health checks** para monitoramento
- 📚 **Documentação** com Swagger

## 🏗️ Arquitetura

```
├── 📁 src/
│   ├── 📁 modules/
│   │   ├── 📁 modbus/          # Comunicação Modbus
│   │   ├── 📁 device-readings/ # Gerenciamento de leituras
│   │   └── 📁 health/          # Health checks
│   ├── 📁 config/              # Configurações
│   └── 📁 database/            # Migrações e seeds
├── 📁 test/                    # Testes E2E
└── 📁 scripts/                 # Scripts utilitários
```

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL ou Docker

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar ambiente

O projeto usa três arquivos de ambiente:

- `.env.development` - Desenvolvimento local
- `.env.docker` - Produção/Docker
- `.env.test` - Testes

## 🛠️ Scripts automatizados de configuração e inicialização do projeto

```bash
# Setup completo (dependências + banco + migrações)
npm run setup

# Ambiente de Desenvolvimento com hot-reload
npm run dev

# Ambiente com Docker
npm run docker

# Limpar containers Docker
npm run clean
```

## 🏃‍♂️ Executando

### Desenvolvimento

```bash
npm run start:dev
```

### Produção

```bash
npm run build
npm run start:prod
```

### Docker

```bash
docker-compose up -d
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Watch mode
npm run test:watch
```

## 📚 API

### Endpoints

#### Device Readings

- `GET /device-readings/last-reading` - Última leitura
- `GET /device-readings/history` - Histórico
- `GET /device-readings/modbus-status` - Status da conexão

#### Health Check

- `GET /health` - Status da aplicação

### Documentação

- Swagger: http://localhost:3003/api

### WebSocket

- Endpoint: http://localhost:3003
- Eventos: `modbus-reading`, `modbus-connected`, `modbus-disconnected`

## 🔧 Configuração

### Variáveis de Ambiente

| Ambiente        | Arquivo            | DB Host     | Modbus Host        |
| --------------- | ------------------ | ----------- | ------------------ |
| Desenvolvimento | `.env.development` | `localhost` | `localhost`        |
| Produção        | `.env.docker`      | `db`        | `modbus_simulator` |
| Teste           | `.env.test`        | -           | `localhost`        |
