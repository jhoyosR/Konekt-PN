import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Skill } from '../skill/entities/skill.entity';
import { Repository } from 'typeorm';
import { skillsData } from './data/skills-data';
import { User } from '../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { BcryptAdapter } from '../common/adapters/bcrypt.adapter';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class SeedService {
  
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly hasher: BcryptAdapter
  ) {}

  async runSeed() {

    await this.insertNewSkills();
    await this.insertFirstUser();

    return {
      message: 'SEED EXECUTED',
      skillsInserted: skillsData.length,
    };
  }

  /**
   * Inserta las habilidades en la base de datos
   */
  private async insertNewSkills(): Promise<void> {
    await this.skillRepository.upsert(
      skillsData,
      ['name'],
    );
  }

  private async insertFirstUser() {
    const user = this.userRepository.create({
      email: 'admin@gmail.com',
      password: await this.hasher.hash(this.configService.get('FIRST_USER_PASSWORD')!),
      role: Role.SUPER_ADMIN
    });

    await this.userRepository.save(user);
  }
}
