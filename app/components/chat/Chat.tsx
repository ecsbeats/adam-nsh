'use client'

import { useState, useEffect, useRef } from 'react'
import MessageBubble from './messages/MessageBubble'

interface Message {
  id: string
  content: string
  type: 'user' | 'assistant'
  timestamp: Date
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', content: 'Console ready. Enter commands or queries.', type: 'assistant', timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      type: 'user',
      timestamp: new Date()
    }

    const currentInput = input
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Generate a UNIQUE ID for this specific assistant message stream
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      content: '', // Start empty
      type: 'assistant',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, assistantPlaceholder])

    try {
      const response = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentInput }),
      })

      if (!response.ok) {
        let errorBody = ''
        try {
          errorBody = await response.text()
        } catch (_e) { }
        throw new Error(`API error: ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let streamedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        streamedContent += chunk

        // Update the specific placeholder message IN PLACE using its unique ID
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === assistantMessageId // Use the unique ID generated for this request
              ? { ...msg, content: streamedContent } // Create NEW object for the updated message
              : msg // Return existing objects for other messages
          )
        )
      }
    } catch (error) {
      console.error('Error sending message or streaming response:', error)
      // Update the placeholder with an error message using its unique ID
      setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === assistantMessageId // Use the unique ID
              ? { ...msg, content: `Error: ${(error as Error).message}` }
              : msg
          )
      )
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  return (
    <div className="w-96 flex flex-col bg-neutral-800 font-mono text-neutral-300 h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700 flex-shrink-0">
        <h2 className="font-medium text-sm text-neutral-400">Console</h2>
        <button className="text-neutral-500 hover:text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm custom-scrollbar">
        {messages.map((message) => {
          // Determine content: Show loading dots if it's an assistant message, we're loading, 
          // AND its content is empty (using startsWith check for the unique ID pattern)
          const isCurrentAssistantLoading = isLoading && message.id.startsWith('assistant-') && message.content === '';
          const bubbleContent = isCurrentAssistantLoading
            ? (
              <div className="flex space-x-1 opacity-50 pt-1.5"> {/* Loading dots */}
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
              </div>
            ) 
            : message.content;

          return (
            <MessageBubble
              key={message.id}
              message={bubbleContent} // Pass determined content (text or loading dots)
              isUser={message.type === 'user'}
            />
          );
        })}

        {/* Input form integrated into the message flow - shown when not loading */}
        {!isLoading && (
          <form onSubmit={sendMessage} className="flex items-start">
            <span className={`mr-2 flex-shrink-0 text-neutral-200`}>$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your command..."
              className="flex-1 bg-transparent outline-none text-neutral-200 placeholder-neutral-500 disabled:opacity-50"
              autoFocus
            />
            {/* Hidden submit button might be useful for accessibility or form handling */}
            <button type="submit" className="hidden"></button>
          </form>
        )}

        {/* Div to assist scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}