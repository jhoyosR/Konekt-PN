import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import request from 'supertest';
import { Role } from '../common/enums/role.enum';

describe('UserController (Integration)', () => {
  let app: INestApplication;
  let userService: jest.Mocked<UserService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: Role.SUPER_ADMIN,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();

    userService = module.get(UserService) as jest.Mocked<UserService>;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /user', () => {
    it('should create a user successfully', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        role: Role.SUPER_ADMIN,
        isActive: true,
      };

      const expectedUser = {
        id: '456',
        ...createUserDto,
      };

      userService.create.mockResolvedValue(expectedUser as any);

      const response = await request(app.getHttpServer())
        .post('/user')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(createUserDto.email);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/user')
        .send({ email: 'test@example.com' })
        .expect(400);
    });
  });

  describe('GET /user', () => {
    it('should return paginated users', async () => {
      const mockUsers = [mockUser, { ...mockUser, id: '789' }];
      const paginatedResponse = {
        data: mockUsers,
        total: 2,
        page: 1,
        limit: 10,
      };

      userService.findAll.mockResolvedValue(paginatedResponse as any);

      const response = await request(app.getHttpServer())
        .get('/user')
        .query({ page: 1, per_page: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should support pagination parameters', async () => {
      const paginatedResponse = {
        data: [mockUser],
        total: 1,
        page: 2,
        limit: 5,
      };

      userService.findAll.mockResolvedValue(paginatedResponse as any);

      const response = await request(app.getHttpServer())
        .get('/user')
        .query({ page: 2, per_page: 5 })
        .expect(200);

      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(5);
    });
  });

  describe('GET /user/:id', () => {
    it('should return a user by id', async () => {
      userService.findOne.mockResolvedValue(mockUser as any);

      const response = await request(app.getHttpServer())
        .get(`/user/${mockUser.id}`)
        .expect(200);

      expect(response.body).toEqual(mockUser);
      expect(userService.findOne).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return 404 for non-existent user', async () => {
      const missingUserId = '123e4567-e89b-12d3-a456-426614174999';
      userService.findOne.mockRejectedValue(new NotFoundException('Not found'));

      await request(app.getHttpServer())
        .get(`/user/${missingUserId}`)
        .expect(404);
    });

    it('should validate UUID format', async () => {
      await request(app.getHttpServer())
        .get('/user/invalid-uuid')
        .expect(400);
    });
  });

  describe('PATCH /user/:id', () => {
    it('should update a user successfully', async () => {
      const updateUserDto = {
        email: 'updated@example.com',
      };

      const updatedUser = {
        ...mockUser,
        ...updateUserDto,
      };

      userService.update.mockResolvedValue(updatedUser as any);

      const response = await request(app.getHttpServer())
        .patch(`/user/${mockUser.id}`)
        .send(updateUserDto)
        .expect(200);

      expect(response.body.email).toBe(updateUserDto.email);
    });

    it('should hash password when updating', async () => {
      const updateUserDto = {
        password: 'newPassword123',
      };

      const updatedUser = {
        ...mockUser,
        password: 'hashedPassword',
      };

      userService.update.mockResolvedValue(updatedUser as any);

      await request(app.getHttpServer())
        .patch(`/user/${mockUser.id}`)
        .send(updateUserDto)
        .expect(200);

      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateUserDto);
    });
  });

  describe('DELETE /user/:id', () => {
    it('should delete a user successfully', async () => {
      userService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/user/${mockUser.id}`)
        .expect(200);

      expect(userService.remove).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return 404 for non-existent user', async () => {
      const missingUserId = '123e4567-e89b-12d3-a456-426614174999';
      userService.remove.mockRejectedValue(new NotFoundException('Not found'));

      await request(app.getHttpServer())
        .delete(`/user/${missingUserId}`)
        .expect(404);
    });
  });
});
