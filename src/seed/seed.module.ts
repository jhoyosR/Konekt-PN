import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { SkillModule } from '../skill/skill.module';
import { UserModule } from '../user/user.module';
import { BcryptAdapter } from '../common/adapters/bcrypt.adapter';

@Module({
  imports: [
    SkillModule,
    UserModule,
  ],
  controllers: [SeedController],
  providers: [SeedService, BcryptAdapter],
})
export class SeedModule {}
