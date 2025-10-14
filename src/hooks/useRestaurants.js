import { useQuery } from '@tanstack/react-query';
import { fetchRestaurants } from '../api/restaurants';

export function useRestaurants () {
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: fetchRestaurants,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false
  });
}
