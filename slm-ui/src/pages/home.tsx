import { Helmet } from 'react-helmet-async';

import { ChatView } from 'src/sections/database-chat/view';

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
