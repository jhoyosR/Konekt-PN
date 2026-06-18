import { Test, TestingModule } from '@nestjs/testing';
import { StudentService } from './student.service';
import { UniversityService } from '../university/university.service';
import { CommonService } from '../common/common.service';
import { StudentFilterBuilder } from './filters/student-filter.builder';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Skill } from '../skill/entities/skill.entity';
import { BcryptAdapter } from '../common/adapters/bcrypt.adapter';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Career } from './enum/career.enum';
import { DataSource } from 'typeorm';

describe('StudentService', () => {
  let service: StudentService;
  let universityService: jest.Mocked<UniversityService>;
  let commonService: jest.Mocked<CommonService>;
  let studentRepository: any;
  let skillRepository: any;
  let filterBuilder: any;
  let bcryptAdapter: jest.Mocked<BcryptAdapter>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: any;
  let queryBuilder: any;

  const mockStudent = {
    id: 1,
    documentNumber: '1234567890',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    dateOfBirth: new Date('2000-01-01'),
    university: { id: 1, name: 'Test University' },
    user: { id: '123', email: 'john@example.com' },
  };

  const mockCreateStudentDto = {
    documentNumber: '9876543210',
    fullName: 'Jane Smith',
    about: 'Sobre mí',
    phone: '9876543210',
    career: Career.SoftwareEngineering,
    semester: 3,
    universityId: 1,
  };

  const mockFiltersDto = {
    page: 1,
    per_page: 10,
    all: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        {
          provide: UniversityService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: CommonService,
          useValue: {
            paginate: jest.fn(),
          },
        },
        {
          provide: StudentFilterBuilder,
          useValue: {
            apply: jest.fn(),
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
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Student),
          useValue: {
            manager: {
              existsBy: jest.fn(),
              create: jest.fn(),
              save: jest.fn(),
            },
            findOneBy: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
    universityService = module.get(UniversityService) as jest.Mocked<UniversityService>;
    commonService = module.get(CommonService) as jest.Mocked<CommonService>;
    studentRepository = module.get(getRepositoryToken(Student));
    skillRepository = module.get(getRepositoryToken(Skill));
    filterBuilder = module.get(StudentFilterBuilder);
    bcryptAdapter = module.get(BcryptAdapter) as jest.Mocked<BcryptAdapter>;
    dataSource = module.get(DataSource) as jest.Mocked<DataSource>;

    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        preload: jest.fn(),
        save: jest.fn(),
      },
    };

    queryBuilder = {
      relation: jest.fn().mockReturnThis(),
      of: jest.fn().mockReturnThis(),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    dataSource.createQueryRunner.mockReturnValue(queryRunner);
    dataSource.createQueryBuilder.mockReturnValue(queryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a student successfully', async () => {
      const createdStudent = {
        ...mockStudent,
        ...mockCreateStudentDto,
        id: 2,
      };

      universityService.findOne.mockResolvedValue({ id: 1, name: 'Test University' } as any);
      studentRepository.manager.existsBy.mockResolvedValue(false);
      studentRepository.manager.create.mockReturnValue(createdStudent);
      studentRepository.manager.save.mockResolvedValue(createdStudent);

      const result = await service.create(mockCreateStudentDto, mockStudent.user as any);

      expect(result).toBeDefined();
      expect(result.documentNumber).toBe(mockCreateStudentDto.documentNumber);
      expect(universityService.findOne).toHaveBeenCalledWith(mockCreateStudentDto.universityId);
    });

    it('should throw ConflictException if document number already exists', async () => {
      studentRepository.manager.existsBy.mockResolvedValue(true);

      await expect(
        service.create(mockCreateStudentDto, mockStudent.user as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated students', async () => {
      const mockQueryBuilder = {
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockStudent], 1]),
      };

      studentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      filterBuilder.apply.mockReturnValue(mockQueryBuilder);
      commonService.paginate.mockResolvedValue({
        data: [mockStudent],
        total: 1,
        page: 1,
        per_page: 10,
        page_count: 1,
        has_next: false,
        has_prev: false,
      });

      const result = await service.findAll(mockFiltersDto);

      expect(result).toHaveProperty('data');
      expect(filterBuilder.apply).toHaveBeenCalled();
      expect(commonService.paginate).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      studentRepository.findOneBy.mockResolvedValue(mockStudent);

      const result = await service.findOne(mockStudent.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockStudent.id);
      expect(studentRepository.findOneBy).toHaveBeenCalledWith({ id: mockStudent.id });
    });

    it('should throw NotFoundException if student not found', async () => {
      studentRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update student successfully', async () => {
      const updateDto = { about: 'Updated about' };
      const updatedStudent = { ...mockStudent, ...updateDto };

      queryRunner.manager.preload.mockResolvedValue(updatedStudent);
      queryRunner.manager.save.mockResolvedValue(updatedStudent);

      const result = await service.update(mockStudent.id, updateDto as any);

      expect(result.about).toBe(updateDto.about);
      expect(queryRunner.manager.preload).toHaveBeenCalledWith(Student, { id: mockStudent.id, ...updateDto });
      expect(queryRunner.manager.save).toHaveBeenCalledWith(updatedStudent);
    });

    it('should throw NotFoundException if student not found', async () => {
      queryRunner.manager.preload.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignSkills', () => {
    it('should assign a skill to student', async () => {
      const assignSkillDto = { skillId: 1 };
      const mockSkill = { id: 1, name: 'Skill 1' };

      studentRepository.findOne.mockResolvedValue(mockStudent);
      skillRepository.findOneBy.mockResolvedValue(mockSkill);
      studentRepository.save.mockResolvedValue({
        ...mockStudent,
        skills: [mockSkill],
      });

      const result = await service.assignSkills(mockStudent.id, assignSkillDto as any);

      expect(result).toBeDefined();
      expect(studentRepository.save).toHaveBeenCalled();
    });
  });

  describe('removeSkill', () => {
    it('should remove skill from student', async () => {
      const skillId = 1;

      const result = await service.removeSkill(mockStudent.id, skillId);

      expect(result).toBeUndefined();
      expect(dataSource.createQueryBuilder).toHaveBeenCalled();
      expect(queryBuilder.relation).toHaveBeenCalledWith(Student, 'skills');
      expect(queryBuilder.of).toHaveBeenCalledWith(mockStudent.id);
      expect(queryBuilder.remove).toHaveBeenCalledWith(skillId);
    });
  });
});
