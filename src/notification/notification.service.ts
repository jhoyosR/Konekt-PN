import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(data: CreateNotificationDto) {
    const notification = this.notificationRepository.create(data);

    return this.notificationRepository.save(notification);
  }

  async findByUser(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async markAsRead(id: number) {
    await this.notificationRepository.update(
      id,
      { isRead: true },
    );
  }

  async countUnread(userId: string) {
    return this.notificationRepository.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      {
        userId,
        isRead: false,
      },
      {
        isRead: true,
      },
    );
  }
}
