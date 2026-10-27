# The Grand Market — Cinematic WebXR / VR Experience

An interactive 3D architectural market walkthrough built with **A-Frame 1.6.0 (Three.js + WebXR)** for VR headsets (Meta Quest, Apple Vision Pro, PCVR) and desktop browsers.

## All Included Files & Plugins

```text
vr-market-viewer/
├── index.html                           # Cinematic landing screen, HUD & WebXR 3D scene
├── style.css                            # Letterbox widescreen UI, film grain & glassmorphism
├── app.js                               # Camera drone fly-in, orbit cam, audio & VR controls
├── .nojekyll                            # Bypasses Jekyll processing on GitHub Pages
├── .gitattributes                       # Configures Git LFS for large .glb files
├── .github/
│   └── workflows/
│       └── optimize-3d.yml              # GitHub Action: Auto-compresses .glb with Draco
├── models/
│   └── PUT_YOUR_market-model.glb_HERE.txt
└── README.md
```

## Quick Deployment Checklist

1. **Add Your 3D Model:**
   * Convert your 3D market model to `.glb`.
   * Rename it to **`market-model.glb`** and place it inside the **`models/`** folder.
2. **Upload to GitHub:**
   * Upload all files and folders from this package to your `vr-market-viewer` repository root.
   * Make sure to delete the old extensionless `index` file if it is still in your repo.
3. **Enable GitHub Pages:**
   * Go to **Settings > Pages** in your repository, set **Source** to **Deploy from a branch** (`main` / `root`), and click **Save**.
