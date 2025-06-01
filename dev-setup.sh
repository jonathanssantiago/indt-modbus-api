#!/bin/bash

# ========================================
# INDT Modbus API - Setup Script
# Funciona em Linux, macOS e Windows (Git Bash/WSL)
# ========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para detectar o OS
detect_os() {
    case "$OSTYPE" in
        linux*)   echo "linux" ;;
        darwin*)  echo "macos" ;;
        msys*)    echo "windows" ;;
        cygwin*)  echo "windows" ;;
        *)        echo "unknown" ;;
    esac
}

# Função para imprimir logs coloridos
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${CYAN}[SUCCESS]${NC} $1"
}

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para verificar requisitos
check_requirements() {
    log "Verificando requisitos..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists docker; then
        missing_deps+=("Docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_deps+=("Docker Compose")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        error "Dependências faltando: ${missing_deps[*]}"
        error "Por favor, instale as dependências antes de continuar."
        exit 1
    fi
    
    success "Todos os requisitos estão instalados!"
}

# Função para criar arquivos de ambiente
create_env_files() {
    log "Criando arquivos de ambiente..."
    
    # .env.development
    if [ ! -f ".env.development" ]; then
        cat > .env.development << 'EOF'
# Ambiente de Desenvolvimento
NODE_ENV=development
PORT=3003

# Database (Local PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=modbus_db

# Modbus Configuration
MODBUS_HOST=localhost
MODBUS_PORT=5020
READING_INTERVAL=5000

# Logs
LOG_LEVEL=debug
EOF
        success "Arquivo .env.development criado!"
    else
        warn "Arquivo .env.development já existe."
    fi
    
    # .env.docker
    if [ ! -f ".env.docker" ]; then
        cat > .env.docker << 'EOF'
# Ambiente Docker
NODE_ENV=production
PORT=3003

# Database (Docker PostgreSQL)
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=modbus_db

# Modbus Configuration
MODBUS_HOST=host.docker.internal
MODBUS_PORT=5020
READING_INTERVAL=5000

# Logs
LOG_LEVEL=info
EOF
        success "Arquivo .env.docker criado!"
    else
        warn "Arquivo .env.docker já existe."
    fi
    
    # .env.test
    if [ ! -f ".env.test" ]; then
        cat > .env.test << 'EOF'
# Ambiente de Teste
NODE_ENV=test
PORT=3004

# Database (SQLite para testes)
DB_TYPE=sqlite
DB_DATABASE=:memory:

# Modbus Configuration (Mock)
MODBUS_HOST=localhost
MODBUS_PORT=5021
READING_INTERVAL=1000

# Logs
LOG_LEVEL=error
EOF
        success "Arquivo .env.test criado!"
    else
        warn "Arquivo .env.test já existe."
    fi
}

# Função para instalar dependências
install_dependencies() {
    log "Instalando dependências do Node.js..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    success "Dependências instaladas com sucesso!"
}

# Função para preparar banco de dados local
setup_local_database() {
    log "Configurando banco de dados local..."
    
    # Verificar se PostgreSQL está rodando
    if command_exists pg_isready; then
        if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
            success "PostgreSQL está rodando!"
        else
            warn "PostgreSQL não está rodando. Tentando iniciar via Docker..."
            docker run -d \
                --name postgres-dev \
                -e POSTGRES_USER=postgres \
                -e POSTGRES_PASSWORD=postgres \
                -e POSTGRES_DB=modbus_db \
                -p 5432:5432 \
                postgres:16-alpine
            
            log "Aguardando PostgreSQL iniciar..."
            sleep 10
        fi
    else
        warn "PostgreSQL não encontrado. Iniciando via Docker..."
        docker run -d \
            --name postgres-dev \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=postgres \
            -e POSTGRES_DB=modbus_db \
            -p 5432:5432 \
            postgres:16-alpine
        
        log "Aguardando PostgreSQL iniciar..."
        sleep 10
    fi
}

# Função para executar migrações
run_migrations() {
    log "Executando migrações do banco de dados..."
    
    # Copiar arquivo de configuração para desenvolvimento
    if [ -f ".env.development" ]; then
        export $(cat .env.development | grep -v '^#' | xargs)
    fi
    
    # Executar migrações
    npm run migration:run
    
    success "Migrações executadas com sucesso!"
}

# Função para executar seeds
run_seeds() {
    log "Executando seeds do banco de dados..."
    
    npm run seed:run
    
    success "Seeds executados com sucesso!"
}

# Função para iniciar em modo desenvolvimento
start_dev() {
    log "Iniciando aplicação em modo desenvolvimento..."
    
    # Configurar variáveis de ambiente
    if [ -f ".env.development" ]; then
        export $(cat .env.development | grep -v '^#' | xargs)
    fi
    
    success "Aplicação iniciando na porta 3003..."
    success "Swagger disponível em: http://localhost:3003/api/docs"
    success "Health check disponível em: http://localhost:3003/health"
    
    npm run start:dev
}

# Função para iniciar com Docker
start_docker() {
    log "Iniciando aplicação com Docker Compose..."
    
    # Verificar se o arquivo docker-compose.yml existe
    if [ ! -f "docker-compose.yml" ]; then
        error "Arquivo docker-compose.yml não encontrado!"
        exit 1
    fi
    
    # Configurar variáveis de ambiente para Docker
    if [ -f ".env.docker" ]; then
        export $(cat .env.docker | grep -v '^#' | xargs)
    fi
    
    # Construir e iniciar containers
    docker-compose up --build -d
    
    success "Containers iniciados com sucesso!"
    success "Aplicação disponível em: http://localhost:3003"
    success "Swagger disponível em: http://localhost:3003/api/docs"
    success "PostgreSQL disponível em: localhost:5432"
    
    log "Para ver os logs: docker-compose logs -f"
    log "Para parar: docker-compose down"
}

# Função para executar testes
run_tests() {
    log "Executando testes..."
    
    # Configurar variáveis de ambiente para teste
    if [ -f ".env.test" ]; then
        export $(cat .env.test | grep -v '^#' | xargs)
    fi
    
    npm run test
    
    success "Testes executados com sucesso!"
}

# Função para limpeza
cleanup() {
    # Só executar limpeza se não for o comando docker
    if [ "${SKIP_CLEANUP:-false}" != "true" ]; then
        log "Executando limpeza..."
        
        # Parar containers Docker se estiverem rodando
        if [ -f "docker-compose.yml" ]; then
            docker-compose down >/dev/null 2>&1 || true
        fi
        
        # Remover container PostgreSQL de desenvolvimento se existir
        docker rm -f postgres-dev >/dev/null 2>&1 || true
        
        success "Limpeza concluída!"
    fi
}

# Função para mostrar ajuda
show_help() {
    cat << EOF
${PURPLE}INDT Modbus API - Setup Script${NC}

${YELLOW}Uso:${NC}
  $0 [comando]

${YELLOW}Comandos disponíveis:${NC}
  ${GREEN}setup${NC}        - Configuração inicial completa (recomendado para primeiro uso)
  ${GREEN}dev${NC}          - Iniciar em modo desenvolvimento (local)
  ${GREEN}docker${NC}       - Iniciar com Docker Compose
  ${GREEN}test${NC}         - Executar testes
  ${GREEN}migrate${NC}      - Executar migrações do banco
  ${GREEN}seed${NC}         - Executar seeds do banco
  ${GREEN}clean${NC}        - Limpeza (parar containers, etc)
  ${GREEN}help${NC}         - Mostrar esta ajuda

${YELLOW}Exemplos:${NC}
  $0 setup          # Primeira configuração
  $0 dev            # Desenvolvimento local
  $0 docker         # Ambiente Docker
  $0 test           # Executar testes

${YELLOW}Requisitos:${NC}
  - Node.js (>= 18)
  - npm
  - Docker
  - Docker Compose

${YELLOW}Portas utilizadas:${NC}
  - 3003: API (aplicação)
  - 5432: PostgreSQL
  - 5020: Modbus (simulador)

EOF
}

# Função principal
main() {
    local os_type=$(detect_os)
    
    echo -e "${PURPLE}"
    echo "=========================================="
    echo "  INDT Modbus API - Setup Script"
    echo "  OS detectado: $os_type"
    echo "=========================================="
    echo -e "${NC}"
    
    case "${1:-help}" in
        "setup")
            log "Executando configuração inicial completa..."
            check_requirements
            create_env_files
            install_dependencies
            setup_local_database
            run_migrations
            run_seeds
            success "Setup completo! Use '$0 dev' para iniciar em desenvolvimento."
            ;;
        "dev")
            check_requirements
            setup_local_database
            run_migrations
            start_dev
            ;;
        "docker")
            check_requirements
            export SKIP_CLEANUP=true
            start_docker
            ;;
        "test")
            check_requirements
            run_tests
            ;;
        "migrate")
            check_requirements
            run_migrations
            ;;
        "seed")
            check_requirements
            run_seeds
            ;;
        "clean")
            cleanup
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Tratamento de sinais para limpeza
trap cleanup EXIT INT TERM

# Executar função principal
main "$@"
