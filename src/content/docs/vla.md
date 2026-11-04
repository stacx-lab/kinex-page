---
title: Using VLAs
description: Register a vision-language-action model as a model device, and run it with helpers.run_policy in an exec program that loops over observations and action chunks.
group: Guides
order: 40
label: Using VLAs
sources: ["docs/devices.md", "packages/core/assets/builtin/device/fastwam/DEVICE.md", "packages/core/assets/builtin/device/templates/model/DEVICE.md", "packages/core/src/workflows/register.txt", "packages/core/assets/python/kinex/helpers/policy.py", "packages/core/assets/python/kinex/helpers/helpers.txt"]
---

A vision-language-action model (VLA) takes camera images, the robot's state and a task description, and predicts the robot's next moves. In Kinex, a VLA is not the agent; it's a device the agent's programs use. The agent decides when to run the policy, on which devices, for how long, and when to stop.

This takes three pieces:

1. **The VLA becomes a device.** It's a `model` device whose `infer` service takes an observation and returns actions.
2. **`helpers.run_policy` runs it once.** It sends one observation to the model and sends the predicted actions to the robot.
3. **An `exec` program loops.** It gathers fresh observations, runs bounded action chunks and returns images for the agent to assess.

## 1. Register the VLA as a device

Kinex bundles [FastWAM](https://github.com/yuantianyuan01/FastWAM), with variants for LIBERO and RoboTwin. Tell `/register` which variant you want and where to run it:

```text
/register fastwam libero_uncond_2cam224 on cuda:0
```

| Variant | Cameras | State | Action |
| --- | --- | --- | --- |
| `libero_uncond_2cam224` | 2 | 8 | 7 |
| `libero_optional_idm_2cam224` | 2 | 8 | 7 |
| `robotwin_uncond_3cam_384` | 3 | 14 | 14 |

FastWAM needs a CUDA GPU, and setup downloads about 26 GB of weights. The agent installs the model into the device's own folder, writes its profile and leaves it unloaded. Loading it puts the model on the GPU, so load it only when you need it:

```text
/load fastwam
```

The result is an ordinary device in `.kinex/devices/fastwam/`. Its profile describes what `infer` takes and returns:

```yaml
name: fastwam
type: model
operations:
  infer:
    description: "Predict an action chunk. Input {obs: {images: camera image paths in the evaluator's orientation, state: proprioception}, task: instruction, seed: default 0, num_inference_steps: default 10, compile_action_infer: default false}. Output {actions: 32 rows of 7 LIBERO actions (xyz deltas within ±0.05 m, rotation deltas within ±0.5 rad, gripper -1 open or +1 close), inference_s}."
    transport: service
    direction: input
    endpoint: /kinex/fastwam/infer
    type: kinex_interfaces/srv/Json
variant: libero_uncond_2cam224
# ...
```

The model only predicts. It never moves the robot itself.

### Bring your own policy

To use another VLA, register a `model` device and describe it to the agent:

```text
/register model my-policy served at http://gpu-box:8000, 7-dim end-effector deltas plus gripper
```

Any model works with `helpers.run_policy` as long as it serves a JSON `infer` operation that takes `obs` (and `task`) and returns `actions`, a list of action vectors.

## 2. Run the policy once with `helpers.run_policy`

`helpers.run_policy` connects the model to the robot. It sends the observation and task to the model, splits each predicted action across the devices you list, and sends them their share. For the LIBERO variant, each action is a 6-value end-effector change for the arm followed by one gripper value:

```python
result = await helpers.run_policy(
    io, "fastwam",
    {"images": [agentview_png, wrist_png], "state": state},  # what fastwam's infer asks for
    [{"device": "arm", "space": "pose_delta"}, {"device": "gripper"}],
    task="put the bowl on the plate", action_hz=10, max_actions=8)
```

Here `io` comes from `async with communication() as io`, the images are paths saved with `helpers.save_image`, and `state` is the robot state the model expects.

| Argument | Meaning |
| --- | --- |
| `model` | The model device to run |
| `observation` | Sent to the model as `obs`; its shape is whatever the model's `infer` description asks for. |
| `task` | Optional instruction for the model. |
| `inference_args` | Optional extra model inputs, such as FastWAM's `num_inference_steps`. |
| `command` | Devices in the order their values appear in each action. Each entry is `{device, space?, frame?, target_frame?}`. |
| `space` | `device` (default): joint positions, or a gripper value from -1 (release) to +1 (grip). `pose` or `pose_delta`: end-effector targets, converted to joint positions with inverse kinematics. |
| `frame`, `target_frame` | For pose spaces: the reference frame (default the arm's base) and the controlled frame (default the arm's tip link). |
| `action_hz` | Actions per second of world time, 10 by default. |
| `max_actions` | Send at most this many actions from the chunk, so the robot gets a fresh prediction instead of following a stale plan. |
| `world` | The world device used for pacing, `world` by default. |

It returns `actions_submitted`, `duration_s` (how long the actions take in world time) and `ik_failure`. When inverse kinematics rejects an action, only the actions before it are sent, and `ik_failure` says which device and action failed; otherwise it's `null`.

## 3. Loop with `exec`

Run several chunks in one program. This example assumes a policy device named `policy` whose `infer` takes two camera images and the arm's joint positions. It runs at most five chunks, then returns both camera views for the agent's next decision:

```python
import asyncio
from kinex import communication, finish, helpers

CAMERAS = ("camera_scene", "camera_wrist")
COMMAND = [{"device": "arm"}, {"device": "gripper"}]

async def main():
    async with communication() as io:
        arm = io.subscribe("arm.joint_state", depth=1)
        for chunk in range(5):
            images = [helpers.save_image((await helpers.camera_frame(io, camera))[0])
                      for camera in CAMERAS]
            state = list((await arm.next(timeout_s=2)).position)
            result = await helpers.run_policy(
                io, "policy", {"images": images, "state": state}, COMMAND,
                task="put the bowl on the plate", action_hz=10, max_actions=8)
            if not result["actions_submitted"]:
                break
        await io.request("world.wait", duration_s=0.5)  # let the last chunk settle
        files = [helpers.save_image((await helpers.camera_frame(io, camera))[0])
                 for camera in CAMERAS]
    finish({"chunks": chunk + 1, "last": result}, file=files)

asyncio.run(main())
```

Adapt the camera names, observation and command order to your model and robot. A good pattern is to ask the agent to run a short policy segment, look at the returned images, and decide what comes next. In a stepped simulator, the world doesn't advance while the model is thinking.

See [vision models](/docs/vision/) for perception-driven motion.
