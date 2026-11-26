import { Test, type TestingModule } from '@nestjs/testing'
import { HealthController } from './health.controller.js'
import { HEALTH_MESSAGE, HealthService } from './health.service.js'

describe('HealthController', () => {
  let healthController: HealthController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile()

    healthController = app.get<HealthController>(HealthController)
  })

  describe('root', () => {
    it('should return the status page with the health message', () => {
      const html = healthController.getStatus()
      expect(html).toContain(HEALTH_MESSAGE)
      expect(html).toContain('<!DOCTYPE html>')
    })
  })
})
