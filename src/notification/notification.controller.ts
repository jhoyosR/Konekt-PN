import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CurrentUser } from '../common/decorators';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('notification')
export class NotificationController {

  constructor(
    private readonly notificationService: NotificationService
  ) {}

  @Get()
  findMyNotifications( @CurrentUser() user: JwtPayload ) {
    return this.notificationService.findByUser(
      user.id,
    );
  }

  @Patch(':id/read')
  markAsRead( @Param('id') id: string ) {
    return this.notificationService.markAsRead(+id);
  }

  @Get('unread/count')
  countUnread( @CurrentUser() user: JwtPayload ) {
    return this.notificationService.countUnread(
      user.id,
    );
  }

  @Patch('read-all')
  markAllAsRead( @CurrentUser() user: JwtPayload ) {
    return this.notificationService.markAllAsRead(
      user.id,
    );
  }
}
