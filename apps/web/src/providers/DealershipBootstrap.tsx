"use client";

import { useEffect } from "react";

import {
  getDefaultDealershipId,
  getStoredDealershipId,
  hasCustomDealershipSelection,
  setDealershipId,
} from "@/lib/dealership-storage";
import { fetchUserDealershipId } from "@/lib/user-dealership";
import { useAuth } from "@/providers/AuthProvider";
import { useDealership } from "@/providers/DealershipProvider";

/** Apply account rooftop when the device has no saved dealership choice yet. */
export function DealershipBootstrap() {
  const { session, isReady } = useAuth();
  const { setRooftopSelection } = useDealership();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const stored = getStoredDealershipId();
    const fromEnv = getDefaultDealershipId();

    if (!stored && fromEnv) {
      setDealershipId(fromEnv, { custom: false });
    }
  }, [isReady]);

  useEffect(() => {
    if (!isReady || !session) {
      return;
    }
    if (hasCustomDealershipSelection()) {
      return;
    }

    let cancelled = false;

    void fetchUserDealershipId(session.id).then((dealershipId) => {
      if (cancelled || !dealershipId) {
        return;
      }

      setRooftopSelection({
        organizationId: null,
        scope: "single",
        dealershipId,
        dealershipIds: [dealershipId],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isReady, session, setRooftopSelection]);

  return null;
}
