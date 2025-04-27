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
    <div className="w-96 flex flex-col bg-black font-mono text-neutral-300">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700">
        <h2 className="font-medium text-sm text-neutral-400">Console</h2>
        <button className="text-neutral-500 hover:text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message.content}
            isUser={message.type === 'user'}
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 bg-neutral-800 flex items-center justify-center mr-2 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-neutral-400">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
              </svg>
            </div>
            <div className="bg-neutral-800 px-3 py-1.5 max-w-[80%]">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={sendMessage} className="relative flex items-center p-3 border-t border-neutral-700">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full pl-8 pr-12 py-2 bg-transparent text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter command..."
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-400 hover:text-blue-300 disabled:text-neutral-600 disabled:cursor-not-allowed"
          disabled={!input.trim() || isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M15.625 8.75a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0V9.5h-8.375a.75.75 0 010-1.5h8.375v-1a.75.75 0 01.75-.75z" clipRule="evenodd" />
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-1.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" />
          </svg>
        </button>
      </form>
    </div>
  )
}