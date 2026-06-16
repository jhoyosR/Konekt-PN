import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('notifications')
@Index(['userId', 'isRead'])
export class Notification {

    @PrimaryGeneratedColumn()
    id!: string;

    @Column('uuid')
    userId!: string;

    @Column('text')
    title!: string;

    @Column('text')
    message!: string;

    @Column({
        default: false,
    })
    isRead!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

}