<% if (tenantClientLayout === 'system-layout') { %>
import { Page } from '@kne/system-layout';
import { Typography } from 'antd';
import withLocale from '../withLocale';
import { useIntl } from '@kne/react-intl';

const { Paragraph } = Typography;

const Home = withLocale(() => {
  const { formatMessage } = useIntl();

  return (
    <Page title={formatMessage({ id: 'ClientHomeTitle' })}>
      <Paragraph>{formatMessage({ id: 'ClientHomeDescription' })}</Paragraph>
    </Page>
  );
});

export default Home;
<% } else { %>
import { Typography } from 'antd';
import { createWithRemoteLoader } from '@kne/remote-loader';
import withLocale from '../withLocale';
import { useIntl } from '@kne/react-intl';

const { Paragraph } = Typography;

const Home = createWithRemoteLoader({
  modules: ['components-core:Layout@Page']
})(
  withLocale(({ remoteModules }) => {
    const [Page] = remoteModules;
    const { formatMessage } = useIntl();

    return (
      <Page title={formatMessage({ id: 'ClientHomeTitle' })}>
        <Paragraph>{formatMessage({ id: 'ClientHomeDescription' })}</Paragraph>
      </Page>
    );
  })
);

export default Home;
<% } %>
