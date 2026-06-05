/**
 * NotesEditor - Markdown editor with smart keyboard shortcuts.
 * No separate preview pane; uses in-editor shortcuts instead:
 *  - Enter  → continues list prefix (-, *, N.)
 *  - Backspace on empty list line → removes the prefix
 *  - Tab    → inserts 2 spaces
 */

import { useEffect, useCallback, useRef } from "react";
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

/** Returns the line the cursor is on and the cursor offset within that line. */
function getLineInfo(
  text: string,
  selStart: number,
): { lineStart: number; lineText: string; offsetInLine: number } {
  const lineStart = text.lastIndexOf("\n", selStart - 1) + 1;
  const lineEnd = text.indexOf("\n", selStart);
  const lineText = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  return { lineStart, lineText, offsetInLine: selStart - lineStart };
}

/** Detect list prefix on a line. Returns the prefix string or null. */
function detectListPrefix(lineText: string): string | null {
  const bullet = lineText.match(/^(\s*[-*]\s)/);
  if (bullet) {
    return bullet[1];
  }
  const ordered = lineText.match(/^(\s*\d+\.\s)/);
  if (ordered) {
    return ordered[1];
  }
  return null;
}

/** Increment the numeric part of an ordered list prefix, e.g. "1. " → "2. " */
function nextOrderedPrefix(prefix: string): string {
  return prefix.replace(/(\d+)/, (_, n) => String(Number(n) + 1));
}

const NOTES_PLACEHOLDER = `# Title

Start writing…

- Use - for bullet lists
- **bold** and *italic* work too`;

export function NotesEditor({ workspaceId }: NotesEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref for the current content so the unmount handler can flush it
  const contentRef = useRef<string>("");

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    const saved = getNotesContent(workspaceId);
    el.value = saved;
    contentRef.current = saved;
  }, [workspaceId]);

  const flushSave = useCallback(
    (text: string) => {
      saveNotesContent(workspaceId, text);
      updateWorkspace(workspaceId, {
        notesSummary: generateNotesSummary(text),
      });
    },
    [workspaceId],
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    contentRef.current = newContent;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => flushSave(newContent), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const { value, selectionStart, selectionEnd } = el;

    // Tab → insert 2 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const before = value.slice(0, selectionStart);
      const after = value.slice(selectionEnd);
      const next = `${before}  ${after}`;
      el.value = next;
      el.selectionStart = el.selectionEnd = selectionStart + 2;
      contentRef.current = next;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => flushSave(next), 500);
      return;
    }

    // Enter → continue list prefix if on a list line
    if (e.key === "Enter") {
      const { lineStart, lineText } = getLineInfo(value, selectionStart);
      const prefix = detectListPrefix(lineText);
      if (!prefix) {
        return; // default Enter
      }

      // If the line contains ONLY the prefix (empty list item) → exit list
      if (lineText.trimEnd() === prefix.trimEnd()) {
        e.preventDefault();
        // Remove the prefix from this line and insert a plain newline
        const before = value.slice(0, lineStart);
        const after = value.slice(lineStart + lineText.length);
        const next = `${before}\n${after}`;
        el.value = next;
        el.selectionStart = el.selectionEnd = lineStart + 1;
        contentRef.current = next;
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => flushSave(next), 500);
        return;
      }

      // Otherwise insert new line with same (or incremented) prefix
      e.preventDefault();
      const nextPrefix = detectListPrefix(lineText)?.match(/^\s*\d+/)
        ? nextOrderedPrefix(prefix)
        : prefix;
      const before = value.slice(0, selectionStart);
      const after = value.slice(selectionEnd);
      const next = `${before}\n${nextPrefix}${after}`;
      el.value = next;
      el.selectionStart = el.selectionEnd =
        selectionStart + 1 + nextPrefix.length;
      contentRef.current = next;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => flushSave(next), 500);
      return;
    }

    // Backspace at start of list line → remove prefix
    if (e.key === "Backspace") {
      const { lineStart, lineText, offsetInLine } = getLineInfo(
        value,
        selectionStart,
      );
      if (selectionStart !== selectionEnd) {
        return; // let default handle selection deletion
      }
      const prefix = detectListPrefix(lineText);
      if (prefix && offsetInLine === prefix.length) {
        e.preventDefault();
        const before = value.slice(0, lineStart);
        const after = value.slice(lineStart + prefix.length);
        const next = `${before}${after}`;
        el.value = next;
        el.selectionStart = el.selectionEnd = lineStart;
        contentRef.current = next;
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => flushSave(next), 500);
      }
    }
  };

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      flushSave(contentRef.current);
    };
  }, [flushSave]);

  return (
    <div className="notes-editor">
      <div className="notes-editor__header">
        <span className="notes-editor__label">Notes</span>
        <span className="notes-editor__hint">
          Markdown · <kbd>-</kbd> list · <kbd>#</kbd> heading · <kbd>Tab</kbd>{" "}
          indent
        </span>
      </div>
      <textarea
        ref={textareaRef}
        className="notes-editor__textarea"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={NOTES_PLACEHOLDER}
        spellCheck
      />
    </div>
  );
}

