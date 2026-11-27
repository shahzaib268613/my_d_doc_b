import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../../middlewares/admin.guard.js'
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from './profile.dto.js'
import { ProfileService } from './profile.service.js'

@Controller('admin/profile')
@UseGuards(AdminGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  getProfile() {
    return this.profile.getProfile()
  }

  @Patch()
  updateProfile(@Body({ schema: updateProfileSchema }) body: UpdateProfileInput) {
    return this.profile.updateProfile(body)
  }
}
