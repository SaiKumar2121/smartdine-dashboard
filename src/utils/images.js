// utils/images.js
export function coerceImages (arr = []) {
  if (!Array.isArray(arr)) return [];
  if (arr.length && typeof arr[0] === 'string') {
    return arr.map((url, i) => ({ id: `legacy-${i + 1}`, uuid: `legacy-${i + 1}`, type: 'menu', url }));
  }
  return arr;
}

export function getPrimaryMenuUrl (images = []) {
  const imgs = coerceImages(images).filter(i => i?.type === 'menu' && i?.url);
  return imgs.length ? imgs[0].url : '';
}
