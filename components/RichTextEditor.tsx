"use client";

import { Plate } from "platejs/react";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { FixedToolbar } from "@/components/ui/fixed-toolbar";
import { RichTextEditorToolbar } from "@/components/NewsEditorToolbar";

interface RichTextEditorProps {
  editor: any;
  onChange: () => void;
  placeholder: string;
}

export default function RichTextEditor({ editor, onChange, placeholder }: RichTextEditorProps) {
  // Simple editor without HTML serialization - that's handled by the parent component
  return (
    <div className="border border-gray-300 rounded-lg">
      <Plate editor={editor} onChange={onChange}>
        <FixedToolbar className="top-[56px]">
          <RichTextEditorToolbar />
        </FixedToolbar>
        <EditorContainer className="min-h-[300px]">
          <Editor placeholder={placeholder} />
        </EditorContainer>
      </Plate>
    </div>
  );
}
