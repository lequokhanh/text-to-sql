import { Navigate, useRoutes } from 'react-router-dom';

import MainLayout from 'src/layouts/main';
import { AuthGuard } from 'src/auth/guard';
import DataSourceManagement from 'src/pages/datasource-management';

// import { PATH_AFTER_LOGIN } from 'src/config-global';
import { authRoutes } from './auth';
import { authDemoRoutes } from './auth-demo';
import { HomePage, mainRoutes } from './main';
import { componentsRoutes } from './components';
// ----------------------------------------------------------------------

export default function Router() {
  return useRoutes([
    // SET INDEX PAGE WITH SKIP HOME PAGE
    // {
    //   path: '/',
    //   element: <Navigate to={PATH_AFTER_LOGIN} replace />,
    // },

    // ----------------------------------------------------------------------

    // SET INDEX PAGE WITH HOME PAGE
    {
      children: [
        {
            path: '/',
            element: (
              <AuthGuard>
                <MainLayout>
                  <HomePage />
                </MainLayout>
              </AuthGuard>
            ),
        },
        {
          path: 'datasource/:id/manage', 
          element: (
            <AuthGuard>
              <MainLayout>
                <DataSourceManagement />
              </MainLayout>
            </AuthGuard>
          ),
        },
      ],
    },

    // Auth routes
    ...authRoutes,
    ...authDemoRoutes,

    // Main routes
    ...mainRoutes,

    // Components routes
    ...componentsRoutes,

    // No match 404
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
