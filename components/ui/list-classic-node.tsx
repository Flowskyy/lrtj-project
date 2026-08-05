'use client';

import React from 'react';

import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';

import { cn } from '@/lib/utils';

export const BulletedListElement = React.forwardRef<
  HTMLUListElement,
  PlateElementProps
>(({ className, children, ...props }, ref) => (
  <PlateElement
    as="ul"
    ref={ref}
    className={cn('list-disc pl-6', className)}
    {...props}
  >
    {children}
  </PlateElement>
));

BulletedListElement.displayName = 'BulletedListElement';

export const NumberedListElement = React.forwardRef<
  HTMLOListElement,
  PlateElementProps
>(({ className, children, ...props }, ref) => (
  <PlateElement
    as="ol"
    ref={ref}
    className={cn('list-decimal pl-6', className)}
    {...props}
  >
    {children}
  </PlateElement>
));

NumberedListElement.displayName = 'NumberedListElement';

export const TaskListElement = React.forwardRef<
  HTMLUListElement,
  PlateElementProps
>(({ className, children, ...props }, ref) => (
  <PlateElement
    as="ul"
    ref={ref}
    className={cn('list-none pl-6', className)}
    {...props}
  >
    {children}
  </PlateElement>
));

TaskListElement.displayName = 'TaskListElement';

export const ListItemElement = React.forwardRef<
  HTMLLIElement,
  PlateElementProps
>(({ className, children, ...props }, ref) => (
  <PlateElement
    as="li"
    ref={ref}
    className={cn('list-item', className)}
    {...props}
  >
    {children}
  </PlateElement>
));

ListItemElement.displayName = 'ListItemElement';
