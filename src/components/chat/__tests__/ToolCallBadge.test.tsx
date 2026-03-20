import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result" = "result",
  result: unknown = "Success"
): ToolInvocation {
  if (state === "call") {
    return { toolCallId: "test", toolName, args, state };
  }
  return { toolCallId: "test", toolName, args, state, result };
}

test("str_replace_editor create shows Creating filename", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" })}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("str_replace_editor str_replace shows Editing filename", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/Card.jsx" })}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("str_replace_editor insert shows Editing filename", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "/utils.js" })}
    />
  );
  expect(screen.getByText("Editing utils.js")).toBeDefined();
});

test("str_replace_editor view shows Reading filename", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "/index.ts" })}
    />
  );
  expect(screen.getByText("Reading index.ts")).toBeDefined();
});

test("str_replace_editor undo_edit shows Undoing edit in filename", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })}
    />
  );
  expect(screen.getByText("Undoing edit in App.jsx")).toBeDefined();
});

test("file_manager rename shows Renaming filename", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("file_manager", { command: "rename", path: "/old.jsx" })}
    />
  );
  expect(screen.getByText("Renaming old.jsx")).toBeDefined();
});

test("file_manager delete shows Deleting filename", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/temp.jsx" })}
    />
  );
  expect(screen.getByText("Deleting temp.jsx")).toBeDefined();
});

test("state call shows spinner", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "call")}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("state result with truthy result shows green dot", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result", "Success")}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("state result with falsy result shows spinner", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result", null)}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("unknown tool name falls back to raw toolName", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("unknown_tool", {})}
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("nested path extracts only filename", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/src/components/Button.tsx" })}
    />
  );
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("missing path in args falls back to file", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create" })}
    />
  );
  expect(screen.getByText("Creating file")).toBeDefined();
});
