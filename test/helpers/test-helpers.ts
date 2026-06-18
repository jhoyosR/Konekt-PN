import { Repository, ObjectLiteral } from 'typeorm';

/**
 * Proporciona métodos de utilidad para crear mocks de repositorios de TypeORM
 */
export class RepositoryMockFactory {
  static createMockRepository<T extends ObjectLiteral = any>(overrides?: Partial<Repository<T>>): jest.Mocked<Repository<T>> {
    return {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      findBy: jest.fn(),
      findByIds: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softRemove: jest.fn(),
      recover: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn(),
      create: jest.fn(),
      preload: jest.fn(),
      upsert: jest.fn(),
      merge: jest.fn(),
      exists: jest.fn(),
      existsBy: jest.fn(),
      createQueryBuilder: jest.fn(),
      hasId: jest.fn(),
      getId: jest.fn(),
      remove: jest.fn(),
      insert: jest.fn(),
      clear: jest.fn(),
      reload: jest.fn(),
      extend: jest.fn(),
      findAndCount: jest.fn(),
      target: {} as any,
      query: jest.fn(),
      manager: {
        create: jest.fn(),
        save: jest.fn(),
        existsBy: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      } as any,
      metadata: {} as any,
      ...overrides,
    } as jest.Mocked<Repository<T>>;
  }
}

/**
 * Proporciona métodos de utilidad para crear mocks de servicios
 */
export class ServiceMockFactory {
  static createMockService<T>(methods: Partial<Record<keyof T, jest.Mock>>): jest.Mocked<T> {
    return methods as jest.Mocked<T>;
  }
}

/**
 * Helpers para aserciones comunes en tests
 */
export class TestAssertions {
  static expectUserResponse(user: any): void {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('role');
    expect(user).not.toHaveProperty('password');
  }

  static expectStudentResponse(student: any): void {
    expect(student).toHaveProperty('id');
    expect(student).toHaveProperty('documentNumber');
    expect(student).toHaveProperty('firstName');
    expect(student).toHaveProperty('lastName');
    expect(student).toHaveProperty('email');
  }

  static expectPaginatedResponse(response: any): void {
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('total');
    expect(response).toHaveProperty('page');
    expect(response).toHaveProperty('limit');
    expect(Array.isArray(response.data)).toBe(true);
  }

  static expectAuthResponse(response: any): void {
    expect(response).toHaveProperty('user');
    expect(response).toHaveProperty('token');
    expect(response.user).toHaveProperty('id');
    expect(response.user).toHaveProperty('email');
    expect(response.user).toHaveProperty('role');
    expect(typeof response.token).toBe('string');
  }

  static expectErrorResponse(response: any, statusCode: number, message?: string): void {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('message');
    if (message) {
      expect(response.body.message).toContain(message);
    }
  }
}

/**
 * Helpers para manejo de tiempo en tests
 */
export class TimeHelpers {
  static addMinutes(minutes: number): Date {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  }

  static subtractMinutes(minutes: number): Date {
    const date = new Date();
    date.setMinutes(date.getMinutes() - minutes);
    return date;
  }

  static addHours(hours: number): Date {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date;
  }

  static subtractHours(hours: number): Date {
    const date = new Date();
    date.setHours(date.getHours() - hours);
    return date;
  }

  static addDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  static subtractDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
}
