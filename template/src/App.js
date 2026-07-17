import RemoteLoader, { createWithRemoteLoader } from '@kne/remote-loader';
import AppChildrenRouter from '@kne/app-children-router';
import { Navigate } from 'react-router-dom';
import Admin from '@components/Admin';
<% if (includeTenantAdmin) { %>
import TenantAdmin from '@components/TenantAdmin';
<% } %>
<% if (includeTenantClient) { %>
import TenantClient from '@components/TenantClient';
<% } %>
<% if (includeClient) { %>
import Client from '@components/Client';
<% } %>
import './index.scss';

const App = createWithRemoteLoader({
  modules: ['components-core:Global', 'components-admin:Authenticate@AfterUserLoginLayout', 'components-admin:Authenticate@AfterAdminUserLoginLayout']
})(({ remoteModules, globalPreset }) => {
  const [Global, AfterUserLoginLayout, AfterAdminUserLoginLayout] = remoteModules;
  const baseUrl = '';
  const systemName = '<%=name%>';

  const adminNavigation = {
    base: `${baseUrl}/admin`,
    showIndex: false,
    defaultTitle: systemName,
    list: [
      {
        key: 'task',
        title: '任务管理',
        path: `${baseUrl}/admin/task`
      },
      {
        key: 'tenant',
        title: '租户管理',
        path: `${baseUrl}/admin/tenant`
      },
      {
        key: 'sample',
        title: '示例模块',
        path: `${baseUrl}/admin/sample`
      },
      {
        key: 'user',
        title: '用户管理',
        path: '/admin/user'
      },
      {
        key: 'file',
        title: '文件管理',
        path: `${baseUrl}/admin/file`
      },
      {
        key: 'intl-admin',
        title: '国际化',
        path: `${baseUrl}/admin/intl-admin`
      },
      {
        key: 'message',
        title: '消息管理',
        path: `${baseUrl}/admin/message`
      }
    ]
  };

  const routes = [
    {
      path: 'account/*',
      title: 'Account',
      element: <RemoteLoader module="components-admin:Account" baseUrl={baseUrl + '/account'} systemName={systemName} />
    },
    {
      path: 'admin/initAdmin',
      title: 'Init Admin',
      element: (
        <AppChildrenRouter
          element={<AfterUserLoginLayout />}
          list={[
            {
              index: true,
              element: <RemoteLoader module="components-admin:Admin@InitAdmin" />
            }
          ]}
        />
      )
    },
    {
      path: 'admin/*',
      title: 'Admin',
      element: (
        <AppChildrenRouter
          errorPage
          notFoundPage
          baseUrl={baseUrl + '/admin'}
          element={<AfterAdminUserLoginLayout navigation={adminNavigation} />}
          list={[
            {
              index: true,
              element: <Navigate to={`${baseUrl}/admin/sample`} replace />
            },
            {
              path: 'tenant/*',
              title: '租户管理',
              element: <RemoteLoader module="components-admin:TenantAdmin" baseUrl={baseUrl + '/admin'} />
            },
            {
              path: 'task/*',
              title: '任务管理',
              element: <RemoteLoader module="components-admin:Task" baseUrl={baseUrl + '/admin'} />
            },
            {
              path: 'file',
              title: '文件管理',
              element: <RemoteLoader module="components-file-manager:FileListPage" />
            },
            {
              path: 'intl-admin/*',
              title: '国际化',
              element: <RemoteLoader module="components-admin:IntlAdmin" baseUrl={baseUrl + '/admin/intl-admin'} />
            },
            {
              path: 'message/*',
              title: '消息管理',
              element: <RemoteLoader module="components-admin:MessageManger" baseUrl={`${baseUrl}/admin/message`} />
            }
          ]}
        >
          <Admin baseUrl={baseUrl + '/admin'}>
            <RemoteLoader module="components-admin:Admin" baseUrl={baseUrl + '/admin'} />
          </Admin>
        </AppChildrenRouter>
      )
    }
  ];

<% if ((includeTenantAdmin || includeTenantClient) && (includeDingtalk || includeWecom)) { %>
  routes.push({
    path: 'third-login',
    title: 'Third Login',
    element: <RemoteLoader module="components-admin:Tenant@ThirdLogin" />
  });
  routes.push({
    path: 'third-login-result',
    title: 'Third Login Result',
    element: <RemoteLoader module="components-admin:Tenant@ThirdLoginResult" />
  });
<% } %>

<% if (includeTenantAdmin || includeTenantClient) { %>
  routes.push({
    path: 'join-tenant',
    title: 'Join Tenant',
    element: (
      <AfterUserLoginLayout>
        <RemoteLoader module="components-admin:Tenant@JoinInvitation" />
      </AfterUserLoginLayout>
    )
  });
  routes.push({
    path: 'login-tenant',
    title: 'Login Tenant',
    element: (
      <AfterUserLoginLayout>
        <RemoteLoader
          module="components-admin:Tenant@LoginTenant"
          tenantPath={`${baseUrl}<% if (includeTenantClient) { %>/tenant<% } else { %>/tenant-admin<% } %>`}
        />
      </AfterUserLoginLayout>
    )
  });
<% } %>

<% if (includeTenantAdmin) { %>
  routes.push({
    path: 'tenant-admin/*',
    element: <TenantAdmin baseUrl={`${baseUrl}/tenant-admin`} />
  });
<% } %>

<% if (includeTenantClient) { %>
  routes.push({
    path: 'tenant/*',
    element: <TenantClient baseUrl={`${baseUrl}/tenant`} />
  });
<% } %>

<% if (includeClient) { %>
  routes.push({
    path: '*',
    element: (
      <Client baseUrl={baseUrl} />
    )
  });
<% } else if (includeTenantClient) { %>
  routes.push({
    path: '*',
    element: <Navigate to={`${baseUrl}/tenant`} replace />
  });
<% } else if (includeTenantAdmin) { %>
  routes.push({
    path: '*',
    element: <Navigate to={`${baseUrl}/tenant-admin`} replace />
  });
<% } else { %>
  routes.push({
    path: '*',
    element: <Navigate to={`${baseUrl}/admin`} replace />
  });
<% } %>

  return (
    <Global preset={globalPreset} themeToken={globalPreset.themeToken}>
      <AppChildrenRouter errorPage notFoundPage baseUrl={baseUrl} list={routes} />
    </Global>
  );
});

export default App;
