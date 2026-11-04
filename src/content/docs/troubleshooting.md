---
title: Troubleshooting
description: Fixes for common problems with installation, models, approvals, devices and Python.
group: Reference
order: 30
sources: ["install.sh", "src/cli.ts", "src/arguments.ts", "src/auth.ts", "docs/overview.md", "docs/devices.md", "docs/communication.md", "docs/setup.md", "packages/core/README.md", "packages/core/src/python/environment.ts", "packages/core/src/python/ros-environment.ts", "packages/core/src/device/profile/store.ts", "packages/core/src/tool/exec.txt"]
---

First, check which version you're running and which workspace and devices Kinex sees:

```sh
kinex --version
kinex run "/devices"
```

## Installation and startup

| Problem | Fix |
| --- | --- |
| `kinex: command not found` | Add `~/.local/bin` to your `PATH`; the installer prints the exact line |
| `Another Kinex is on PATH` | Another `kinex` is installed and first on your `PATH`. Either keep it and run `kinex update`, or remove it and rerun the installer. |
| `Refusing to replace ~/.local/bin/kinex` | A file the installer didn't create is in the way. Move it, then reinstall. |
| Syntax errors, or Node.js too old | Kinex needs Node.js 22.19 or newer. Rerun the installer to get one. |
| `Unsupported option` or `--json was removed` | The option changed in 1.0.0; see [Changed in 1.0.0](/docs/cli/#changed-in-100) |
| `--resume requires a terminal` | In scripts, use `--continue` or `--session <id>` instead |
| `AuthPathConflict` | `~/.config/kinex/agent/auth.json` holds credentials that Kinex expects in `~/.local/share/kinex/agent/auth.json`. Move or merge them into the latter, delete the former, then restart. |

## Models and approvals

| Problem | Fix |
| --- | --- |
| Model not found | Check the exact name in `/model`. `--provider` only works together with `--model`. |
| Authentication errors | Run `/login` again, or check the provider's API-key environment variable |
| Local model doesn't respond | Make sure the model server is running before you start Kinex |
| Tool calls denied in a scripted run | Without a terminal, `ask` can't prompt you, so calls are denied. Allow specific permissions in `.kinex/kinex.json`, or use `--auto`. See [Permissions](/docs/control-graph/#permissions). |

## Devices

| Problem | Fix |
| --- | --- |
| `device "x" is unloaded` | Run `/load x`. |
| A device doesn't become ready on `/load` | Run `/ping x` to see its status. Check that your robot's own ROS stack is running on the device's ROS domain and that the node's dependencies are installed, then `/unload x` and `/load x`. Kinex never restarts a failed device on its own. |
| Shows as loaded but doesn't respond | Being marked as loaded doesn't mean it's ready. Run `/ping x`, then `/unload x` and `/load x`. |
| Simulator devices don't respond | The simulator must be running. Start it with `rosbridge launch` using the same `--domain-id` you gave `rosbridge setup`, then `/unload all` and `/load all`. See [Simulators](/docs/simulators/). |
| A profile or node edit has no effect | Run `/unload x` and then `/load x` to apply it. |
| `DeviceProfileError` after upgrading from v1.0 | v1.0 device profiles don't work in v1.1. Move `.kinex/devices` aside and set your devices up again with `/onboarding` or `/register`. |
| `No robot is configured` | No valid `.kinex/workspace.yaml` was found: it's missing or invalid. Check you're in the right directory. |
| The wrong devices show up | A `.kinex/` folder closer to your current directory is hiding the one you meant |
| A `devices` call returns an error for one device | Each call reports its own result, so the others may have succeeded. Check every entry before retrying. |
| Old behavior after an update | Tools, skills and device guides copied into the workspace override the updated built-ins. Refresh those copies. |

## Python

| Problem | Fix |
| --- | --- |
| `Install Pixi to prepare the independent Kinex ROS Python environment` | Install [Pixi](https://pixi.sh); Kinex Python needs it for ROS. Pixi environments run on Linux x86-64 only. See [Python environment](/docs/control-graph/#python-environment). |
| `Install uv to prepare Kinex core Python` | Install [uv](https://docs.astral.sh/uv/), which the `uv` provider uses. |
| Wrong ROS distribution | Set `python.provider` to `ros-jazzy` or `ros-humble` in `.kinex/kinex.json`. Kinex Python is prepared again on next use. |
| Camera images aren't attached | Images read in Python aren't attached on their own. Save them with `helpers.save_image(image)` and return the paths with `finish(result, file=[...])`. |
| Script finishes but motion continues | A successful script leaves motion running. Call the device's `stop` operation in a `finally` block when exiting must stop it, or use `/stop`. |
| Custom tool or skill is missing | Put tools in `.kinex/tools/` and skills in `.kinex/skills/`, or the same folders under `~/.config/kinex/`. A Python tool also needs a valid `tool.yaml`, and a custom tool can't reuse a built-in tool's name. |

## Reporting an issue

Open an issue at [stacx-lab/kinex/issues](https://github.com/stacx-lab/kinex/issues) and include:

- the output of `kinex --version`, your OS, your Node.js version and your `python.provider`;
- the command you ran, what you expected, and what happened, including the error;
- whether the device is simulated or real.

Remove credentials and any private images first.
