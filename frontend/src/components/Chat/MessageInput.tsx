"use client";

import React, { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Send, Paperclip, Settings2, Mic } from "lucide-react"; // Icons
import { Button } from "@/components/Common/Button";
import { Textarea } from "@/components/Common/Textarea";
// ChatSettingsPanel will be moved to the page level
// import { useChatStore } from "@/store/chatStore"; // No longer needed here if activeChatSession is not used

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  isLoading?: boolean;
  // currentModelId is now derived from activeChatSession passed to ChatSettingsPanel
  // Callbacks for settings changes if managed here, or use a context/store
  // onTemperatureChange?: (value: number) => void;
  // onTopPChange?: (value: number) => void;
  // onMaxTokensChange?: (value: number) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  // currentModelId, // No longer needed directly here
}) => {
  // const activeChatSession = useChatStore(state => state.getActiveChatSession()); // Moved to page level
  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSend = useCallback(() => {
    if (inputValue.trim() || attachments.length > 0) {
      onSendMessage(inputValue.trim(), attachments);
      setInputValue("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [inputValue, attachments, onSendMessage]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachments(Array.from(event.target.files));
      // Optionally display file previews or names
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-background sticky bottom-0"> {/* Reduced padding, specific border color */}
      {/* Attachment previews could go here */}
      {attachments.length > 0 && (
        <div className="mb-2 text-sm flex flex-wrap gap-2">
          {attachments.map(file => (
            <span key={file.name} className="p-1 px-2 bg-gray-200 dark:bg-gray-700 rounded text-xs">
              {file.name}
              {/* TODO: Add a way to remove individual attachments */}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end space-x-2">
        {/* ChatSettingsPanel has been moved to ChatPage.tsx to be placed in a header */}
        <Button variant="ghost" size="icon" onClick={triggerFileInput} title="添加附件" disabled={isLoading} className="text-gray-500 hover:text-[var(--color-primary)] dark:text-gray-400 dark:hover:text-[var(--color-primary)]">
          <Paperclip size={20} />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
        />

        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Shift+Enter 换行)"
          className="flex-grow resize-none overflow-y-auto max-h-48 min-h-[42px] p-2.5 text-sm border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-gray-750 dark:text-gray-50" // Adjusted padding, border, max-height, min-height
          rows={1}
          disabled={isLoading}
        />
        {/* Future: Voice Input Button */}
        {/* <Button variant="ghost" size="icon" title="Voice input" disabled={isLoading}>
          <Mic size={20} />
        </Button> */}
        <Button
          onClick={handleSend}
          disabled={isLoading || (!inputValue.trim() && attachments.length === 0)}
          size="icon"
          title="发送"
          className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90 dark:bg-[var(--color-primary)] dark:hover:bg-[var(--color-primary)]/90 shrink-0" // Prominent send button
        >
          <Send size={20} />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;