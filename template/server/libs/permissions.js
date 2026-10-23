// 应用系统权限：经 fastify-tenant permissionsProfile 合并进租户权限树，部署到应用中心时注册给宿主，由宿主按租户开通（默认不开通）。
// 权限码为 `模块code:子模块code:权限code`，例：
// { name: '订单', code: 'order', modules: [{ name: '订单', code: 'order', permissions: [{ name: '创建', code: 'create' }] }] } => 'order:order:create'
module.exports = {
  modules: []
};
