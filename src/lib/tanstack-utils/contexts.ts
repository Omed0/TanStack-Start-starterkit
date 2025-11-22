import type { AuthSession } from "@/fn/related-user";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function getContext() {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError(error, query) {
        toast.error(error.message, {
          action: {
            label: "Retry",
            onClick: () => query.invalidate(),
          },
          cancel: {
            label: "Cancel",
            onClick: () => query.cancel()
          }
        })
      },
    }),
    defaultOptions: {
      queries: {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: import.meta.env.PROD,
        staleTime: 10 * 60 * 1000, // 10 minutes 
        retry: 2,
      },
      mutations: {
        onError(error) {
          toast.error(error.message)
        }
      }
    },
  });

  let session: AuthSession | null = null; // Default to null, we preload it on beforeLoad in SSR Router global page
  //let customer: PaymentCustomerState | null = null; // Default to null, we preload it on beforeLoad in SSR Router global page
  return {
    queryClient,
    session,
    //customer,
  };
}

export type RqContext = ReturnType<typeof getContext>;
