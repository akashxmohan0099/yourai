import { type UIMessage } from 'ai'
import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'

interface ChatMessageProps {
  message: UIMessage
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  // Extract text content from parts
  const textContent = message.parts
    ?.filter((part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('') || ''

  if (!textContent) return null

  return (
    <div className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-[#1d1d1f]' : 'bg-[#d2d2d7]'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-[#424245]" />
        )}
      </div>
      <div
        className={cn(
          'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-[#1d1d1f] text-white rounded-br-md'
            : 'bg-[#f5f5f7] text-[#1d1d1f] border border-[#d2d2d7] rounded-bl-md shadow-sm'
        )}
      >
        <p className="whitespace-pre-wrap">{textContent}</p>
      </div>
    </div>
  )
}
