import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCategoryGroups, createCategoryGroup, updateCategoryGroup } from '../api/categroup';

export function useCategoryGroups (restaurantId) {
  return useQuery({
    queryKey: ['categoryGroups', restaurantId],
    queryFn: () => fetchCategoryGroups(restaurantId),
    enabled: !!restaurantId,
    staleTime: 60 * 1000
  });
}

export function useCreateCategoryGroup () {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ restaurantId, data }) => createCategoryGroup(restaurantId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['categoryGroups', variables.restaurantId]);
    }
  });
}

export function useUpdateCategoryGroup () {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ restaurantId, categoryGroupId, data }) => updateCategoryGroup(restaurantId, categoryGroupId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['categoryGroups', variables.restaurantId]);
    }
  });
}
