import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function getMediaQueryList() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 0.02}px)`);
}

function subscribe(onStoreChange: () => void) {
  const mql = getMediaQueryList();
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => getMediaQueryList().matches,
    () => false,
  );
}
