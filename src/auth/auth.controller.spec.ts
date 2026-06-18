import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import request from 'supertest';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'student',
    isActive: true,
  };

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiJ9';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            registerUniversity: jest.fn(),
            registerCompany: jest.fn(),
            registerStudent: jest.fn(),
            login: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();

    authService = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse = {
        user: mockUser,
        token: mockToken,
      };

      authService.login.mockResolvedValue(expectedResponse as any);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });

    it('should return 400 for missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'password123' })
        .expect(400);
    });

    it('should return 400 for missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);
    });
  });

  describe('POST /auth/register-student', () => {
    it('should register student successfully', async () => {
      const registerDto = {
        email: 'student@example.com',
        password: 'Password123!',
        fullName: 'John Doe',
        about: 'Soy un estudiante apasionado por el desarrollo de aplicaciones web',
        documentNumber: '1234567890',
        phone: '3176356499',
        career: 'Ingeniería de Software',
        semester: 6,
        universityId: 1,
      };

      const expectedResponse = {
        user: { ...mockUser, email: registerDto.email },
        student: { id: 1, ...registerDto },
        token: mockToken,
      };

      authService.registerStudent.mockResolvedValue(expectedResponse as any);

      const response = await request(app.getHttpServer())
        .post('/auth/register-student')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('student');
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('POST /auth/register-university', () => {
    it('should register university successfully', async () => {
      const registerDto = {
        email: 'university@example.com',
        password: 'Password123!',
        name: 'Test University',
        nit: '900123456-7',
        phone: '3141234567',
      };

      const expectedResponse = {
        user: { ...mockUser, email: registerDto.email, role: 'university' },
        university: { id: 1, ...registerDto },
        token: mockToken,
      };

      authService.registerUniversity.mockResolvedValue(expectedResponse as any);

      const response = await request(app.getHttpServer())
        .post('/auth/register-university')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('university');
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('POST /auth/register-company', () => {
    it('should register company successfully', async () => {
      const registerDto = {
        email: 'company@example.com',
        password: 'Password123!',
        name: 'Test Company',
        description: 'Empresa especializada en consultoría tecnológica.',
        nit: '900123456-7',
        industry: 'Servicios y Consultoría TI',
        phone: '3141234567',
      };

      const expectedResponse = {
        user: { ...mockUser, email: registerDto.email, role: 'company' },
        company: { id: 1, ...registerDto },
        token: mockToken,
      };

      authService.registerCompany.mockResolvedValue(expectedResponse as any);

      const response = await request(app.getHttpServer())
        .post('/auth/register-company')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('company');
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should send password reset email', async () => {
      const forgotPasswordDto = {
        email: 'test@example.com',
      };

      const expectedResponse = {
        message: 'Email sent successfully',
      };

      authService.forgotPassword.mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send(forgotPasswordDto)
        .expect(200);

      expect(response.body).toEqual(expectedResponse);
    });

    it('should return generic message for non-existent email', async () => {
      const forgotPasswordDto = {
        email: 'nonexistent@example.com',
      };

      const expectedResponse = {
        message: 'Email sent successfully',
      };

      authService.forgotPassword.mockResolvedValue(expectedResponse);

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send(forgotPasswordDto)
        .expect(200);
    });

    it('should allow repeated forgot-password requests in this test setup', async () => {
      const forgotPasswordDto = {
        email: 'test@example.com',
      };

      authService.forgotPassword.mockResolvedValue({
        message: 'Email sent successfully',
      });

      for (let i = 0; i < 4; i++) {
        await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send(forgotPasswordDto)
          .expect(200);
      }
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password successfully', async () => {
      const resetPasswordDto = {
        token: 'valid-reset-token',
        password: 'NewPassword123!',
      };

      const expectedResponse = {
        message: 'Password reset successfully',
      };

      authService.resetPassword.mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(resetPasswordDto)
        .expect(200);

      expect(response.body).toEqual(expectedResponse);
    });

    it('should return 400 for invalid token', async () => {
      const resetPasswordDto = {
        token: 'invalid-token',
        password: 'newPassword123',
      };

      authService.resetPassword.mockRejectedValue(
        new BadRequestException('Invalid or expired token'),
      );

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(resetPasswordDto)
        .expect(400);
    });
  });
});
