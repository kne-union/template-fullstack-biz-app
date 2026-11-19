/** apiHost 可已含 /api/v1；否则补 /api/v1，与宿主应用中心下发的 apiHost 对齐 */
export const normalizeApiPrefix = apiHost => {
  const base = String(apiHost || '')
    .trim()
    .replace(/\/+$/, '');
  if (!base) {
    return '';
  }
  if (/\/api\/v\d+$/i.test(base)) {
    return base;
  }
  return `${base}/api/v1`;
};
