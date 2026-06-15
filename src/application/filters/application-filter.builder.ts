import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { ApplicationFiltersDto } from '../dto/application-filters.dto';
import { Application } from '../entities/application.entity';
import { FilterBuilder } from '../../common/interfaces/filter-builder.interface';


@Injectable()
export class ApplicationFilterBuilder implements FilterBuilder<Application, ApplicationFiltersDto> {

  apply( queryBuilder: SelectQueryBuilder<Application>, filters: ApplicationFiltersDto ): SelectQueryBuilder<Application> {

    queryBuilder.leftJoinAndSelect(
        'application.student',
        'student',
    );

    queryBuilder.leftJoinAndSelect(
        'student.university',
        'university',
    );

    queryBuilder.leftJoinAndSelect(
        'student.skills',
        'skills',
    );

    queryBuilder.leftJoinAndSelect(
        'application.vacancie',
        'vacancie',
    );

    queryBuilder.leftJoinAndSelect(
        'vacancie.company',
        'company',
    );

    if (filters.studentId) {

        queryBuilder.andWhere(
            'student.id = :studentId', {
                studentId: filters.studentId,
            },
        );
    }

    if (filters.status) {

        queryBuilder.andWhere(
            'application.status = :status', {
                status: filters.status,
            },
        );
    }

    if (filters.companyId) {

        queryBuilder.andWhere(
            'company.id = :companyId', {
                companyId: filters.companyId,
            },
        );
    }

    if (filters.withoutInternship) {

        queryBuilder.leftJoin(
            'application.internship',
            'internship',
        ).andWhere(
            'internship.id IS NULL',
        );
    }

    return queryBuilder;

  }

}