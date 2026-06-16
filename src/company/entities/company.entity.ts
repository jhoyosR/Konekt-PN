import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { IndustryType } from '../enum/industry-type.enum';
import { Vacancie } from '../../vacancie/entities/vacancie.entity';
import { Partnership } from '../../partnership/entities/partnership.entity';
import { Expose } from 'class-transformer';

@Entity('companies')
export class Company {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text' })
    name!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({
        type: 'varchar',
        unique: true,
        length: 100
    })
    nit!: string;

    @Column({
        type: 'enum',
        enum: IndustryType
    })
    industry!: IndustryType

    @Column({ type: 'text', nullable: true })
    address?: string;

    @Column({type: 'varchar', length: 15})
    phone!: string;

    @Column()
    userId!: string;

    @Column('text', { nullable: true })
    profilePhoto?: string;

    @Expose()
    get profilePhotoUrl() {
        if (this.profilePhoto)
            return `${process.env.HOST_URL ?? 'http://localhost:3000/api'}/files/${ this.profilePhoto }`;
    }

    @OneToOne(
        () => User, 
        (user) => user.company, 
        { eager: true, cascade: ['remove', 'soft-remove'] }
    )
    @JoinColumn({ name: 'userId' })
    user!: User;

    @OneToMany(
        () => Vacancie,
        (vacancie) => vacancie.company,
        { cascade: ['remove', 'soft-remove'] }
    )
    vacancies?: Vacancie[]

    @OneToMany(
        () => Partnership,
        (partnership) => partnership.company,
        { cascade: ['remove', 'soft-remove'] }
    )
    partnerships?: Partnership[]

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn({ select: false })
    deletedAt?: Date;
}
