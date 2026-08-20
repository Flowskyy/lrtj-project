'use client';

import * as React from 'react';

import { ChevronDown } from 'lucide-react';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';

import { ToolbarButton } from './toolbar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LINE_HEIGHT_VALUES = [1, 1.2, 1.5, 2, 3];

export function LineHeightToolbarButton() {
  const editor = useEditorRef();

  const lineHeight = useSelectionFragmentProp({
    defaultValue: 1.5,
    getProp: (node) => (node as any).lineHeight,
  });

  const currentLineHeight = React.useMemo(() => {
    return lineHeight ?? 1.5;
  }, [lineHeight]);

  const handleLineHeightChange = React.useCallback(
    (value: string) => {
      const numValue = parseFloat(value);
      if (editor.selection) {
        editor.tf.select(editor.selection);
        editor.tf.setNodes({ lineHeight: numValue });
        editor.tf.focus();
      }
    },
    [editor]
  );

  return (
    <div className="flex items-center">
      <ToolbarButton tooltip="Line Height">
        <ChevronDown className="size-4" />
      </ToolbarButton>
      <Select value={String(currentLineHeight)} onValueChange={handleLineHeightChange}>
        <SelectTrigger className="h-8 w-16 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LINE_HEIGHT_VALUES.map((value) => (
            <SelectItem key={value} value={String(value)}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
