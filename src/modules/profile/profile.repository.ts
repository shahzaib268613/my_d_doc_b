import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import { eq } from 'drizzle-orm'
import type { Database } from '../../database/database.js'
import {
  adminProfiles,
  type AdminProfile,
  type NewAdminProfile,
} from '../../database/schema.js'

export const ADMIN_PROFILE_SLOT = 'default'

@Injectable()
export class ProfileRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async findDefault(): Promise<AdminProfile | null> {
    const [row] = await this.db
      .select()
      .from(adminProfiles)
      .where(eq(adminProfiles.slot, ADMIN_PROFILE_SLOT))
      .limit(1)
    return row ?? null
  }

  async create(values: NewAdminProfile): Promise<AdminProfile> {
    const [row] = await this.db.insert(adminProfiles).values(values).returning()
    return row
  }

  async updateDefault(
    values: Pick<AdminProfile, 'fullName' | 'email' | 'phone' | 'contactEmail'>,
  ): Promise<AdminProfile | null> {
    const [row] = await this.db
      .update(adminProfiles)
      .set({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        contactEmail: values.contactEmail,
      })
      .where(eq(adminProfiles.slot, ADMIN_PROFILE_SLOT))
      .returning()
    return row ?? null
  }
}
