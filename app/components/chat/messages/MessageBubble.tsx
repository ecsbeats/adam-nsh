'use client'

import React from 'react';

interface MessageBubbleProps {
  message: React.ReactNode; // Allow string or JSX
  isUser: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isUser }) => {
  const prompt = isUser ? '$' : '>';
  const promptColor = isUser ? 'text-neutral-200' : 'text-green-200';

  return (
    <div className={`flex items-start`}>
      <span className={`mr-2 flex-shrink-0 ${promptColor}`}>{prompt}</span>
      {/* Render the message content (string or JSX) */}
      <div className="flex-1 whitespace-pre-wrap break-words text-neutral-200">
        {message}
      </div>
    </div>
  );
};

export default MessageBubble;