import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { BlogsService } from './blogs.service.js'

@Injectable()
export class BlogsSchedulerService {
  private readonly logger = new Logger(BlogsSchedulerService.name)

  constructor(private readonly blogs: BlogsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async publishDue() {
    const count = await this.blogs.publishDueScheduled()
    if (count > 0) {
      this.logger.log(`Auto-published ${count} scheduled blog(s)`)
    }
  }
}
