import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt.auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { UniversityModule } from './university/university.module';
import { CompanyModule } from './company/company.module';
import { StudentModule } from './student/student.module';
import { VacancieModule } from './vacancie/vacancie.module';
import { ApplicationModule } from './application/application.module';
import { PartnershipModule } from './partnership/partnership.module';
import { StorageModule } from './storage/storage.module';
import { FilesModule } from './files/files.module';
import { InternshipModule } from './internship/internship.module';
import { InternshipUpdateModule } from './internship-update/internship-update.module';
import { SkillModule } from './skill/skill.module';
import { SeedModule } from './seed/seed.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        ssl: {
          rejectUnauthorized: false,
        }
      }),
    }),

    CommonModule,

    AuthModule,

    UserModule,

    UniversityModule,

    CompanyModule,

    StudentModule,

    VacancieModule,

    ApplicationModule,

    PartnershipModule,

    StorageModule,

    FilesModule,

    InternshipModule,

    InternshipUpdateModule,

    SkillModule,

    SeedModule,

    NotificationModule

  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
