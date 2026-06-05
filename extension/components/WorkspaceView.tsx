/**
 * WorkspaceView - Container for workspace with Canvas and Notes tabs.
 */

import { useEffect, useState } from "react";
import { updateWorkspace } from "../workspaceManager";
import { navigateToHome, navigateToWorkspace } from "../router";
import type { WorkspaceTab } from "../router";
import {
  configureBoardStorage,
  resetStorageKeys,
} from "../../excalidraw-app/app_constants";
import { NotesEditor } from "./NotesEditor";

import "./WorkspaceView.css";

interface WorkspaceViewProps {
  workspaceId: string;
  activeTab: WorkspaceTab;
}

export function WorkspaceView({ workspaceId, activeTab }: WorkspaceViewProps) {
  const [ExcalidrawApp, setExcalidrawApp] =
    useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Override storage keys to point to this workspace's canvas data
    configureBoardStorage(workspaceId);

    // Dynamically import to ensure storage keys are set before App initializes
    import("../../excalidraw-app/App").then((mod) => {
      setExcalidrawApp(() => mod.default);
    });

    return () => {
      updateWorkspace(workspaceId, {});
      resetStorageKeys();
    };
  }, [workspaceId]);

  const handleTabSwitch = (tab: WorkspaceTab) => {
    navigateToWorkspace(workspaceId, tab);
  };

  return (
    <div className="workspace-view">
      <div className="workspace-view__nav">
        <button
          className="workspace-view__back"
          onClick={navigateToHome}
          title="Back to workspaces"
        >
          ← Wisp
        </button>

        <div className="workspace-view__tabs">
          <button
            className={`workspace-view__tab ${activeTab === "canvas" ? "workspace-view__tab--active" : ""}`}
            onClick={() => handleTabSwitch("canvas")}
          >
            🎨 Canvas
          </button>
          <button
            className={`workspace-view__tab ${activeTab === "notes" ? "workspace-view__tab--active" : ""}`}
            onClick={() => handleTabSwitch("notes")}
          >
            📝 Notes
          </button>
        </div>
      </div>

      <div className="workspace-view__content">
        {activeTab === "canvas" && ExcalidrawApp && (
          <div className="workspace-view__canvas">
            <ExcalidrawApp />
          </div>
        )}
        {activeTab === "canvas" && !ExcalidrawApp && (
          <div className="workspace-view__loading">Loading canvas...</div>
        )}
        {activeTab === "notes" && (
          <div className="workspace-view__notes">
            <NotesEditor workspaceId={workspaceId} />
          </div>
        )}
      </div>
    </div>
  );
}
