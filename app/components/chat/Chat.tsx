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
    <div className="w-96 flex flex-col border-l border-neutral-200 dark:border-neutral-800">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Messages will render here */}
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50"
          placeholder="Ask about maritime data..."
        />
      </form>
    </div>
  )
}