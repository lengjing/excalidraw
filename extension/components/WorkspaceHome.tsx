import { useState, useEffect, useCallback } from "react";
import {
  getWorkspaces,
  createWorkspace,
  deleteWorkspace,
  updateWorkspace,
  migrateFromBoards,
} from "../workspaceManager";
import { navigateToWorkspace } from "../router";
import type { WorkspaceMeta } from "../workspaceManager";

import "./WorkspaceHome.css";

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

export function WorkspaceHome() {
  const [workspaces, setWorkspaces] = useState<WorkspaceMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const loadWorkspaces = useCallback(async () => {
    await migrateFromBoards();
    const list = await getWorkspaces();
    setWorkspaces(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const handleCreate = async () => {
    const ws = await createWorkspace();
    navigateToWorkspace(ws.id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this workspace?")) {
      await deleteWorkspace(id);
      await loadWorkspaces();
    }
  };

  const handleRenameStart = (e: React.MouseEvent, ws: WorkspaceMeta) => {
    e.stopPropagation();
    setRenamingId(ws.id);
    setRenameValue(ws.name);
  };

  const handleRenameConfirm = async () => {
    if (renamingId && renameValue.trim()) {
      await updateWorkspace(renamingId, { name: renameValue.trim() });
      setRenamingId(null);
      await loadWorkspaces();
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
      <div className="ws-home">
        <div className="ws-home__empty">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ws-home">
      <div className="ws-home__header">
        <div className="ws-home__brand">
          <h1 className="ws-home__title">Wisp</h1>
          <span className="ws-home__subtitle">Workspaces</span>
        </div>
      </div>
      <div className="ws-home__grid">
        {/* New workspace card */}
        <div className="ws-card ws-card--new" onClick={handleCreate}>
          <div className="ws-card__add-icon">+</div>
          <div className="ws-card__add-text">New Workspace</div>
        </div>

        {/* Existing workspaces */}
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className="ws-card"
            onClick={() => navigateToWorkspace(ws.id)}
          >
            <div className="ws-card__actions">
              <button
                className="ws-card__action-btn"
                onClick={(e) => handleRenameStart(e, ws)}
                title="Rename"
              >
                ✏️
              </button>
              <button
                className="ws-card__action-btn ws-card__action-btn--delete"
                onClick={(e) => handleDelete(e, ws.id)}
                title="Delete"
              >
                🗑️
              </button>
            </div>

            <div className="ws-card__thumbnail">
              {ws.thumbnail ? (
                <img src={ws.thumbnail} alt={ws.name} />
              ) : (
                <span className="ws-card__thumbnail-placeholder">🎨</span>
              )}
            </div>

            <div className="ws-card__info">
              {renamingId === ws.id ? (
                <input
                  className="ws-card__rename-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameConfirm}
                  onKeyDown={handleRenameKeyDown}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="ws-card__name">{ws.name}</span>
              )}
              <span className="ws-card__date">{formatDate(ws.updatedAt)}</span>
            </div>

            {ws.notesSummary && (
              <div className="ws-card__notes-summary">{ws.notesSummary}</div>
            )}
          </div>
        ))}
      </div>

      {workspaces.length === 0 && (
        <div className="ws-home__empty">
          <p>No workspaces yet</p>
          <p>Click &quot;New Workspace&quot; to get started!</p>
        </div>
      )}
    </div>
  );
}
