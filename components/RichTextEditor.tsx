"use client";

import { useEffect } from "react";
import { Plate } from "platejs/react";
import { serializeHtml } from "platejs/static";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { FixedToolbar } from "@/components/ui/fixed-toolbar";
import { NewsEditorToolbar } from "@/components/NewsEditorToolbar";

interface RichTextEditorProps {
  editor: any;
  onChange: () => void;
  onContentChange?: (html: string) => void;
  placeholder: string;
}

// Internal component that runs inside Plate context to safely serialize HTML
function PlateContentSerializer({ editor, onContentChange }: { editor: any; onContentChange?: (html: string) => void }) {
  useEffect(() => {
    const serialize = async () => {
      if (onContentChange) {
        const html = await serializeHtml(editor);
        onContentChange(html || '<p>-</p>');
      }
    };
    serialize();
  }, [editor, onContentChange]);

  return null;
}

export default function RichTextEditor({ editor, onChange, onContentChange, placeholder }: RichTextEditorProps) {
  return (
    <div className="border border-gray-300 rounded-lg">
      <Plate editor={editor} onChange={onChange}>
        <FixedToolbar className="top-[56px]">
          <NewsEditorToolbar />
        </FixedToolbar>
        <EditorContainer className="min-h-[300px]">
          <Editor placeholder={placeholder} />
        </EditorContainer>
        <PlateContentSerializer editor={editor} onContentChange={onContentChange} />
      </Plate>
    </div>
  );
}
