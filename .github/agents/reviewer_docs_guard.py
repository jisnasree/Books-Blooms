#!/usr/bin/env python3
"""PreToolUse guard for the Reviewer agent.

Enforces the Reviewer's write boundary deterministically:
- File-write tools are allowed only when every target path is documentation
  markdown: docs/**/*.md, the root README.md, or the root AGENTS.md.
- Anything under .github/ (agent, hook, prompt, and instruction files) is
  never writable, so the agent cannot modify or disable this guard.
- Shell/execution tools are denied outright.
- All other tools (read, search) are allowed.

Input:  JSON on stdin  ({ "tool_name": ..., "tool_input": ..., "cwd": ... })
Output: JSON on stdout ({ "hookSpecificOutput": { "permissionDecision": ... } })
"""

import json
import os
import sys

WRITE_HINTS = ("edit", "write", "create", "patch", "notebook", "replace",
               "insert", "delete", "remove", "rename", "save", "move")
EXEC_HINTS = ("execute", "shell", "bash", "terminal", "command")
PATH_KEYS = {"path", "file", "file_path", "filepath", "notebook_path",
             "target_file", "source", "destination"}
MARKDOWN_EXTENSIONS = (".md", ".markdown")
ROOT_DOC_FILES = {"readme.md", "agents.md"}


def respond(decision, reason=""):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": decision,
            "permissionDecisionReason": reason,
        }
    }))


def collect_paths(value):
    """Recursively collect path-like strings from a tool input payload."""
    paths = []
    if isinstance(value, dict):
        for key, item in value.items():
            if isinstance(item, str) and key.lower() in PATH_KEYS:
                paths.append(item)
            else:
                paths.extend(collect_paths(item))
    elif isinstance(value, list):
        for item in value:
            paths.extend(collect_paths(item))
    return paths


def is_documentation_markdown(path, root):
    absolute = path if os.path.isabs(path) else os.path.join(root, path)
    absolute = os.path.realpath(absolute)
    relative = os.path.relpath(absolute, root)
    if relative.startswith("..") or os.path.isabs(relative):
        return False
    parts = relative.split(os.sep)
    if any(part.lower() == ".github" for part in parts):
        return False
    if not absolute.lower().endswith(MARKDOWN_EXTENSIONS):
        return False
    if parts[0].lower() == "docs":
        return True
    return len(parts) == 1 and parts[0].lower() in ROOT_DOC_FILES


def main():
    try:
        event = json.load(sys.stdin)
    except Exception:
        respond("deny", "Reviewer guard: unreadable hook input; failing closed.")
        return

    tool_name = str(event.get("tool_name") or "").lower()

    if any(hint in tool_name for hint in EXEC_HINTS):
        respond("deny", "Reviewer guard: shell execution is not allowed.")
        return

    if not any(hint in tool_name for hint in WRITE_HINTS):
        respond("allow")
        return

    root = os.path.realpath(event.get("cwd") or os.getcwd())
    paths = collect_paths(event.get("tool_input"))
    if not paths:
        respond("deny",
                f"Reviewer guard: no target file found for tool '{tool_name}'; "
                "failing closed.")
        return

    blocked = [p for p in paths if not is_documentation_markdown(p, root)]
    if blocked:
        respond("deny",
                "Reviewer may only write documentation markdown "
                "(docs/**/*.md, README.md, AGENTS.md). Blocked: "
                + ", ".join(blocked))
        return

    respond("allow")


if __name__ == "__main__":
    main()
