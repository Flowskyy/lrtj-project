"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { usePlateEditor } from "platejs/react";
import { type Value } from "platejs";
import { NewsEditorKit } from "@/components/editor/plugins/news-editor-kit";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

interface RichTextContentFieldProps {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  isEditMode?: boolean;
  readOnly?: boolean;
}

export default function RichTextContentField({ 
  label, 
  value, 
  onChange, 
  placeholder = "Enter content...",
  isEditMode = false,
  readOnly = false
}: RichTextContentFieldProps) {
  const [isEditing, setIsEditing] = useState(isEditMode);
  
  // Track the last initialized value to avoid unnecessary re-deserialization
  const lastInitializedValue = useRef<string | null>(null);
  
  // PlateJS editor
  const editor = usePlateEditor({
    plugins: NewsEditorKit,
  });

  // Initialize editor with value on mount or when value changes externally
  useEffect(() => {
    // Only deserialize if the actual HTML content has changed
    if (value && value !== lastInitializedValue.current) {
      const slateValue = editor.api.html.deserialize({ 
        element: value,
        collapseWhiteSpace: false,
      });
      editor.tf.setValue(slateValue as Value);
      lastInitializedValue.current = value;
    }
  }, [value, editor]);

  // Initialize empty state on mount for add mode
  useEffect(() => {
    if (!value && lastInitializedValue.current !== null) {
      const emptyValue = [{ type: 'p', children: [{ text: '' }] }] as Value;
      editor.tf.setValue(emptyValue);
      lastInitializedValue.current = null;
    }
  }, [editor, value]);

  // Handle content save
  const handleSave = async () => {
    // Serialize HTML dynamically to avoid SSR issues
    const { serializeHtml } = await import('platejs/static');
    const html = await serializeHtml(editor, {
      stripClassNames: true,
      stripDataAttributes: true,
      preserveClassNames: [],
      preserveWhitespace: true,
    });
    onChange(html || '<p>-</p>');
    setIsEditing(false);
  };

  // Handle content cancel
  const handleCancel = () => {
    // Revert to last saved content
    if (value) {
      const slateValue = editor.api.html.deserialize({ 
        element: value,
        collapseWhiteSpace: false,
      });
      editor.tf.setValue(slateValue as Value);
    } else {
      const emptyValue = [{ type: 'p', children: [{ text: '' }] }] as Value;
      editor.tf.setValue(emptyValue);
    }
    setIsEditing(false);
  };

  // Strip HTML tags for preview
  const stripHtml = (html: string) => {
    if (typeof window === 'undefined') return html || '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // For read-only mode, just show the content
  if (readOnly) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="text-gray-600 text-sm prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: value || '<p>-</p>' }} />
          </div>
        </div>
      </div>
    );
  }

  // Prevent SSR rendering of editor components
  if (typeof window === 'undefined') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="text-gray-600 text-sm">
            {stripHtml(value) || 'No content'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {!isEditing ? (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="line-clamp-3 text-gray-600 text-sm overflow-hidden">
            {stripHtml(value) || 'No content'}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="mt-3"
          >
            Edit Content
          </Button>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg">
          <RichTextEditor
            editor={editor}
            onChange={() => {}}
            placeholder={placeholder}
          />
          <div className="border-t border-gray-300 p-3 bg-gray-50 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="bg-[#E5262C] hover:bg-[#c91e24] text-white"
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
