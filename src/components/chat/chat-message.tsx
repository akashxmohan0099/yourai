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
          isUser ? 'bg-violet-600' : 'bg-stone-200'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-stone-600" />
        )}
      </div>
      <div
        className={cn(
          'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-violet-600 text-white rounded-br-md'
            : 'bg-white text-stone-900 border border-stone-200 rounded-bl-md shadow-sm'
        )}
      >
        <p className="whitespace-pre-wrap">{textContent}</p>
      </div>
    </div>
  )
}
