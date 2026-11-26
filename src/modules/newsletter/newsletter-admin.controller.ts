import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { AdminGuard } from '../../middlewares/admin.guard.js'
import {
  createSubscriberSchema,
  importSubscribersSchema,
  queryLogsSchema,
  querySubscribersSchema,
  sendBulkSchema,
  sendSingleSchema,
  uuidParamSchema,
  type CreateSubscriberInput,
  type ImportSubscribersInput,
  type QueryLogsInput,
  type QuerySubscribersInput,
  type SendBulkInput,
  type SendSingleInput,
} from './newsletter.dto.js'
import { NewsletterService } from './newsletter.service.js'

@Controller('newsletter')
@UseGuards(AdminGuard)
export class NewsletterAdminController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Get('subscribers')
  listSubscribers(@Query({ schema: querySubscribersSchema }) query: QuerySubscribersInput) {
    return this.newsletter.listActive(query)
  }

  @Post('subscribers')
  createSubscriber(@Body({ schema: createSubscriberSchema }) body: CreateSubscriberInput) {
    return this.newsletter.createSubscriber(body)
  }

  @Post('subscribers/import')
  importSubscribers(@Body({ schema: importSubscribersSchema }) body: ImportSubscribersInput) {
    return this.newsletter.importSubscribers(body)
  }

  @Delete('subscribers/:id')
  @HttpCode(204)
  async removeSubscriber(@Param('id', { schema: uuidParamSchema }) id: string) {
    await this.newsletter.deleteSubscriber(id)
  }

  @Post('send-single')
  @HttpCode(200)
  sendSingle(@Body({ schema: sendSingleSchema }) body: SendSingleInput) {
    return this.newsletter.sendSingle(body)
  }

  @Post('send-bulk')
  @HttpCode(202)
  sendBulk(@Body({ schema: sendBulkSchema }) body: SendBulkInput) {
    return this.newsletter.sendBulk(body)
  }

  @Get('batch/:batchId')
  getBatch(@Param('batchId', { schema: uuidParamSchema }) batchId: string) {
    return this.newsletter.getBatch(batchId)
  }

  @Get('logs')
  listLogs(@Query({ schema: queryLogsSchema }) query: QueryLogsInput) {
    return this.newsletter.listLogs(query)
  }
}
