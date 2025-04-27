'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import MessageBubble from './messages/MessageBubble'

interface DisplayMessage {
  id: string
  content: string | React.ReactNode
  type: 'user' | 'assistant'
  timestamp: Date
}

interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

// Define and export the callback type
export type ZoomRequestCallback = (location: string, level: number) => Promise<string | null>;

interface ChatProps {
  // Use the exported type here
  onZoomRequest?: ZoomRequestCallback;
}

export default function Chat({ onZoomRequest }: ChatProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { id: 'initial', content: 'Console ready. Enter commands or queries.', type: 'assistant', timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<HistoryMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleZoomRequest = useCallback(async (args: { location_name?: string, zoom_level?: string }) => {
    const location = args.location_name;
    const levelStr = args.zoom_level;

    if (!location || !levelStr) {
      console.error("Invalid zoom arguments received:", args);
      setMessages(prev => prev.map(msg => msg.id.startsWith('assistant-') && msg.content === '...' 
          ? { ...msg, content: "Error: Invalid zoom arguments from agent." }
          : msg));
      return;
    }

    const level = parseInt(levelStr, 10);
    if (isNaN(level)) {
      console.error("Invalid zoom level received:", levelStr);
      setMessages(prev => prev.map(msg => msg.id.startsWith('assistant-') && msg.content === '...' 
          ? { ...msg, content: `Error: Invalid zoom level '${levelStr}' from agent.` }
          : msg));
      return;
    }

    const assistantMessageId = `assistant-${Date.now() + 1}`;
    setMessages(prev => prev.map(msg => 
        msg.id.startsWith('assistant-') && msg.content === '...' // Find the placeholder
        ? { ...msg, content: `Zooming map to ${location} (Level ${level})...` }
        : msg
    ));

    let imageDescription: string | null = `Zoomed to ${location}.`;

    if (onZoomRequest) {
      try {
        console.log(`Requesting zoom via prop: ${location}, ${level}`);
        const description = await onZoomRequest(location, level);
        imageDescription = description;
        console.log(`Received image description from map: ${imageDescription}`);
      } catch (error) {
        console.error('Error during map zoom/screenshot:', error);
        imageDescription = `Error during map interaction: ${(error as Error).message}`;
        setMessages(prev => prev.map(msg => msg.id === assistantMessageId 
            ? { ...msg, content: `Error during map interaction: ${(error as Error).message}` }
            : msg));
      }
    } else {
      console.warn("onZoomRequest prop not provided to Chat component. Map interaction disabled.");
      imageDescription = "Map interaction skipped (no handler).";
    }

    // Don't update history here; the agent knows it requested the zoom.
    // setConversationHistory(prev => [...prev, { role: 'assistant', content: `Okay, zooming to ${location}.` }]);

    // Send the image description back to the backend. The agent will use this.
    // The 'messageToSend' can be minimal as the imageDesc is the key info.
    await sendBackendRequest("Tool execution result:", conversationHistory, imageDescription);
  }, [onZoomRequest, conversationHistory]);

  const sendBackendRequest = async (
    messageToSend: string, 
    currentHistory: HistoryMessage[], 
    imageDesc: string | null
  ) => {
    setIsLoading(true);
    const assistantMessageId = `assistant-${Date.now()}`;
    let currentAssistantContent = '';
    let finalAssistantMessageForHistory = '';
    let toolCalled = false;

    const assistantPlaceholder: DisplayMessage = {
      id: assistantMessageId,
      content: '...', 
      type: 'assistant',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, assistantPlaceholder]);

    try {
      const response = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageToSend, 
          history: currentHistory, 
          image_description: imageDesc 
        }),
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
      let buffer = '';

      // Function to process complete JSON messages from the buffer
      const processCompleteMessages = () => {
        let separatorIndex;
        while ((separatorIndex = buffer.indexOf('\n')) >= 0) {
          const messagePart = buffer.slice(0, separatorIndex).trim();
          buffer = buffer.slice(separatorIndex + 1);

          if (messagePart) {
            try {
              const parsed = JSON.parse(messagePart);
              if (parsed.type === 'text') {
                currentAssistantContent += parsed.content;
                // Update message bubble progressively
                setMessages((prevMessages) =>
                  prevMessages.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: currentAssistantContent || '...' } // Show '...' if empty initially
                      : msg
                  )
                );
                finalAssistantMessageForHistory += parsed.content; // Accumulate for history
              } else if (parsed.type === 'tool_call' && parsed.tool_name === 'zoom') {
                console.log("Received tool_call:", parsed);
                toolCalled = true;
                handleZoomRequest(parsed.args); // Trigger the zoom
                // Optionally clear current text or add a message like "Attempting zoom..."
                // currentAssistantContent = 'Attempting zoom...'; 
                setMessages((prevMessages) =>
                  prevMessages.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: currentAssistantContent || `Attempting zoom...` } // Placeholder during zoom
                      : msg
                  )
                );
                // Don't add agent's decision to zoom to history here, 
                // handleZoomRequest will call sendBackendRequest again after completion.
                finalAssistantMessageForHistory = ''; // Reset history accumulation if tool is called
              } else if (parsed.type === 'error') {
                console.error("Received error from backend:", parsed.content);
                currentAssistantContent = `Error: ${parsed.content}`;
                setMessages((prevMessages) =>
                  prevMessages.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: currentAssistantContent }
                      : msg
                  )
                );
                finalAssistantMessageForHistory = `Error: ${parsed.content}`; // Log error in history
                break; // Stop processing on error
              } else {
                 console.warn("Received unknown message type:", parsed.type);
              }
            } catch (parseError) {
              console.error('Error parsing JSON chunk:', parseError, 'Chunk:', messagePart);
              // Decide how to handle parse errors, maybe show an error message
              currentAssistantContent = `Error: Could not parse response chunk.`;
               setMessages((prevMessages) =>
                 prevMessages.map((msg) =>
                   msg.id === assistantMessageId
                     ? { ...msg, content: currentAssistantContent }
                     : msg
                 )
               );
               finalAssistantMessageForHistory = currentAssistantContent;
              break; // Stop processing on parse error
            }
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          // Process any remaining data in the buffer after stream ends
          buffer += decoder.decode(value); // Decode final chunk if any
          processCompleteMessages();
          break;
        }
        // Append new data to buffer and process complete messages
        buffer += decoder.decode(value, { stream: true });
        processCompleteMessages();
      }

      // Update history only if no tool was called (tool calls handle their own follow-up)
      if (!toolCalled && finalAssistantMessageForHistory.trim()) {
        setConversationHistory(prev => [
          ...prev, 
          { role: 'assistant', content: finalAssistantMessageForHistory.trim() } 
        ]);
      }

    } catch (error) {
      console.error('Error sending message or streaming response:', error)
      finalAssistantMessageForHistory = `Error: ${(error as Error).message}`; 
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === assistantMessageId
          ? { ...msg, content: `Error: ${(error as Error).message}` }
          : msg
        )
      )
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  };

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return;

    const userMessageContent = input;
    const userMessageForDisplay: DisplayMessage = {
      id: Date.now().toString(),
      content: userMessageContent,
      type: 'user',
      timestamp: new Date()
    }
    const userMessageForHistory: HistoryMessage = { role: 'user', content: userMessageContent };

    setMessages(prev => [...prev, userMessageForDisplay])
    setInput('')
    
    const updatedHistory = [...conversationHistory, userMessageForHistory];
    setConversationHistory(updatedHistory);

    await sendBackendRequest(userMessageContent, updatedHistory, null); 
  }

  return (
    <div className="w-96 flex flex-col bg-neutral-800 font-mono text-neutral-300 h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700 flex-shrink-0">
        <h2 className="font-medium text-sm text-neutral-400">Console</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm custom-scrollbar">
        {messages.map((message) => {
          const isCurrentAssistantLoading = isLoading && message.id.startsWith('assistant-') && message.content === '...';
          let bubbleContent: string | React.ReactNode = message.content;

          if (isCurrentAssistantLoading) {
            bubbleContent = (
              <div className="flex space-x-1 opacity-50 pt-1.5"> 
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
              </div>
            );
          }

          return (
            <MessageBubble
              key={message.id}
              message={bubbleContent} 
              isUser={message.type === 'user'}
            />
          );
        })}

        {!isLoading && (
          <form onSubmit={sendMessage} className="flex items-start mt-2">
            <span className={`mr-2 flex-shrink-0 text-neutral-200`}>$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your command..."
              className="flex-1 bg-transparent outline-none text-neutral-200 placeholder-neutral-500 disabled:opacity-50"
              autoFocus
              disabled={isLoading} 
            />
            <button type="submit" className="hidden"></button>
          </form>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}