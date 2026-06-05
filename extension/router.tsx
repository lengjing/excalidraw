/**
 * Simple hash-based router for the Wisp extension.
 * Routes:
 *   #/ or empty → Workspace home page
 *   #/workspace/:id → Workspace view (default: canvas)
 *   #/workspace/:id/canvas → Canvas tab
 *   #/workspace/:id/notes → Notes tab
 */

import { useState, useEffect } from "react";

export type WorkspaceTab = "canvas" | "notes";

export interface Route {
  type: "home" | "workspace";
  workspaceId?: string;
  tab?: WorkspaceTab;
}

function parseHash(hash: string): Route {
  const cleaned = hash.replace(/^#\/?/, "");

  const wsMatch = cleaned.match(/^workspace\/([^/]+)(?:\/(canvas|notes))?$/);
  if (wsMatch) {
    return {
      type: "workspace",
      workspaceId: wsMatch[1],
      tab: (wsMatch[2] as WorkspaceTab) || "canvas",
    };
  }

  // Legacy support: #/board/:id → redirect to workspace
  const boardMatch = cleaned.match(/^board\/(.+)$/);
  if (boardMatch) {
    return {
      type: "workspace",
      workspaceId: boardMatch[1],
      tab: "canvas",
    };
  }

  return { type: "home" };
}

export function navigateTo(route: Route): void {
  if (route.type === "home") {
    window.location.hash = "#/";
  } else if (route.type === "workspace" && route.workspaceId) {
    const tab = route.tab || "canvas";
    window.location.hash = `#/workspace/${route.workspaceId}/${tab}`;
  }
}

export function navigateToWorkspace(
  workspaceId: string,
  tab: WorkspaceTab = "canvas",
): void {
  navigateTo({ type: "workspace", workspaceId, tab });
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
