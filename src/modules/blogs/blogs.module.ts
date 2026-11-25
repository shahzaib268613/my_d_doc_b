import { Module } from '@nestjs/common'
import { BlogsAdminController } from './blogs-admin.controller.js'
import { BlogsPublicController } from './blogs-public.controller.js'
import { BlogsRepository } from './blogs.repository.js'
import { BlogsSchedulerService } from './blogs-scheduler.service.js'
import { BlogsService } from './blogs.service.js'

@Module({
  controllers: [BlogsAdminController, BlogsPublicController],
  providers: [BlogsRepository, BlogsService, BlogsSchedulerService],
  exports: [BlogsService],
})
export class BlogsModule {}
