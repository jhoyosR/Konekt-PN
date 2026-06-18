import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';

describe('Backend integration tests', () => {
  let app: INestApplication;
  let authToken: string;
  let createdUniversityId: number;
  const uniqueSuffix = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) => new BadRequestException(errors),
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return career constants through /common/career', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/common/career')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should register a university and return token, user and university data', async () => {
    const createUniversityDto = {
      email: `integration-${uniqueSuffix}@example.com`,
      password: 'Str0ngP@ssword!',
      name: 'Integration University',
      nit: `900${uniqueSuffix}`,
      phone: '3001234567',
      address: 'Calle 100 # 50-50',
    };

    const response = await request(app.getHttpServer())
      .post('/api/auth/register-university')
      .send(createUniversityDto)
      .expect(201);

    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('university');
    expect(response.body.user).toMatchObject({
      email: createUniversityDto.email,
    });
    expect(response.body.university).toMatchObject({
      name: createUniversityDto.name,
      nit: createUniversityDto.nit,
    });

    authToken = response.body.token;
    createdUniversityId = response.body.university.id;
  });

  it('should return universities list through /university', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/university')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.some((item: any) => item.id === createdUniversityId)).toBe(true);
  });

  it('should login with the registered university user and return a token', async () => {
    const loginPayload = {
      email: `integration-${uniqueSuffix}@example.com`,
      password: 'Str0ngP@ssword!',
    };

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(loginPayload)
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('profile');
    expect(response.body.user.email).toBe(loginPayload.email);
    expect(typeof response.body.token).toBe('string');

    authToken = response.body.token;
  });

  it('should return university details through /university/:id with auth token', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/university/${createdUniversityId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', createdUniversityId);
    expect(response.body).toHaveProperty('name', 'Integration University');
  });

  describe('Company Endpoints', () => {
    let createdCompanyId: number;
    let companyToken: string;

    it('should register a company and return token, user and company data', async () => {
      const createCompanyDto = {
        email: `company-${uniqueSuffix}@example.com`,
        password: 'Comp@ny123!',
        name: 'Test Company Inc',
        nit: `800${uniqueSuffix}`,
        phone: '3005551234',
        industry: 'Servicios y Consultoría TI',
        description: 'A test company for integration testing',
        address: 'Carrera 50 # 100-50',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register-company')
        .send(createCompanyDto)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('company');
      expect(response.body.company.name).toBe(createCompanyDto.name);

      createdCompanyId = response.body.company.id;
      companyToken = response.body.token;
    });

    it('should return companies list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/company')
        .set('Authorization', `Bearer ${companyToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return company details by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/company/${createdCompanyId}`)
        .set('Authorization', `Bearer ${companyToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdCompanyId);
      expect(response.body).toHaveProperty('name', 'Test Company Inc');
    });
  });

  describe('Skills Endpoints', () => {
    it('should return skills list with auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/skill')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Common/Constants Endpoints', () => {
    it('should return career constants', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/common/career')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Auth Edge Cases', () => {
    it('should reject login with invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register-university')
        .send({
          email: 'invalid-email',
          password: 'Str0ngP@ssword!',
          name: 'Test University',
          nit: `920${uniqueSuffix}`,
          phone: '3001234567',
        });

      expect(response.status).toBe(400);
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register-university')
        .send({
          email: `weak-pass-${uniqueSuffix}@example.com`,
          password: 'weak',
          name: 'Test University',
          nit: `925${uniqueSuffix}`,
          phone: '3001234567',
        });

      expect(response.status).toBe(400);
    });
  });
});
