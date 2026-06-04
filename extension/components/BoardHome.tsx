import { useState, useEffect, useCallback } from "react";
import {
  getBoards,
  createBoard,
  deleteBoard,
  updateBoard,
  migrateExistingData,
} from "../boardManager";
import { navigateToBoard } from "../router";
import type { BoardMeta } from "../boardManager";

import "./BoardHome.css";

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;

  if (diff < 60 * 1000) {
    return "Just now";
  }
  if (diff < 3600 * 1000) {
    return `${Math.floor(diff / 60000)} min ago`;
  }
  if (diff < 86400 * 1000) {
    return `${Math.floor(diff / 3600000)} hr ago`;
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BoardHome() {
  const [boards, setBoards] = useState<BoardMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const loadBoards = useCallback(async () => {
    // Run migration on first load
    await migrateExistingData();
    const list = await getBoards();
    setBoards(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const handleCreate = async () => {
    const board = await createBoard();
    navigateToBoard(board.id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this board?")) {
      await deleteBoard(id);
      await loadBoards();
    }
  };

  const handleRenameStart = (e: React.MouseEvent, board: BoardMeta) => {
    e.stopPropagation();
    setRenamingId(board.id);
    setRenameValue(board.name);
  };

  const handleRenameConfirm = async () => {
    if (renamingId && renameValue.trim()) {
      await updateBoard(renamingId, { name: renameValue.trim() });
      setRenamingId(null);
      await loadBoards();
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameConfirm();
    } else if (e.key === "Escape") {
      setRenamingId(null);
    }
  };

  if (loading) {
    return (
      <div className="board-home">
        <div className="board-home__empty">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="board-home">
      <div className="board-home__header">
        <h1 className="board-home__title">My Boards</h1>
      </div>
      <div className="board-home__grid">
        {/* New board card */}
        <div className="board-card board-card--new" onClick={handleCreate}>
          <div className="board-card__add-icon">+</div>
          <div className="board-card__add-text">Create New Board</div>
        </div>

        {/* Existing boards */}
        {boards.map((board) => (
          <div
            key={board.id}
            className="board-card"
            onClick={() => navigateToBoard(board.id)}
          >
            <div className="board-card__actions">
              <button
                className="board-card__action-btn"
                onClick={(e) => handleRenameStart(e, board)}
                title="Rename"
              >
                ✏️
              </button>
              <button
                className="board-card__action-btn board-card__action-btn--delete"
                onClick={(e) => handleDelete(e, board.id)}
                title="Delete"
              >
                🗑️
              </button>
            </div>

            <div className="board-card__thumbnail">
              {board.thumbnail ? (
                <img src={board.thumbnail} alt={board.name} />
              ) : (
                <span className="board-card__thumbnail-placeholder">🎨</span>
              )}
            </div>

            <div className="board-card__info">
              {renamingId === board.id ? (
                <input
                  className="board-card__rename-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameConfirm}
                  onKeyDown={handleRenameKeyDown}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="board-card__name">{board.name}</span>
              )}
              <span className="board-card__date">
                {formatDate(board.updatedAt)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {boards.length === 0 && (
        <div className="board-home__empty">
          <p>No boards yet</p>
          <p>Click the + card above to create your first board!</p>
        </div>
      )}
    </div>
  );
}
