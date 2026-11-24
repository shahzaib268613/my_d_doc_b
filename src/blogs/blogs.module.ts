import { Module } from '@nestjs/common'
import { BlogsAdminController } from './controllers/blogs-admin.controller.js'
import { BlogsPublicController } from './controllers/blogs-public.controller.js'
import { BlogsRepository } from './repositories/blogs.repository.js'
import { BlogsSchedulerService } from './services/blogs-scheduler.service.js'
import { BlogsService } from './services/blogs.service.js'

@Module({
  controllers: [BlogsAdminController, BlogsPublicController],
  providers: [BlogsRepository, BlogsService, BlogsSchedulerService],
  exports: [BlogsService],
})
export class BlogsModule {}
