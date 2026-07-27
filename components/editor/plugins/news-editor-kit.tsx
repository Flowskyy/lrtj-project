'use client';

import { BasicNodesKit } from './basic-nodes-kit';
import { ListKit } from './list-kit';
import { AlignKit } from './align-kit';
import { LinkKit } from './link-kit';
import { TableKit } from './table-kit';
import { EmojiKit } from './emoji-kit';
import { FontSizeKit } from './font-size-kit';

export const NewsEditorKit = [
  ...BasicNodesKit,
  ...ListKit,
  ...AlignKit,
  ...LinkKit,
  ...TableKit,
  ...EmojiKit,
  ...FontSizeKit,
];
