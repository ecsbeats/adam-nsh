'use client'

import { useState, useEffect, useRef } from 'react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null) // Ref for scrolling

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading]); // Scroll on new messages or loading state change

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return // Prevent sending empty or during loading
    
    // Create new user message
    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      type: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, newMessage])
    setInput('') // Clear input after sending
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700 flex-shrink-0">
        <h2 className="font-medium text-sm text-neutral-400">Console</h2>
        <button className="text-neutral-500 hover:text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
          </svg>
        </button>
      </div>
      
      {/* Scrollable message area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message.content} // Pass message content
            isUser={message.type === 'user'}
          />
        ))}
        
        {isLoading && (
          <div className="flex items-start">
             <span className={`mr-2 flex-shrink-0 text-green-400`}>{'>'}</span>
             {/* Loading indicator styled like a message bubble */}
            <div className="bg-neutral-800 px-3 py-1.5 max-w-[80%] inline-block">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}

        {/* Input form integrated into the message flow */} 
        {!isLoading && (
          <form onSubmit={sendMessage} className="flex items-start">
            <span className="mr-2 text-blue-400">$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent text-neutral-100 focus:outline-none"
              autoFocus // Automatically focus the input
            />
            {/* Submit button can be hidden or styled differently if needed */}
             <button type="submit" className="hidden"></button> 
          </form>
        )}

        {/* Dummy div to help scroll to bottom */}
        <div ref={messagesEndRef} /> 
      </div>

      {/* Removed the separate form from here */}
    </div>
  )
}