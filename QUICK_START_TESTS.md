# Quick Start - Tests

Guía rápida para ejecutar tests en Konekt PN Backend.

## ⚡ Comandos Rápidos

```bash
# Ejecutar todos los tests unitarios
npm run test

# Ejecutar tests en modo watch (auto-recarga)
npm run test:watch

# Ver reporte de cobertura
npm run test:cov

# Ejecutar tests de integración del backend
npm run test:integration
```

##  Ejecutar Tests Específicos

```bash
# Test de un módulo específico
npm run test -- auth.service.spec.ts
npm run test -- user.service.spec.ts
npm run test -- student.controller.spec.ts

# Test por patrón de nombre
npm run test -- --testNamePattern="login"
npm run test -- --testNamePattern="register"
npm run test -- --testNamePattern="update"

# Test de integración específico
npm run test:integration -- backend.integration.spec.ts
```

## 🔌 Tests de Integración del Backend

Los tests de integración validan que los endpoints del backend funcionan correctamente con la base de datos.

### Requisitos Previos
- La base de datos debe estar corriendo: `docker-compose up -d`
- Las variables de entorno en `.env` deben estar configuradas correctamente

### Ejecutar Tests de Integración
```bash
# Ejecutar todos los tests de integración
npm run test:integration

# Ejecutar un test específico en modo verbose
npm run test:integration -- --testNamePattern="should register a university"

# Ejecutar en modo watch
npm run test:integration -- --watch
```

### Endpoints Validados
- ✅ Auth: Registro y login de usuarios (Universidad, Company)
- ✅ University: Listar y obtener detalles
- ✅ Company: Registrar, listar y obtener detalles
- ✅ Common: Constantes (career, etc)
- ✅ Skills: Listar skills disponibles
- ✅ Validación de credenciales inválidas

### Archivos Relacionados
- `test/backend.integration.spec.ts` - Suite principal de integración
- `test/jest-integration.json` - Configuración Jest para integración
- `test/setup.ts` - Configuración global de tests

## Ver Cobertura

```bash
# Generar reporte
npm run test:cov

# Abrir en navegador
open coverage/index.html  # macOS
# o
xdg-open coverage/index.html  # Linux
# o
start coverage/index.html  # Windows
```

##  Debugging

### Opción 1: Agregar `debugger`
```typescript
it('should do something', async () => {
  debugger;  // Se pausará aquí
  const result = await service.method();
});
```

### Opción 2: Console.log
```typescript
it('should do something', async () => {
  debugger;  // Se pausará aquí
  const result = await service.method();
});
```

### Opción 3: Console.log
```typescript
it('should do something', async () => {
  console.log('Debug info:', data);
  // ...
});
```

## Ejemplos de Tests

### Test Unitario (Service)
```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, ...mocks]
    }).compile();
    service = module.get(AuthService);
  });

  it('should login with valid credentials', async () => {
    const result = await service.login('test@example.com', 'password');
    expect(result).toHaveProperty('token');
  });
});
```

### Test de Integración (Controller)
```typescript
// user.controller.spec.ts
describe('UserController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [mockServices]
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  it('should return users', async () => {
    const res = await request(app.getHttpServer())
      .get('/user')
      .expect(200);
    expect(res.body).toHaveProperty('data');
  });
});
```

##  Usar Factory de Datos

```typescript
import { TestDataFactory } from '../test/factories/test-data.factory';

// En tus tests
const mockUser = TestDataFactory.createUser();
const mockStudent = TestDataFactory.createStudent();
const mockCompany = TestDataFactory.createCompany();

// Con overrides
const customUser = TestDataFactory.createUser({
  email: 'custom@example.com',
  role: Role.ADMIN
});
```

## 🛠️ Usar Test Helpers

```typescript
import { TestAssertions, TimeHelpers } from '../test/helpers/test-helpers';

// Aserciones comunes
TestAssertions.expectUserResponse(user);
TestAssertions.expectPaginatedResponse(response);
TestAssertions.expectAuthResponse(response);

// Utilidades de tiempo
const futureDate = TimeHelpers.addDays(30);
const pastDate = TimeHelpers.subtractHours(2);
```

## Ł Solucionar Problemas

### Tests fallan por timeout
```bash
# Aumentar timeout en jest.config.js
testTimeout: 30000  // 30 segundos
```

### No encuentra módulos
```bash
# Limpiar cache de Jest
npm run test -- --clearCache
```

### Tests de integración fallan por BD
```bash
# Crear .env.test o usar .env
cp .env.test.example .env.test

# Asegurar que docker-compose está levantado
docker-compose up -d

# Configurar base de datos PostgreSQL
# Asegurar que DB_HOST y credenciales sean correctas
```

### TypeORM errors
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

##  Más Información

- Guía completa: [TESTING.md](./TESTING.md)
- Resumen de suite: [TESTS_SUMMARY.md](./TESTS_SUMMARY.md)
- Ejemplos: Ver archivos `*.spec.ts`

## Workflow de Desarrollo

1. **Desarrollo**
   ```bash
   npm run test:watch
   # Hace cambios y tests se ejecutan automáticamente
   ```

2. **Pre-commit**
   ```bash
   npm run test
   npm run lint
   npm run format
   ```

3. **Integración continua**
   ```bash
   npm run test:cov
   npm run test:integration
   ```

## Métricas

```bash
# Ver cobertura actual
npm run test:cov

# Foco en archivos específicos
npm run test:cov -- src/auth/auth.service.ts
```

---

