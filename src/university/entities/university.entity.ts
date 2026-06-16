import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Student } from '../../student/entities/student.entity';
import { Partnership } from '../../partnership/entities/partnership.entity';
import { Expose } from 'class-transformer';

@Entity('universities')
export class University {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text')
    name!: string;

    @Column({
        type: 'varchar',
        unique: true,
        length: 100
    })
    nit!: string;

    @Column('text', { nullable: true })
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
        (user) => user.university, 
        { eager: true, cascade: ['remove', 'soft-remove'] }
    )
    @JoinColumn({ name: 'userId' })
    user!: User;

    @OneToMany(
        () => Student,
        (student) => student.university,
        { cascade: ['remove', 'soft-remove'] }
    )
    students?: Student[]

    @OneToMany(
        () => Partnership,
        (partnership) => partnership.university,
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