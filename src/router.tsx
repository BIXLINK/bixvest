import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Snappier navigation: reuse cached data for 60s, keep 5m in cache,
        // don't refetch on focus (BIXVEST invalidates explicitly after mutations)
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Preloaded route data is fresh for 30s so hover-preload isn't wasted
    defaultPreloadStaleTime: 30_000,
    defaultPreload: "intent",
  });

  return router;
};
