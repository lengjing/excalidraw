/**
 * WorkspaceView - Side-by-side Canvas (65%) + Notes (35%) layout.
 * Also captures a canvas thumbnail periodically and saves it.
 */

import { useEffect, useRef, useState } from "react";
import { updateWorkspace } from "../workspaceManager";
import { navigateToHome } from "../router";
import {
  configureBoardStorage,
  resetStorageKeys,
} from "../../excalidraw-app/app_constants";
import { NotesEditor } from "./NotesEditor";

import "./WorkspaceView.css";

interface WorkspaceViewProps {
  workspaceId: string;
  // activeTab kept in signature for router compat, not used in split layout
  activeTab?: string;
}

/** Capture the Excalidraw canvas element as a JPEG data-URL thumbnail. */
function captureCanvasThumbnail(): string | null {
  const canvas = document.querySelector<HTMLCanvasElement>(
    "canvas.excalidraw__canvas",
  );
  if (!canvas) {
    return null;
  }
  try {
    // Shrink to thumbnail size
    const thumbW = 400;
    const thumbH = Math.round((thumbW * canvas.height) / canvas.width) || 240;
    const thumb = document.createElement("canvas");
    thumb.width = thumbW;
    thumb.height = thumbH;
    const ctx = thumb.getContext("2d");
    if (!ctx) {
      return null;
    }
    ctx.drawImage(canvas, 0, 0, thumbW, thumbH);
    return thumb.toDataURL("image/jpeg", 0.6);
  } catch {
    return null;
  }
}

export function WorkspaceView({ workspaceId }: WorkspaceViewProps) {
  const [ExcalidrawApp, setExcalidrawApp] =
    useState<React.ComponentType | null>(null);
  const thumbnailTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    configureBoardStorage(workspaceId);

    import("../../excalidraw-app/App").then((mod) => {
      setExcalidrawApp(() => mod.default);
    });

    return () => {
      updateWorkspace(workspaceId, {});
      resetStorageKeys();
      if (thumbnailTimerRef.current) {
        clearInterval(thumbnailTimerRef.current);
      }
    };
  }, [workspaceId]);

  // Once ExcalidrawApp is loaded, start thumbnail capture on an interval
  useEffect(() => {
    if (!ExcalidrawApp) {
      return;
    }

    // Delay first capture to let Excalidraw render
    const firstCapture = setTimeout(() => {
      const thumb = captureCanvasThumbnail();
      if (thumb) {
        updateWorkspace(workspaceId, { thumbnail: thumb });
      }
    }, 2000);

    thumbnailTimerRef.current = setInterval(() => {
      const thumb = captureCanvasThumbnail();
      if (thumb) {
        updateWorkspace(workspaceId, { thumbnail: thumb });
      }
    }, 10_000);

    return () => {
      clearTimeout(firstCapture);
      if (thumbnailTimerRef.current) {
        clearInterval(thumbnailTimerRef.current);
        thumbnailTimerRef.current = null;
      }
    };
  }, [ExcalidrawApp, workspaceId]);

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
      </div>

      <div className="workspace-view__body">
        <div className="workspace-view__canvas-pane">
          {ExcalidrawApp ? (
            <ExcalidrawApp />
          ) : (
            <div className="workspace-view__loading">Loading canvas…</div>
          )}
        </div>

        <div className="workspace-view__notes-pane">
          <NotesEditor workspaceId={workspaceId} />
        </div>
      </div>
    </div>
  );
}

