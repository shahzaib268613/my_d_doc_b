import { z } from 'zod'

const emailSchema = z.string().trim().email().max(320)

export const partnershipInquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  company: z.string().trim().min(2).max(120),
  email: emailSchema,
  collaborationType: z.string().trim().min(1).max(80),
  budgetRange: z.string().trim().min(1).max(80),
  timeline: z.string().trim().min(1).max(120),
  message: z.string().trim().min(20).max(4000),
})

export type PartnershipInquiryInput = z.infer<typeof partnershipInquirySchema>

export const speakingInquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  organization: z.string().trim().min(2).max(120),
  email: emailSchema,
  eventType: z.string().trim().min(1).max(80),
  eventDate: z.string().trim().min(1).max(40),
  audienceSize: z.string().trim().min(1).max(80),
  format: z.string().trim().min(1).max(80),
  location: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(4000),
})

export type SpeakingInquiryInput = z.infer<typeof speakingInquirySchema>

export const appointmentInquirySchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: z.string().trim().min(7).max(25),
  date: z.string().trim().min(1).max(40),
  preferredTime: z.string().trim().min(1).max(80),
  message: z.string().trim().max(4000).optional().default(''),
})

export type AppointmentInquiryInput = z.infer<typeof appointmentInquirySchema>
