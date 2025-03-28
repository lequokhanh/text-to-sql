// File: src/sections/database-management/components/main-content/MainContent.tsx

import { IChatMessage } from 'src/types/chat';
import { DatabaseSource } from 'src/types/database';

import ChatSection from '../chat/ChatSection';
import { NotOwner } from '../states/NotOwner';
import { NoSourceSelected } from '../states/NoSourceSelected';
import { SelectDataSource } from '../states/SelectDataSource';
import DatabaseCreateDialog from '../dialogs/DatabaseCreateDialog';
import DataSourceManagement from '../management/DataSourceManagement';
import { NoConversationSelected } from '../states/NoConversationSelected';

interface ChatProps {
  source: DatabaseSource;
  messages: IChatMessage[];
  onSendMessage: (message: string) => void;
  onClearChat?: () => void;
  onExportChat?: () => void;
  isConnected?: boolean;
  messageCount?: number;
  isLoading?: boolean;
}

function Chat({
  source,
  messages,
  onSendMessage,
  onClearChat,
  onExportChat,
  isConnected = true,
  messageCount = 0,
  isLoading = false,
}: ChatProps) {
  return (
    <ChatSection
      source={source}
      messages={messages}
      onSendMessage={onSendMessage}
      onClearChat={onClearChat}
      onExportChat={onExportChat}
      messageCount={messageCount}
      isLoading={isLoading}
      isConnected={isConnected}
    />
  );
}

interface ManagementProps {
  dataSource: DatabaseSource;
  onUpdate: (updatedSource: DatabaseSource) => void;
  onDelete: (sourceId: string) => void;
}

function Management({ dataSource, onUpdate, onDelete }: ManagementProps) {
  return <DataSourceManagement dataSource={dataSource} onUpdate={onUpdate} onDelete={onDelete} />;
}

interface CreateDataSourceDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateSource: (source: DatabaseSource) => void;
}

function CreateDataSourceDialog({ open, onClose, onCreateSource }: CreateDataSourceDialogProps) {
  return <DatabaseCreateDialog open={open} onClose={onClose} onCreateSource={onCreateSource} />;
}

// Export all components together
export const MainContent = {
  Chat,
  Management,
  NoSourceSelected,
  NoConversationSelected,
  NotOwner,
  SelectDataSource,
  CreateDataSourceDialog,
};
