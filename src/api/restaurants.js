import api from './apiClient';

function normalizeId (doc) {
  const raw = doc?._id ?? doc?.id;
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    if (typeof raw.$oid === 'string') return raw.$oid;
    if (typeof raw.toString === 'function') return raw.toString();
    if (raw._bsontype === 'ObjectID' && typeof raw.toHexString === 'function') return raw.toHexString();
  }
  return String(raw);
}

function normalizeRestaurant (r) {
  const _id = normalizeId(r);
  return {
    _id,
    id: _id,
    name: r.name ?? '',
    status: r.status ?? 'unknown',
    description: r.description ?? ''
  };
}

export async function fetchRestaurants () {
  const res = await api.get('/restaurants');
  // Accept either { data: { restaurants: [...] } } or raw array
  const list = Array.isArray(res.data?.data?.restaurants)
    ? res.data.data.restaurants
    : Array.isArray(res.data)
      ? res.data
      : [];

  return list.map(normalizeRestaurant);
}
