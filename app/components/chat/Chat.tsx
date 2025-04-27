'use client'

import { useState } from 'react'
import MessageBubble from './messages/MessageBubble'

type MessageType = 'user' | 'assistant'

interface Message {
  id: string
  content: string
  type: MessageType
  timestamp: Date
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Welcome to AMIS. How can I assist with maritime intelligence today?',
      type: 'assistant',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim()) return
    
    // Create new message
    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      type: 'user',
      timestamp: new Date()
    }
    
    // Add user message
    setMessages(prev => [...prev, newMessage])
    setInput('')
    setIsLoading(true)
    
    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'This is a placeholder response. In a real implementation, this would call an API for maritime data.',
        type: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="w-96 flex flex-col border-l border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="font-medium">AMIS Assistant</h2>
        <button className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            content={message.content}
            isUser={message.type === 'user'}
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="w-8 h-8  bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-neutral-700 dark:text-neutral-300">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
              </svg>
            </div>
            <div className="bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50 px-4 py-2 rounded-lg max-w-[80%]">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500  animate-pulse"></div>
                <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500  animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500  animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={sendMessage} className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-3 pr-12 border border-neutral-300 dark:border-neutral-700 rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50"
            placeholder="Ask about maritime data..."
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-neutral-700 text-neutral-50 hover:bg-neutral-600 disabled:bg-neutral-400 disabled:cursor-not-allowed"
            disabled={!input.trim() || isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}