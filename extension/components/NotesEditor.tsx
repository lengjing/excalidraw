/**
 * NotesEditor - A simple Markdown editor for workspace notes.
 * Features:
 * - Split view: editor on left, preview on right
 * - Auto-save to localStorage
 * - Basic markdown rendering
 */

import { useState, useEffect, useCallback, useRef } from "react";
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

// Simple markdown to HTML converter for preview
function markdownToHtml(md: string): string {
  let html = md;

  // Escape HTML
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>',
  );

  // Unordered lists
  html = html.replace(/^\*\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/^-\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/((<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Blockquotes
  html = html.replace(/^&gt;\s+(.+)$/gm, "<blockquote>$1</blockquote>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr>");

  // Paragraphs (double newlines)
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");
  html = html.replace(/<p>(<h[1-6]>)/g, "$1");
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
  html = html.replace(/<p>(<ul>)/g, "$1");
  html = html.replace(/(<\/ul>)<\/p>/g, "$1");
  html = html.replace(/<p>(<blockquote>)/g, "$1");
  html = html.replace(/(<\/blockquote>)<\/p>/g, "$1");
  html = html.replace(/<p>(<hr>)<\/p>/g, "$1");

  // Line breaks within paragraphs
  html = html.replace(/\n/g, "<br>");

  return html;
}

export function NotesEditor({ workspaceId }: NotesEditorProps) {
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = getNotesContent(workspaceId);
    setContent(saved);
  }, [workspaceId]);

  const handleSave = useCallback(
    (text: string) => {
      saveNotesContent(workspaceId, text);
      const summary = generateNotesSummary(text);
      updateWorkspace(workspaceId, { notesSummary: summary });
    },
    [workspaceId],
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Debounced auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(newContent);
    }, 500);
  };

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="notes-editor">
      <div className="notes-editor__toolbar">
        <span className="notes-editor__title">Notes</span>
        <button
          className={`notes-editor__toggle ${showPreview ? "notes-editor__toggle--active" : ""}`}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      <div
        className={`notes-editor__body ${showPreview ? "notes-editor__body--split" : ""}`}
      >
        <div className="notes-editor__editor-pane">
          <textarea
            className="notes-editor__textarea"
            value={content}
            onChange={handleChange}
            placeholder="Start writing your notes in Markdown..."
            spellCheck
          />
        </div>

        {showPreview && (
          <div className="notes-editor__preview-pane">
            <div
              className="notes-editor__preview-content"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
