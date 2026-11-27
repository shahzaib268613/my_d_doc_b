import { pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core'

/**
 * Singleton admin profile until multi-admin auth exists.
 * `slot` is fixed to "default" so GET/PATCH always target one row.
 */
export const adminProfiles = pgTable(
  'admin_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slot: text('slot').notNull().default('default'),
    fullName: text('full_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    contactEmail: text('contact_email').notNull(),
    role: text('role').notNull().default('Admin'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('admin_profiles_slot_uidx').on(table.slot),
    uniqueIndex('admin_profiles_email_uidx').on(table.email),
    uniqueIndex('admin_profiles_contact_email_uidx').on(table.contactEmail),
  ],
)

export type AdminProfile = typeof adminProfiles.$inferSelect
export type NewAdminProfile = typeof adminProfiles.$inferInsert
