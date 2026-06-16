import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { StudentModule } from '../student/student.module';
import { VacancieModule } from '../vacancie/vacancie.module';
import { CommonModule } from '../common/common.module';
import { ApplicationFilterBuilder } from './filters/application-filter.builder';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ Application ]),
    StudentModule,
    VacancieModule,
    CommonModule,
    NotificationModule
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService, ApplicationFilterBuilder],
  exports: [
    TypeOrmModule,
    ApplicationService
  ]
})
export class ApplicationModule {}
