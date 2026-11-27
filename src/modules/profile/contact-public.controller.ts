import { Controller, Get } from '@nestjs/common'
import { ProfileService } from './profile.service.js'

@Controller('contact')
export class ContactPublicController {
  constructor(private readonly profile: ProfileService) {}

  /** Public site contact details sourced from the admin profile. */
  @Get()
  getContact() {
    return this.profile.getPublicContact()
  }
}
