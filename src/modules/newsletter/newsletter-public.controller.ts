import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common'
import {
  publicSubscribeSchema,
  unsubscribeQuerySchema,
  type PublicSubscribeInput,
  type UnsubscribeQuery,
} from './newsletter.dto.js'
import { NewsletterService } from './newsletter.service.js'

@Controller('newsletter')
export class NewsletterPublicController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(201)
  subscribe(@Body({ schema: publicSubscribeSchema }) body: PublicSubscribeInput) {
    return this.newsletter.publicSubscribe(body)
  }

  @Get('unsubscribe')
  unsubscribe(@Query({ schema: unsubscribeQuerySchema }) query: UnsubscribeQuery) {
    return this.newsletter.unsubscribeByToken(query.token)
  }
}
