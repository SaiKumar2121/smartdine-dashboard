// api/menuItems.js
import api from './apiClient';

const normalizeItem = (x = {}) => {
  const id = x._id || x.id;
  const name = x.name ?? '';
  const description = x.description ?? x.desc ?? '';
  const price = typeof x.price === 'number' ? x.price : Number(x.price) || 0;

  const tags = Array.isArray(x.tags) ? x.tags : [];
  const veg = (x.veg ?? x.isVeg) ? 'Veg' : (x.nonVeg ?? x.isNonVeg) ? 'Non-Veg' : null;
  const bestseller = x.bestseller ? 'Bestseller' : null;

  let images = [];
  if (typeof x.image === 'string') images = [x.image];
  else if (Array.isArray(x.images)) images = x.images.map(u => typeof u === 'string' ? u : (u?.url ?? ''));
  else if (Array.isArray(x.photos)) images = x.photos.map(u => typeof u === 'string' ? u : (u?.url ?? ''));
  images = images.filter(Boolean);

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
    category,
    menuName,
    posCategoryId,
    posItemId,
    status,
    displayOrder: x.displayOrder ?? 0,
  };
};

// single page fetch (used internally)
async function getMenuItemsByRestaurantPaged(restaurantId, params = {}) {
  const res = await api.get(`/restaurants/${restaurantId}/menu-items`, { params });
  const d = res.data?.data || {};
  const items = (d.menuItems || d.items || []).map(normalizeItem);
  const pagination = d.pagination || {
    totalItems: items.length,
    totalPages: 1,
    currentPage: Number(params.page || 1),
    pageSize: Number(params.limit || items.length || 20),
    nextPage: null,
    prevPage: null
  };
  return { items, pagination };
}

// public: fetch ALL items (auto-paginates until done)
export async function getAllMenuItemsByRestaurant(restaurantId, params = {}) {
  const limit = Math.max(1, Number(params.limit || 100)); // 100 works with your backend cap
  let page = 1;

  const out = [];
  let totalItems = 0;
  let totalPages = 1;

  // first page
  let { items, pagination } = await getMenuItemsByRestaurantPaged(restaurantId, { ...params, page, limit });
  out.push(...items);
  totalItems = Number(pagination.totalItems || items.length);
  totalPages = Number(pagination.totalPages || 1);

  // remaining pages (if any)
  while (page < totalPages) {
    page += 1;
    const r = await getMenuItemsByRestaurantPaged(restaurantId, { ...params, page, limit });
    out.push(...r.items);
  }

  // return a flat list (admin wants everything in one page)
  return { items: out, pagination: { totalItems: out.length, totalPages: 1, currentPage: 1, pageSize: out.length } };
}

export async function updateMenuItem (restaurantId, itemId, payload) {
  const url = `/restaurants/${restaurantId}/menu-items/${itemId}`;
  const res = payload instanceof FormData
    ? await api.patch(url, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
    : await api.patch(url, payload);
  const out = res.data?.data ?? res.data;
  return normalizeItem(out);
}
