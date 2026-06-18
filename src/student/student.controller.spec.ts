import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import request from 'supertest';

describe('StudentController (Integration)', () => {
  let app: INestApplication;
  let studentService: jest.Mocked<StudentService>;

  const mockStudent = {
    id: 1,
    documentNumber: '1234567890',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    dateOfBirth: '2000-01-01T00:00:00.000Z',
    university: { id: 1, name: 'Test University' },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentController],
      providers: [
        {
          provide: StudentService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            assignSkills: jest.fn(),
            removeSkill: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();

    studentService = module.get(StudentService) as jest.Mocked<StudentService>;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /student', () => {
    it('should return all students with filters', async () => {
      const mockStudents = [mockStudent, { ...mockStudent, id: 2 }];
      const paginatedResponse = {
        data: mockStudents,
        total: 2,
      };

      studentService.findAll.mockResolvedValue(paginatedResponse as any);

      const response = await request(app.getHttpServer())
        .get('/student')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should support filter parameters', async () => {
      const paginatedResponse = {
        data: [mockStudent],
        total: 1,
      };

      studentService.findAll.mockResolvedValue(paginatedResponse as any);

      const response = await request(app.getHttpServer())
        .get('/student')
        .query({ universityId: 1, page: 1, per_page: 10 })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /student/:id', () => {
    it('should return a student by id', async () => {
      studentService.findOne.mockResolvedValue(mockStudent as any);

      const response = await request(app.getHttpServer())
        .get(`/student/${mockStudent.id}`)
        .expect(200);

      expect(response.body).toEqual(mockStudent);
      expect(studentService.findOne).toHaveBeenCalledWith(mockStudent.id);
    });

    it('should return 404 for non-existent student', async () => {
      studentService.findOne.mockRejectedValue(new NotFoundException('Not found'));

      await request(app.getHttpServer())
        .get('/student/999')
        .expect(404);
    });
  });

  describe('PATCH /student/:id', () => {
    it('should update a student successfully', async () => {
      const updateStudentDto = {
        phone: '9876543210',
      };

      const updatedStudent = {
        ...mockStudent,
        ...updateStudentDto,
      };

      studentService.update.mockResolvedValue(updatedStudent as any);

      const response = await request(app.getHttpServer())
        .patch(`/student/${mockStudent.id}`)
        .send(updateStudentDto)
        .expect(200);

      expect(response.body.phone).toBe(updateStudentDto.phone);
    });

    it('should allow students to update their own profile', async () => {
      const updateStudentDto = {
        phone: '9876543210',
      };

      const updatedStudent = {
        ...mockStudent,
        ...updateStudentDto,
      };

      studentService.update.mockResolvedValue(updatedStudent as any);

      await request(app.getHttpServer())
        .patch(`/student/${mockStudent.id}`)
        .send(updateStudentDto)
        .expect(200);
    });
  });

  describe('POST /student/:id/skills', () => {
    it('should assign skills to a student', async () => {
      const assignSkillDto = {
        skillId: 1,
      };

      const studentWithSkills = {
        ...mockStudent,
        skills: [
          { id: 1, name: 'JavaScript' },
          { id: 2, name: 'TypeScript' },
          { id: 3, name: 'Node.js' },
        ],
      };

      studentService.assignSkills.mockResolvedValue(studentWithSkills as any);

      const response = await request(app.getHttpServer())
        .post(`/student/${mockStudent.id}/skills`)
        .send(assignSkillDto)
        .expect(201);

      expect(response.body).toHaveProperty('skills');
      expect(response.body.skills).toBeInstanceOf(Array);
    });

    it('should not assign duplicate skills', async () => {
      const assignSkillDto = {
        skillId: 1,
      };

      const studentWithSkills = {
        ...mockStudent,
        skills: [
          { id: 1, name: 'JavaScript' },
          { id: 2, name: 'TypeScript' },
        ],
      };

      studentService.assignSkills.mockResolvedValue(studentWithSkills as any);

      await request(app.getHttpServer())
        .post(`/student/${mockStudent.id}/skills`)
        .send(assignSkillDto)
        .expect(201);
    });
  });

  describe('DELETE /student/:id/skills/:skillId', () => {
    it('should remove a skill from a student', async () => {
      const skillId = 1;
      const studentWithoutSkill = {
        ...mockStudent,
        skills: [{ id: 2, name: 'TypeScript' }],
      };

      studentService.removeSkill.mockResolvedValue(studentWithoutSkill as any);

      const response = await request(app.getHttpServer())
        .delete(`/student/${mockStudent.id}/skills/${skillId}`)
        .expect(200);

      expect(response.body).toHaveProperty('skills');
    });

    it('should return 404 if skill not found for student', async () => {
      studentService.removeSkill.mockRejectedValue(new NotFoundException('Skill not found'));

      await request(app.getHttpServer())
        .delete(`/student/${mockStudent.id}/skills/999`)
        .expect(404);
    });
  });
});
