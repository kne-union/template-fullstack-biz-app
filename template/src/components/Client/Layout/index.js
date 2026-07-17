import { createWithRemoteLoader } from '@kne/remote-loader';
import { Outlet } from 'react-router-dom';
<% if (clientLayout === 'system-layout') { %>
import SystemLayout from '@kne/system-layout';
import '@kne/system-layout/dist/index.css';
<% } %>
import withLocale from '../withLocale';
import { useIntl } from '@kne/react-intl';

const Layout = createWithRemoteLoader({
  modules: [
    'components-admin:Authenticate@AfterUserLoginLayout',
    'components-core:Global@GlobalValue'<% if (clientLayout === 'layout') { %>,
    'components-core:Layout'<% } %>
  ]
})(
  withLocale(({ remoteModules, baseUrl, children }) => {
    const [AfterUserLoginLayout, GlobalValue<% if (clientLayout === 'layout') { %>, CoreLayout<% } %>] = remoteModules;
    const { formatMessage } = useIntl();

    return (
      <AfterUserLoginLayout>
        <GlobalValue globalKey="userInfo">
          {({ value }) => {
            const userInfo = value?.value;
            return (
<% if (clientLayout === 'system-layout') { %>
              <SystemLayout
                userInfo={userInfo}
                background={'linear-gradient(180deg, #E8DCDF, #E1D1E3, #DED7EF, #D5E0F1)'}
                menu={{
                  base: baseUrl,
                  items: [
                    {
                      path: '/',
                      label: formatMessage({ id: 'ClientAdminHome' }),
                      toolbar: true,
                      icon: 'home'
                    },
                    {
                      path: '/sample',
                      label: formatMessage({ id: 'ClientAdminSample' }),
                      toolbar: true,
                      icon: 'assignment'
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
                  defaultTitle: formatMessage({ id: 'ClientAdminHomeTitle' }),
                  list: [
                    { key: 'home', title: formatMessage({ id: 'ClientAdminHome' }), path: baseUrl },
                    { key: 'sample', title: formatMessage({ id: 'ClientAdminSample' }), path: `${baseUrl}/sample` }
                  ]
                }}
              >
                {children || <Outlet />}
              </CoreLayout>
<% } %>
            );
          }}
        </GlobalValue>
      </AfterUserLoginLayout>
    );
  })
);

export default Layout;
