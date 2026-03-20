"use client";

import type { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

function getToolLabel(toolInvocation: ToolInvocation): string {
  const { toolName, args } = toolInvocation;
  const path: string | undefined = args?.path;
  const filename = path?.split("/").pop() || "file";

  if (toolName === "str_replace_editor") {
    switch (args?.command) {
      case "create":     return `Creating ${filename}`;
      case "str_replace": return `Editing ${filename}`;
      case "insert":     return `Editing ${filename}`;
      case "view":       return `Reading ${filename}`;
      case "undo_edit":  return `Undoing edit in ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    switch (args?.command) {
      case "rename": return `Renaming ${filename}`;
      case "delete": return `Deleting ${filename}`;
    }
  }

  return toolName;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const label = getToolLabel(toolInvocation);
  const isDone = toolInvocation.state === "result" && toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
