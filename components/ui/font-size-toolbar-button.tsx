'use client';

import * as React from 'react';

import { Minus, Plus, Type } from 'lucide-react';
import { useEditorRef, useEditorSelector } from 'platejs/react';

import { ToolbarButton } from './toolbar';

export function FontSizeToolbarButton() {
  const editor = useEditorRef();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const fontSize = useEditorSelector(
    (editor) => editor.api.mark('fontSize') as string,
    []
  );

  const currentFontSize = React.useMemo(() => {
    if (!fontSize) return 16;
    const parsed = parseInt(fontSize.replace('px', ''), 10);
    return isNaN(parsed) ? 16 : parsed;
  }, [fontSize]);

  const [inputValue, setInputValue] = React.useState(String(currentFontSize));

  React.useEffect(() => {
    setInputValue(String(currentFontSize));
  }, [currentFontSize]);

  const updateFontSize = React.useCallback(
    (value: number) => {
      if (editor.selection) {
        editor.tf.select(editor.selection);
        editor.tf.addMarks({ fontSize: `${value}px` });
      }
    },
    [editor]
  );

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    },
    []
  );

  const handleInputBlur = React.useCallback(() => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      updateFontSize(parsed);
    } else {
      setInputValue(String(currentFontSize));
    }
  }, [inputValue, currentFontSize, updateFontSize]);

  const handleInputKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const parsed = parseInt(inputValue, 10);
        if (!isNaN(parsed) && parsed > 0) {
          updateFontSize(parsed);
        } else {
          setInputValue(String(currentFontSize));
        }
        inputRef.current?.blur();
      }
    },
    [inputValue, currentFontSize, updateFontSize]
  );

  const handleIncrement = React.useCallback(() => {
    const parsed = parseInt(inputValue, 10);
    const newValue = isNaN(parsed) ? currentFontSize + 1 : parsed + 1;
    setInputValue(String(newValue));
    updateFontSize(newValue);
  }, [inputValue, currentFontSize, updateFontSize]);

  const handleDecrement = React.useCallback(() => {
    const parsed = parseInt(inputValue, 10);
    const newValue = isNaN(parsed) ? Math.max(1, currentFontSize - 1) : Math.max(1, parsed - 1);
    setInputValue(String(newValue));
    updateFontSize(newValue);
  }, [inputValue, currentFontSize, updateFontSize]);

  return (
    <div className="flex items-center">
      <ToolbarButton tooltip="Font Size">
        <Type className="size-4" />
      </ToolbarButton>
      <div className="flex items-center border border-input rounded-md h-8">
        <button
          type="button"
          className="px-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleDecrement}
          aria-label="Decrease font size"
        >
          <Minus className="size-3" />
        </button>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="w-12 text-center text-sm bg-transparent border-0 outline-none focus:ring-0"
          aria-label="Font size in pixels"
        />
        <button
          type="button"
          className="px-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleIncrement}
          aria-label="Increase font size"
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  );
}
