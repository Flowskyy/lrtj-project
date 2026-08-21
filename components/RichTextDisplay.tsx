"use client";

import { usePlateEditor } from "platejs/react";
import { type Value } from "platejs";
import { NewsEditorKit } from "@/components/editor/plugins/news-editor-kit";
import { Plate } from "platejs/react";
import { EditorContainer, Editor } from "@/components/ui/editor";
import { cn } from "@/lib/utils";

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export default function RichTextDisplay({ content, className }: RichTextDisplayProps) {
  const editor = usePlateEditor({
    plugins: NewsEditorKit,
    value: (editor) => {
      if (!content) {
        return [{ type: 'p', children: [{ text: '' }] }] as Value;
      }
      
      try {
        // Pre-process HTML to strip non-content tags and extract body content
        // This handles legacy full HTML documents with <style>, <script>, <head>, etc.
        let cleanHtml = content;
        
        // Use DOMParser to safely extract and clean HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        // If the HTML contains a body tag, extract only body content
        // This handles full HTML documents stored in the database
        if (content.includes('<body>') || content.includes('<html>')) {
          cleanHtml = doc.body.innerHTML;
        } else {
          // For fragment HTML, still strip style/script tags from the parsed document
          cleanHtml = doc.body.innerHTML;
        }
        
        // Remove <style> and <script> tags and their content
        cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        cleanHtml = cleanHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        // Remove <head>, <meta>, <link> tags (self-closing and with content)
        cleanHtml = cleanHtml.replace(/<head\b[^>]*>.*?<\/head>/gi, '');
        cleanHtml = cleanHtml.replace(/<meta\b[^>]*>/gi, '');
        cleanHtml = cleanHtml.replace(/<link\b[^>]*>/gi, '');
        
        // Remove Word/Office-specific attributes (simple approach)
        cleanHtml = cleanHtml.replace(/data-ccp-props="[^"]*"/gi, '');
        cleanHtml = cleanHtml.replace(/data-contrast="[^"]*"/gi, '');
        
        // Pass cleaned HTML string to Plate.js deserializer
        const deserializedValue = editor.api.html.deserialize({
          element: cleanHtml,
          collapseWhiteSpace: false,
        }) as Value;

        // Normalize: wrap any bare text/leaf nodes at top level in paragraph elements
        const normalizedValue = deserializedValue.map((node) => {
          if (node && typeof node === 'object' && !('children' in node)) {
            // This is a bare text/leaf node, wrap it in a paragraph
            return { type: 'p', children: [node] };
          }
          return node;
        });

        // Fallback for empty or invalid structure
        if (!normalizedValue || normalizedValue.length === 0) {
          return [{ type: 'p', children: [{ text: '' }] }] as Value;
        }

        return normalizedValue as Value;
      } catch (err) {
        console.error("Failed to deserialize HTML value:", err);
        // Fallback to empty paragraph on error
        return [{ type: 'p', children: [{ text: '' }] }] as Value;
      }
    },
  });

  // Helper to check if HTML content is actually empty
  const isHtmlContentEmpty = (html: string): boolean => {
    if (!html) return true;
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text === '' || text === '-';
  };

  // If content is empty, show a placeholder
  if (isHtmlContentEmpty(content)) {
    return (
      <div className={cn("text-gray-400 text-sm", className)}>
        No content
      </div>
    );
  }

  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <Plate editor={editor}>
        <EditorContainer variant="comment" className="min-h-0 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <Editor disabled variant="comment" className="p-0" />
        </EditorContainer>
      </Plate>
    </div>
  );
}
