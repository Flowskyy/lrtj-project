'use client';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      {...props}
      className={cn(
        'scrollbar-hide sticky top-0 left-0 z-50 w-full justify-between overflow-x-auto rounded-t-lg border-b border-gray-200 bg-white shadow-sm px-3 py-2',
        props.className
      )}
    />
  );
}
