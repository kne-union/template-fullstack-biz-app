import { createWithRemoteLoader } from '@kne/remote-loader';
import { Outlet } from 'react-router-dom';
<% if (tenantClientLayout === 'system-layout') { %>
import SystemLayout from '@kne/system-layout';
import '@kne/system-layout/dist/index.css';
<% } %>
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const Layout = createWithRemoteLoader({
  modules: [
    'components-admin:Tenant@Authenticate',
    'components-core:Permissions',
    'components-core:Icon'<% if (tenantClientLayout === 'layout') { %>,
    'components-core:Layout'<% } %>
  ]
})(
  withLocale(({ remoteModules, baseUrl, children }) => {
    const [Authenticate, Permissions, Icon<% if (tenantClientLayout === 'layout') { %>, CoreLayout<% } %>] = remoteModules;
    const { formatMessage } = useIntl();

    return (
      <Authenticate>
        {({ global }) => {
          const { tenantUserInfo, tenant } = global;
          return (
            <Permissions request={['client']} type="error">
<% if (tenantClientLayout === 'system-layout') { %>
              <SystemLayout
                openScrollbar={false}
                logo={{ id: tenant?.logo }}
                userInfo={{
                  ...tenantUserInfo,
                  email: '',
                  description: tenantUserInfo?.options?.position || tenantUserInfo?.email
                }}
                background={'linear-gradient(180deg, #E8DCDF, #E1D1E3, #DED7EF, #D5E0F1)'}
                menu={{
                  base: baseUrl,
                  items: [
                    {
                      path: '/',
                      label: formatMessage({ id: 'ClientHome' }),
                      toolbar: true,
                      icon: <Icon type="a-home_fill" fontClassName="coach" />
                    }
                  ]
                }}
              >
                {children || <Outlet />}
              </SystemLayout>
<% } else { %>
              <CoreLayout
                navigation={{
                  base: baseUrl,
                  showIndex: false,
                  defaultTitle: formatMessage({ id: 'ClientHomeTitle' }),
                  list: [{ key: 'home', title: formatMessage({ id: 'ClientHome' }), path: baseUrl }]
                }}
              >
                {children || <Outlet />}
              </CoreLayout>
<% } %>
            </Permissions>
          );
        }}
      </Authenticate>
    );
  })
);

export default Layout;
