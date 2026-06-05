/**
 * NotesEditor - Rich text editor powered by Tiptap.
 * Supports headings, bold/italic, bullet/ordered lists, code blocks,
 * blockquotes, and full undo/redo — all via standard keyboard shortcuts.
 */

import { useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
// 💡 导入 Image 扩展
import Image from "@tiptap/extension-image";
import {
  getNotesContent,
  saveNotesContent,
  generateNotesSummary,
  updateWorkspace,
} from "../workspaceManager";

import "./NotesEditor.css";

interface NotesEditorProps {
  workspaceId: string;
}

const NOTES_PLACEHOLDER = "Start writing…";

export function NotesEditor({ workspaceId }: NotesEditorProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track workspaceId in a ref so the onUpdate closure always sees the latest value
  const workspaceIdRef = useRef(workspaceId);

  useEffect(() => {
    workspaceIdRef.current = workspaceId;
  }, [workspaceId]);

  const flushSave = useCallback((html: string, wsId: string) => {
    saveNotesContent(wsId, html);
    updateWorkspace(wsId, { notesSummary: generateNotesSummary(html) });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: NOTES_PLACEHOLDER }),
      Image.configure({
        allowBase64: true, // 允许使用 base64 格式的图片
      }),
    ],
    // 💡 核心配置：拦截粘贴和拖拽事件
    editorProps: {
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith("image/"));

        if (imageItem) {
          event.preventDefault(); // 阻止浏览器默认粘贴行为
          const file = imageItem.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64Src = e.target?.result as string;
              // 将图片插入到 Tiptap 编辑器中
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src: base64Src })
                )
              );
            };
            reader.readAsDataURL(file);
          }
          return true; // 表示事件已处理
        }
        return false;
      },
      handleDrop: (view, event, moved, slice) => {
        if (!moved && event.dataTransfer?.files.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64Src = e.target?.result as string;
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src: base64Src })
                )
              );
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
    content: getNotesContent(workspaceId) || "",
    onUpdate({ editor: ed }) {
      const html = ed.getHTML();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(
        () => flushSave(html, workspaceIdRef.current),
        500,
      );
    },
  });

  // Reload content when the workspace changes
  useEffect(() => {
    if (!editor) {
      return;
    }
    const content = getNotesContent(workspaceId) || "";
    // false = don't emit an update event, so we don't trigger an unnecessary save
    editor.commands.setContent(content, false);
  }, [editor, workspaceId]);

  // Flush any pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (editor) {
        flushSave(editor.getHTML(), workspaceIdRef.current);
      }
    };
  }, [editor, flushSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="notes-editor" onKeyDown={handleKeyDown}>
      <div className="notes-editor__header">
        <span className="notes-editor__label">Notes</span>
        <span className="notes-editor__hint">
          <kbd>Ctrl+B</kbd> bold · <kbd>Ctrl+I</kbd> italic ·{" "}
          <kbd>Ctrl+Z</kbd> undo
        </span>
      </div>
      <EditorContent editor={editor} className="notes-editor__content" />
    </div>
  );
}

