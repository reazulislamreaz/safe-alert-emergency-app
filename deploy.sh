#!/usr/bin/env bash
# ==============================================================================
# SafeAlert Emergency Response System - One-Command Deployment Script
# ==============================================================================
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}   🚨 SafeAlert Emergency Response System - Automated Deployment     ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. Check prerequisites
echo -e "\n${BLUE}[1/5] Checking environment prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker before proceeding.${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose plugin is not installed. Please install docker-compose-plugin.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker & Docker Compose are available.${NC}"

# 2. Check and initialize .env file
echo -e "\n${BLUE}[2/5] Initializing environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Bootstrapping from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file.${NC}"
else
    echo -e "${GREEN}✓ Existing .env file detected.${NC}"
fi

# 3. Build & pull container images
echo -e "\n${BLUE}[3/5] Building Docker container images...${NC}"
docker compose build --parallel

# 4. Spin up services in detached mode
echo -e "\n${BLUE}[4/5] Launching SafeAlert stack with Docker Compose...${NC}"
docker compose up -d --remove-orphans

# 5. Verify service health
echo -e "\n${BLUE}[5/5] Waiting for services to become healthy...${NC}"
MAX_RETRIES=15
COUNTER=0

while [ $COUNTER -lt $MAX_RETRIES ]; do
    UNHEALTHY=$(docker compose ps --format json | grep -i '"Health":' | grep -v -i '"healthy"' || true)
    if [ -z "$UNHEALTHY" ]; then
        break
    fi
    echo -e "${YELLOW}⏳ Waiting for healthchecks to pass... ($((COUNTER+1))/$MAX_RETRIES)${NC}"
    sleep 3
    COUNTER=$((COUNTER+1))
done

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}   🎉 SafeAlert Stack Deployed Successfully!                         ${NC}"
echo -e "${GREEN}======================================================================${NC}"

docker compose ps

echo -e "\n${BLUE}🌐 Access Endpoints:${NC}"
echo -e "   • ${GREEN}Admin Dashboard & Simulator:${NC} http://localhost:3000"
echo -e "   • ${GREEN}Backend REST API:${NC}           http://localhost:5000/api"
echo -e "   • ${GREEN}WebSocket Hub:${NC}              ws://localhost:5000/socket.io"
echo -e "   • ${GREEN}Health Check:${NC}               http://localhost:5000/health"
echo -e "\n${BLUE}📋 Useful Commands:${NC}"
echo -e "   • View Logs:    ${YELLOW}docker compose logs -f${NC}"
echo -e "   • Stop Stack:   ${YELLOW}docker compose down${NC}"
echo -e "   • Restart:      ${YELLOW}docker compose restart${NC}"
echo -e "======================================================================\n"
