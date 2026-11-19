import { useMemo } from 'react';
import merge from 'lodash/merge';
import { createWithRemoteLoader } from '@kne/remote-loader';
import { getApis } from '@components/Apis';
import { normalizeApiPrefix } from './mergeComponentPreset';
import style from './style.module.scss';

// 没有上层 preset 时用稳定引用，避免每次渲染产生新对象导致 useMemo 依赖失效
const EMPTY_PRESET = {};

/**
 * 被应用中心宿主嵌入时的外层预设组件（open-menus.json 的 remote.preset 默认指向它）。
 *
 * 宿主通过 props 下发：
 * - ajax：宿主的请求方法（带宿主登录令牌）
 * - apiHost：本应用接口前缀 /app/{name}，与宿主同源，由应用中心网关转发并把宿主令牌换成本应用令牌
 * - themeToken / tenantId / preset：主题、当前租户、额外 preset（最后深合并）
 *
 * 行为：用按 apiHost 拼接的 apis 覆盖宿主 preset 里的同名字段，再通过 PureGlobal 下发给页面组件。
 * 页面组件只需 usePreset().apis / ajax，不关心自己是独立运行还是被嵌入。
 */
const ComponentPreset = createWithRemoteLoader({
  modules: ['components-core:Global@usePreset', 'components-core:Global@PureGlobal', 'components-core:Global@useGlobalValue', 'components-core:Global@SetGlobal']
})(({ remoteModules, ajax: ajaxProp, apiHost, themeToken, tenantId, preset: presetProp, className, children }) => {
  const [usePreset, PureGlobal, useGlobalValue, SetGlobal] = remoteModules;
  const parentPreset = usePreset() || EMPTY_PRESET;
  // 宿主当前语言：PureGlobal 会新建独立的全局上下文，语言只取 preset.locale 的初始值，宿主切换后由 SetGlobal 同步
  const hostLocale = useGlobalValue('locale');
  const prefix = useMemo(() => normalizeApiPrefix(apiHost), [apiHost]);

  const ajax = ajaxProp || parentPreset.ajax;

  const packageLayer = useMemo(() => {
    if (!prefix || !ajax) {
      return {};
    }
    // getApis 需要按 prefix 拼接接口地址：新增业务接口时保持 getApis({ prefix, ajax }) 的签名
    return { apis: getApis({ prefix, ajax }) };
  }, [prefix, ajax]);

  const mergedPreset = useMemo(
    () => merge({}, parentPreset, packageLayer, { tenantId, locale: hostLocale, preferHostTheme: Boolean(themeToken?.colorPrimary) }, presetProp || {}),
    [parentPreset, packageLayer, tenantId, hostLocale, themeToken, presetProp]
  );

  return (
    <div className={`${style.root}${className ? ` ${className}` : ''}`}>
      <PureGlobal preset={mergedPreset} themeToken={themeToken}>
        <SetGlobal globalKey="locale" value={hostLocale}>
          {children}
        </SetGlobal>
      </PureGlobal>
    </div>
  );
});

export default ComponentPreset;
export { normalizeApiPrefix } from './mergeComponentPreset';
