'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement } from 'platejs/react';

import { cn } from '@/lib/utils';

export function ParagraphElement(props: PlateElementProps) {
  const { lineHeight } = props.element as any;
  
  const style = lineHeight ? { lineHeight: String(lineHeight) } : undefined;
  
  return (
    <PlateElement 
      {...props} 
      className={cn('m-0 px-0 py-1')}
      style={style}
    >
      {props.children}
    </PlateElement>
  );
}
