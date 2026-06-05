/**
 * Workspace Manager - handles CRUD operations for workspaces.
 * Each workspace contains a Canvas (Excalidraw) and Notes (Markdown).
 */

import { createStore, get, set } from "idb-keyval";

export interface WorkspaceMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  notesSummary?: string;
}

const WS_DB = "wisp-workspaces-db";
const WS_STORE = "wisp-workspaces-store";
const WS_LIST_KEY = "workspaces-list";

const wsStore = createStore(WS_DB, WS_STORE);

function generateId(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function getWorkspaces(): Promise<WorkspaceMeta[]> {
  const workspaces = await get<WorkspaceMeta[]>(WS_LIST_KEY, wsStore);
  return workspaces || [];
}

export async function saveWorkspaces(
  workspaces: WorkspaceMeta[],
): Promise<void> {
  await set(WS_LIST_KEY, workspaces, wsStore);
}

export async function createWorkspace(name?: string): Promise<WorkspaceMeta> {
  const workspaces = await getWorkspaces();
  const workspace: WorkspaceMeta = {
    id: generateId(),
    name: name || `Workspace ${workspaces.length + 1}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  workspaces.unshift(workspace);
  await saveWorkspaces(workspaces);
  return workspace;
}

export async function updateWorkspace(
  id: string,
  updates: Partial<
    Pick<WorkspaceMeta, "name" | "thumbnail" | "updatedAt" | "notesSummary">
  >,
): Promise<void> {
  const workspaces = await getWorkspaces();
  const idx = workspaces.findIndex((w) => w.id === id);
  if (idx !== -1) {
    workspaces[idx] = {
      ...workspaces[idx],
      ...updates,
      updatedAt: Date.now(),
    };
    await saveWorkspaces(workspaces);
  }
}

export async function deleteWorkspace(id: string): Promise<void> {
  const workspaces = await getWorkspaces();
  const filtered = workspaces.filter((w) => w.id !== id);
  await saveWorkspaces(filtered);

  // Clean up workspace's localStorage data
  try {
    localStorage.removeItem(getCanvasElementsKey(id));
    localStorage.removeItem(getCanvasAppStateKey(id));
    localStorage.removeItem(getNotesKey(id));
  } catch (e) {
    console.error("Failed to clean workspace storage", e);
  }
}

export async function getWorkspace(
  id: string,
): Promise<WorkspaceMeta | undefined> {
  const workspaces = await getWorkspaces();
  return workspaces.find((w) => w.id === id);
}

// Storage key helpers
export function getCanvasElementsKey(workspaceId: string): string {
  return `wisp-canvas-${workspaceId}`;
}

export function getCanvasAppStateKey(workspaceId: string): string {
  return `wisp-canvas-state-${workspaceId}`;
}

export function getNotesKey(workspaceId: string): string {
  return `wisp-notes-${workspaceId}`;
}

// Notes helpers
export function getNotesContent(workspaceId: string): string {
  return localStorage.getItem(getNotesKey(workspaceId)) || "";
}

export function saveNotesContent(
  workspaceId: string,
  content: string,
): void {
  localStorage.setItem(getNotesKey(workspaceId), content);
}

// Generate a summary from notes content (first ~100 chars of text)
export function generateNotesSummary(content: string): string {
  const text = content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~`>]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
  if (text.length <= 100) {
    return text;
  }
  return `${text.slice(0, 97)}...`;
}

// Migration from old board system
const MIGRATION_DONE_KEY = "wisp-migrated-from-boards";

export async function migrateFromBoards(): Promise<string | null> {
  try {
    if (localStorage.getItem(MIGRATION_DONE_KEY)) {
      return null;
    }

    // Check for existing workspaces
    const existing = await getWorkspaces();
    if (existing.length > 0) {
      localStorage.setItem(MIGRATION_DONE_KEY, "1");
      return null;
    }

    // Try to migrate from old board system
    const { getBoards, getBoardElementsKey, getBoardAppStateKey } = await import(
      "./boardManager"
    );
    const boards = await getBoards();

    if (boards.length === 0) {
      // Also check legacy excalidraw data
      const legacyElements = localStorage.getItem("excalidraw");
      const legacyState = localStorage.getItem("excalidraw-state");
      if (legacyElements || legacyState) {
        const ws = await createWorkspace("My First Workspace");
        if (legacyElements) {
          localStorage.setItem(getCanvasElementsKey(ws.id), legacyElements);
        }
        if (legacyState) {
          localStorage.setItem(getCanvasAppStateKey(ws.id), legacyState);
        }
        localStorage.setItem(MIGRATION_DONE_KEY, "1");
        return ws.id;
      }
      localStorage.setItem(MIGRATION_DONE_KEY, "1");
      return null;
    }

    // Migrate each board to a workspace
    for (const board of boards) {
      const ws: WorkspaceMeta = {
        id: board.id,
        name: board.name,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        thumbnail: board.thumbnail,
      };

      // Copy canvas data
      const elementsData = localStorage.getItem(getBoardElementsKey(board.id));
      const stateData = localStorage.getItem(getBoardAppStateKey(board.id));
      if (elementsData) {
        localStorage.setItem(getCanvasElementsKey(ws.id), elementsData);
      }
      if (stateData) {
        localStorage.setItem(getCanvasAppStateKey(ws.id), stateData);
      }

      const workspaces = await getWorkspaces();
      workspaces.push(ws);
      await saveWorkspaces(workspaces);
    }

    localStorage.setItem(MIGRATION_DONE_KEY, "1");
    return null;
  } catch (e) {
    console.error("Migration failed", e);
    return null;
  }
}
