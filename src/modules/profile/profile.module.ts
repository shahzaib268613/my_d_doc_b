import { Module } from '@nestjs/common'
import { ContactPublicController } from './contact-public.controller.js'
import { ProfileController } from './profile.controller.js'
import { ProfileRepository } from './profile.repository.js'
import { ProfileService } from './profile.service.js'

@Module({
  controllers: [ProfileController, ContactPublicController],
  providers: [ProfileRepository, ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
