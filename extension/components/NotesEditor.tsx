/**
 * NotesEditor - Rich text editor powered by Tiptap.
 * Supports headings, bold/italic, bullet/ordered lists, code blocks,
 * blockquotes, and full undo/redo — all via standard keyboard shortcuts.
 */

import { useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
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
    ],
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

  return (
    <div className="notes-editor">
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

