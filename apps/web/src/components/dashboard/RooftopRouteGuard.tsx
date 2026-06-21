"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useDealership } from "@/providers/DealershipProvider";

/** Leave entity detail routes when the active rooftop changes. */
export function RooftopRouteGuard() {
  const { dealershipId, rooftopScope } = useDealership();
  const pathname = usePathname();
  const router = useRouter();
  const prevDealershipRef = useRef(dealershipId);
  const prevScopeRef = useRef(rooftopScope);

  useEffect(() => {
    const dealershipChanged = prevDealershipRef.current !== dealershipId;
    const scopeChanged = prevScopeRef.current !== rooftopScope;

    if (dealershipChanged || scopeChanged) {
      if (/^\/dashboard\/vehicles\/[^/]+$/.test(pathname)) {
        router.replace("/dashboard/vehicles");
      }
    }

    prevDealershipRef.current = dealershipId;
    prevScopeRef.current = rooftopScope;
  }, [dealershipId, rooftopScope, pathname, router]);

  return null;
}
