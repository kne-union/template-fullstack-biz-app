<% const includeTenant = includeTenantAdmin || includeTenantClient; %>
const fastify = require('fastify')({
  logger: true,
  querystringParser: str => require('qs').parse(str)
});

const fastifyEnv = require('@fastify/env');
const packageJson = require('./package.json');
const path = require('path');

const version = `v${packageJson.version.split('.')[0]}`;

const options = {
  name: 'project',
  prefix: `/api/${version}`,
  taskCron: '*/1 * * * *',
  getUserModel: () => {
    return fastify.account.models.user;
  }<% if (includeTenant) { %>,
  getTenantModels: () => {
    return {
      tenant: fastify.tenant.models.tenant,
      tenantUser: fastify.tenant.models.tenantUser,
      tenantOrg: fastify.tenant.models.tenantOrg
    };
  }<% } %>
};

<% if (includeTenant && (includeDingtalk || includeWecom)) { %>
const syncOrgType = [<% if (includeWecom) { %>'wecom:企业微信'<% } %><% if (includeWecom && includeDingtalk) { %>, <% } %><% if (includeDingtalk) { %>'dingtalk:钉钉'<% } %>].join(',');
<% } %>

const createServer = () => {
  fastify.register(fastifyEnv, {
    dotenv: true,
    schema: {
      type: 'object',
      properties: {
        DB_DIALECT: { type: 'string', default: 'sqlite' },
        DB_HOST: { type: 'string', default: 'data.db' },
        DB_PORT: { type: 'number' },
        DB_USERNAME: { type: 'string' },
        DB_PASSWORD: { type: 'string' },
        DB_DATABASE: { type: 'string' },
        ENV: { type: 'string', default: 'local' },
        PORT: { type: 'number', default: <%=port%> },
        ORIGIN: { type: 'string', default: '' }<% if (includeOss) { %>,
        OSS_REGION: { type: 'string' },
        OSS_BUCKET: { type: 'string' },
        OSS_ACCESS_KEY_ID: { type: 'string' },
        OSS_ACCESS_KEY_SECRET: { type: 'string' }<% } %><% if (includeTenant && (includeDingtalk || includeWecom)) { %>,
        SYNC_ORG_SECRET: { type: 'string' },
        SYNC_ORG_HOST: { type: 'string' }<% } %>,
        ALISMTP_USER: { type: 'string' },
        ALISMTP_PASSWORD: { type: 'string' },
        ALISMTP_ENDPOINT: { type: 'string' }
      }
    }
  });

  fastify.register(require('fastify-cron'));

  fastify.register(
    require('fastify-plugin')(async fastify => {
      fastify.register(require('@kne/fastify-sequelize'), {
        db: {
          dialect: fastify.config.DB_DIALECT,
          host: fastify.config.DB_HOST,
          port: fastify.config.DB_PORT,
          database: fastify.config.DB_DATABASE,
          username: fastify.config.DB_USERNAME,
          password: fastify.config.DB_PASSWORD
        },
        modelsGlobOptions: {
          syncOptions: {}
        },
        getUserModel: options.getUserModel<% if (includeTenant) { %>,
        getTenantModels: options.getTenantModels<% } %>
      });

      fastify.register(require('@kne/fastify-account'), {
        isTest: true,
        prefix: `${options.prefix}`,
        sendMessage: async ({ name, type, messageType, props }) => {
          if (messageType === 1 && type === 0) {
            await fastify.message.services.sendMessage({
              name,
              type: 0,
              code: 'REGISTERCODE',
              props,
              options: {
                title: '注册验证码'
              }
            });
          }
          if (messageType === 1 && type === 5) {
            await fastify.message.services.sendMessage({
              name,
              type: 0,
              code: 'RESETPASSWORDCODE',
              props: Object.assign({}, props, {
                url: `${fastify.config.ORIGIN}/account/reset-password/${props.token}${props.options?.referer ? `?referer=${props.options?.referer}` : ''}`
              }),
              options: {
                title: '重置密码'
              }
            });
          }
        }
      });

      fastify.register(require('@kne/fastify-message'), {
        prefix: `${options.prefix}/message`,
        emailConfig: {
          host: fastify.config.ALISMTP_ENDPOINT,
          port: 465,
          secure: true,
          user: fastify.config.ALISMTP_USER,
          pass: fastify.config.ALISMTP_PASSWORD
        },
        templateDir: path.join(__dirname, './messageTemplate'),
        senders: {}
      });

      fastify.register(require('@kne/fastify-task'), {
        prefix: `${options.prefix}/task`,
        cronTime: options.taskCron,
        task: {<% if (includeTenant && (includeDingtalk || includeWecom)) { %>
          'sync-org': ({ result }) => {
            return fastify.tenant.services.org.syncOrg(result);
          },
          'third-login-url': ({ result }) => result,
          'third-login-result': ({ result }) => result<% } %>
        }
      });<% if (includeTenant) { %>

      fastify.register(require('@kne/fastify-tenant'), {
        prefix: `${options.prefix}/tenant`,
        getUserModel: options.getUserModel<% if (includeDingtalk || includeWecom) { %>,
        syncOrgType: syncOrgType,
        syncOrgTask: async input => {
          const { tenantId } = input;
          return fastify.task.services.create({
            type: 'sync-org',
            targetId: tenantId,
            targetType: 'tenant',
            runnerType: 'system',
            input
          });
        },
        thirdLogin: {
          getThirdLoginUrl: ({ tenant, platform, redirect }) => {
            return fastify.task.services.executor({
              type: 'third-login-url',
              task: {
                input: {
                  tenantId: tenant.id,
                  platform,
                  redirect
                }
              }
            });
          },
          getThirdLoginResult: props => {
            return fastify.task.services.executor({
              type: 'third-login-result',
              task: {
                input: Object.assign({}, props)
              }
            });
          }
        }<% } %>
      });<% } %>
    })
  );

  fastify.register(
    require('fastify-plugin')(async fastify => {<% if (includeOss) { %>
      fastify.register(require('@kne/fastify-aliyun'), {
        prefix: `${options.prefix}/aliyun`,
        oss: {
          baseDir: '<%=name%>',
          region: fastify.config.OSS_REGION,
          accessKeyId: fastify.config.OSS_ACCESS_KEY_ID,
          accessKeySecret: fastify.config.OSS_ACCESS_KEY_SECRET,
          bucket: fastify.config.OSS_BUCKET
        }
      });<% } %>

      fastify.register(require('@kne/fastify-file-manager'), {
        prefix: `${options.prefix}/static`,
        root: path.resolve('./static')<% if (includeOss) { %>,
        ossAdapter: () => fastify.aliyun.services.oss<% } %>
      });
    })
  );

  fastify.register(
    require('fastify-plugin')(async fastify => {
      fastify.register(require('@kne/fastify-namespace'), {
        options,
        name: options.name,
        modules: [
          ['controllers', path.resolve(__dirname, './libs/controllers')],
          [
            'models',
            await fastify.sequelize.addModels(path.resolve(__dirname, './libs/models'), {
              getUserModel: options.getUserModel
            })
          ],
          ['services', path.resolve(__dirname, './libs/services')]
        ]
      });
      await fastify.sequelize.sync();
    })
  );

  fastify.register(
    require('fastify-plugin')(async fastify => {
      const getEntry = () => {
        const env = fastify.config.ENV;
        if (env === 'staging') {
          return 'entry.html';
        }

        if (env === 'prod') {
          return 'entry-prod.html';
        }

        return 'index.html';
      };
      fastify.register(require('@fastify/static'), {
        root: path.join(__dirname, './build'),
        prefix: '/',
        decorateReply: false,
        index: getEntry()
      });
      fastify.setNotFoundHandler((req, reply) => {
        if (req.method === 'GET') {
          reply.sendFile(getEntry(), { root: path.join(__dirname, './build') });
        }
      });
    })
  );

  fastify.register(require('@kne/fastify-response-data-format'));
};

module.exports = {
  fastify,
  createServer,
  start: () => {
    createServer();
    return fastify.then(() => {
      fastify.listen({ port: fastify.config.PORT, host: '0.0.0.0' }, (err, address) => {
        if (err) throw err;
        console.log(`Server is now listening on ${address}`);
      });
    });
  }
};
