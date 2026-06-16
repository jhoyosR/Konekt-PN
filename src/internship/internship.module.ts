import { Module } from '@nestjs/common';
import { InternshipService } from './internship.service';
import { InternshipController } from './internship.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Internship } from './entities/internship.entity';
import { CommonModule } from '../common/common.module';
import { ApplicationModule } from '../application/application.module';
import { InternshipFilterBuilder } from './filters/internship-filter.builder';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ Internship ]),
    CommonModule,
    ApplicationModule,
    NotificationModule
  ],
  controllers: [InternshipController],
  providers: [InternshipService, InternshipFilterBuilder],
  exports: [
    TypeOrmModule,
    InternshipService
  ]
})
export class InternshipModule {}
