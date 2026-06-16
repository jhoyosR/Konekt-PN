import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { NotificationType } from "../enum/notification-type.enum";

@Entity('notifications')
@Index(['userId', 'isRead'])
@Index(['type', 'resourceId'])
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

    @Column({
        type: 'enum',
        enum: NotificationType,
        nullable: true
    })
    type?: NotificationType;

    @Column({ nullable: true })
    resourceId?: number;

    @CreateDateColumn()
    createdAt!: Date;

}