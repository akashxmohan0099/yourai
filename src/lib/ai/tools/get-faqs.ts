import { tool } from 'ai'
import { z } from 'zod'
import { BusinessContext } from '../context-builder'

export function getFaqsTool(context: BusinessContext) {
  return tool({
    description: 'Search frequently asked questions for relevant answers',
    inputSchema: z.object({
      query: z.string().describe('The question or topic to search FAQs for'),
    }),
    execute: async ({ query }: { query: string }) => {
      const queryLower = query.toLowerCase()
      const matches = context.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(queryLower) ||
          faq.answer.toLowerCase().includes(queryLower)
      )

      if (matches.length === 0) {
        return {
          found: false,
          message: 'No matching FAQs found.',
          allFaqs: context.faqs,
        }
      }

      return {
        found: true,
        faqs: matches,
      }
    },
  })
}
