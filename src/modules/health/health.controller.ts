import { Controller, Get, Header } from '@nestjs/common'
import { HealthService } from './health.service.js'

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getStatus(): string {
    return this.healthService.getStatusPage()
  }
}
