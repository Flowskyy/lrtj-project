"use client";

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { usePlateEditor } from "platejs/react";
import { type Value } from "platejs";
import { NewsEditorKit } from "@/components/editor/plugins/news-editor-kit";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

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
  saveContent: () => Promise<void>;
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
  
  // Track the last initialized value to avoid unnecessary re-deserialization
  const lastInitializedValue = useRef<string | null>(null);
  
  // PlateJS editor
  const editor = usePlateEditor({
    plugins: NewsEditorKit,
  });

  // Store editor in ref to ensure stable reference for useEffect
  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Initialize editor with value on mount or when value changes externally
  useEffect(() => {
    // Only deserialize if the actual HTML content has changed
    if (value && value !== lastInitializedValue.current) {
      const slateValue = editorRef.current.api.html.deserialize({ 
        element: value,
        collapseWhiteSpace: false,
      });
      editorRef.current.tf.setValue(slateValue as Value);
      lastInitializedValue.current = value;
      setHasUnsavedChanges(false);
    }
  }, [value]);

  // Initialize empty state once on mount for add mode
  useEffect(() => {
    if (!value && lastInitializedValue.current === null) {
      const emptyValue = [{ type: 'p', children: [{ text: '' }] }] as Value;
      editorRef.current.tf.setValue(emptyValue);
      lastInitializedValue.current = '';
      setHasUnsavedChanges(false);
    }
  }, []);

  // Handle content save
  const handleSave = async () => {
    try {
      // Serialize HTML dynamically to avoid SSR issues
      const { serializeHtml } = await import('platejs/static');
      const html = await serializeHtml(editorRef.current, {
        stripClassNames: true,
        stripDataAttributes: true,
        preserveClassNames: [],
        preserveWhitespace: true,
      });
      onChange(html || '<p>-</p>');
      setHasUnsavedChanges(false);
      setIsEditing(false);
      toast.success("Content saved successfully");
    } catch (err) {
      console.error("Failed to save content", err);
      toast.error("Failed to save content");
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
    // Revert to last saved content
    if (value) {
      const slateValue = editorRef.current.api.html.deserialize({ 
        element: value,
        collapseWhiteSpace: false,
      });
      editorRef.current.tf.setValue(slateValue as Value);
    } else {
      const emptyValue = [{ type: 'p', children: [{ text: '' }] }] as Value;
      editorRef.current.tf.setValue(emptyValue);
    }
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
      await handleSave();
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
              setIsEditing(true);
            }}
            className="mt-3"
          >
            Edit Content
          </Button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <RichTextEditor
            editor={editorRef.current}
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
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in the editor. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={performCancel}
              className="bg-[#E5262C] hover:bg-[#c91e24] text-white"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

RichTextContentField.displayName = "RichTextContentField";

export default RichTextContentField;
