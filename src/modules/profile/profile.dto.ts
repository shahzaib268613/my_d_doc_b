import { z } from 'zod'

const EMAIL_PATTERN =
  /^(?=.{3,254}$)[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/

const NAME_PATTERN = /^[A-Za-z][A-Za-z\s'.-]{1,79}$/
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,32}$/
const PHONE_PATTERN = /^[+\d][\d\s().-]{6,24}$/

function phoneDigitCount(value: string) {
  return value.replace(/\D/g, '').length
}

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(80, 'Full name must be at most 80 characters')
    .regex(NAME_PATTERN, 'Use letters, spaces, apostrophes, or hyphens only'),
  email: z
    .string()
    .trim()
    .min(3)
    .max(254)
    .regex(EMAIL_PATTERN, 'Enter a valid email address')
    .transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(25)
    .regex(PHONE_PATTERN, 'Use a valid phone format')
    .refine((value) => {
      const digits = phoneDigitCount(value)
      return digits >= 10 && digits <= 15
    }, 'Enter a valid phone number'),
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(
      USERNAME_PATTERN,
      'Use 3–32 characters: letters, numbers, dots, underscores, or hyphens',
    )
    .transform((value) => value.toLowerCase()),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export type AdminProfileResponse = {
  fullName: string
  email: string
  phone: string
  username: string
  role: string
  updatedAt: string
}
