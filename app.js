document.addEventListener('DOMContentLoaded', () => {
    const marketModel = document.getElementById('market-model');
    const marketContainer = document.getElementById('market-container');
    const placeholderMarket = document.getElementById('placeholder-market');
    const statusBadge = document.getElementById('status-badge');
    const rig = document.getElementById('rig');

    const scaleSlider = document.getElementById('scale-slider');
    const scaleVal = document.getElementById('scale-val');
    const ySlider = document.getElementById('y-slider');
    const yVal = document.getElementById('y-val');
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');

    const btnCenter = document.getElementById('btn-center');
    const btnResetPos = document.getElementById('btn-reset-pos');
    const btnLighting = document.getElementById('btn-lighting');
    const glbUpload = document.getElementById('glb-upload');
    const toggleHud = document.getElementById('toggle-hud');
    const showHud = document.getElementById('show-hud');
    const hud = document.getElementById('hud');

    // 1. Model Load & Error Handling
    marketModel.addEventListener('model-loaded', () => {
        placeholderMarket.setAttribute('visible', 'false');
        statusBadge.textContent = 'GLB Loaded';
        statusBadge.className = 'badge ready';
        console.log('Market 3D model loaded successfully.');
    });

    marketModel.addEventListener('model-error', () => {
        placeholderMarket.setAttribute('visible', 'true');
        statusBadge.textContent = 'Awaiting GLB File';
        statusBadge.className = 'badge placeholder';
        console.warn('models/market-model.glb not found yet. Showing preview stall.');
    });

    // 2. Instant Local .GLB File Drag/Upload Testing
    glbUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        statusBadge.textContent = 'Loading Local GLB...';
        statusBadge.className = 'badge loading';
        marketModel.setAttribute('gltf-model', url);
    });

    // 3. Scale, Elevation & Walk Speed Controls
    scaleSlider.addEventListener('input', (e) => {
        const s = parseFloat(e.target.value);
        scaleVal.textContent = s.toFixed(2);
        marketContainer.setAttribute('scale', `${s} ${s} ${s}`);
    });

    ySlider.addEventListener('input', (e) => {
        const y = parseFloat(e.target.value);
        yVal.textContent = y.toFixed(1);
        const pos = marketContainer.getAttribute('position');
        marketContainer.setAttribute('position', { x: pos.x, y: y, z: pos.z });
    });

    speedSlider.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        speedVal.textContent = speed.toFixed(2);
        rig.setAttribute('movement-controls', `speed: ${speed}; fly: false`);
    });

    // 4. Keyboard Q/E Vertical Elevation Adjustment for Architectural Review
    window.addEventListener('keydown', (e) => {
        const pos = rig.getAttribute('position');
        if (e.key === 'e' || e.key === 'E') {
            rig.setAttribute('position', { x: pos.x, y: pos.y + 0.3, z: pos.z });
        } else if (e.key === 'q' || e.key === 'Q') {
            rig.setAttribute('position', { x: pos.x, y: Math.max(0, pos.y - 0.3), z: pos.z });
        }
    });

    // 5. Auto-Center & Align Model to Ground (Fixes CAD/BIM off-origin exports)
    btnCenter.addEventListener('click', () => {
        const mesh = marketModel.getObject3D('mesh');
        if (!mesh) return;
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Move container so model center is at X=0, Z=0 and bottom sits on Y=0
        marketContainer.setAttribute('position', {
            x: -center.x,
            y: -box.min.y,
            z: -center.z
        });
        ySlider.value = (-box.min.y).toFixed(1);
        yVal.textContent = (-box.min.y).toFixed(1);
        console.log('Model centered. Dimensions (m):', size);
    });

    // 6. Reset Player Spawn Position
    btnResetPos.addEventListener('click', () => {
        rig.setAttribute('position', { x: 0, y: 0, z: 5 });
    });

    // 7. Lighting Presets (Daylight / Golden Hour / Night Market)
    const lightingModes = [
        { name: 'Daylight', sky: '#d8ecf8', ambient: '#ffffff', ambInt: 0.9, sun: '#fff6e5', sunInt: 1.4, sunPos: '15 30 20' },
        { name: 'Golden Hour', sky: '#fdba74', ambient: '#fed7aa', ambInt: 0.65, sun: '#fb923c', sunInt: 1.6, sunPos: '35 8 -15' },
        { name: 'Night Market', sky: '#0f172a', ambient: '#38bdf8', ambInt: 0.35, sun: '#fde047', sunInt: 0.6, sunPos: '5 15 5' }
    ];
    let currentLight = 0;

    btnLighting.addEventListener('click', () => {
        currentLight = (currentLight + 1) % lightingModes.length;
        const mode = lightingModes[currentLight];
        btnLighting.textContent = `Lighting: ${mode.name}`;
        document.getElementById('sky').setAttribute('color', mode.sky);
        document.getElementById('ambient-light').setAttribute('color', mode.ambient);
        document.getElementById('ambient-light').setAttribute('intensity', mode.ambInt);
        document.getElementById('sun-light').setAttribute('color', mode.sun);
        document.getElementById('sun-light').setAttribute('intensity', mode.sunInt);
        document.getElementById('sun-light').setAttribute('position', mode.sunPos);
    });

    // 8. Toggle HUD Menu
    toggleHud.addEventListener('click', () => {
        hud.classList.add('hidden');
        showHud.classList.remove('hidden');
    });
    showHud.addEventListener('click', () => {
        hud.classList.remove('hidden');
        showHud.classList.add('hidden');
    });
});
