// hooks/useMenuItems.js
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllMenuItemsByRestaurant, updateMenuItem } from '../api/menuItems';

export function useMenuItems (restaurantId, filters = {}) {
  const stableFilterKey = useMemo(
    () => JSON.stringify(filters || {}),
    [filters]
  );
  const normalizedFilters = useMemo(
    () => (filters && typeof filters === 'object' ? filters : {}),
    [stableFilterKey]
  );

  return useQuery({
    queryKey: ['menu-items-all', restaurantId, stableFilterKey],
    queryFn: () => getAllMenuItemsByRestaurant(restaurantId, normalizedFilters),
    enabled: !!restaurantId,
    staleTime: 60_000,
    refetchOnWindowFocus: false
  });
}

export function useUpdateMenuItem (restaurantId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }) => updateMenuItem(restaurantId, itemId, data),

    async onMutate ({ itemId, data }) {
      await qc.cancelQueries({ queryKey: ['menu-items-all', restaurantId] });
      const previous = qc.getQueryData(['menu-items-all', restaurantId]);

      if (data && (data.description != null || data.name != null || data.comboItems != null || data.combos != null)) {
        qc.setQueryData(['menu-items-all', restaurantId], (old) => {
          if (!old?.items) return old;
          const comboItems =
            data.comboItems ??
            data.comboIds ??
            data.upsellItems ??
            (Array.isArray(data.combos) ? data.combos : undefined);

          return {
            ...old,
            items: old.items.map((it) => {
              if (it._id !== itemId) return it;
              return {
                ...it,
                ...data,
                ...(comboItems ? { comboItems } : {})
              };
            })
          };
        });
      }
      return { previous };
    },

    onError (_err, _vars, ctx) {
      if (ctx?.previous) qc.setQueryData(['menu-items-all', restaurantId], ctx.previous);
    },

    onSuccess (updated) {
      if (!updated?._id) return;
      qc.setQueryData(['menu-items-all', restaurantId], (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map(it => (it._id === updated._id ? { ...it, ...updated } : it))
        };
      });
    },

    onSettled () {
      qc.invalidateQueries({ queryKey: ['menu-items-all', restaurantId] });
    }
  });
}
