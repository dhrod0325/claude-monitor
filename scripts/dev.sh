#!/bin/bash

# Claude Monitor - Development Server Script
# Backend (FastAPI + uvicorn) and Frontend (Vite) with hot reload

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

cleanup() {
    echo -e "\n${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kill existing processes
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

echo -e "${GREEN}Starting Claude Monitor Development Servers${NC}"
echo "============================================"

# Start Backend with prefix
echo -e "${YELLOW}Starting Backend (FastAPI)...${NC}"
cd "$BACKEND_DIR"
LOG_LEVEL=DEBUG python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level debug 2>&1 | while IFS= read -r line; do echo -e "${BLUE}[BE]${NC} $line"; done &
BACKEND_PID=$!
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to start
sleep 2

# Start Frontend with prefix
echo -e "${YELLOW}Starting Frontend (Vite)...${NC}"
cd "$FRONTEND_DIR"
npm run dev 2>&1 | while IFS= read -r line; do echo -e "${MAGENTA}[FE]${NC} $line"; done &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo "============================================"
echo -e "${GREEN}Development servers running:${NC}"
echo -e "  ${BLUE}[BE]${NC} Backend:  http://localhost:8000"
echo -e "  ${MAGENTA}[FE]${NC} Frontend: http://localhost:5173"
echo -e "  API Docs: http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo "============================================"

# Wait for both processes
wait
