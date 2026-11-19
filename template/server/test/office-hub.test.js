const { expect } = require('chai');
const { getOfficeHubConfig, getBearerToken, getTenantAgentConfig, getResponseData, officeHubFetch } = require('../libs/utils/office-hub');

const createFastify = ({ config = {}, orgSyncConfig } = {}) => ({
  config: Object.assign({ SYNC_ORG_HOST: 'https://hub.test', SYNC_ORG_SECRET: 'secret' }, config),
  tenant: { services: { orgSync: { getConfig: async () => orgSyncConfig } } }
});

const mockResponse = ({ ok = true, status = 200, statusText = 'OK', json = {} } = {}) => ({
  ok,
  status,
  statusText,
  json: async () => json
});

describe('office-hub', () => {
  const originalFetch = global.fetch;
  let fetchCalls;

  const mockFetch = response => {
    global.fetch = async (url, options) => {
      fetchCalls.push({ url, options });
      return response;
    };
  };

  beforeEach(() => {
    fetchCalls = [];
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('配置读取测试', () => {
    it('should return host and secret from fastify config', () => {
      expect(getOfficeHubConfig(createFastify())).to.deep.equal({ host: 'https://hub.test', secret: 'secret' });
    });

    it('should throw when host or secret is missing', () => {
      expect(() => getOfficeHubConfig(createFastify({ config: { SYNC_ORG_HOST: '' } }))).to.throw('未配置');
    });
  });

  describe('token 获取测试', () => {
    it('should request token with secret key', async () => {
      mockFetch(mockResponse({ json: { data: { access_token: 'token-1' } } }));
      const token = await getBearerToken(createFastify());
      expect(token).to.equal('token-1');
      expect(fetchCalls[0].url).to.equal('https://hub.test/api/v1/system/auth/external/token');
      expect(JSON.parse(fetchCalls[0].options.body)).to.deep.equal({ secret_key: 'secret' });
    });

    it('should throw when response is not ok', async () => {
      mockFetch(mockResponse({ ok: false, status: 500, statusText: 'Server Error' }));
      let error;
      await getBearerToken(createFastify()).catch(e => (error = e));
      expect(error.message).to.include('500');
    });

    it('should throw error_msg when token is missing', async () => {
      mockFetch(mockResponse({ json: { error_msg: 'bad secret' } }));
      let error;
      await getBearerToken(createFastify()).catch(e => (error = e));
      expect(error.message).to.equal('bad secret');
    });
  });

  describe('租户组织配置测试', () => {
    it('should return agentId from enabled config', async () => {
      const orgSyncConfig = { enabled: true, source: 'dingtalk', props: { agentid: 'agent-1' } };
      const result = await getTenantAgentConfig(createFastify({ orgSyncConfig }), { tenantId: 't1', platform: 'dingtalk' });
      expect(result).to.deep.equal({ agentId: 'agent-1', config: orgSyncConfig });
    });

    it('should throw when config is disabled, platform mismatches or agentId is missing', async () => {
      const cases = [
        [{ enabled: false }, '未找到有效的组织关联配置'],
        [{ enabled: true, source: 'wecom', props: { agentid: 'a' } }, '不一致'],
        [{ enabled: true, source: 'dingtalk', props: {} }, 'agentId']
      ];
      for (const [orgSyncConfig, message] of cases) {
        let error;
        await getTenantAgentConfig(createFastify({ orgSyncConfig }), { tenantId: 't1', platform: 'dingtalk' }).catch(e => (error = e));
        expect(error.message).to.include(message);
      }
    });
  });

  describe('请求封装测试', () => {
    it('should return data field or payload itself', () => {
      expect(getResponseData({ data: { a: 1 } })).to.deep.equal({ a: 1 });
      expect(getResponseData({ a: 1 })).to.deep.equal({ a: 1 });
    });

    it('should post body with bearer token', async () => {
      mockFetch(mockResponse({ json: { data: 'ok' } }));
      const payload = await officeHubFetch('https://hub.test/api', { token: 't', body: { a: 1 } });
      expect(payload).to.deep.equal({ data: 'ok' });
      expect(fetchCalls[0].options.headers.Authorization).to.equal('Bearer t');
    });

    it('should throw when payload status_code is an error', async () => {
      mockFetch(mockResponse({ json: { status_code: 400, error_msg: 'invalid' } }));
      let error;
      await officeHubFetch('https://hub.test/api', { token: 't', body: {} }).catch(e => (error = e));
      expect(error.message).to.equal('invalid');
    });
  });
});
