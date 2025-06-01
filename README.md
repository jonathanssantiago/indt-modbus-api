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

## 🛠️ Scripts de Desenvolvimento

O projeto inclui scripts automatizados que simplificam o desenvolvimento:

```bash
# Setup completo (dependências + banco + migrações + seeds)
npm run setup

# Ambiente de desenvolvimento com simulador Modbus integrado
npm run dev

# Ambiente Docker com simulador Modbus integrado
npm run docker

# Limpeza completa (containers + volumes + redes)
npm run clean

# Ajuda com todos os comandos disponíveis
npm run help
```

### 🎯 Simulador Modbus Integrado

O projeto usa automaticamente o simulador [jonathanssantiagodev/indt-iot-simulator](https://hub.docker.com/r/jonathanssantiagodev/indt-iot-simulator) que:

- **Simula dispositivos IoT** com registradores Modbus TCP
- **Inicia automaticamente** com os comandos `npm run dev` e `npm run docker`
- **Executa na porta 5020** (configurável via MODBUS_PORT)
- **Remove-se automaticamente** com `npm run clean`

### ⚙️ Configuração do Simulador

```bash
# Variáveis de ambiente (.env.development / .env.docker)
MODBUS_HOST=localhost
MODBUS_PORT=5020
```

## 🏃‍♂️ Executando

### Desenvolvimento (com simulador Modbus)

```bash
# Inicia PostgreSQL + Simulador Modbus + API com hot-reload
npm run dev

# Ou manualmente
npm run start:dev
```

### Produção/Docker (com simulador Modbus)

```bash
# Inicia PostgreSQL + Simulador Modbus + API via Docker
npm run docker

# Ou manualmente
docker-compose up -d
```

### Acesso aos serviços

- **API**: http://localhost:3003
- **Swagger**: http://localhost:3003/api
- **WebSocket**: ws://localhost:3003/socket.io
- **Simulador Modbus**: localhost:5020
- **PostgreSQL**: localhost:5432

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Watch mode
npm run test:watch
```

## 🛠️ Comandos Úteis

```bash
# Ver logs em tempo real
docker logs -f indt-api
docker logs -f modbus-simulator

# Reiniciar apenas a API (mantém banco e simulador)
docker restart indt-api

# Verificar status dos containers
docker ps

# Limpar tudo e começar do zero
npm run clean && npm run setup

# Executar migrações manualmente
npm run migration:run

# Gerar nova migração
npm run migration:generate -- NomeDaMigracao

# Ver ajuda completa
npm run help
```

## 🚨 Troubleshooting

### Problemas comuns

**Erro de conexão com banco:**

```bash
npm run clean && npm run setup
```

**Simulador Modbus não conecta:**

```bash
# Verificar se a porta 5020 está disponível
netstat -an | grep 5020
docker restart modbus-simulator
```

**API não inicia:**

```bash
# Verificar logs
docker logs indt-api
# Reiniciar ambiente
npm run clean && npm run dev
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
