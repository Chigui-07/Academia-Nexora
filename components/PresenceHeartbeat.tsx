"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const HEARTBEAT_MS = 30_000;
const IDLE_AFTER_MS = 5 * 60_000;

export default function PresenceHeartbeat() {
  const lastInteraction = useRef(Date.now());
  const sending = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const markActive = () => {
      lastInteraction.current = Date.now();
    };

    async function heartbeat(forceActive?: boolean) {
      if (cancelled || sending.current) return;
      sending.current = true;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session || cancelled) return;

        const isVisible = document.visibilityState === "visible";
        const recentlyActive = Date.now() - lastInteraction.current < IDLE_AFTER_MS;
        const active = forceActive ?? (isVisible && recentlyActive);

        await supabase.rpc("heartbeat_user_presence", { p_active: active });
      } finally {
        sending.current = false;
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        markActive();
        void heartbeat(true);
      } else {
        void heartbeat(false);
      }
    };

    const interactionEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "mousemove",
      "scroll",
    ];

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActive, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibility);

    void heartbeat(true);
    const interval = window.setInterval(() => void heartbeat(), HEARTBEAT_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActive);
      });
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}
