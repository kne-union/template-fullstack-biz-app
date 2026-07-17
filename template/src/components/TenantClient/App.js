import { createWithRemoteLoader } from '@kne/remote-loader';
import AppChildrenRouter from '@kne/app-children-router';
import Layout from './Layout';
import withLocale from './withLocale';
import { useIntl } from '@kne/react-intl';

const TenantClient = createWithRemoteLoader({
  modules: ['components-core:Permissions']
})(
  withLocale(({ remoteModules, baseUrl }) => {
    const [Permissions] = remoteModules;
    const { formatMessage } = useIntl();

    return (
      <Permissions request={['client']}>
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
      </Permissions>
    );
  })
);

export default TenantClient;
