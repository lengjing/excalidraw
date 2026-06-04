/**
 * BoardView - Wraps ExcalidrawApp for a specific board.
 * Sets up board-specific storage keys before rendering.
 */

import { useEffect, useState } from "react";
import { updateBoard } from "../boardManager";
import { navigateToHome } from "../router";
import {
  configureBoardStorage,
  resetStorageKeys,
} from "../../excalidraw-app/app_constants";

interface BoardViewProps {
  boardId: string;
}

export function BoardView({ boardId }: BoardViewProps) {
  const [ExcalidrawApp, setExcalidrawApp] =
    useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Override storage keys to point to this board's data
    configureBoardStorage(boardId);

    // Dynamically import to ensure storage keys are set before App initializes
    import("../../excalidraw-app/App").then((mod) => {
      setExcalidrawApp(() => mod.default);
    });

    return () => {
      // Update the board's updatedAt timestamp when leaving
      updateBoard(boardId, {});
      resetStorageKeys();
    };
  }, [boardId]);

  if (!ExcalidrawApp) {
    return null;
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <button
        onClick={navigateToHome}
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 99999,
          background: "rgba(105, 101, 219, 0.9)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px 16px",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
        title="Back to boards"
      >
        ← Boards
      </button>
      <ExcalidrawApp />
    </div>
  );
}
