'use client'

import { useState } from 'react'

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    // Message handling logic will go here
  }

  return (
    <div className="w-96 flex flex-col border-l border-gray-200 dark:border-gray-800">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Messages will render here */}
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Ask about maritime data..."
        />
      </form>
    </div>
  )
}