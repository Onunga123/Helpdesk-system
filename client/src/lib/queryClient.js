import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

export const queryKeys = {
  userProfile: ['user', 'profile'],
  knowledgeArticles: (params = {}) => ['knowledge', 'articles', params],
  knowledgeStats: ['knowledge', 'stats'],
  users: (params = {}) => ['users', params],
};
