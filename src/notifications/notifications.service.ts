import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(notification: Notification): Promise<Notification> {
    return this.notificationRepository.save(notification);
  }

  async getNotifications(): Promise<Notification[]> {
    return this.notificationRepository.find();
  }

  async getAllUnread(): Promise<Notification[]> {
    return this.notificationRepository.find({ where: { isRead: false } });
  }

  async markAsRead(ids: string[]): Promise<void> {
    const notifications = await this.notificationRepository.find({
      where: { id: In(ids) },
    });
    for (const notification of notifications) {
      notification.isRead = true;
    }
    await this.notificationRepository.save(notifications);
  }

  async getRecent(limit = 50): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {},
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }
}
