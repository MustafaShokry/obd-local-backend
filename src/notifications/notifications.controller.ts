import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AccessTokenGuard } from 'src/auth/accessToken.guard';
import { UseGuards } from '@nestjs/common';
import { MarkReadDto } from './dto/mark-read.dto';

@Controller('notifications')
@UseGuards(AccessTokenGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications() {
    return this.notificationsService.getNotifications();
  }

  @Get('recent')
  getRecentNotifications(@Query('limit') limit = 50) {
    return this.notificationsService.getRecent(limit);
  }

  @Get('unread')
  getUnreadNotifications() {
    return this.notificationsService.getAllUnread();
  }

  @Patch('read')
  markAsRead(@Body() markReadDto: MarkReadDto) {
    return this.notificationsService.markAsRead(markReadDto.ids);
  }
}
