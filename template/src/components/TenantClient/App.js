import AppChildrenRouter from '@kne/app-children-router';
import Layout from './Layout';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const TenantClient = withLocale(({ baseUrl }) => {
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
          title: formatMessage({ id: 'ClientHome' }),
          loader: () => import('./Home')
        }
      ]}
    />
  );
});

export default TenantClient;
