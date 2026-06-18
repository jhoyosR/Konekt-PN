import { Role } from '../../src/common/enums/role.enum';

/**
 * Fábrica de datos para tests
 * Proporciona métodos para crear objetos de prueba consistentes
 */
export class TestDataFactory {
  static createUser(overrides?: Partial<any>) {
    return {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: Role.STUDENT,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...overrides,
    };
  }

  static createStudent(overrides?: Partial<any>) {
    return {
      id: 1,
      documentNumber: '1234567890',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      dateOfBirth: new Date('2000-01-01'),
      university: { id: 1, name: 'Test University' },
      user: TestDataFactory.createUser(),
      ...overrides,
    };
  }

  static createUniversity(overrides?: Partial<any>) {
    return {
      id: 1,
      name: 'Test University',
      email: 'admin@testuniversity.edu',
      phone: '+1234567890',
      address: '123 University St',
      city: 'Test City',
      country: 'Test Country',
      user: TestDataFactory.createUser({ role: Role.UNIVERSITY }),
      ...overrides,
    };
  }

  static createCompany(overrides?: Partial<any>) {
    return {
      id: 1,
      name: 'Test Company',
      email: 'contact@testcompany.com',
      phone: '+1234567890',
      industry: 'Technology',
      address: '123 Company Ave',
      city: 'Test City',
      country: 'Test Country',
      user: TestDataFactory.createUser({ role: Role.COMPANY }),
      ...overrides,
    };
  }

  static createSkill(overrides?: Partial<any>) {
    return {
      id: 1,
      name: 'JavaScript',
      description: 'JavaScript programming language',
      ...overrides,
    };
  }

  static createVacancy(overrides?: Partial<any>) {
    return {
      id: 1,
      title: 'Junior Developer',
      description: 'Looking for a junior developer',
      position: 'Junior',
      salary: 50000,
      company: TestDataFactory.createCompany(),
      skills: [TestDataFactory.createSkill()],
      ...overrides,
    };
  }

  static createApplication(overrides?: Partial<any>) {
    return {
      id: 1,
      student: TestDataFactory.createStudent(),
      vacancy: TestDataFactory.createVacancy(),
      status: 'pending',
      appliedAt: new Date(),
      ...overrides,
    };
  }

  static createInternship(overrides?: Partial<any>) {
    return {
      id: 1,
      student: TestDataFactory.createStudent(),
      company: TestDataFactory.createCompany(),
      title: 'Software Engineering Internship',
      description: 'Internship in software engineering',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
      ...overrides,
    };
  }

  static createPasswordResetToken(overrides?: Partial<any>) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    return {
      id: 1,
      userId: '123e4567-e89b-12d3-a456-426614174000',
      tokenHash: 'hashedToken123',
      expiresAt,
      used: false,
      createdAt: new Date(),
      ...overrides,
    };
  }
}
