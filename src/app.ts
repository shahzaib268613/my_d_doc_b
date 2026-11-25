import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { createObserveModule } from '@nestjs/observe'
import { ScheduleModule } from '@nestjs/schedule'
import { DatabaseModule } from './database/database.module.js'
import { BlogsModule } from './modules/blogs/blogs.module.js'
import { HealthModule } from './modules/health/health.module.js'

export const { ObserveModule, ObserveInstrument } = createObserveModule()

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'Backend',
    }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    HealthModule,
    BlogsModule,
  ],
})
export class AppModule {}
