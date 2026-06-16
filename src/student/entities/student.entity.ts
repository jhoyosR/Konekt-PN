import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../user/entities/user.entity";
import { Career } from "../enum/career.enum";
import { University } from "../../university/entities/university.entity";
import { Application } from "../../application/entities/application.entity";
import { Expose } from "class-transformer";
import { Skill } from "../../skill/entities/skill.entity";


@Entity('students')
export class Student {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text' })
    fullName!: string;

    @Column({ type: 'text' })
    about!: string;

    @Column({
        type: 'varchar',
        unique: true,
        length: 50
    })
    documentNumber!: string;

    @Column({type: 'varchar', length: 15})
    phone!: string;

    @Column({ type: 'enum', enum: Career })
    career!: string;

    @Column({ type: 'int' })
    semester!: number;

    @Column()
    userId!: string;

    @Column()
    universityId!: number;

    @Column('text', { nullable: true })
    profilePhoto?: string;

    @Expose()
    get profilePhotoUrl() {
        if (this.profilePhoto)
            return `${process.env.HOST_URL ?? 'http://localhost:3000/api'}/files/${ this.profilePhoto }`;
    }

    @Column('text', { nullable: true })
    resume?: string;

    @Expose()
    get resumeUrl() {
        if (this.resume)
            return `${process.env.HOST_URL ?? 'http://localhost:3000/api'}/files/${ this.resume }`;
    }

    @OneToOne(
        () => User, 
        (user) => user.company, 
        { eager: true, cascade: ['remove', 'soft-remove'] }
    )
    @JoinColumn({ name: 'userId' })
    user!: User;

    @ManyToOne(
        () => University, 
        (university) => university.students,
        { eager: true }
    )
    @JoinColumn({ name: 'universityId' })
    university?: University;

    @OneToMany(
        () => Application,
        (application) => application.student,
        { cascade: ['remove', 'soft-remove'] }
    )
    applications?: Application[]

    @ManyToMany(
        () => Skill, 
        skill => skill.students,
        { eager: true, cascade: ['remove', 'soft-remove'] }
    )
    @JoinTable({
        name: 'student_skills',
        joinColumn: {
            name: 'studentId',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'skillId',
            referencedColumnName: 'id',
        },
    })
    skills?: Skill[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn({ select: false })
    deletedAt?: Date;

}
