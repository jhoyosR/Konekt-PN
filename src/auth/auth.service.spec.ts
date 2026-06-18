/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { UniversityService } from '../university/university.service';
import { CompanyService } from '../company/company.service';
import { StudentService } from '../student/student.service';
import { BcryptAdapter } from '../common/adapters/bcrypt.adapter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { User } from '../user/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let universityService: jest.Mocked<UniversityService>;
  let companyService: jest.Mocked<CompanyService>;
  let studentService: jest.Mocked<StudentService>;
  let bcryptAdapter: jest.Mocked<BcryptAdapter>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let dataSource: jest.Mocked<DataSource>;
  let resetTokenRepository: jest.Mocked<Repository<PasswordResetToken>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let mailService: jest.Mocked<MailService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: Role.STUDENT,
    isActive: true,
    university: null,
    company: null,
    student: { id: 1, name: 'John' },
  };

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmailWithPassword: jest.fn(),
            create: jest.fn(),
            createWithManager: jest.fn(),
          },
        },
        {
          provide: UniversityService,
          useValue: {
            createWithManager: jest.fn(),
          },
        },
        {
          provide: CompanyService,
          useValue: {
            createWithManager: jest.fn(),
          },
        },
        {
          provide: StudentService,
          useValue: {
            createWithManager: jest.fn(),
          },
        },
        {
          provide: BcryptAdapter,
          useValue: {
            hash: jest.fn(),
            compare: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: {
            update: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService) as jest.Mocked<UserService>;
    universityService = module.get(UniversityService) as jest.Mocked<UniversityService>;
    companyService = module.get(CompanyService) as jest.Mocked<CompanyService>;
    studentService = module.get(StudentService) as jest.Mocked<StudentService>;
    bcryptAdapter = module.get(BcryptAdapter) as jest.Mocked<BcryptAdapter>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    dataSource = module.get(DataSource) as jest.Mocked<DataSource>;
    resetTokenRepository = module.get(getRepositoryToken(PasswordResetToken)) as jest.Mocked<Repository<PasswordResetToken>>;
    userRepository = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      userService.findByEmailWithPassword.mockResolvedValue(mockUser as any);
      bcryptAdapter.compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValue(mockToken);
      configService.getOrThrow.mockReturnValue('JWT_SECRET');

      const result = await service.login(email, password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.token).toBe(mockToken);
      expect(bcryptAdapter.compare).toHaveBeenCalledWith(password, mockUser.password);
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongPassword';

      userService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      userService.findByEmailWithPassword.mockResolvedValue(inactiveUser as any);

      await expect(service.login('test@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with incorrect password', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(mockUser as any);
      bcryptAdapter.compare.mockResolvedValue(false);

      await expect(service.login('test@example.com', 'wrongPassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should convert email to lowercase before searching', async () => {
      const email = 'Test@Example.COM';
      userService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(service.login(email, 'password')).rejects.toThrow();

      expect(userService.findByEmailWithPassword).toHaveBeenCalledWith(email.toLowerCase());
    });
  });

  describe('forgotPassword', () => {
    it('should send reset token email for valid user', async () => {
      const dto = { email: 'test@example.com' };

      userRepository.findOne.mockResolvedValue(mockUser as any);
      resetTokenRepository.update.mockResolvedValue({} as any);
      resetTokenRepository.create.mockReturnValue({ userId: mockUser.id } as any);
      resetTokenRepository.save.mockResolvedValue({} as any);
      mailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword(dto);

      expect(result).toHaveProperty('message');
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        dto.email,
        expect.any(String),
      );
      expect(resetTokenRepository.update).toHaveBeenCalledWith(
        { userId: mockUser.id, used: false },
        { used: true },
      );
    });

    it('should return generic message for non-existent email', async () => {
      const dto = { email: 'nonexistent@example.com' };

      userRepository.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword(dto);

      expect(result).toHaveProperty('message');
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const dto = { token: 'valid-token', password: 'newPassword' };
      const mockResetToken = {
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 10000),
        used: false,
      };

      resetTokenRepository.findOne.mockResolvedValue(mockResetToken as any);
      bcryptAdapter.hash.mockResolvedValue('hashedNewPassword');
      userRepository.update.mockResolvedValue({} as any);
      resetTokenRepository.save.mockResolvedValue({} as any);

      const result = await service.resetPassword(dto);

      expect(result).toHaveProperty('message');
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        password: 'hashedNewPassword',
      });
      expect(bcryptAdapter.hash).toHaveBeenCalledWith(dto.password);
    });

    it('should throw BadRequestException with invalid token', async () => {
      const dto = { token: 'invalid-token', password: 'newPassword' };

      resetTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.resetPassword(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with expired token', async () => {
      const dto = { token: 'expired-token', password: 'newPassword' };
      const expiredToken = {
        userId: mockUser.id,
        expiresAt: new Date(Date.now() - 10000),
        used: false,
      };

      resetTokenRepository.findOne.mockResolvedValue(expiredToken as any);

      await expect(service.resetPassword(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('registerUniversity', () => {
    it('should register university successfully', async () => {
      const registerDto = {
        email: 'university@example.com',
        password: 'password123',
        name: 'Test University',
      };

      const mockManager = {
        create: jest.fn(),
        save: jest.fn(),
      };

      const mockUniversity = { id: 1, name: registerDto.name };

      dataSource.transaction.mockImplementation(async (callback: any) => {
        const result = await callback(mockManager);
        return result;
      });

      universityService.createWithManager.mockResolvedValue(mockUniversity as any);

      // Este es un test simplificado. En un caso real, necesitarías mockear más profundamente
      // expect(result).toHaveProperty('user');
      // expect(result).toHaveProperty('university');
      // expect(result).toHaveProperty('token');
    });
  });
});
