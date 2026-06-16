import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateVacancieDto } from './dto/create-vacancie.dto';
import { UpdateVacancieDto } from './dto/update-vacancie.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Vacancie } from './entities/vacancie.entity';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CompanyService } from '../company/company.service';
import { MSG } from '../common/helpers/validation-messages.helper';
import { VacancieFiltersDto } from './dto/vacancie-filters.dto';
import { VacancieFilterBuilder } from './filters/vacancie-filter.builder';
import { CommonService } from '../common/common.service';
import { AssignSkillDto } from '../skill/dto/assign-skill.dto';
import { Skill } from '../skill/entities/skill.entity';
import { Student } from '../student/entities/student.entity';
import { Notification } from '../notification/entities/notification.entity';
import { NotificationType } from '../notification/enum/notification-type.enum';
import { NotificationTemplates } from '../notification/templates/notification-templates';

@Injectable()
export class VacancieService {

  constructor(
    @InjectRepository(Vacancie)
    private readonly vacancieRepository: Repository<Vacancie>,
    private readonly companyService: CompanyService,
    private readonly commonService: CommonService,
    private readonly filterBuilder: VacancieFilterBuilder,
    private readonly dataSource: DataSource,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

  ) {}

  /**
   * Crea una nueva vacante asociada a una empresa.
   * @param createVacancieDto - Datos de la vacante (incluye `companyId`).
   * @returns La entidad `Vacancie` creada.
   */
  async create(createVacancieDto: CreateVacancieDto) {
    // Obtener la empresa relacionada; `findOne` lanzará NotFound si no existe
    const company = await this.companyService.findOne(createVacancieDto.companyId);

    // Crear la entidad vacante con la relación asignada
    const vacancie = this.vacancieRepository.create({
      ...createVacancieDto,
      company
    });

    return this.vacancieRepository.save(vacancie);

  }

  /**
   * Obtiene vacantes paginadas.
   * @param filters - Filtros.
   * @returns Respuesta paginada con entidades `Vacancie`.
   */
  async findAll(filters: VacancieFiltersDto): Promise<PaginatedResponse<Vacancie>|Vacancie[]> {

    let queryBuilder = this.vacancieRepository.createQueryBuilder('vacancie');

    queryBuilder = this.filterBuilder.apply(queryBuilder, filters);

    return this.commonService.paginate(queryBuilder, filters)
  }

  /**
   * Busca una vacante por id.
   * @param id - Identificador numérico de la vacante.
   * @returns La entidad `Vacancie` encontrada.
   * @throws NotFoundException si no existe.
   */
  async findOne(id: number) {
    const vacancie = await this.vacancieRepository.findOneBy({ id });
    if (!vacancie) throw new NotFoundException(MSG.notFoundById('vacante'));

    return vacancie;
  }

  /**
   * Actualiza una vacante.
   * @param id - Identificador de la vacante a actualizar.
   * @param updateVacancieDto - Datos a actualizar (puede incluir `companyId`).
   * @returns La entidad `Vacancie` actualizada.
   * @throws NotFoundException si no existe la vacante.
   */
  async update(id: number, updateVacancieDto: UpdateVacancieDto) {
    const { companyId, ...vacancieData } = updateVacancieDto;

    // Valida existencia de la empresa y obtiene la entidad
    const company = companyId
      ? await this.companyService.findOne(companyId)
      : undefined;

    const vacancie = await this.vacancieRepository.preload({ id, ...vacancieData });
    if (!vacancie) throw new NotFoundException(MSG.notFoundById('vacante'));

    // Asigna la relación como objeto
    if (company) vacancie.company = company;

    return this.vacancieRepository.save(vacancie);
  }

  /**
   * Elimina (soft remove) una vacante por id.
   * @param id - Identificador de la vacante.
   */
  async remove(id: number) {
    const vacancie = await this.findOne(id);
    await this.vacancieRepository.softRemove(vacancie);
  }

  /**
     * Le asigna una habilidad a una vacante
     * 
     * @param {number} id 
     * @param {AssignSkillDto} assignSkillDto 
     * @returns 
     */
    async assignSkills(id: number, assignSkillDto: AssignSkillDto) {
      const vacancie = await this.vacancieRepository.findOne({
        where: { id },
        relations: {
          skills: true,
        },
      });
  
      if (!vacancie) throw new NotFoundException(MSG.notFoundById('vacante'));
  
      const skill = await this.skillRepository.findOneBy({id: assignSkillDto.skillId});
  
      if (!skill) throw new NotFoundException(MSG.notFoundById('habilidad'));
  
      const alreadyExists = vacancie.skills?.some(
        skill => skill.id === assignSkillDto.skillId,
      );
  
      if (alreadyExists) throw new ConflictException(MSG.alreadyAsiggn('habilidad'));
  
      vacancie.skills?.push(skill);
  
      const vacancieAssigned = await this.vacancieRepository.save(vacancie);

      await this.notifyStudentsWithSameSkill(vacancieAssigned, assignSkillDto.skillId);

      return vacancieAssigned;
    }
  
    /**
     * Elimina una habilidad de una vacante
     * 
     * @param {number} id 
     * @param {number} skillId 
     */
    async removeSkill(id: number, skillId: number) {
      await this.dataSource.createQueryBuilder()
        .relation(Vacancie, 'skills')
        .of(id)
        .remove(skillId);
    }

    /**
     * Notifica a los estudiantes que tengan la misma habilidad asociada a la vacante
     * 
     * @param {Vacancie} vacancie 
     * @param {number} skillId 
     */
    private async notifyStudentsWithSameSkill(vacancie: Vacancie, skillId: number) {

      const students = await this.studentRepository.createQueryBuilder('student')
        .innerJoin(
          'student.skills',
          'skill',
          'skill.id = :skillId',
          {
            skillId
          },
        )
        .distinct(true)
        .getMany();

      const notifiedUsers = await this.notificationRepository.find({
        select: {
          userId: true,
        },
        where: {
          type: NotificationType.NEW_COMPATIBLE_VACANCY,
          resourceId: vacancie.id,
        },
      });

      const notifiedIds = new Set(
        notifiedUsers.map(notifiedUser => notifiedUser.userId),
      );

      const notifications = students
        .filter(student => !notifiedIds.has(student.userId))
        .map(student =>
          this.notificationRepository.create({
            userId: student.userId,
            resourceId: vacancie.id,
            ...NotificationTemplates.newCompatibleVacancy(vacancie.title)
          }),
        );

      if (notifications.length > 0) {
        await this.notificationRepository.save(notifications);
      }
    }
}
