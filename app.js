document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    const curtain = document.getElementById('cinematic-curtain');
    const btnEnterExplore = document.getElementById('btn-enter-explore');
    const btnEnterVR = document.getElementById('btn-enter-vr-direct');
    const heroModelStatus = document.getElementById('hero-model-status');

    const rig = document.getElementById('rig');
    const marketModel = document.getElementById('market-model');
    const marketContainer = document.getElementById('market-container');
    const placeholderMarket = document.getElementById('placeholder-market');
    const statusBadge = document.getElementById('status-badge');

    const scaleSlider = document.getElementById('scale-slider');
    const scaleVal = document.getElementById('scale-val');
    const ySlider = document.getElementById('y-slider');
    const yVal = document.getElementById('y-val');
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');

    const btnCenter = document.getElementById('btn-center');
    const btnDroneCam = document.getElementById('btn-drone-cam');
    const btnLighting = document.getElementById('btn-lighting');
    const btnEnvToggle = document.getElementById('btn-env-toggle');
    const btnStatsToggle = document.getElementById('btn-stats-toggle');
    const glbUpload = document.getElementById('glb-upload');
    const toggleHud = document.getElementById('toggle-hud');
    const hud = document.getElementById('hud');

    const dockBtnRecenter = document.getElementById('dock-btn-recenter');
    const dockBtnFly = document.getElementById('dock-btn-fly');
    const dockBtnMenu = document.getElementById('dock-btn-menu');
    const btnAudioToggle = document.getElementById('btn-audio-toggle');
    const audioState = document.getElementById('audio-state');

    let audioCtx = null;
    let isDroneMode = false;
    let droneAngle = 0;
    let droneAnimFrame = null;
    let envActive = false;
    let statsActive = false;

    // 1. Model Status Event Listeners
    marketModel.addEventListener('model-loaded', () => {
        if (placeholderMarket) placeholderMarket.setAttribute('visible', 'false');
        statusBadge.textContent = 'Ready';
        statusBadge.className = 'badge ready';
        heroModelStatus.textContent = 'Custom .GLB Ready';
        heroModelStatus.style.color = '#34d399';
    });

    marketModel.addEventListener('model-error', () => {
        if (placeholderMarket) placeholderMarket.setAttribute('visible', 'true');
        statusBadge.textContent = 'Awaiting Model';
        statusBadge.className = 'badge placeholder';
        heroModelStatus.textContent = 'Awaiting models/market-model.glb';
        heroModelStatus.style.color = '#fdba74';
    });

    // 2. Cinematic Camera Fly-in Transition
    function triggerCinematicFlyIn(onComplete) {
        const startPos = { x: 0, y: 18, z: 35 };
        const endPos = { x: 0, y: 0, z: 6 };
        const startRot = { x: -22, y: 0, z: 0 };
        const endRot = { x: 0, y: 0, z: 0 };
        
        const duration = 2400; // ms
        const startTime = performance.now();

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function animate(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeOutCubic(progress);

            const curX = startPos.x + (endPos.x - startPos.x) * ease;
            const curY = startPos.y + (endPos.y - startPos.y) * ease;
            const curZ = startPos.z + (endPos.z - startPos.z) * ease;
            rig.setAttribute('position', `${curX} ${curY} ${curZ}`);

            const curRotX = startRot.x + (endRot.x - startRot.x) * ease;
            rig.setAttribute('rotation', `${curRotX} 0 0`);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (onComplete) onComplete();
            }
        }

        requestAnimationFrame(animate);
    }

    // 3. Ambient Audio Synthesizer
    function toggleAmbientSound() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();

            const bufferSize = audioCtx.sampleRate * 2;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const whiteNoise = audioCtx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320, audioCtx.currentTime);

            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.045, audioCtx.currentTime);

            whiteNoise.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            whiteNoise.start(0);

            audioState.textContent = 'AMBIENT ON';
            audioState.style.color = '#34d399';
        } else {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
                audioState.textContent = 'AMBIENT ON';
                audioState.style.color = '#34d399';
            } else if (audioCtx.state === 'running') {
                audioCtx.suspend();
                audioState.textContent = 'AMBIENT OFF';
                audioState.style.color = '';
            }
        }
    }

    btnAudioToggle.addEventListener('click', toggleAmbientSound);

    // 4. Start Walkthrough Button Trigger
    btnEnterExplore.addEventListener('click', () => {
        curtain.classList.add('fade-out');
        triggerCinematicFlyIn();
    });

    // 5. Enter VR Headset Direct
    btnEnterVR.addEventListener('click', () => {
        curtain.classList.add('fade-out');
        rig.setAttribute('position', '0 0 6');
        rig.setAttribute('rotation', '0 0 0');
        if (scene.enterVR) {
            scene.enterVR();
        }
    });

    // 6. Drone Orbit Camera Mode
    function startDroneOrbit() {
        isDroneMode = true;
        cancelAnimationFrame(droneAnimFrame);

        function orbitLoop() {
            if (!isDroneMode) return;
            droneAngle += 0.003;
            const radius = 32;
            const x = Math.sin(droneAngle) * radius;
            const z = Math.cos(droneAngle) * radius;
            rig.setAttribute('position', `${x} 15 ${z}`);
            
            const rotY = (droneAngle * 180 / Math.PI) + 180;
            rig.setAttribute('rotation', `-18 ${rotY} 0`);
            droneAnimFrame = requestAnimationFrame(orbitLoop);
        }
        orbitLoop();
    }

    function stopDroneOrbit() {
        if (isDroneMode) {
            isDroneMode = false;
            cancelAnimationFrame(droneAnimFrame);
            rig.setAttribute('rotation', '0 0 0');
        }
    }

    btnDroneCam.addEventListener('click', () => {
        if (!isDroneMode) {
            startDroneOrbit();
            btnDroneCam.textContent = 'Stop Orbit Cam';
        } else {
            stopDroneOrbit();
            btnDroneCam.textContent = 'Cinematic Drone Cam';
        }
    });

    dockBtnFly.addEventListener('click', () => {
        if (!isDroneMode) {
            startDroneOrbit();
            dockBtnFly.textContent = 'Exit Orbit';
        } else {
            stopDroneOrbit();
            dockBtnFly.textContent = 'Orbit Cam';
        }
    });

    dockBtnRecenter.addEventListener('click', () => {
        stopDroneOrbit();
        rig.setAttribute('position', '0 0 6');
        rig.setAttribute('rotation', '0 0 0');
    });

    // 7. HUD Toggle & Controls
    toggleHud.addEventListener('click', () => {
        hud.classList.toggle('hud-collapsed');
    });
    dockBtnMenu.addEventListener('click', () => {
        hud.classList.toggle('hud-collapsed');
    });

    // Local GLB Upload Preview
    glbUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        statusBadge.textContent = 'Loading File...';
        statusBadge.className = 'badge loading';
        marketModel.setAttribute('gltf-model', url);
        heroModelStatus.textContent = file.name;
    });

    // Sliders
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

    // Auto-Center Mesh
    btnCenter.addEventListener('click', () => {
        const mesh = marketModel.getObject3D('mesh');
        if (!mesh) return;
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        marketContainer.setAttribute('position', {
            x: -center.x,
            y: -box.min.y,
            z: -center.z
        });
        ySlider.value = (-box.min.y).toFixed(1);
        yVal.textContent = (-box.min.y).toFixed(1);
    });

    // Atmosphere Lighting Switcher
    const lightingModes = [
        { name: 'Daylight', sky: '#cbe4f9', ambient: '#ffffff', ambInt: 0.85, sun: '#fff7e6', sunInt: 1.5, sunPos: '25 45 30' },
        { name: 'Golden Hour', sky: '#fed7aa', ambient: '#fdba74', ambInt: 0.7, sun: '#f97316', sunInt: 1.8, sunPos: '40 10 -25' },
        { name: 'Dusk Market', sky: '#0f172a', ambient: '#38bdf8', ambInt: 0.35, sun: '#fde047', sunInt: 0.6, sunPos: '10 20 10' }
    ];
    let lightIdx = 0;

    btnLighting.addEventListener('click', () => {
        lightIdx = (lightIdx + 1) % lightingModes.length;
        const mode = lightingModes[lightIdx];
        btnLighting.textContent = `Atmosphere: ${mode.name}`;
        document.getElementById('sky').setAttribute('color', mode.sky);
        document.getElementById('ambient-light').setAttribute('color', mode.ambient);
        document.getElementById('ambient-light').setAttribute('intensity', mode.ambInt);
        document.getElementById('sun-light').setAttribute('color', mode.sun);
        document.getElementById('sun-light').setAttribute('intensity', mode.sunInt);
        document.getElementById('sun-light').setAttribute('position', mode.sunPos);
    });

    // Procedural 3D Horizon Plugin Toggle
    btnEnvToggle.addEventListener('click', () => {
        envActive = !envActive;
        const envEl = document.getElementById('procedural-env');
        const skyEl = document.getElementById('sky');
        if (envActive) {
            envEl.setAttribute('environment', 'active: true; preset: yavapai; ground: none');
            skyEl.setAttribute('visible', 'false');
            btnEnvToggle.textContent = '3D Horizon: On';
        } else {
            envEl.setAttribute('environment', 'active: false');
            skyEl.setAttribute('visible', 'true');
            btnEnvToggle.textContent = '3D Horizon: Off';
        }
    });

    // VR Performance / FPS Stats Monitor Toggle
    btnStatsToggle.addEventListener('click', () => {
        statsActive = !statsActive;
        if (statsActive) {
            scene.setAttribute('stats', '');
            btnStatsToggle.textContent = 'Hide FPS / Performance Stats';
        } else {
            scene.removeAttribute('stats');
            btnStatsToggle.textContent = 'FPS / VR Performance Stats';
        }
    });
});
