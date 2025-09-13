#!/bin/bash

# Sports Platform Service Manager
# Usage: ./scripts/manage-services.sh [start|stop|status|restart] [service_name]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service configuration
IDENTITY_PORT=3001
IDENTITY_PATH="apps/identity-service"
SPORTS_PORT=3002
SPORTS_PATH="apps/sports-service"

# Functions
print_usage() {
    echo "Usage: $0 [start|stop|status|restart|list] [service_name]"
    echo ""
    echo "Commands:"
    echo "  start [service]     - Start a service or all services"
    echo "  stop [service]      - Stop a service or all services"
    echo "  status              - Show status of all services"
    echo "  restart [service]   - Restart a service or all services"
    echo "  list                - List available services"
    echo ""
    echo "Services:"
    for service in "${!SERVICES[@]}"; do
        IFS=':' read -r port path <<< "${SERVICES[$service]}"
        echo "  $service            - Port $port ($path)"
    done
}

check_port() {
    local port=$1
    lsof -ti:$port >/dev/null 2>&1
}

kill_port() {
    local port=$1
    if check_port $port; then
        echo -e "${YELLOW}Killing process on port $port...${NC}"
        lsof -ti:$port | xargs kill -9
        sleep 2
    fi
}

start_service() {
    local service=$1
    if [[ -z "${SERVICES[$service]}" ]]; then
        echo -e "${RED}Error: Unknown service '$service'${NC}"
        return 1
    fi
    
    IFS=':' read -r port path <<< "${SERVICES[$service]}"
    
    if check_port $port; then
        echo -e "${YELLOW}Service '$service' is already running on port $port${NC}"
        return 0
    fi
    
    echo -e "${BLUE}Starting $service service on port $port...${NC}"
    cd $path && PORT=$port npm run start:dev &
    local pid=$!
    
    # Wait a bit and check if the service started
    sleep 5
    if check_port $port; then
        echo -e "${GREEN}✅ $service service started successfully on port $port${NC}"
    else
        echo -e "${RED}❌ Failed to start $service service${NC}"
        return 1
    fi
}

stop_service() {
    local service=$1
    if [[ -z "${SERVICES[$service]}" ]]; then
        echo -e "${RED}Error: Unknown service '$service'${NC}"
        return 1
    fi
    
    IFS=':' read -r port path <<< "${SERVICES[$service]}"
    
    if check_port $port; then
        echo -e "${YELLOW}Stopping $service service on port $port...${NC}"
        kill_port $port
        echo -e "${GREEN}✅ $service service stopped${NC}"
    else
        echo -e "${YELLOW}Service '$service' is not running${NC}"
    fi
}

show_status() {
    echo -e "${BLUE}Service Status:${NC}"
    echo "----------------------------------------"
    for service in "${!SERVICES[@]}"; do
        IFS=':' read -r port path <<< "${SERVICES[$service]}"
        if check_port $port; then
            echo -e "$service: ${GREEN}RUNNING${NC} (port $port)"
        else
            echo -e "$service: ${RED}STOPPED${NC} (port $port)"
        fi
    done
}

# Main script logic
case "$1" in
    "start")
        if [[ -n "$2" ]]; then
            start_service "$2"
        else
            echo -e "${BLUE}Starting core services...${NC}"
            start_service "identity"
            sleep 3
            start_service "sports"
        fi
        ;;
    "stop")
        if [[ -n "$2" ]]; then
            stop_service "$2"
        else
            echo -e "${YELLOW}Stopping all services...${NC}"
            for service in "${!SERVICES[@]}"; do
                stop_service "$service"
            done
        fi
        ;;
    "status")
        show_status
        ;;
    "restart")
        if [[ -n "$2" ]]; then
            stop_service "$2"
            sleep 2
            start_service "$2"
        else
            echo -e "${YELLOW}Restarting all services...${NC}"
            for service in "${!SERVICES[@]}"; do
                stop_service "$service"
            done
            sleep 3
            start_service "identity"
            sleep 3
            start_service "sports"
        fi
        ;;
    "list")
        echo -e "${BLUE}Available services:${NC}"
        for service in "${!SERVICES[@]}"; do
            IFS=':' read -r port path <<< "${SERVICES[$service]}"
            echo "  $service - Port $port ($path)"
        done
        ;;
    *)
        print_usage
        exit 1
        ;;
esac
