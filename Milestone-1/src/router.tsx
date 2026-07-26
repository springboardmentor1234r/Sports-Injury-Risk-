import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data fresh for a minute so switching tabs/pages reuses the
        // cache instantly instead of re-fetching (and showing a loading
        // state) every single time.
        staleTime: 60_000,
        // Don't refetch every query just because the browser tab regained
        // focus — this was the main source of the "loading every time I
        // switch tabs" delay.
        refetchOnWindowFocus: false,
        // Don't retry 3x with backoff on a hard error (e.g. a permission
        // error) — fail fast so the UI doesn't sit there "loading".
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
