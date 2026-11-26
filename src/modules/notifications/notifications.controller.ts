import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Sse,
  UseGuards,
  type MessageEvent,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import { AdminGuard } from '../../middlewares/admin.guard.js'
import { NotificationsService } from './notifications.service.js'

@Controller('notifications')
@UseGuards(AdminGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.notifications.stream()
  }

  @Get()
  list() {
    return this.notifications.list(30)
  }

  @Get('unread-count')
  unreadCount() {
    return this.notifications.unreadCount()
  }

  @Patch('read-all')
  markAllRead() {
    return this.notifications.markAllRead()
  }

  @Delete('clear-all')
  clearAll() {
    return this.notifications.clearAll()
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notifications.markRead(id)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notifications.remove(id)
  }
}
