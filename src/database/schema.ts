import { blogs } from './models/blog.model.js'
import {
  newsletterBatches,
  newsletterEmailLogs,
  newsletterSubscribers,
} from './models/newsletter.model.js'

export * from './models/blog.model.js'
export * from './models/newsletter.model.js'

export const schema = {
  blogs,
  newsletterSubscribers,
  newsletterBatches,
  newsletterEmailLogs,
}
