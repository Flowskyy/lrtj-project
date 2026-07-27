"use client";

import { Plate } from "platejs/react";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { FixedToolbar } from "@/components/ui/fixed-toolbar";
import { NewsEditorToolbar } from "@/components/NewsEditorToolbar";

interface RichTextEditorProps {
  editor: any;
  onChange: () => void;
  placeholder: string;
}

export default function RichTextEditor({ editor, onChange, placeholder }: RichTextEditorProps) {
  return (
    <div className="border border-gray-300 rounded-lg">
      <Plate editor={editor} onChange={onChange}>
        <FixedToolbar className="top-[56px]">
          <NewsEditorToolbar />
        </FixedToolbar>
        <EditorContainer className="min-h-[300px]">
          <Editor placeholder={placeholder} />
        </EditorContainer>
      </Plate>
    </div>
  );
}
