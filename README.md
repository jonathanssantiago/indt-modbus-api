# INDT Modbus API

<p align="center">
  API para comunicação Modbus e leitura de dispositivos IoT desenvolvida com NestJS
</p>

<p align="center">
  <a href="#" target="_blank">
    <img src="https://img.shields.io/badge/Node.js-20%2B-green" alt="Node Version" />
  </a>
  <a href="#" target="_blank">
    <img src="https://img.shields.io/badge/TypeScript-5.3%2B-blue" alt="TypeScript Version" />
  </a>
  <a href="#" target="_blank">
    <img src="https://img.shields.io/badge/NestJS-10.3%2B-red" alt="NestJS Version" />
  </a>
  <a href="#" target="_blank">
    <img src="https://img.shields.io/badge/PostgreSQL-16%2B-blue" alt="PostgreSQL Version" />
  </a>
</p>

## 📋 Descrição

A **INDT Modbus API** é uma aplicação robusta desenvolvida para comunicação com dispositivos IoT via protocolo Modbus TCP. A API fornece funcionalidades para:

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

### Módulos Principais

#### 🔌 **Modbus Module**

- **ModbusService**: Gerencia conexão e leitura de dados
- **ModbusGateway**: WebSocket para dados em tempo real
- **ModbusEvents**: Sistema de eventos customizado

#### 📊 **Device Readings Module**

- **Controller**: Endpoints REST para consulta
- **Service**: Lógica de negócio para leituras
- **Entity**: Modelo de dados PostgreSQL

#### 🏥 **Health Module**

- **Controller**: Endpoints de health check
- **Service**: Verificação de saúde do sistema

## 🛠️ Tecnologias

### Backend

- **[NestJS](https://nestjs.com/)** - Framework Node.js progressivo
- **[TypeScript](https://www.typescriptlang.org/)** - Linguagem tipada
- **[TypeORM](https://typeorm.io/)** - ORM para TypeScript/JavaScript
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional
- **[Socket.io](https://socket.io/)** - WebSocket para tempo real

### Modbus & IoT

- **[modbus-serial](https://www.npmjs.com/package/modbus-serial)** - Biblioteca Modbus TCP/RTU
- **[EventEmitter2](https://www.npmjs.com/package/eventemitter2)** - Sistema de eventos

### Documentação & Testes

- **[Swagger/OpenAPI](https://swagger.io/)** - Documentação automática da API
- **[Jest](https://jestjs.io/)** - Framework de testes
- **[Supertest](https://github.com/visionmedia/supertest)** - Testes de integração

### DevOps

- **[Docker](https://www.docker.com/)** - Containerização
- **[Docker Compose](https://docs.docker.com/compose/)** - Orquestração de containers

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- Yarn ou npm
- PostgreSQL 15+ (ou Docker)
- Git

### 1. Instale as dependências

```bash
yarn install
# ou
npm install
```

### 2. Configure as variáveis de ambiente

#### Variáveis de ambiente para Local

```bash
cp .env.local.example .env
```

#### Variáveis de ambiente para o Docker

```bash
cp .env.docker .env
```

### 4. Execute as migrações do banco (necessário somente no ambiente sem o docker)

```bash
yarn run migration:run
# ou
npm run migration:run
```

### 5. (Opcional) Execute o seed de dados

```bash
yarn run seed:run
# ou
npm run seed:run
```

## 🏃‍♂️ Executando a aplicação

### Modo desenvolvimento

```bash
yarn run start:dev
# ou
npm run start:dev
```

### Com Docker

```bash
# Executar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f api
```

## 🧪 Testes

### Testes unitários

```bash
yarn run test
# ou
npm run test
```

### Testes de integração (E2E)

```bash
yarn run test:e2e
# ou
npm run test:e2e
```

### Resultados dos Testes

- ✅ **35 testes unitários** passando (Modbus module)
- ✅ **Cobertura completa** dos módulos principais
- ✅ **Testes E2E** para endpoints REST

### 🏥 Health Check

#### `GET /health`

Endpoint de health check para monitoramento.

## 🔌 WebSocket Events

### Eventos disponíveis

#### `modbus-reading`

Emitido a cada nova leitura do dispositivo (intervalo configurável).

#### `modbus-connected`

Emitido quando a conexão Modbus é estabelecida.

#### `modbus-disconnected`

Emitido quando a conexão Modbus é perdida.

## 📚 Documentação da API

A documentação completa da API está disponível via Swagger:

```
http://localhost:3003/api/docs
```

## 📈 Monitoramento

### Health Checks

- **Aplicação**: `GET /health`
- **Banco de dados**: Verificação automática de conexão
- **Modbus**: Status de conectividade em tempo real

### Problemas comuns

#### Erro de variaveis de ambiente

Verifique seu .env de acordo com o ambiente (local ou com docker)

#### Erro de banco de dados

```bash
# Verificar conexão PostgreSQL
docker-compose exec db psql -U postgres -d modbus_db

# Executar migrações
yarn run migration:run
```
