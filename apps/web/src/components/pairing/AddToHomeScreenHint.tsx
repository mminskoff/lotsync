"use client";

import { Share, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISS_KEY = "lotsync:pwa-hint-dismissed";

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function AddToHomeScreenHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <Smartphone className="size-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Add LotSync to your home screen</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
            {isIos() ? (
              <>
                Tap <Share className="inline size-3.5 align-text-bottom" /> Share, then{" "}
                <span className="font-medium">Add to Home Screen</span> for full-screen pairing
                on the lot.
              </>
            ) : (
              <>
                Open the browser menu and choose <span className="font-medium">Install app</span>{" "}
                or <span className="font-medium">Add to Home screen</span> for faster camera access.
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-amber-800/70 transition hover:bg-amber-100 hover:text-amber-900"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
