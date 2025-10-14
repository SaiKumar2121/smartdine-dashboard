import api from './apiClient';

export async function getMenuItemsByRestaurant (restaurantId) {
  const res = await api.get(`/restaurants/${restaurantId}/menu-items`);
  const d = res.data;
  let items =
    d?.data?.items ??
    d?.data?.menuItems ??
    d?.items ??
    d?.menuItems ??
    (Array.isArray(d) ? d : null);
  if (!Array.isArray(items)) items = [];
  return items.map(normalizeItem);
}

export async function updateMenuItem (restaurantId, itemId, payload) {
  const url = `/restaurants/${restaurantId}/menu-items/${itemId}`;
  const res = payload instanceof FormData
    ? await api.patch(url, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
    : await api.patch(url, payload);
  const out = res.data?.data ?? res.data;
  return normalizeItem(out);
}

function normalizeItem (x = {}) {
  const id = x._id || x.id;
  const name = x.name ?? '';
  const description = x.description ?? x.desc ?? '';
  const price = typeof x.price === 'number' ? x.price : Number(x.price) || 0;

  // diet/tags
  const tags = Array.isArray(x.tags) ? x.tags : [];
  const veg = (x.veg ?? x.isVeg)
    ? 'Veg'
    : (x.nonVeg ?? x.isNonVeg)
        ? 'Non-Veg'
        : null;
  const bestseller = x.bestseller ? 'Bestseller' : null;

  // images: string[] or {url}[]
  let images = [];
  if (typeof x.image === 'string') images = [x.image];
  else if (Array.isArray(x.images)) images = x.images.map(u => typeof u === 'string' ? u : (u?.url ?? ''));
  else if (Array.isArray(x.photos)) images = x.photos.map(u => typeof u === 'string' ? u : (u?.url ?? ''));
  images = images.filter(Boolean);

  // NEW: POS fields
  const category = x.categoryName ?? x.category ?? null;
  const menuName = x.menuName ?? null;
  const posCategoryId = x.posCategoryId ?? null;
  const posItemId = x.posItemId ?? null;
  const status = x.status ?? 'active';

  return {
    _id: id,
    name,
    description,
    price,
    tags: [...tags, ...(veg ? [veg] : []), ...(bestseller ? [bestseller] : [])],
    images,
    // expose POS-derived category for filtering
    category,
    menuName,
    posCategoryId,
    posItemId,
    status
  };
}
