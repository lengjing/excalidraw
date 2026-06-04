/**
 * Simple hash-based router for the Chrome extension.
 * Routes:
 *   #/ or empty → Board home page
 *   #/board/:id → Specific board (Excalidraw editor)
 */

import { useState, useEffect } from "react";

export interface Route {
  type: "home" | "board";
  boardId?: string;
}

function parseHash(hash: string): Route {
  const cleaned = hash.replace(/^#\/?/, "");
  const boardMatch = cleaned.match(/^board\/(.+)$/);
  if (boardMatch) {
    return { type: "board", boardId: boardMatch[1] };
  }
  return { type: "home" };
}

export function navigateTo(route: Route): void {
  if (route.type === "home") {
    window.location.hash = "#/";
  } else if (route.type === "board" && route.boardId) {
    window.location.hash = `#/board/${route.boardId}`;
  }
}

export function navigateToBoard(boardId: string): void {
  navigateTo({ type: "board", boardId });
}

export function navigateToHome(): void {
  navigateTo({ type: "home" });
}

export function useRouter(): Route {
  const [route, setRoute] = useState<Route>(() =>
    parseHash(window.location.hash),
  );

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return route;
}
