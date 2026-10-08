import { createWithRemoteLoader } from '@kne/remote-loader';
import { LogoutOutlined, PartitionOutlined, SafetyCertificateOutlined, UserOutlined, UserSwitchOutlined } from '@ant-design/icons';
<% if (tenantAdminLayout === 'system-layout') { %>
import SystemLayout from '@kne/system-layout';
import '@kne/system-layout/dist/index.css';
<% } %>
import { Outlet } from 'react-router-dom';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';
import { withPublicUrl } from '../../commons/publicUrl';

const Layout = createWithRemoteLoader({
  modules: [
    'components-admin:Tenant@Authenticate',
    'components-admin:Account@useLogout',
    'components-core:Permissions',
    'components-core:Icon',
    'components-core:Global@SetGlobal'<% if (tenantAdminLayout === 'layout') { %>,
    'components-core:Layout'<% } %>
  ]
})(
  withLocale(({ remoteModules, baseUrl, children }) => {
    const [Authenticate, useLogout, Permissions, Icon, SetGlobal<% if (tenantAdminLayout === 'layout') { %>, CoreLayout<% } %>] = remoteModules;
    const logout = useLogout();
    const { formatMessage } = useIntl();

    return (
      <Authenticate>
        {({ global }) => {
          const { tenantUserInfo, tenant } = global;
          return (
            <SetGlobal globalKey="tenant" value={tenant}>
              <SetGlobal globalKey="userInfo" value={{ tenantUserInfo, tenant }}>
                <Permissions request={['tenant']} type="error">
<% if (tenantAdminLayout === 'system-layout') { %>
                  <SystemLayout
                    logo={{ id: tenant?.logo }}
                    userInfo={tenantUserInfo}
                    background={'linear-gradient(180deg, #E8DCDF, #E1D1E3, #DED7EF, #D5E0F1)'}
                    menu={{
                      base: baseUrl,
                      items: [
                        {
                          path: '/',
                          label: formatMessage({ id: 'TenantMenuDashboard' }),
                          toolbar: true,
                          icon: ({ active }) => (active ? <Icon type="a-home_fill" fontClassName="coach" /> : <Icon type="home_unfill" fontClassName="coach" />)
                        },
                        {
                          path: '/sample',
                          label: formatMessage({ id: 'TenantMenuSample' }),
                          toolbar: true,
                          icon: ({ active }) => (active ? <Icon type="assignment_fill" fontClassName="coach" /> : <Icon type="assignment_unfill" fontClassName="coach" />)
                        },
                        {
                          group: 'tenantSetting',
                          groupLabel: formatMessage({ id: 'TenantMenuSetting' }),
                          label: formatMessage({ id: 'TenantMenuCompany' }),
                          path: '/setting/company',
                          icon: { type: 'gongsi' }
                        },
                        {
                          group: 'tenantSetting',
                          groupLabel: formatMessage({ id: 'TenantMenuSetting' }),
                          label: formatMessage({ id: 'TenantMenuGroup' }),
                          path: '/setting/org',
                          icon: <PartitionOutlined />
                        },
                        {
                          group: 'tenantSetting',
                          groupLabel: formatMessage({ id: 'TenantMenuSetting' }),
                          label: formatMessage({ id: 'TenantMenuUser' }),
                          path: '/setting/user',
                          icon: <UserOutlined />
                        },
                        {
                          group: 'tenantSetting',
                          groupLabel: formatMessage({ id: 'TenantMenuSetting' }),
                          label: formatMessage({ id: 'TenantMenuPermission' }),
                          path: '/setting/permission',
                          icon: <SafetyCertificateOutlined />
                        },
                        {
                          group: 'account',
                          groupLabel: formatMessage({ id: 'TenantMenuAccount' }),
                          label: formatMessage({ id: 'TenantMenuSwitchTenant' }),
                          icon: <UserSwitchOutlined />,
                          onClick: () => {
                            window.location.href = withPublicUrl('/login-tenant');
                          }
                        },
                        {
                          group: 'account',
                          groupLabel: formatMessage({ id: 'TenantMenuAccount' }),
                          label: formatMessage({ id: 'TenantMenuLogout' }),
                          icon: <LogoutOutlined />,
                          onClick: logout
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
                      defaultTitle: formatMessage({ id: 'TenantDashboardTitle' }),
                      list: [
                        { key: 'dashboard', title: formatMessage({ id: 'TenantMenuDashboard' }), path: baseUrl },
                        { key: 'sample', title: formatMessage({ id: 'TenantMenuSample' }), path: `${baseUrl}/sample` },
                        { key: 'company', title: formatMessage({ id: 'TenantMenuCompany' }), path: `${baseUrl}/setting/company` },
                        { key: 'org', title: formatMessage({ id: 'TenantMenuGroup' }), path: `${baseUrl}/setting/org` },
                        { key: 'user', title: formatMessage({ id: 'TenantMenuUser' }), path: `${baseUrl}/setting/user` },
                        { key: 'permission', title: formatMessage({ id: 'TenantMenuPermission' }), path: `${baseUrl}/setting/permission` }
                      ]
                    }}
                  >
                    {children || <Outlet />}
                  </CoreLayout>
<% } %>
                </Permissions>
              </SetGlobal>
            </SetGlobal>
          );
        }}
      </Authenticate>
    );
  })
);

export default Layout;
