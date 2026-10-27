# The Grand Market — Poorna Market WebXR Viewer

An A-Frame / Three.js architectural walkthrough designed for desktop browsers and Meta Quest through WebXR. It includes PBR material tuning, four lighting moods, desktop orbit mode, free movement, trigger-based teleport, responsive controls and a lightweight procedural ambience toggle.

## Run the experience

1. Keep your model at `models/market-model.glb`.
2. Enable GitHub Pages in **Settings → Pages → Deploy from a branch → main / root**.
3. Open the published HTTPS site. WebXR requires a compatible browser and a secure context; on Quest, open the site in the Meta Quest Browser.
4. Select **Enter Walkthrough** for desktop/mobile or **Enter VR Headset** while using a compatible headset.

## Quest controls

- **Left thumbstick:** walk using A-Frame movement controls.
- **Right controller trigger:** aim and teleport to a teleportable surface.
- **Controls panel:** adjust model scale/ground offset, walking speed, lighting mood, environment and performance stats.
- **Market ambience:** optional procedural, low-volume audio; it starts only after a user gesture.

The model itself needs sensible geometry, UVs and texture maps for high-fidelity results. The viewer can tune existing materials, but it cannot invent missing texture detail or correct an incorrectly authored model.

## Optimize the GLB for Meta Quest

The repository includes a manual GitHub Actions workflow that compresses the model using glTF Transform / Draco and returns it as a downloadable artifact. This avoids replacing the source model automatically.

1. Open the repository's **Actions** tab.
2. Select **Optimize 3D model**, then **Run workflow**.
3. When it finishes, download the `market-model-optimized` artifact.
4. Test the optimized file locally and in Quest. If it looks correct, replace `models/market-model.glb` with the optimized GLB (rename it to `market-model.glb`) and commit it.

You can also run the optimizer locally with Node.js 20+:

```bash
npm install
npm run optimize:model
```

This creates `models/market-model-optimized.glb` without overwriting the original. Compression can reduce download size but adds decode work; always compare visual quality and loading time on the target headset. Keep a backup of the source model.

## Performance notes

- Avoid adding expensive post-processing (SSAO, bloom or multiple real-time shadow lights) before profiling on Quest.
- Draco optimizes geometry payload size; texture compression such as KTX2/Basis may be a separate step for models dominated by large textures.
- Verify the final experience on the actual headset. Desktop FPS alone is not a reliable indicator of immersive VR performance.
