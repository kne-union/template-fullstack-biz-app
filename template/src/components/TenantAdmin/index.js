import AppChildrenRouter from '@kne/app-children-router';
import Layout from './Layout';
<% if (tenantAdminLayout === 'system-layout') { %>
import { Page } from '@kne/system-layout';
<% } %>
import { createWithRemoteLoader } from '@kne/remote-loader';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const TenantAdmin = createWithRemoteLoader({
  modules: ['components-admin:Tenant@Setting', 'components-core:Global@usePreset'<% if (tenantAdminLayout === 'layout') { %>, 'components-core:Layout@Page'<% } %>]
})(
  withLocale(({ remoteModules, baseUrl }) => {
    const [Setting, usePreset<% if (tenantAdminLayout === 'layout') { %>, Page<% } %>] = remoteModules;
    const { apis } = usePreset();
    const { formatMessage } = useIntl();

    return (
      <AppChildrenRouter
        errorPage
        notFoundPage
        baseUrl={baseUrl}
        element={<Layout baseUrl={baseUrl} />}
        list={[
          {
            index: true,
            title: formatMessage({ id: 'TenantDashboardTitle' }),
            loader: () => import('./Dashboard')
          },
          {
            path: 'sample',
            title: formatMessage({ id: 'TenantMenuSample' }),
            loader: () => import('@components/Sample').then(({ TenantSample }) => TenantSample),
            elementProps: {
              apis: apis.sample,
              baseUrl,
              layoutType: '<%=tenantAdminLayout%>'
            }
          },
          {
            path: 'setting/company',
            title: formatMessage({ id: 'TenantMenuCompany' }),
            element: <Setting.Company>{({ title, children }) => <Page title={title}>{children}</Page>}</Setting.Company>
          },
          {
            path: 'setting/org',
            title: formatMessage({ id: 'TenantMenuGroup' }),
            element: <Setting.Org>{({ title, children }) => <Page title={title}>{children}</Page>}</Setting.Org>
          },
          {
            path: 'setting/user',
            title: formatMessage({ id: 'TenantMenuUser' }),
            element: (
              <Setting.User>
                {({ title, titleExtra, children }) => (
                  <Page title={title} extra={titleExtra}>
                    {children}
                  </Page>
                )}
              </Setting.User>
            )
          },
          {
            path: 'setting/permission',
            title: formatMessage({ id: 'TenantMenuPermission' }),
            element: (
              <Setting.Permission>
                {({ title, titleExtra, children }) => (
                  <Page title={title} extra={titleExtra}>
                    {children}
                  </Page>
                )}
              </Setting.Permission>
            )
          }
        ]}
      />
    );
  })
);

export default TenantAdmin;
