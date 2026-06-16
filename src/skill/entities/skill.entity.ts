import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Student } from "../../student/entities/student.entity";
import { Vacancie } from "../../vacancie/entities/vacancie.entity";

@Entity('skills')
export class Skill {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { unique: true })
    name!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @ManyToMany(
        () => Student, 
        student => student.skills,
        { cascade: ['remove', 'soft-remove'] }
    )
    students?: Student[];

    @ManyToMany(
        () => Vacancie, 
        vacancie => vacancie.skills,
        { cascade: ['remove', 'soft-remove'] }
    )
    vacancies?: Vacancie[];
}
