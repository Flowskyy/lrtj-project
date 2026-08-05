"use client";

import { Plate } from "platejs/react";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { FixedToolbar } from "@/components/ui/fixed-toolbar";
import { RichTextEditorToolbar } from "@/components/NewsEditorToolbar";

interface RichTextEditorProps {
  editor: any;
  onChange: () => void;
  placeholder: string;
  disableTable?: boolean;
}

export default function RichTextEditor({ editor, onChange, placeholder, disableTable = false }: RichTextEditorProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden relative">
      <Plate editor={editor} onChange={onChange}>
        <FixedToolbar className="top-0 bg-gray-50 border-b border-gray-200 sticky z-50">
          <RichTextEditorToolbar disableTable={disableTable} />
        </FixedToolbar>
        <EditorContainer className="min-h-[300px] bg-white max-h-[500px]">
          <Editor placeholder={placeholder} />
        </EditorContainer>
      </Plate>
    </div>
  );
}
