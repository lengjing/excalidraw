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
import { SplitView } from "./SplitView";

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

// 💡 定义布局模式类型
type LayoutMode = "split" | "canvas-only" | "notes-only";

export function WorkspaceView({ workspaceId }: WorkspaceViewProps) {
  const [ExcalidrawApp, setExcalidrawApp] =
    useState<React.ComponentType | null>(null);
  const thumbnailTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 💡 核心状态：管理当前布局
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("split");

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
    // 💡 动态注入布局类名：workspace-view--split / --canvas-only / --notes-only
    <div className={`workspace-view workspace-view--${layoutMode}`}>
      <div className="workspace-view__nav">
        <button
          className="workspace-view__back"
          onClick={navigateToHome}
          title="Back to workspaces"
        >
          ← Wisp
        </button>

        {/* 💡 视图切换控制组 */}
        <div className="workspace-view__layout-switch">
          <button
            className={`layout-btn ${layoutMode === "canvas-only" ? "active" : ""}`}
            onClick={() => setLayoutMode("canvas-only")}
            title="纯画板"
          >
            🎨 仅画布
          </button>
          <button
            className={`layout-btn ${layoutMode === "split" ? "active" : ""}`}
            onClick={() => setLayoutMode("split")}
            title="双栏并排"
          >
             Divided 左右分栏
          </button>
          <button
            className={`layout-btn ${layoutMode === "notes-only" ? "active" : ""}`}
            onClick={() => setLayoutMode("notes-only")}
            title="纯笔记"
          >
            📝 仅笔记
          </button>
        </div>
      </div>

      <div className="workspace-view__body">
        {/* 💡 关键改动：根据不同的 layoutMode 渲染不同的内容 */}
        {layoutMode === "split" ? (
          <SplitView
            left={
              <div className="workspace-view__canvas-pane" style={{ width: '100%' }}>
                {ExcalidrawApp ? <ExcalidrawApp /> : <div className="workspace-view__loading">Loading canvas…</div>}
              </div>
            }
            right={
              <div className="workspace-view__notes-pane" style={{ width: '100%', minWidth: 'unset' }}>
                <NotesEditor workspaceId={workspaceId} />
              </div>
            }
          />
        ) : (
          <>
            {/* 非分栏模式下，原本的独立满铺逻辑保持不变 */}
            {layoutMode !== "notes-only" && (
              <div className="workspace-view__canvas-pane">
                {ExcalidrawApp ? <ExcalidrawApp /> : <div className="workspace-view__loading">Loading canvas…</div>}
              </div>
            )}
            {layoutMode !== "canvas-only" && (
              <div className="workspace-view__notes-pane">
                <NotesEditor workspaceId={workspaceId} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
