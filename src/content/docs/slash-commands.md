---
title: Slash commands
description: The commands you type inside a Kinex session, and the keys that go with them.
group: Reference
order: 20
sources: ["docs/commands.md", "packages/core/src/commands.ts", "packages/setup/src/integration.ts", "src/integration/commands.ts", "src/integration/extension.ts"]
---

Type `/` in a session to search every command; device names complete with Tab. Device, program and recording commands run at once, without the model, and also work from the shell: `kinex run "/ping all"`. The exception is `/register`, which hands the work to the agent.

## Devices

| Command | Does |
| --- | --- |
| `/devices` | List devices and whether each is set to load |
| `/load <device\|all>` | Connect a device, starting the nodes it declares, and wait until it is ready |
| `/unload <device\|all>` | Disconnect a device and release its resources |
| `/ping <device\|all>` | Check live status without starting anything |
| `/stop [device]` | Cancel the agent's response, stop the robot's motion and cancel the programs that commanded it. Never asks for approval. |
| `/register <type-or-template>` | Have the agent set up a new device of this type or template; it stays unloaded |
| `/unregister <device>` | After confirmation, unload a device and delete its profile, node and local files |

To restart a device after editing its profile or node, run `/unload` and then `/load`.

## Programs

| Command | Does |
| --- | --- |
| `/exec <file.py> [name=value ...]` | Run a saved program without the model |
| `/lib [module[.function]]` | Browse the function library: modules, a module's functions, one function's signature |
| `/visualize <file.py[:function]\|module.function> [output.html]` | Draw a program or function as a flow chart page |
| `/subagent [<provider/model> [thinking]\|session]` | Show or choose the model that subagents in programs use |

While the agent is idle, Escape cancels a running `/exec`. See [Programs and the library](/docs/programs/).

## Recording

| Command | Does |
| --- | --- |
| `/record start <device=Hz ...> [instruction]` | Start recording these devices at these rates |
| `/record snap <device ...> [note]` | Save one snapshot and mark the moment |
| `/record status` | Show the active recording and summaries of recent ones |
| `/record stop [success\|failure\|partial] [note]` | Stop and save, with an optional outcome |

Add `--verbose` after the action, as in `/record status --verbose`, to include empty fields. See [Recording](/docs/recording/).

## Setup

These hand a guided task to the agent, so they need a model.

| Command | Does |
| --- | --- |
| `/onboarding [description]` | Set the robot up for a task: devices, checks and the calibration it needs |
| `/calibrate [scope]` | Calibrate what you describe, or continue the current task's calibration |

See [Onboarding & calibration](/docs/onboarding/).

## Agent and sessions

`/mode` is Kinex's own; the rest come from Pi. See [Working with the agent](/docs/agent/).

| Command | Does |
| --- | --- |
| `/mode [ask\|auto\|yolo]` | Choose how much the agent asks before acting; bare `/mode` opens a picker |
| `/login`, `/logout` | Connect or disconnect a model provider |
| `/model`, `/thinking` | Choose the model and its reasoning effort |
| `/new`, `/resume` | Start a new session, or switch to a saved one |
| `/tree`, `/fork`, `/clone` | Browse branches, branch from an earlier message, or copy the session |
| `/name`, `/session` | Name the session, or show its details |
| `/compact [instructions]` | Summarize the conversation to free up context |
| `/export [path]` | Save the session as HTML or JSONL |
| `/copy` | Copy the agent's last reply |
| `/settings`, `/hotkeys` | Open preferences, or list keyboard shortcuts |
| `/reload` | Reload extensions, skills, prompts and themes. It doesn't reload devices. |
| `/quit` | Exit Kinex |

Installed packages can add commands of their own. Start a line with `!` to run it as a shell command.

## Keys

| Key | Does |
| --- | --- |
| Enter | Send. While the agent is working, steer it. |
| Shift+Enter | New line |
| Alt+Enter | Queue a follow-up for when the agent finishes |
| Escape | Interrupt the agent, or cancel a running command. Use `/stop` to stop the robot too. |
| Ctrl+O | Expand or collapse tool calls and their output |
