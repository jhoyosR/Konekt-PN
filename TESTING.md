# Testing Guide - Konekt PN Backend

Este documento proporciona una guía completa para ejecutar y escribir tests en la aplicación Konekt PN Backend.

## Estructura de Tests

```
.
├── src/
│   ├── auth/
│   │   ├── auth.service.spec.ts      # Tests unitarios del servicio
│   │   └── auth.controller.spec.ts   # Tests de integración del controlador
│   ├── user/
│   │   ├── user.service.spec.ts
│   │   └── user.controller.spec.ts
│   ├── student/
│   │   ├── student.service.spec.ts
│   │   └── student.controller.spec.ts
│   └── ...
└── test/
    ├── setup.ts                       # Configuración global de tests
    ├── jest-integration.json          # Configuración Jest para integración
    ├── backend.integration.spec.ts    # Tests de integración del backend
    ├── auth.controller.spec.ts        # Tests de integración - Auth
    ├── user.controller.spec.ts        # Tests de integración - User
    ├── student.controller.spec.ts     # Tests de integración - Student
    ├── factories/
    │   └── test-data.factory.ts       # Fábrica de datos de prueba
    └── helpers/
        └── test-helpers.ts             # Utilidades y helpers de prueba
```

## Comandos de Testing

### Tests Unitarios
```bash
# Ejecutar todos los tests unitarios
npm run test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:cov

# Ejecutar tests en modo debug
npm run test:debug

# Ejecutar tests de un archivo específico
npm run test -- auth.service.spec.ts

# Ejecutar tests con patrón
npm run test -- --testNamePattern="login"
```

### Tests de Integración
```bash
# Ejecutar todos los tests de integración
npm run test:integration

# Ejecutar test de integración en modo watch
npm run test:integration -- --watch

# Ejecutar integración con cobertura
npm run test:integration -- --coverage
```

## Estructura de un Test Unitario

### Ejemplo: UserService.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            // ... otros métodos necesarios
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      repository.findOne.mockResolvedValue(mockUser as any);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });
});
```

## Estructura de un Test de Integración

### Ejemplo: AuthController.spec.ts (en test/)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import request from 'supertest';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            // ... otros métodos
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      authService.login.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        token: 'jwt-token',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });
  });
});
```

## Usando TestDataFactory

La fábrica de datos proporciona métodos para crear objetos de prueba consistentes:

```typescript
import { TestDataFactory } from '../test/factories/test-data.factory';

// Crear un usuario de prueba
const mockUser = TestDataFactory.createUser({
  email: 'custom@example.com',
  role: Role.ADMIN,
});

// Crear un estudiante de prueba
const mockStudent = TestDataFactory.createStudent({
  firstName: 'Jane',
  lastName: 'Doe',
});

// Crear una universidad de prueba
const mockUniversity = TestDataFactory.createUniversity({
  name: 'Custom University',
});
```

## Usando TestHelpers

Los helpers proporcionan utilidades para aserciones comunes:

```typescript
import { TestAssertions, TimeHelpers } from '../test/helpers/test-helpers';

// Verificar estructura de respuesta de usuario
TestAssertions.expectUserResponse(user);
expect(user).not.toHaveProperty('password');

// Verificar respuesta paginada
TestAssertions.expectPaginatedResponse(response.body);

// Verificar respuesta de autenticación
TestAssertions.expectAuthResponse(response.body);

// Trabajar con tiempos
const futureDate = TimeHelpers.addDays(30);
const expiredDate = TimeHelpers.subtractMinutes(30);
```

## Best Practices

### 1. Aislar Tests
- Cada test debe ser independiente
- Usar `beforeEach` para resetear mocks
- No compartir estado entre tests

### 2. Nombres Descriptivos
```typescript
// ✅ Bien
it('should throw NotFoundException when user does not exist', async () => {
});

// ❌ Mal
it('should work', async () => {
});
```

### 3. Estructura AAA (Arrange-Act-Assert)
```typescript
it('should update user email', async () => {
  // Arrange
  const updateDto = { email: 'new@example.com' };
  const existingUser = { id: '1', email: 'old@example.com' };
  repository.findOne.mockResolvedValue(existingUser);
  repository.save.mockResolvedValue({ ...existingUser, ...updateDto });

  // Act
  const result = await service.update('1', updateDto);

  // Assert
  expect(result.email).toBe(updateDto.email);
  expect(repository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
});
```

### 4. Mocking Efectivo
```typescript
// Mock de función que retorna valor
service.method.mockResolvedValue(value);

// Mock de función que lanza excepción
service.method.mockRejectedValue(new Error('Error'));

// Mock de función que retorna valor específico basado en parámetros
service.method.mockImplementation((param) => {
  if (param === 'specific') return value;
  return otherValue;
});
```

### 5. Pruebas de Validación
```typescript
it('should validate email format', async () => {
  const invalidDto = { email: 'invalid-email' };
  
  await expect(service.create(invalidDto)).rejects.toThrow();
});
```

## Configuración de Base de Datos para Tests de Integración

Para ejecutar tests de integración con una base de datos real:

1. Crea un archivo `.env.test` o utiliza `.env`:
```
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=konekt_pn_test
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=konekt_pn_test
JWT_SECRET=test-secret
JWT_EXPIRATION=24h
```

2. Configura TypeORM en el test:
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  autoLoadEntities: true,
  synchronize: true,
  dropSchema: true, // Limpiar antes de cada test
})
```

## Cobertura de Tests

Ver reporte de cobertura:
```bash
npm run test:cov
```

El reporte se genera en `/coverage/index.html`

### Umbrales de Cobertura Recomendados
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Debugging de Tests

### Usar `debugger`
```typescript
it('should debug this test', async () => {
  debugger; // Se pausará aquí
  const result = await service.method();
});
```

### Ejecutar Test Específico
```bash
npm run test -- --testNamePattern="specific test name"
npm run test -- auth.service.spec.ts
```

## Troubleshooting

### Tests Fallan por Timeout
```typescript
// Aumentar timeout para un test específico
it('should handle long operation', async () => {
  // ...
}, 30000); // 30 segundos

// O globalmente en jest.config.js
testTimeout: 30000
```

### Problemas con TypeORM
```typescript
// Asegurar que el módulo está correctamente mockeado
import { getRepositoryToken } from '@nestjs/typeorm';

{
  provide: getRepositoryToken(Entity),
  useValue: mockRepository,
}
```

### Errores de Sincronización Asincrónica
```typescript
// Usar async/await correctamente
it('should do something', async () => {
  const result = await asyncMethod();
  expect(result).toBeDefined();
});

// En beforeEach también
beforeEach(async () => {
  // ...
});
```

## Recursos Adicionales

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [SuperTest](https://github.com/visionmedia/supertest)
- [TypeORM Testing](https://typeorm.io/usage)

## Contribuyendo Tests

Al agregar nuevas funcionalidades:

1. Escribe tests unitarios para servicios/lógica
2. Escribe tests de integración para controllers/endpoints
3. Asegúrate de que la cobertura sea > 80%
4. Sigue la estructura y convenciones existentes
5. Usa TestDataFactory y TestHelpers
