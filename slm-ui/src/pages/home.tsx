import { Helmet } from 'react-helmet-async';

import { ChatView } from 'src/sections/database-management/view';

// ----------------------------------------------------------------------

export default function ChatPage() {
  return (
    <>
      <Helmet>
        <title> Text-to-SQL</title>
      </Helmet>

      <ChatView />
    </>
  );
}
