import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { DrizzleModule } from '@nestjs/drizzle'
import { createObserveModule } from '@nestjs/observe'
import { ScheduleModule } from '@nestjs/schedule'
import { drizzle } from 'drizzle-orm/node-postgres'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { BlogsModule } from './blogs/blogs.module.js'
import { schema } from './db/schema.js'

export const { ObserveModule, ObserveInstrument } = createObserveModule()

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'Backend',
    }),
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        drizzle,
        connection: config.getOrThrow<string>('DATABASE_URL'),
        schema,
      }),
    }),
    ScheduleModule.forRoot(),
    BlogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
