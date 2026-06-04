/**
 * Board Manager - handles CRUD operations for multiple boards.
 * Each board has its own isolated storage for elements, appState, and files.
 */

import { createStore, get, set, del } from "idb-keyval";

export interface BoardMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

const BOARDS_DB = "excalidraw-boards-db";
const BOARDS_STORE = "excalidraw-boards-store";
const BOARDS_LIST_KEY = "boards-list";

const boardsStore = createStore(BOARDS_DB, BOARDS_STORE);

function generateId(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function getBoards(): Promise<BoardMeta[]> {
  const boards = await get<BoardMeta[]>(BOARDS_LIST_KEY, boardsStore);
  return boards || [];
}

export async function saveBoards(boards: BoardMeta[]): Promise<void> {
  await set(BOARDS_LIST_KEY, boards, boardsStore);
}

export async function createBoard(name?: string): Promise<BoardMeta> {
  const boards = await getBoards();
  const board: BoardMeta = {
    id: generateId(),
    name: name || `Board ${boards.length + 1}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  boards.unshift(board);
  await saveBoards(boards);
  return board;
}

export async function updateBoard(
  id: string,
  updates: Partial<Pick<BoardMeta, "name" | "thumbnail" | "updatedAt">>,
): Promise<void> {
  const boards = await getBoards();
  const idx = boards.findIndex((b) => b.id === id);
  if (idx !== -1) {
    boards[idx] = { ...boards[idx], ...updates, updatedAt: Date.now() };
    await saveBoards(boards);
  }
}

export async function deleteBoard(id: string): Promise<void> {
  const boards = await getBoards();
  const filtered = boards.filter((b) => b.id !== id);
  await saveBoards(filtered);

  // Clean up board's localStorage data
  const elementsKey = getBoardElementsKey(id);
  const appStateKey = getBoardAppStateKey(id);
  try {
    localStorage.removeItem(elementsKey);
    localStorage.removeItem(appStateKey);
  } catch (e) {
    console.error("Failed to clean board storage", e);
  }
}

export async function getBoard(id: string): Promise<BoardMeta | undefined> {
  const boards = await getBoards();
  return boards.find((b) => b.id === id);
}

// Storage key helpers - each board uses prefixed keys
export function getBoardElementsKey(boardId: string): string {
  return `excalidraw-board-${boardId}`;
}

export function getBoardAppStateKey(boardId: string): string {
  return `excalidraw-board-state-${boardId}`;
}

// Migration: check if there's existing data without a board, and migrate it
const MIGRATION_DONE_KEY = "excalidraw-boards-migrated";

export async function migrateExistingData(): Promise<string | null> {
  try {
    if (localStorage.getItem(MIGRATION_DONE_KEY)) {
      return null;
    }

    const existingElements = localStorage.getItem("excalidraw");
    const existingState = localStorage.getItem("excalidraw-state");

    if (!existingElements && !existingState) {
      localStorage.setItem(MIGRATION_DONE_KEY, "1");
      return null;
    }

    // Check if boards already exist
    const boards = await getBoards();
    if (boards.length > 0) {
      localStorage.setItem(MIGRATION_DONE_KEY, "1");
      return null;
    }

    // Create a default board and migrate existing data
    const board = await createBoard("My First Board");

    if (existingElements) {
      localStorage.setItem(getBoardElementsKey(board.id), existingElements);
    }
    if (existingState) {
      localStorage.setItem(getBoardAppStateKey(board.id), existingState);
    }

    localStorage.setItem(MIGRATION_DONE_KEY, "1");
    return board.id;
  } catch (e) {
    console.error("Migration failed", e);
    return null;
  }
}
