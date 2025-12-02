import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../api/categories';

export function useCategories(restaurantId) {
    return useQuery({
        queryKey: ['categories', restaurantId],
        queryFn: () => fetchCategories(restaurantId),
        enabled: !!restaurantId,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false
    });
}
