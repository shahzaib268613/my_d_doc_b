import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { isUniqueViolation } from '../../helpers/db-errors.js'
import type { AdminProfile } from '../../database/schema.js'
import type { AdminProfileResponse, UpdateProfileInput } from './profile.dto.js'
import { ADMIN_PROFILE_SLOT, ProfileRepository } from './profile.repository.js'

const DEFAULT_PROFILE = {
  slot: ADMIN_PROFILE_SLOT,
  fullName: 'Dr. Jonas Leibowitz',
  email: 'hello@mydiabetesdoc.com',
  phone: '914-650-2806',
  username: 'admin',
  role: 'Admin',
} as const

@Injectable()
export class ProfileService {
  constructor(private readonly repo: ProfileRepository) {}

  private toResponse(row: AdminProfile): AdminProfileResponse {
    return {
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      username: row.username,
      role: row.role,
      updatedAt:
        row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : String(row.updatedAt),
    }
  }

  async getProfile(): Promise<AdminProfileResponse> {
    const existing = await this.repo.findDefault()
    if (existing) return this.toResponse(existing)

    try {
      const created = await this.repo.create({ ...DEFAULT_PROFILE })
      return this.toResponse(created)
    } catch (error) {
      // Concurrent first requests may race on unique slot — re-read.
      if (isUniqueViolation(error)) {
        const row = await this.repo.findDefault()
        if (row) return this.toResponse(row)
      }
      throw new InternalServerErrorException('Unable to initialize admin profile')
    }
  }

  async updateProfile(input: UpdateProfileInput): Promise<AdminProfileResponse> {
    await this.getProfile()

    try {
      const updated = await this.repo.updateDefault(input)
      if (!updated) {
        throw new InternalServerErrorException('Unable to update admin profile')
      }
      return this.toResponse(updated)
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'Email or username is already in use. Choose a different value.',
        )
      }
      throw error
    }
  }

  async getPublicContact() {
    const profile = await this.getProfile()
    return {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
    }
  }
}
