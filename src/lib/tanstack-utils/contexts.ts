import type { AuthSession } from "@/fn/related-user";
import { QueryClient } from "@tanstack/react-query";

export function getContext() {
  const queryClient = new QueryClient();
  let session: AuthSession | null = null; // Default to null, we preload it on beforeLoad in SSR Router global page
  //let customer: PaymentCustomerState | null = null; // Default to null, we preload it on beforeLoad in SSR Router global page
  return {
    queryClient,
    session,
    //customer,
  };
}

export type RqContext = ReturnType<typeof getContext>;
