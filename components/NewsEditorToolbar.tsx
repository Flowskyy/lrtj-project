'use client';

import { Bold, Italic, Underline, Strikethrough, Code, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, CheckSquare, Link, Table, Smile, Undo, Redo, Heading1, Heading2, Heading3, Palette, Highlighter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ToolbarButton } from '@/components/ui/toolbar';
import { MarkToolbarButton } from '@/components/ui/mark-toolbar-button';
import { BulletedListToolbarButton, NumberedListToolbarButton, TodoListToolbarButton } from '@/components/ui/list-toolbar-button';
import { AlignToolbarButton } from '@/components/ui/align-toolbar-button';
import { LinkToolbarButton } from '@/components/ui/link-toolbar-button';
import { TableToolbarButton } from '@/components/ui/table-toolbar-button';
import { EmojiToolbarButton } from '@/components/ui/emoji-toolbar-button';
import { FontColorToolbarButton } from '@/components/ui/font-color-toolbar-button';
import { ToolbarGroup } from '@/components/ui/toolbar';
import { TurnIntoToolbarButton } from '@/components/ui/turn-into-toolbar-button';
import { UndoToolbarButton, RedoToolbarButton } from '@/components/ui/history-toolbar-button';

export function NewsEditorToolbar() {
  return (
    <>
      {/* Undo/Redo */}
      <ToolbarGroup>
        <UndoToolbarButton tooltip="Undo (Ctrl+Z)">
          <Undo className="size-4" />
        </UndoToolbarButton>
        <RedoToolbarButton tooltip="Redo (Ctrl+Y)">
          <Redo className="size-4" />
        </RedoToolbarButton>
      </ToolbarGroup>

      {/* Heading Dropdown */}
      <ToolbarGroup>
        <TurnIntoToolbarButton tooltip="Turn into">
          <Heading1 className="size-4" />
        </TurnIntoToolbarButton>
      </ToolbarGroup>

      {/* Text Formatting */}
      <ToolbarGroup>
        <MarkToolbarButton nodeType="bold" tooltip="Bold (Ctrl+B)">
          <Bold className="size-4" />
        </MarkToolbarButton>
        <MarkToolbarButton nodeType="italic" tooltip="Italic (Ctrl+I)">
          <Italic className="size-4" />
        </MarkToolbarButton>
        <MarkToolbarButton nodeType="underline" tooltip="Underline (Ctrl+U)">
          <Underline className="size-4" />
        </MarkToolbarButton>
        <MarkToolbarButton nodeType="strikethrough" tooltip="Strikethrough (Ctrl+Shift+X)">
          <Strikethrough className="size-4" />
        </MarkToolbarButton>
        <MarkToolbarButton nodeType="code" tooltip="Inline Code (Ctrl+E)">
          <Code className="size-4" />
        </MarkToolbarButton>
      </ToolbarGroup>

      {/* Text Color & Highlight */}
      <ToolbarGroup>
        <FontColorToolbarButton tooltip="Text Color">
          <Palette className="size-4" />
        </FontColorToolbarButton>
        <MarkToolbarButton nodeType="highlight" tooltip="Highlight (Ctrl+Shift+H)">
          <Highlighter className="size-4" />
        </MarkToolbarButton>
      </ToolbarGroup>

      {/* Text Alignment */}
      <ToolbarGroup>
        <AlignToolbarButton value="left" tooltip="Align Left">
          <AlignLeft className="size-4" />
        </AlignToolbarButton>
        <AlignToolbarButton value="center" tooltip="Align Center">
          <AlignCenter className="size-4" />
        </AlignToolbarButton>
        <AlignToolbarButton value="right" tooltip="Align Right">
          <AlignRight className="size-4" />
        </AlignToolbarButton>
        <AlignToolbarButton value="justify" tooltip="Justify">
          <AlignJustify className="size-4" />
        </AlignToolbarButton>
      </ToolbarGroup>

      {/* Lists */}
      <ToolbarGroup>
        <BulletedListToolbarButton />
        <NumberedListToolbarButton />
        <TodoListToolbarButton />
      </ToolbarGroup>

      {/* Link */}
      <ToolbarGroup>
        <LinkToolbarButton tooltip="Insert Link (Ctrl+K)">
          <Link className="size-4" />
        </LinkToolbarButton>
      </ToolbarGroup>

      {/* Table */}
      <ToolbarGroup>
        <TableToolbarButton tooltip="Insert Table">
          <Table className="size-4" />
        </TableToolbarButton>
      </ToolbarGroup>

      {/* Emoji */}
      <ToolbarGroup>
        <EmojiToolbarButton tooltip="Insert Emoji">
          <Smile className="size-4" />
        </EmojiToolbarButton>
      </ToolbarGroup>
    </>
  );
}
