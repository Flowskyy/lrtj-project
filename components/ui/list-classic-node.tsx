'use client';

import React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { cn } from '@/lib/utils';

export const BulletedListElement = React.forwardRef<
  HTMLUListElement,
  PlateElementProps
>(({ className, children, setOption, getOption, setOptions, getOptions, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('list-disc pl-6', className)}
    {...props}
  >
    {children}
  </ul>
));

BulletedListElement.displayName = 'BulletedListElement';

export const NumberedListElement = React.forwardRef<
  HTMLOListElement,
  PlateElementProps
>(({ className, children, setOption, getOption, setOptions, getOptions, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn('list-decimal pl-6', className)}
    {...props}
  >
    {children}
  </ol>
));

NumberedListElement.displayName = 'NumberedListElement';

export const TaskListElement = React.forwardRef<
  HTMLUListElement,
  PlateElementProps
>(({ className, children, setOption, getOption, setOptions, getOptions, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('list-none pl-6', className)}
    {...props}
  >
    {children}
  </ul>
));

TaskListElement.displayName = 'TaskListElement';

export const ListItemElement = React.forwardRef<
  HTMLLIElement,
  PlateElementProps
>(({ className, children, setOption, getOption, setOptions, getOptions, ...props }, ref) => (
  <li ref={ref} className={cn('list-item', className)} {...props}>
    {children}
  </li>
));

ListItemElement.displayName = 'ListItemElement';
