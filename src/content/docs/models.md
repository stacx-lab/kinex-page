---
title: Using models
description: Add a detector, a segmenter or a vision-language-action policy as a model device, and call it from a program that turns its output into motion.
group: Guides
order: 50
label: Using models
sources: ["docs/devices.md", "docs/communication.md", "packages/core/assets/builtin/device/templates/model/DEVICE.md", "packages/core/assets/builtin/device/sam3/DEVICE.md", "packages/core/assets/builtin/device/grounding-dino/DEVICE.md", "packages/core/assets/builtin/device/fastwam/DEVICE.md", "packages/core/assets/python/kinex/lib/images.py", "packages/core/assets/python/kinex/lib/frames.py"]
---

The agent reasons about the task. For "where exactly is the red mug?" or "what would a trained policy do next?", it calls a specialist: a vision model or a vision-language-action model (VLA). In Kinex these are not agents. They are [model devices](/docs/devices/#model-devices) that a program calls like any other device, and the agent decides what to do with the answer.

| Bundled model | Kind | Operations |
| --- | --- | --- |
| [SAM3](https://huggingface.co/facebook/sam3) | Open-vocabulary segmentation | `detect` (text prompt), `segment_point` (pixel prompt) |
| [Grounding DINO](https://huggingface.co/IDEA-Research/grounding-dino-tiny) | Open-vocabulary detection | `detect` |
| [FastWAM](https://github.com/yuantianyuan01/FastWAM) | Action policy for LIBERO and RoboTwin | `infer` |

## Add a model device

Tell `/register` which model and where to run it:

```text
/register sam3 on cuda:0
/register grounding-dino on cpu
/register fastwam libero_uncond_2cam224 on cuda:0
```

The agent installs the model into the device's own folder, downloads its weights, writes the profile and leaves the device unloaded. Loading places the model on its GPU or CPU, so load it when you need it and unload it to free the memory:

```text
/load sam3
```

- **SAM3** weights are gated. Request access at [facebook/sam3](https://huggingface.co/facebook/sam3) and make a token available as `HF_TOKEN` first.
- **FastWAM** needs a CUDA GPU and downloads about 26 GB. Its variants are `libero_uncond_2cam224`, `libero_optional_idm_2cam224` and `robotwin_uncond_3cam_384`.

The profile states each operation's contract in its description. This is SAM3's `detect`:

```yaml
operations:
  detect:
    description: "Segment a noun phrase. Input {image: image file path, prompt, min_score: default 0.25, max_results: default 10}. Output {results: [{box: [x1, y1, x2, y2] in input pixels, score, label: the prompt, mask: binary PNG path at input size}]} sorted by score."
    transport: service
    direction: input
    endpoint: /kinex/sam3/detect
    type: custom_interfaces/srv/Json
```

Model operations exchange JSON, so a program calls one with keyword arguments and gets a dict back. Images travel as file paths.

## Find an object in 3D

This program asks SAM3 for the mug, measures its depth inside the mask and expresses the point in the arm's base frame. It assumes an RGB-D camera whose depth is registered to its color image:

```python
import asyncio
import numpy as np
from PIL import Image
from kinex import finish, io, lib, profile

CAMERA = "camera_wrist"

async def main():
    image, depth = await lib.images.camera_frame(CAMERA)
    found = await io.request("sam3.detect", prompt="red mug",
                             image=lib.images.save_image(image))
    if not found["results"]:
        finish({"found": False}, file=[image])
    best = found["results"][0]

    mask = np.asarray(Image.open(best["mask"])) > 0
    metres = lib.images.image_array(depth) * profile(CAMERA)["depth"]["scale_m_per_unit"]
    z = float(np.median(metres[mask & (metres > 0)]))     # depth of the mug
    v, u = np.argwhere(mask).mean(axis=0)                 # its centre pixel

    geometry = await lib.images.camera_geometry(CAMERA)
    ray = (await geometry.unproject([[u, v]]))[0]         # optical ray with Z = 1
    to_arm = await lib.frames.lookup_transform("arm:base", image.header.frame_id, image)
    finish({"found": True, "score": best["score"],
            "mug_in_arm_base": to_arm.apply(ray * z)}, file=[image])

asyncio.run(main())
```

Three things make the result trustworthy:

- **The frame lookup is stamped.** Passing `image` asks where the camera was when the picture was taken, which matters for a wrist camera on a moving arm.
- **The image comes back.** The agent sees what the model saw and can reject a wrong match before anything moves.
- **Nothing moves here.** Perception and motion can be separate programs when the agent wants to look at the answer first, or one program when it is confident.

Grounding DINO's `detect` takes the same inputs and returns boxes without masks. Its prompt is lowercase, with categories separated by `.`, such as `red mug . bowl`. With boxes only, sample depth in the middle of the box.

## Run a policy

A VLA predicts a short sequence of actions from camera images, the robot's state and an instruction. The model only predicts; a program decides how many of those actions to execute before asking again.

This program assumes a model device named `policy` whose `infer` returns rows of absolute joint positions followed by a gripper position. It runs five short chunks, then returns both camera views for the agent to assess:

```python
import asyncio
from kinex import args, finish, io, lib

CAMERAS = ("camera_scene", "camera_wrist")
HZ = 10        # the control rate the policy was trained at
STEPS = 8      # actions to execute before predicting again

async def views():
    return [(await lib.images.camera_frame(camera))[0] for camera in CAMERAS]

async def main():
    arm = lib.kinematics.joint_model("arm")
    for chunk in range(5):
        state = await io.read("arm.joint_state")
        reply = await io.request("policy.infer", task=args()["task"], obs={
            "images": [lib.images.save_image(image) for image in await views()],
            "state": list(state.position)})
        for *joints, grip in reply["actions"][:STEPS]:
            await io.publish("arm.joint_target", {"joint_names": arm.names, "points": [
                {"positions": joints, "time_from_start": 1 / HZ}]})
            await io.publish("gripper.target", {"data": grip})
            await io.request("world.wait", duration_s=1 / HZ)
    await io.request("world.wait", duration_s=0.5)        # let the last action settle
    finish({"chunks": chunk + 1}, file=await views())

asyncio.run(main())
```

Executing only the first few actions of each chunk keeps the robot on fresh predictions instead of a stale plan. In a stepped simulation, the world stands still while the model thinks.

Every policy has its own contract, so read its `infer` description and adapt the program. FastWAM's LIBERO variants, for example, take two camera images and an 8-value state, and return 32 actions of end-effector deltas plus a gripper command. A program turns those into `pose_target` commands on an arm that accepts them, or into joint targets through `lib.kinematics`.

A good way to work with a policy is in segments: ask the agent to run a short stretch, look at the returned images and decide whether to continue, correct by hand-written motion or stop.

## Bring your own model

Any model becomes a device the same way. Describe it to the agent:

```text
/register model my-detector served at http://gpu-box:8000, API key in DET_API_KEY
```

The agent writes a node that serves each operation as a JSON service and a profile that documents the fields. Keep credentials in environment variables, not in profiles. If your detector's `detect` matches SAM3's contract, programs written for one work with the other.
