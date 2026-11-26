import { z } from 'zod'

export const subscriberStatusSchema = z.enum(['active', 'unsubscribed'])
export const subscriberSourceSchema = z.enum(['homepage', 'admin', 'import'])

export const createSubscriberSchema = z.object({
  email: z.string().trim().email().max(320),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  source: subscriberSourceSchema.default('admin'),
})

export type CreateSubscriberInput = z.infer<typeof createSubscriberSchema>

export const publicSubscribeSchema = z.object({
  email: z.string().trim().email().max(320),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
})

export type PublicSubscribeInput = z.infer<typeof publicSubscribeSchema>

export const importSubscribersSchema = z.object({
  subscribers: z
    .array(
      z.object({
        email: z.string().trim().email().max(320),
        name: z
          .string()
          .trim()
          .max(120)
          .optional()
          .nullable()
          .transform((value) => (value ? value : null)),
        status: subscriberStatusSchema.optional().default('active'),
        source: subscriberSourceSchema.optional().default('import'),
        createdAt: z.coerce.date().optional(),
      }),
    )
    .min(1)
    .max(500),
})

export type ImportSubscribersInput = z.infer<typeof importSubscribersSchema>

export const querySubscribersSchema = z.object({
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export type QuerySubscribersInput = z.infer<typeof querySubscribersSchema>

export const queryLogsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type QueryLogsInput = z.infer<typeof queryLogsSchema>

export const sendSingleSchema = z.object({
  subscriberId: z.string().uuid(),
  subject: z.string().trim().min(1).max(200),
  html: z.string().trim().min(1).max(100_000),
})

export type SendSingleInput = z.infer<typeof sendSingleSchema>

export const sendBulkSchema = z
  .object({
    subscriberIds: z.array(z.string().uuid()).max(500).optional(),
    sendToAll: z.boolean().optional().default(false),
    subject: z.string().trim().min(1).max(200),
    html: z.string().trim().min(1).max(100_000),
  })
  .superRefine((value, ctx) => {
    if (!value.sendToAll && (!value.subscriberIds || value.subscriberIds.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['subscriberIds'],
        message: 'Provide subscriberIds or set sendToAll to true',
      })
    }
  })

export type SendBulkInput = z.infer<typeof sendBulkSchema>

export const uuidParamSchema = z.string().uuid()

export const unsubscribeQuerySchema = z.object({
  token: z.string().trim().min(1).max(2000),
})

export type UnsubscribeQuery = z.infer<typeof unsubscribeQuerySchema>
