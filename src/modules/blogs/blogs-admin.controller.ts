import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { AdminGuard } from '../../middlewares/admin.guard.js'
import {
  checkSlugQuerySchema,
  createBlogSchema,
  queryBlogSchema,
  updateBlogSchema,
  uuidParamSchema,
  type CheckSlugQuery,
  type CreateBlogInput,
  type QueryBlogInput,
  type UpdateBlogInput,
} from './blogs.dto.js'
import { BlogsService } from './blogs.service.js'

@Controller('admin/blogs')
@UseGuards(AdminGuard)
export class BlogsAdminController {
  constructor(private readonly blogs: BlogsService) {}

  @Get('counts')
  counts() {
    return this.blogs.counts()
  }

  @Get('check-slug')
  checkSlug(@Query({ schema: checkSlugQuerySchema }) query: CheckSlugQuery) {
    return this.blogs.isSlugAvailable(query.slug, query.excludeId)
  }

  @Get()
  findAll(@Query({ schema: queryBlogSchema }) query: QueryBlogInput) {
    return this.blogs.findAdminPage(query)
  }

  @Get(':id')
  findOne(@Param('id', { schema: uuidParamSchema }) id: string) {
    return this.blogs.findAdminById(id)
  }

  @Post()
  create(@Body({ schema: createBlogSchema }) body: CreateBlogInput) {
    return this.blogs.create(body)
  }

  @Patch(':id')
  update(
    @Param('id', { schema: uuidParamSchema }) id: string,
    @Body({ schema: updateBlogSchema }) body: UpdateBlogInput,
  ) {
    return this.blogs.update(id, body)
  }

  @Post(':id/publish')
  @HttpCode(200)
  publish(@Param('id', { schema: uuidParamSchema }) id: string) {
    return this.blogs.publish(id)
  }

  @Post(':id/unpublish')
  @HttpCode(200)
  unpublish(@Param('id', { schema: uuidParamSchema }) id: string) {
    return this.blogs.unpublish(id)
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', { schema: uuidParamSchema }) id: string) {
    await this.blogs.remove(id)
  }
}
