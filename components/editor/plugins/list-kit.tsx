'use client';

import {
  BulletedListRules,
  OrderedListRules,
  TaskListRules,
} from '@platejs/list-classic';
import {
  ListPlugin,
  BulletedListPlugin,
  NumberedListPlugin,
  TaskListPlugin,
  ListItemPlugin,
} from '@platejs/list-classic/react';

import {
  BulletedListElement,
  NumberedListElement,
  TaskListElement,
  ListItemElement,
} from '@/components/ui/list-classic-node';

export const ListKit = [
  ListPlugin.configure({
    inputRules: [
      BulletedListRules.markdown({ variant: '-' }),
      BulletedListRules.markdown({ variant: '*' }),
      OrderedListRules.markdown({ variant: '.' }),
      OrderedListRules.markdown({ variant: ')' }),
      TaskListRules.markdown({ checked: false }),
      TaskListRules.markdown({ checked: true }),
    ],
  }),
  BulletedListPlugin.configure({
    node: {
      component: BulletedListElement,
    },
  }),
  NumberedListPlugin.configure({
    node: {
      component: NumberedListElement,
    },
  }),
  TaskListPlugin.configure({
    node: {
      component: TaskListElement,
    },
  }),
  ListItemPlugin.configure({
    node: {
      component: ListItemElement,
    },
  }),
];
