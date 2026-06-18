#!/bin/bash

# Script de pruebas para Konekt PN Backend
# Este script proporciona atajos para ejecutar tests comúnmente

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${YELLOW}Comandos de Tests disponibles:${NC}"
    echo ""
    echo "  npm run test                    - Ejecutar todos los tests unitarios"
    echo "  npm run test:watch              - Ejecutar tests en modo watch"
    echo "  npm run test:cov                - Ejecutar tests con cobertura"
    echo "  npm run test:debug              - Ejecutar tests en modo debug"
    echo "  npm run test:integration        - Ejecutar tests de integración"
    echo ""
    echo -e "${YELLOW}Comandos específicos:${NC}"
    echo ""
    echo "  npm run test -- auth.service.spec.ts"
    echo "  npm run test -- --testNamePattern=\"login\""
    echo "  npm run test:integration -- backend.integration.spec.ts"
    echo ""
    echo -e "${YELLOW}Scripts útiles:${NC}"
    echo ""
    echo "  ./scripts/test.sh all           - Ejecutar todos los tests"
    echo "  ./scripts/test.sh unit          - Solo tests unitarios"
    echo "  ./scripts/test.sh integration   - Solo tests de integración"
    echo "  ./scripts/test.sh auth          - Tests del módulo de autenticación"
    echo "  ./scripts/test.sh user          - Tests del módulo de usuario"
    echo "  ./scripts/test.sh student       - Tests del módulo de estudiante"
    echo "  ./scripts/test.sh coverage      - Tests con reporte de cobertura"
    echo "  ./scripts/test.sh watch         - Tests en modo watch"
    echo ""
}

# Función para ejecutar tests
run_tests() {
    case "$1" in
        all)
            echo -e "${YELLOW}Ejecutando todos los tests...${NC}"
            npm run test
            npm run test:integration
            ;;
        unit)
            echo -e "${YELLOW}Ejecutando tests unitarios...${NC}"
            npm run test
            ;;
        integration)
            echo -e "${YELLOW}Ejecutando tests de integración...${NC}"
            npm run test:integration
            ;;
        auth)
            echo -e "${YELLOW}Ejecutando tests de autenticación...${NC}"
            npm run test -- auth.service.spec.ts
            npm run test -- auth.controller.spec.ts
            ;;
        user)
            echo -e "${YELLOW}Ejecutando tests de usuario...${NC}"
            npm run test -- user.service.spec.ts
            npm run test -- user.controller.spec.ts
            ;;
        student)
            echo -e "${YELLOW}Ejecutando tests de estudiante...${NC}"
            npm run test -- student.service.spec.ts
            npm run test -- student.controller.spec.ts
            ;;
        coverage)
            echo -e "${YELLOW}Ejecutando tests con cobertura...${NC}"
            npm run test:cov
            echo -e "${GREEN}Reporte de cobertura disponible en: ./coverage/index.html${NC}"
            ;;
        watch)
            echo -e "${YELLOW}Ejecutando tests en modo watch...${NC}"
            npm run test:watch
            ;;
        help|"")
            show_help
            ;;
        *)
            echo -e "${RED}Comando no reconocido: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función
run_tests "$1"
