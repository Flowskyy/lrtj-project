"use client";

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { usePlateEditor } from "platejs/react";
import { type Value } from "platejs";
import { NewsEditorKit } from "@/components/editor/plugins/news-editor-kit";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

const EditorInstance = ({ 
  value, 
  onChange, 
  onEditorReady,
  placeholder, 
  disableTable 
}: { 
  value: string; 
  onChange: () => void; 
  onEditorReady: (editor: any) => void;
  placeholder: string; 
  disableTable?: boolean;
}) => {
  const editor = usePlateEditor({
    plugins: NewsEditorKit,
    value: (editor) => {
      if (!value) {
        return [{ type: 'p', children: [{ text: '' }] }] as Value;
      }
      
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(value, 'text/html');
        const element = doc.body.firstChild as HTMLElement;
        
        // Ensure we have a valid element to deserialize
        if (!element) {
          return [{ type: 'p', children: [{ text: '' }] }] as Value;
        }
        
        const deserializedValue = editor.api.html.deserialize({
          element: element,
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

  useEffect(() => {
    onEditorReady(editor);
  }, []);

  return (
    <RichTextEditor
      editor={editor}
      onChange={onChange}
      placeholder={placeholder}
      disableTable={disableTable}
    />
  );
};

interface RichTextContentFieldProps {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  isEditMode?: boolean;
  readOnly?: boolean;
  disableTable?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

export interface RichTextContentFieldRef {
  hasUnsavedChanges: () => boolean;
  saveContent: () => Promise<string>;
}

const RichTextContentField = forwardRef<RichTextContentFieldRef, RichTextContentFieldProps>(({ 
  label, 
  value, 
  onChange, 
  placeholder = "Enter content...",
  isEditMode = false,
  readOnly = false,
  disableTable = false,
  onDirtyChange
}, ref) => {
  const [isEditing, setIsEditing] = useState(isEditMode);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Key to force editor remount when entering edit mode
  const [editorInstanceKey, setEditorInstanceKey] = useState(0);
  
  // Ref to store editor instance from child
  const editorRef = useRef<any>(null);

  // Handle content save
  const handleSave = async () => {
    try {
      // Serialize HTML dynamically to avoid SSR issues
      const { serializeHtml } = await import('platejs/static');
      let html = await serializeHtml(editorRef.current, {
        stripClassNames: true,
        stripDataAttributes: true,
        preserveClassNames: [],
        preserveWhitespace: true,
      });

      const finalHtml = html || '<p>-</p>';
      onChange(finalHtml);
      setHasUnsavedChanges(false);
      setIsEditing(false);
      toast.success("Content saved successfully");
      return finalHtml;
    } catch (err) {
      console.error("Failed to save content", err);
      toast.error("Failed to save content");
      throw err;
    }
  };

  // Handle content cancel
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      performCancel();
    }
  };

  const performCancel = () => {
    setHasUnsavedChanges(false);
    setIsEditing(false);
    setShowConfirmDialog(false);
  };

  // Track editor changes for dirty flag
  const handleEditorChange = () => {
    setHasUnsavedChanges(true);
  };

  // Notify parent of dirty state changes
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onDirtyChange]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    hasUnsavedChanges: () => hasUnsavedChanges,
    saveContent: async () => {
      return await handleSave();
    }
  }));

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
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="line-clamp-3 text-gray-600 text-sm overflow-hidden">
            {stripHtml(value) || 'No content'}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setHasUnsavedChanges(false);
              // Force editor remount by incrementing key
              setEditorInstanceKey(prev => prev + 1);
              setIsEditing(true);
            }}
            className="mt-3"
          >
            Edit Content
          </Button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <EditorInstance
            key={editorInstanceKey}
            onEditorReady={(editor) => { editorRef.current = editor; }}
            value={value}
            onChange={handleEditorChange}
            placeholder={placeholder}
            disableTable={disableTable}
          />
          <div className="border-t border-gray-200 p-3 bg-gray-50 flex gap-2">
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

      {/* Unsaved changes confirmation dialog */}
      <UnsavedChangesDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onKeepEditing={() => setShowConfirmDialog(false)}
        onDiscard={performCancel}
        description="You have unsaved changes in the Terms & Condition editor. These changes will be lost if you continue."
        showIcon={true}
      />
    </div>
  );
});

RichTextContentField.displayName = "RichTextContentField";

export default RichTextContentField;
