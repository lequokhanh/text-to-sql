// File: src/sections/database-management/components/main-content/MainContent.tsx

import { DatabaseSource } from 'src/types/database';

import { NotOwner } from '../states/not-owner';
import { NoSourceSelected } from '../states/no-source-selected';
import { SelectDataSource } from '../states/select-data-source';
import DatabaseCreateDialog from '../dialogs/database-create-dialog';
import DataSourceManagement from '../management/data-source-management';
import { NoConversationSelected } from '../states/no-conversation-selected';

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
  Management,
  NoSourceSelected,
  NoConversationSelected,
  NotOwner,
  SelectDataSource,
  CreateDataSourceDialog,
};
