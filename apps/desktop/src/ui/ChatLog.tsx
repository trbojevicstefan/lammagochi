import { useEffect, useRef } from 'react';

export type ChatMessage = {
  id: string;
  role: 'user' | 'creature' | 'system';
  content: string;
  timestamp: number;
};

type ChatLogProps = {
  messages: ChatMessage[];
  petName?: string;
  isStreaming?: boolean;
};

const formatTime = (ts: number): string => {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const ChatLog = ({ messages, petName = 'Lamagotchi', isStreaming }: ChatLogProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isStreaming]);

  return (
    <div className="chat-log">
      {messages.length === 0 && (
        <div className="chat-log__empty">
          <div className="chat-log__empty-icon">💬</div>
          <p>Your conversation will appear here</p>
          <small>Type a message below to start chatting with {petName}</small>
        </div>
      )}
      {messages.map((msg) => (
        <div key={msg.id} className={`chat-msg chat-msg--${msg.role}`}>
          {msg.role !== 'user' && (
            <span className="chat-msg__author">
              {msg.role === 'system' ? '⚡ System' : petName}
            </span>
          )}
          <div className="chat-msg__bubble">
            <p>{msg.content}</p>
          </div>
          {msg.role === 'user' && <span className="chat-msg__author chat-msg__author--right">You</span>}
          <span className="chat-msg__time">{formatTime(msg.timestamp)}</span>
        </div>
      ))}
      {isStreaming && (
        <div className="chat-msg chat-msg--creature">
          <span className="chat-msg__author">{petName}</span>
          <div className="chat-msg__bubble chat-msg__bubble--typing">
            <span className="typing-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};
