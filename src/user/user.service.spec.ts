import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { BcryptAdapter } from '../common/adapters/bcrypt.adapter';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';

describe('UserService', () => {
  let service: UserService;
  let bcryptAdapter: jest.Mocked<BcryptAdapter>;
  let userRepository: any;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: Role.STUDENT,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockCreateUserDto = {
    email: 'newuser@example.com',
    password: 'password123',
    role: Role.STUDENT,
    isActive: true,
  };

  const mockPaginationDto = {
    page: 1,
    per_page: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: BcryptAdapter,
          useValue: {
            hash: jest.fn(),
            compare: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn(),
            findOneBy: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            existsBy: jest.fn(),
            preload: jest.fn(),
            softRemove: jest.fn(),
            createQueryBuilder: jest.fn(),
            manager: {
              create: jest.fn(),
              save: jest.fn(),
              existsBy: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    bcryptAdapter = module.get(BcryptAdapter) as jest.Mocked<BcryptAdapter>;
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const hashedPassword = 'hashedPassword123';

      userRepository.manager.existsBy.mockResolvedValue(false);
      bcryptAdapter.hash.mockResolvedValue(hashedPassword);
      userRepository.manager.create.mockReturnValue({
        ...mockCreateUserDto,
        password: hashedPassword,
      });
      userRepository.manager.save.mockResolvedValue({
        id: '123',
        ...mockCreateUserDto,
        password: hashedPassword,
      });

      const result = await service.create(mockCreateUserDto);

      expect(bcryptAdapter.hash).toHaveBeenCalledWith(mockCreateUserDto.password);
      expect(userRepository.manager.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(mockCreateUserDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepository.manager.existsBy.mockResolvedValue(true);

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [mockUser, { ...mockUser, id: '456' }];
      const pagination = {
        page: 1,
        per_page: 10,
      };

      userRepository.findAndCount.mockResolvedValue([mockUsers, 2]);

      const result = await service.findAll(pagination as any);

      expect(result).toHaveProperty('data');
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: mockUser.id });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateDto = { email: 'newemail@example.com' };
      const updatedUser = { ...mockUser, ...updateDto };

      userRepository.preload.mockResolvedValue(updatedUser);
      userRepository.existsBy.mockResolvedValue(false);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateDto);

      expect(result.email).toBe(updateDto.email);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should hash password if provided in update', async () => {
      const password = 'newPassword';
      const updateDto = { password };
      const hashedPassword = 'hashedNewPassword';

      bcryptAdapter.hash.mockResolvedValue(hashedPassword);
      userRepository.preload.mockResolvedValue({ ...mockUser, password: hashedPassword });
      userRepository.save.mockResolvedValue({ ...mockUser, password: hashedPassword });

      await service.update(mockUser.id, updateDto);

      expect(bcryptAdapter.hash).toHaveBeenCalledWith(password);
      expect(userRepository.preload).toHaveBeenCalledWith({ id: mockUser.id, password: hashedPassword });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.preload.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if email is already taken', async () => {
      const updateDto = { email: 'taken@example.com' };

      userRepository.preload.mockResolvedValue(mockUser);
      userRepository.existsBy.mockResolvedValue(true);

      await expect(service.update(mockUser.id, updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft remove user', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);
      userRepository.softRemove.mockResolvedValue(mockUser);

      await service.remove(mockUser.id);

      expect(userRepository.softRemove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should find user with password by email', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmailWithPassword(mockUser.email);

      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
      expect(result.password).toBe(mockUser.password);
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmailWithPassword('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });
});
