<% if (tenantAdminLayout === 'system-layout') { %>
import { Page } from '@kne/system-layout';
import { Typography } from 'antd';
import withLocale from '../withLocale';
import { useIntl } from '@kne/react-intl';

const { Paragraph } = Typography;

const Dashboard = withLocale(() => {
  const { formatMessage } = useIntl();

  return (
    <Page title={formatMessage({ id: 'TenantDashboardTitle' })}>
      <Paragraph>{formatMessage({ id: 'TenantDashboardDescription' })}</Paragraph>
    </Page>
  );
});

export default Dashboard;
<% } else { %>
import { Typography } from 'antd';
import { createWithRemoteLoader } from '@kne/remote-loader';
import withLocale from '../withLocale';
import { useIntl } from '@kne/react-intl';

const { Paragraph } = Typography;

const Dashboard = createWithRemoteLoader({
  modules: ['components-core:Layout@Page']
})(
  withLocale(({ remoteModules }) => {
    const [Page] = remoteModules;
    const { formatMessage } = useIntl();

    return (
      <Page title={formatMessage({ id: 'TenantDashboardTitle' })}>
        <Paragraph>{formatMessage({ id: 'TenantDashboardDescription' })}</Paragraph>
      </Page>
    );
  })
);

export default Dashboard;
<% } %>
