import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePartnershipDto } from './dto/create-partnership.dto';
import { UpdatePartnershipDto } from './dto/update-partnership.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Partnership } from './entities/partnership.entity';
import { Repository } from 'typeorm';
import { UniversityService } from '../university/university.service';
import { CompanyService } from '../company/company.service';
import { CommonService } from '../common/common.service';
import { PartnershipFilterBuilder } from './filters/partnership-filter.builder';
import { PartnershipFiltersDto } from './dto/partnership-filters.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { MSG } from '../common/helpers/validation-messages.helper';

@Injectable()
export class PartnershipService {

  constructor(
    @InjectRepository(Partnership)
    private readonly partnershipRepository: Repository<Partnership>,
    private readonly universityService: UniversityService,
    private readonly companyService: CompanyService,
    private readonly commonService: CommonService,
    private readonly filterBuilder: PartnershipFilterBuilder,
  ) {}

  /**
   * Crea un nuevo convenio.
   * 
   * @param createPartnershipDto - Datos del convenio.
   * @returns La entidad `Partnership` creada.
   */
  async create(createPartnershipDto: CreatePartnershipDto) {

    const { companyId, universityId, ...createPartnershipData } = createPartnershipDto;

    // Obtener la empresa y universidad relacionada; Lanzará NotFound si no existe
    const [ company, university ] = await Promise.all([
      this.companyService.findOne(companyId),
      this.universityService.findOne(universityId)
    ]);

    // Validar que no exista ya un convenio entre las entidades
    const partnershipAlreadyExists = await this.partnershipRepository.exists({
      where: {
        company: { id: companyId },
        university: { id: universityId }
      }
    });

    if (partnershipAlreadyExists) throw new ConflictException(MSG.alreadyExists('convenio'));

    // Crea la entidad convenio con las relaciones
    const partnership = this.partnershipRepository.create({
      ...createPartnershipData,
      company,
      university
    });

    return this.partnershipRepository.save(partnership);
  }

  /**
   * Obtiene convenios paginados.
   * 
   * @param filters - Filtros.
   * @returns Respuesta paginada con entidades `Partnership`.
   */
  async findAll(filters: PartnershipFiltersDto): Promise<PaginatedResponse<Partnership>|Partnership[]> {
    
    let queryBuilder = this.partnershipRepository.createQueryBuilder('partnership');

    queryBuilder = this.filterBuilder.apply(queryBuilder, filters);

    return this.commonService.paginate(queryBuilder, filters)
  }

  /**
   * Busca un convenio por id.
   * 
   * @param id - Identificador numérico del convenio.
   * @returns La entidad `Partnership` encontrada.
   * @throws NotFoundException si no existe.
   */
  async findOne(id: number) {
    const partnership = await this.partnershipRepository.findOneBy({ id });
    if (!partnership) throw new NotFoundException(MSG.notFoundById('convenio'));

    return partnership;
  }

  /**
   * Actualiza un convenio.
   * 
   * @param id - Identificador del convenio a actualizar.
   * @param updatePartnershipDto - Datos a actualizar.
   * @returns La entidad `Partnership` actualizada.
   * @throws NotFoundException si no existe la convenio.
   */
  async update(id: number, updatePartnershipDto: UpdatePartnershipDto) {

    const partnership = await this.partnershipRepository.preload({ id, ...updatePartnershipDto });
    if (!partnership) throw new NotFoundException(MSG.notFoundById('convenio'));

    return this.partnershipRepository.save(partnership);
  }

  /**
   * Elimina (soft remove) un convenio por id.
   * 
   * @param id - Identificador del convenio.
   */
  async remove(id: number) {
    const partnership = await this.findOne(id);
    await this.partnershipRepository.softRemove(partnership);
  }
}
