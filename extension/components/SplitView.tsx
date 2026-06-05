// SplitView.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./SplitView.css";

interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
}

export function SplitView({
  left,
  right,
  defaultLeftPercent = 65,
  minLeftPercent = 20,
  maxLeftPercent = 80,
}: SplitViewProps) {
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize"; // 拖拽时全局锁死鼠标样式
    document.body.style.userSelect = "none";   // 防止拖拽时误选中文本
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - containerRect.left;

    // 计算当前鼠标位置占容器总宽度的百分比
    let newPercent = (currentX / containerRect.width) * 100;

    // 边界限制，防止某一边被挤到彻底消失
    if (newPercent < minLeftPercent) newPercent = minLeftPercent;
    if (newPercent > maxLeftPercent) newPercent = maxLeftPercent;

    setLeftPercent(newPercent);
  }, [minLeftPercent, maxLeftPercent]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, []);

  // 全局监听 mousemove 和 mouseup，确保鼠标离开分割线也能持续拖拽
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className="split-view-container" ref={containerRef}>
      {/* 左侧面板 */}
      <div className="split-view__pane-left" style={{ width: `${leftPercent}%` }}>
        {left}
      </div>

      {/* 拖拽分割线 */}
      <div className="split-view__resizer" onMouseDown={handleMouseDown} />

      {/* 右侧面板 */}
      <div className="split-view__pane-right" style={{ width: `${100 - leftPercent}%` }}>
        {right}
      </div>
    </div>
  );
}
