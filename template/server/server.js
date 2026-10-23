<% const includeTenant = includeTenantAdmin || includeTenantClient; %>
const fastify = require('fastify')({
  logger: true,
  querystringParser: str => require('qs').parse(str)
});

const fastifyEnv = require('@fastify/env');
const packageJson = require('./package.json');
const path = require('path');
const fs = require('fs');

const version = `v${packageJson.version.split('.')[0]}`;
// 部署包里根目录 package.json 才是应用版本；server 单独运行（如 Docker 镜像）时回退 server/package.json
const appPackageJson = fs.existsSync(path.join(__dirname, '../package.json')) ? require('../package.json') : packageJson;

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
    schema: require('./env.schema.json')
  });

  // 须在其它插件之前注册，否则收集不到先定义的路由；文档由 @kne/fastify-app-runtime 的 /open-api.json 输出
  fastify.register(require('@fastify/swagger'), {
    openapi: {
      info: { title: '<%=name%>', version: appPackageJson.version }
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
        isTest: fastify.config.IS_TEST,
        prefix: `${options.prefix}`,<% if (includeOidc) { %>
        getUserAuthenticate: () => fastify.oidc.authenticate.user,<% } %>
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
        isTest: fastify.config.IS_TEST,
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
        getUserModel: options.getUserModel,
        permissionsProfile: path.resolve(__dirname, './libs/permissions.js')<% if (includeOidc) { %>,
        onPermissionChange: payload => fastify.oidc.onPermissionChange(payload)<% } %><% if (includeDingtalk || includeWecom) { %>,
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
      });<% } %><% if (includeOidc) { %>

      // .env 里的值不一定写入 process.env（@fastify/env 7 起不再写入），fastify-oidc 的环境变量默认值可能读不到，需显式传入
      fastify.register(require('@kne/fastify-oidc'), {
        selfClient: { clientName: '<%= name.charAt(0).toUpperCase() + name.slice(1) %>' },
        origin: fastify.config.ORIGIN,
        keyEncryptionSecret: fastify.config.OIDC_KEY_SECRET<% if (includeTenant) { %>,
        // 部署到应用中心时宿主注入 OIDC_APP_CODE 等；带本地租户数据，以 independent 模式托管宿主同步过来的租户
        tenant: () => fastify.tenant,
        app: { tenantMode: 'independent' }<% } %>
      });<% } %>
    })
  );

  fastify.register(
    require('fastify-plugin')(async fastify => {<% if (includeOss) { %>
      const { OSS_REGION, OSS_BUCKET, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET } = fastify.config;
      const ossEnabled = !!(OSS_REGION && OSS_BUCKET && OSS_ACCESS_KEY_ID && OSS_ACCESS_KEY_SECRET);
<% } %>
      fastify.register(require('@kne/fastify-file-manager'), {
        prefix: `${options.prefix}/static`,
        root: path.resolve('./static')<% if (includeOss) { %>,
        ossAdapter: () => (ossEnabled ? fastify.aliyun.services.oss : {})<% } %>
      });<% if (includeOss) { %>

      if (ossEnabled) {
        fastify.register(require('@kne/fastify-aliyun'), {
          prefix: `${options.prefix}/aliyun`,
          oss: {
            baseDir: '<%=name%>',
            region: OSS_REGION,
            accessKeyId: OSS_ACCESS_KEY_ID,
            accessKeySecret: OSS_ACCESS_KEY_SECRET,
            bucket: OSS_BUCKET
          }
        });
      }<% } %>
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
      // 内含 @kne/fastify-setting，须在 sync 之前注册
      await fastify.register(require('@kne/fastify-app-runtime'), {
        root: path.join(__dirname, './build'),
        packageJson: appPackageJson,
        setting: {
          prefix: `${options.prefix}/setting`
        },
        static: {
          manifestFiles: ['manifest.json']
        }
      });
      await fastify.sequelize.sync();
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
