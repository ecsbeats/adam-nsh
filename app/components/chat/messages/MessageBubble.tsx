'use client'

interface MessageBubbleProps {
  message: string
  isUser: boolean
}

export default function MessageBubble({ message, isUser }: MessageBubbleProps) {
  return (
    <div className="flex items-start">
      <span className={`mr-2 flex-shrink-0 ${isUser ? 'text-blue-400' : 'text-green-400'}`}>
        {isUser ? '$' : '>'}
      </span>
      <span className="whitespace-pre-wrap break-words">
        {message}
      </span>
    </div>
  )
}