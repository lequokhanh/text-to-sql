// File: src/sections/database-management/components/chat/ChatMessage.tsx

import { m } from 'framer-motion';

import { IChatMessage } from 'src/types/chat';

import { UserMessage } from './user-message';
import { ErrorMessage } from './error-message';
import { SqlQueryResults } from './sql-query-result';
import { SimpleBotMessage } from './simple-bot-message';

interface ChatMessageProps {
  message: IChatMessage;
}

// Animation variants for messages
const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20 },
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.senderId === 'bot';
  const isError = isBot && message.body.includes('## Error');

  // Check if this is a SQL query message with results
  const hasSqlSection = isBot && message.body.includes('## SQL Query');
  const hasResultsSection = isBot && message.body.includes('## Results');
  const isSqlQueryResults = hasSqlSection && hasResultsSection;

  return (
    <m.div variants={messageVariants} initial="hidden" animate="visible" exit="exit">
      {(() => {
        if (!isBot) return <UserMessage message={message} />;
        if (isError) return <ErrorMessage message={message} />;
        if (isSqlQueryResults) return <SqlQueryResults message={message} />;
        return <SimpleBotMessage message={message} />;
      })()}
    </m.div>
  );
}

export default ChatMessage;

// Export all the message components for direct usage
export * from './user-message';
export * from './error-message';
export * from './simple-bot-message';
export * from './sql-query-result';
export * from './bot-loading-message';
