import { Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodBody, ZodQuery } from '../../common/decorators/zod.decorator';
import { notificationPrefsSchema, notificationQuerySchema } from './dto/notifications.schema';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications (all|unread|mentions)' })
  list(
    @CurrentUser('id') userId: string,
    @ZodQuery(notificationQuerySchema) query: typeof notificationQuerySchema._type,
  ) {
    return this.notifications.list(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread badge count' })
  unreadCount(@CurrentUser('id') userId: string) {
    return this.notifications.unreadCount(userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get per-type notification preferences' })
  getPreferences(@CurrentUser('id') userId: string) {
    return this.notifications.getPreferences(userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  updatePreferences(
    @CurrentUser('id') userId: string,
    @ZodBody(notificationPrefsSchema) body: typeof notificationPrefsSchema._type,
  ) {
    return this.notifications.updatePreferences(userId, body);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all as read' })
  readAll(@CurrentUser('id') userId: string) {
    return this.notifications.markAllRead(userId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark one as read' })
  read(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notifications.markRead(userId, id);
  }
}
