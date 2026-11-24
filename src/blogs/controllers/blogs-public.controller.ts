import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common'
import {
  publicListQuerySchema,
  slugParamSchema,
  type PublicListQuery,
} from '../schemas/blog.schemas.js'
import { BlogsService } from '../services/blogs.service.js'

@Controller('blogs')
export class BlogsPublicController {
  constructor(private readonly blogs: BlogsService) {}

  @Get()
  findPublished(@Query({ schema: publicListQuerySchema }) query: PublicListQuery) {
    return this.blogs.findPublicPage(query)
  }

  @Get('by-slug/:slug')
  findBySlug(@Param('slug', { schema: slugParamSchema }) slug: string) {
    return this.blogs.findPublicBySlug(slug)
  }

  @Post('by-slug/:slug/view')
  @HttpCode(200)
  recordView(@Param('slug', { schema: slugParamSchema }) slug: string) {
    return this.blogs.recordView(slug)
  }
}
