import { StandardSchemaValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule, ObserveInstrument } from './app.module.js'
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  })

  // Cover images are sent as data URLs in JSON — default 100kb limit is too small.
  app.useBodyParser('json', { limit: '10mb' })
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true })

  const config = app.get(ConfigService)
  const corsOrigin = config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173'
  const port = Number(config.get<string>('PORT') ?? 3000)

  app.enableCors({
    origin: corsOrigin.split(',').map((value) => value.trim()),
    credentials: true,
  })
  app.useGlobalPipes(new StandardSchemaValidationPipe())
  app.useGlobalFilters(new AllExceptionsFilter())

  await app.listen(port)
  console.log(`API listening on http://localhost:${port}`)
}

await bootstrap()
