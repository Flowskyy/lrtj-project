import * as React from "react";
import { Plate } from "@platejs/react";
import { cn } from "@/lib/utils";

const Editor = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:.cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Editor.displayName = "Editor";

const EditorContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative w-full", className)}
    {...props}
  />
));
EditorContainer.displayName = "EditorContainer";

export { Editor, EditorContainer };
