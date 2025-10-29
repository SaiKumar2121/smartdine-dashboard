// hooks/useMenuItems.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllMenuItemsByRestaurant, updateMenuItem } from '../api/menuItems';

// Admin wants ALL items in one page:
// this hook auto-fetches all pages and returns a flat array
export function useMenuItems(restaurantId, filters = {}) {
  return useQuery({
    queryKey: ['menu-items-all', restaurantId, filters],
    queryFn: () => getAllMenuItemsByRestaurant(restaurantId, filters),
    enabled: !!restaurantId,
    staleTime: 60_000
  });
}

export function useUpdateMenuItem (restaurantId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }) => updateMenuItem(restaurantId, itemId, data),

    async onMutate ({ itemId, data }) {
      await qc.cancelQueries({ queryKey: ['menu-items-all', restaurantId] });
      const previous = qc.getQueryData(['menu-items-all', restaurantId]);

      if (data && (data.description != null || data.name != null)) {
        qc.setQueryData(['menu-items-all', restaurantId], (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map(it => (it._id === itemId ? { ...it, ...data } : it))
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
