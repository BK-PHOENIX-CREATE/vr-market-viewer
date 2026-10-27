# VR Market Viewer (WebXR)

Interactive 3D architectural market viewer built with **A-Frame (Three.js + WebXR)** for VR headsets (Meta Quest, Apple Vision Pro, HTC Vive, PCVR) and desktop browsers.

## Folder Structure

```text
vr-market-viewer/
├── index.html          # Main WebXR scene & HUD interface
├── style.css           # Styling for the on-screen control menu
├── app.js              # Model centering, scale, lighting & VR locomotion logic
├── .nojekyll           # Ensures GitHub Pages serves all static assets properly
├── models/
│   └── market-model.glb # <-- Place your converted .glb file here!
└── README.md
```

## Quick Start Steps

1. **Add Your 3D Model:**
   * Convert your 3D market model to `.glb` format.
   * Name the file **`market-model.glb`** and upload it inside the **`models/`** folder.
   * *(Tip: You can also test any `.glb` file immediately before uploading by clicking **"Test Local .GLB File Instantaneously"** in the top-left menu!)*

2. **Delete Old `index` File (Important):**
   * In your initial repository commit, there was a file named `index` without `.html`. Make sure to delete `index` and keep **`index.html`**.

3. **Enable GitHub Pages:**
   * Go to **Settings > Pages** in your GitHub repository.
   * Set **Source** to **Deploy from a branch**, select **`main`** and **`/ (root)`**, and click **Save**.

4. **Explore in VR:**
   * Open your GitHub Pages link inside your VR headset browser and click the **"VR"** button in the bottom-right corner.
