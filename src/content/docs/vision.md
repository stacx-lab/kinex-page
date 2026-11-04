---
title: Using vision models
description: Register a vision model such as SAM3 as a model device, locate objects in 3D with helpers.locate_object_3d, and combine perception and motion in one exec program.
group: Guides
order: 50
label: Using vision models
sources: ["docs/devices.md", "packages/core/assets/builtin/device/sam3/DEVICE.md", "packages/core/assets/builtin/device/grounding-dino/DEVICE.md", "packages/core/assets/builtin/device/templates/model/DEVICE.md", "packages/core/assets/python/kinex/helpers/perception.py", "packages/core/assets/python/kinex/helpers/frames.py", "packages/core/README.md"]
---

Vision models answer questions like "where is the red mug?" by finding objects in camera images. In Kinex, a vision model is not the agent; it's a device the agent's programs use. The agent decides what to look for, which camera to use, and what to do with the answer.

This takes three pieces:

1. **The vision model becomes a device.** It's a `model` device with a `detect` service.
2. **`helpers.locate_object_3d` uses it.** It takes a camera image, asks the model to find the object, and turns the result into a 3D position.
3. **One `exec` program combines perception and action.** It converts the position for the arm, commands motion and returns fresh images for the agent to check.

Kinex bundles two vision models: [SAM3](https://huggingface.co/facebook/sam3), an open-vocabulary segmentation model, and [Grounding DINO](https://huggingface.co/IDEA-Research/grounding-dino-tiny), an open-vocabulary detector. This page uses SAM3.

## 1. Register the vision model as a device

SAM3's weights are gated on Hugging Face. Request access at [facebook/sam3](https://huggingface.co/facebook/sam3) and make a token available (for example as `HF_TOKEN`), then let the agent set it up:

```text
/register sam3 on cuda:0
```

Say `on cpu` instead to run without a GPU. The agent installs the model into the device's own folder, downloads the weights, writes its profile and leaves it unloaded. Loading it puts the model on its GPU or CPU, so load it only when you need it:

```text
/load sam3
```

The result is an ordinary device in `.kinex/devices/sam3/`. Its profile describes each operation:

```yaml
name: sam3
type: model
operations:
  detect:
    description: "Segment a noun phrase. Input {image: image file path, prompt, min_score: default 0.25, max_results: default 10}. Output {results: [{box: [x1, y1, x2, y2] in input pixels, score, label: the prompt, mask: binary PNG path at input size}]} sorted by score."
    transport: service
    direction: input
    endpoint: /kinex/sam3/detect
    type: kinex_interfaces/srv/Json
  segment_point:
    # ... finds the object at a pixel
```

Grounding DINO (`/register grounding-dino`) has the same `detect` operation but returns boxes without masks. Its prompt is lowercase, with categories separated by `.`, such as `red mug . bowl`.

## 2. Locate an object

`helpers.locate_object_3d` connects the vision model to a camera. It reads the camera, asks the model to find the object, then uses depth to work out where it is. A minimal `exec` program:

```python
import asyncio
from kinex import communication, finish, helpers

async def main():
    async with communication() as io:
        found = await helpers.locate_object_3d(io, "wrist_cam", "sam3", "red mug")
    finish({key: found[key] for key in ("frame", "point", "label", "detection_score")},
           file=found["file"])

asyncio.run(main())
```

- **The camera** is an RGB or RGB-D camera whose color projection is calibrated (see [Onboarding & calibration](/docs/onboarding/#calibration)). An RGB-D camera supplies depth itself. For a plain RGB camera, pass a known distance along the optical axis, in metres, as `depth=`.
- **The model** is any model device with a `detect` operation, and **the prompt** describes the object in plain words.
- Optional: `min_score=` ignores weak matches (default 0.25), and `instance=` picks another match when there are several (0 is the best).

The result is a point in metres in the camera's optical frame (X right, Y down, Z forward), with the detection score. `found["file"]` is the camera image the model saw; returning it with `finish` lets the agent check the model found the right thing:

```json
{"frame": "wrist_cam/base", "point": [0.04, -0.02, 0.31], "label": "red mug", "detection_score": 0.91}
```

With a segmentation model like SAM3, depth is measured inside the object's mask; with a detection-only model, inside the central part of its box. To use the point with the arm, express it in the arm's frame with `helpers.relative_pose`.

## 3. Combine perception and motion with `exec`

Use a Python script to locate the mug, express it in the arm's base frame, plan an approach and check where the arm ended up. This example assumes the arm's base Z axis points up and that quaternion `[1, 0, 0, 0]` (x, y, z, w) points its tip link down. Review that orientation, the clearance and the full path for your setup before motion.

```python
import asyncio
from kinex import communication, finish, helpers

async def main():
    arm = helpers.joint_model("arm")
    async with communication() as io:
        state = io.subscribe("arm.joint_state", depth=1)
        found = await helpers.locate_object_3d(io, "wrist_cam", "sam3", "red mug")
        mug = await helpers.relative_pose(
            io, {"frame": found["frame"], "pose": [*found["point"], 0, 0, 0, 1]},
            {"frame": "arm:base"}, timestamp=found["timestamp"])
        x, y, z = mug["pose"][:3]
        goal = [x, y, z + 0.10, 1, 0, 0, 0]  # 10 cm above the mug, tip link down
        measured = await state.next(timeout_s=2)
        start = [dict(zip(measured.name, measured.position))[n] for n in arm.names]
        target = arm.ik(goal, start)
        plan = helpers.trajectory(arm.joints, start, target, period_s=0.01, fraction=0.15)
        points = []
        for i, q in enumerate(plan.actions, start=1):
            t = i * plan.duration_s / len(plan.actions)
            points.append({"positions": list(q),
                           "time_from_start": {"sec": int(t), "nanosec": int(t % 1 * 1e9)}})
        await io.publish("arm.joint_target", {"joint_names": arm.names, "points": points})
        await io.request("world.wait", duration_s=plan.duration_s)
        after = helpers.save_image((await helpers.camera_frame(io, "wrist_cam"))[0])
    finish({"goal": goal, "detection_score": found["detection_score"]},
           file=[found["file"], after])

asyncio.run(main())
```

The script returns the image the mug was found in and the image after the motion, so the agent can check the result before it continues. If the mug can't be found, `helpers.locate_object_3d` raises an error before any motion.

The same pattern runs a policy model instead of a vision model; see [Using VLAs](/docs/vla/).

## Bring your own model

To use a vision model that isn't bundled, register a `model` device and describe it to the agent:

```text
/register model my-detector served at http://gpu-box:8000, API key in DET_API_KEY
```

If it serves a JSON `detect` operation like SAM3's (an image path and a prompt in, scored boxes out), `helpers.locate_object_3d` and programs built on it work unchanged.
