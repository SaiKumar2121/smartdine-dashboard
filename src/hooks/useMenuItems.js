import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMenuItemsByRestaurant, updateMenuItem } from '../api/menuItems';

export function useMenuItems (restaurantId) {
  return useQuery({
    queryKey: ['menu-items', restaurantId],
    queryFn: () => getMenuItemsByRestaurant(restaurantId),
    enabled: !!restaurantId,
    staleTime: 60_000
  });
}

export function useUpdateMenuItem (restaurantId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }) => updateMenuItem(restaurantId, itemId, data),

    async onMutate ({ itemId, data }) {
      await qc.cancelQueries({ queryKey: ['menu-items', restaurantId] });
      const previous = qc.getQueryData(['menu-items', restaurantId]);

      // read description from JSON payload
      const nextDescription = data?.description;
      if (nextDescription != null) {
        qc.setQueryData(['menu-items', restaurantId], (old = []) =>
          old.map(it => (it._id === itemId ? { ...it, description: nextDescription } : it))
        );
      }
      return { previous };
    },

    onError (_err, _vars, ctx) {
      if (ctx?.previous) qc.setQueryData(['menu-items', restaurantId], ctx.previous);
    },

    onSuccess (updated) {
      if (!updated?._id) return;
      qc.setQueryData(['menu-items', restaurantId], (old = []) =>
        old.map(it => (it._id === updated._id ? { ...it, ...updated } : it))
      );
    },

    onSettled () {
      qc.invalidateQueries({ queryKey: ['menu-items', restaurantId] });
    }
  });
}
