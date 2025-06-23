"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Message } from "@/types/chat";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import { ScrollArea } from "@/components/Common/ScrollArea"; // Use the new ScrollArea

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string; // To determine message alignment, user info etc.
  isLoading?: boolean; // Is AI currently responding?
  onSendMessage: (content: string, attachments?: File[]) => void;
  // For message actions
  onResendMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onCopyMessage?: (content: string) => void;
  onBranchMessage?: (messageId: string) => void; // Added for branching
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  currentUserId, // Not directly used in MessageItem if user prop is on message
  isLoading,
  onSendMessage,
  onResendMessage,
  onEditMessage,
  onDeleteMessage,
  onCopyMessage,
  onBranchMessage, // Added for branching
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollToBottom = () => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, autoScroll]); // Scroll when new messages arrive or autoScroll changes

  // Placeholder for handling scroll events to disable auto-scroll if user scrolls up
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    // If scrolled to the bottom, re-enable auto-scroll
    // A threshold helps with precision issues
    if (scrollHeight - scrollTop - clientHeight < 50) {
      setAutoScroll(true);
    } else {
      // If user scrolls up significantly, disable auto-scroll
      if (scrollTop < scrollHeight - clientHeight - 100) {
         setAutoScroll(false);
      }
    }
  };


  return (
    <div className="flex flex-col h-full bg-background dark:bg-gray-800"> {/* Use bg-background for consistency */}
      <ScrollArea className="flex-grow" onScrollCapture={handleScroll}> {/* Use ScrollArea, onScrollCapture might work or need adjustment */}
        <div className="p-4 space-y-4"> {/* Inner div for padding and message spacing */}
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onResend={onResendMessage}
              onEditMessage={onEditMessage}
              onDelete={onDeleteMessage}
              onCopy={onCopyMessage}
              onBranch={onBranchMessage}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <MessageInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatWindow;