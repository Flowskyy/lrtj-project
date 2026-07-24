"use client";

import { useMemo, useRef, useEffect } from "react";
import { Plate, usePlateEditor, useEditorRef } from "platejs/react";
import { createPlateEditor } from "platejs";
import { serializeHtml } from "platejs/static";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
}

function ToolbarButtons() {
  const editor = useEditorRef();

  if (!editor) return null;

  const isBoldActive = editor.api.selection.hasMark('bold');
  const isItalicActive = editor.api.selection.hasMark('italic');
  const isBulletListActive = editor.api.block.isSelectionInBlock('ul');
  const isOrderedListActive = editor.api.block.isSelectionInBlock('ol');

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.tf.toggle.mark('bold')}
        className={isBoldActive ? "bg-gray-200" : ""}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.tf.toggle.mark('italic')}
        className={isItalicActive ? "bg-gray-200" : ""}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.tf.toggle.block({ type: 'ul' })}
        className={isBulletListActive ? "bg-gray-200" : ""}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.tf.toggle.block({ type: 'ol' })}
        className={isOrderedListActive ? "bg-gray-200" : ""}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </>
  );
}

export default function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
  const isInternalUpdate = useRef(false);

  // Deserialize HTML to Plate format for initial value
  const initialValue = useMemo(() => {
    if (!value) return [{ type: "p", children: [{ text: "" }] }];
    
    try {
      const tmpEditor = createPlateEditor({ plugins: BasicNodesKit });
      const deserialized = tmpEditor.api.html.deserialize({ element: value });
      return deserialized;
    } catch (error) {
      console.error("Failed to deserialize HTML:", error);
      return [{ type: "p", children: [{ text: value || "" }] }];
    }
  }, [value]);

  const editor = usePlateEditor({
    plugins: BasicNodesKit,
    value: initialValue,
  });

  // Handle changes and serialize to HTML
  useEffect(() => {
    if (!editor || isInternalUpdate.current) return;

    const handleChange = async () => {
      try {
        const html = await serializeHtml(editor);
        isInternalUpdate.current = true;
        onChange(html);
        setTimeout(() => {
          isInternalUpdate.current = false;
        }, 0);
      } catch (error) {
        console.error("Failed to serialize HTML:", error);
      }
    };

    editor.on("change", handleChange);
    return () => editor.off("change", handleChange);
  }, [editor, onChange]);

  if (!editor) {
    return null;
  }

  return (
    <div>
      {label && (
        <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
          {label}
        </label>
      )}
      <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#E5262C] focus-within:ring-2 focus-within:ring-[#E5262C]/20 transition-all">
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          <Plate editor={editor}>
            <ToolbarButtons />
          </Plate>
        </div>
        <Plate editor={editor}>
          <EditorContainer className="min-h-[100px]">
            <Editor
              placeholder="Type your content here..."
              className="prose prose-sm max-w-none focus:outline-none px-3 py-2 text-sm text-gray-900"
            />
          </EditorContainer>
        </Plate>
      </div>
    </div>
  );
}
