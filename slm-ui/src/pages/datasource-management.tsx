import { Helmet } from 'react-helmet-async';

import { ManagementView } from 'src/sections/database-management/view';

// ----------------------------------------------------------------------

export default function DatasourceManagementPage() {
  return (
    <>
      <Helmet>
        <title> Data Source Management</title>
      </Helmet>

      <ManagementView />
    </>
  );
}
