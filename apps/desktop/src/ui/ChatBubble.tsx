type ChatBubbleProps = {
  text: string;
  isStreaming?: boolean;
  petName?: string;
};

export const ChatBubble = ({ text, isStreaming, petName }: ChatBubbleProps) => {
  return (
    <div className="chat-bubble-container">
      <div className={`chat-bubble ${isStreaming ? 'chat-bubble--streaming' : ''}`}>
        {petName && <span className="chat-bubble__name">{petName}</span>}
        <p className="chat-bubble__text">
          {text || ''}
          {isStreaming && <span className="chat-bubble__cursor">|</span>}
        </p>
        <div className="chat-bubble__tail" />
      </div>
    </div>
  );
};
