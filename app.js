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

    // Lightweight material tuning for a more consistent architectural finish on Quest.
    function tuneModelMaterials(root) {
        if (!root) return;
        root.traverse((node) => {
            if (!node.isMesh) return;
            node.frustumCulled = true;
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach((material) => {
                if (!material) return;
                if (material.map) {
                    material.map.colorSpace = THREE.SRGBColorSpace;
                    const maxAnisotropy = scene.renderer && scene.renderer.capabilities
                        ? scene.renderer.capabilities.getMaxAnisotropy() : 1;
                    material.map.anisotropy = Math.min(4, maxAnisotropy);
                    material.map.needsUpdate = true;
                }
                if ('roughness' in material && material.roughness < 0.12) material.roughness = 0.12;
                if ('metalness' in material) material.metalness = Math.min(material.metalness, 0.8);
                material.needsUpdate = true;
            });
        });
    }

    // 1. Model Status Event Listeners
    marketModel.addEventListener('model-loaded', () => {
        tuneModelMaterials(marketModel.getObject3D('mesh'));
        if (placeholderMarket) placeholderMarket.setAttribute('visible', 'false');
        statusBadge.textContent = 'Ready · PBR tuned';
        const mesh = marketModel.getObject3D('mesh');
        if (mesh) {
            const box = new THREE.Box3().setFromObject(mesh);
            const size = box.getSize(new THREE.Vector3());
            heroModelStatus.title = `Model bounds: ${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)} world units`;
        }
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

    // 3. Lightweight procedural market soundscape. Starts only after a user gesture.
    // This avoids downloading large audio files and works on static GitHub Pages.
    let ambienceStarted = false;
    async function toggleAmbientSound() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            audioState.textContent = 'AUDIO UNSUPPORTED';
            return;
        }

        if (!audioCtx) {
            audioCtx = new AudioContextClass();
            const master = audioCtx.createGain();
            master.gain.value = 0.0001;
            master.connect(audioCtx.destination);

            // Soft distant crowd / room tone from filtered noise, kept intentionally subtle.
            const bufferSize = audioCtx.sampleRate * 3;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            let last = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                last = (last + 0.035 * white) / 1.035;
                data[i] = last * 3.5;
            }
            const crowd = audioCtx.createBufferSource();
            crowd.buffer = noiseBuffer;
            crowd.loop = true;
            const crowdFilter = audioCtx.createBiquadFilter();
            crowdFilter.type = 'bandpass';
            crowdFilter.frequency.value = 480;
            crowdFilter.Q.value = 0.55;
            const crowdGain = audioCtx.createGain();
            crowdGain.gain.value = 0.22;
            crowd.connect(crowdFilter);
            crowdFilter.connect(crowdGain);
            crowdGain.connect(master);
            crowd.start();

            // Gentle low-frequency urban market bed, not a harsh white-noise loop.
            const hum = audioCtx.createOscillator();
            hum.type = 'sine';
            hum.frequency.value = 58;
            const humGain = audioCtx.createGain();
            humGain.gain.value = 0.018;
            hum.connect(humGain);
            humGain.connect(master);
            hum.start();

            audioCtx.__marketMaster = master;
            audioCtx.__marketSources = [crowd, hum];
            ambienceStarted = true;
        }

        if (audioCtx.state === 'suspended') await audioCtx.resume();
        const isPlaying = audioCtx.state === 'running' && audioCtx.__marketMaster.gain.value > 0.001;
        audioCtx.__marketMaster.gain.cancelScheduledValues(audioCtx.currentTime);
        audioCtx.__marketMaster.gain.setTargetAtTime(isPlaying ? 0.0001 : 0.72, audioCtx.currentTime, 0.18);
        audioState.textContent = isPlaying ? 'AMBIENCE OFF' : 'MARKET AMBIENCE ON';
        audioState.style.color = isPlaying ? '' : '#34d399';
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

    // Keep orbit camera out of the way when the user enters immersive VR.
    scene.addEventListener('enter-vr', () => {
        stopDroneOrbit();
        if (audioCtx && audioCtx.state === 'running') {
            audioState.textContent = 'MARKET AMBIENCE ON';
        }
    });

    // Recenter to a comfortable eye-level spawn, with a predictable forward view.
    scene.addEventListener('exit-vr', () => {
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
        statusBadge.textContent = 'Loading File…';
        statusBadge.className = 'badge loading';
        marketModel.setAttribute('gltf-model', url);
        heroModelStatus.textContent = file.name;
        marketModel.addEventListener('model-loaded', () => URL.revokeObjectURL(url), { once: true });
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
        { name: 'Coastal Daylight', sky: '#b8d4e8', ambient: '#e7f0ff', ambInt: 0.72, ground: '#716354', sun: '#fff0d7', sunInt: 1.35, sunPos: '25 45 30', fill: 0.22 },
        { name: 'Golden Hour', sky: '#e9b995', ambient: '#f4c9a1', ambInt: 0.58, ground: '#735342', sun: '#ffb66d', sunInt: 1.45, sunPos: '40 10 -25', fill: 0.16 },
        { name: 'Blue Hour', sky: '#202d49', ambient: '#9bb9df', ambInt: 0.38, ground: '#393b48', sun: '#ffd09a', sunInt: 0.52, sunPos: '10 20 10', fill: 0.3 },
        { name: 'Warm Market Evening', sky: '#453d39', ambient: '#f0c7a1', ambInt: 0.46, ground: '#3b3028', sun: '#ffcf8b', sunInt: 0.78, sunPos: '-8 14 12', fill: 0.24 }
    ];
    let lightIdx = 0;

    // Blend between lighting states rather than snapping instantly. This feels more like a
    // cinematographer changing the time of day and avoids a harsh visual jump in VR.
    function transitionLighting(mode) {
        const skyEl = document.getElementById('sky');
        const ambientEl = document.getElementById('ambient-light');
        const sunEl = document.getElementById('sun-light');
        const fillEl = document.getElementById('fill-light');
        const start = {
            sky: new THREE.Color(skyEl.getAttribute('color')),
            ambient: new THREE.Color(ambientEl.getAttribute('color')),
            ground: new THREE.Color(ambientEl.getAttribute('groundColor')),
            sun: new THREE.Color(sunEl.getAttribute('color')),
            ambInt: Number(ambientEl.getAttribute('intensity')) || 0,
            sunInt: Number(sunEl.getAttribute('intensity')) || 0,
            fill: Number(fillEl.getAttribute('intensity')) || 0,
            sunPos: sunEl.getAttribute('position')
        };
        const end = {
            sky: new THREE.Color(mode.sky),
            ambient: new THREE.Color(mode.ambient),
            ground: new THREE.Color(mode.ground),
            sun: new THREE.Color(mode.sun),
            ambInt: mode.ambInt,
            sunInt: mode.sunInt,
            fill: mode.fill,
            sunPos: mode.sunPos.split(/\s+/).map(Number)
        };
        const endPosition = new THREE.Vector3(end.sunPos[0], end.sunPos[1], end.sunPos[2]);
        const startPosition = new THREE.Vector3(start.sunPos.x, start.sunPos.y, start.sunPos.z);
        const began = performance.now();
        const duration = 1100;
        const colorHex = (a, b, t) => '#' + a.clone().lerp(b, t).getHexString();
        function tick(now) {
            const raw = Math.min(1, (now - began) / duration);
            const t = 1 - Math.pow(1 - raw, 3);
            skyEl.setAttribute('color', colorHex(start.sky, end.sky, t));
            ambientEl.setAttribute('color', colorHex(start.ambient, end.ambient, t));
            ambientEl.setAttribute('groundColor', colorHex(start.ground, end.ground, t));
            sunEl.setAttribute('color', colorHex(start.sun, end.sun, t));
            ambientEl.setAttribute('intensity', start.ambInt + (end.ambInt - start.ambInt) * t);
            sunEl.setAttribute('intensity', start.sunInt + (end.sunInt - start.sunInt) * t);
            fillEl.setAttribute('intensity', start.fill + (end.fill - start.fill) * t);
            const p = startPosition.clone().lerp(endPosition, t);
            sunEl.setAttribute('position', { x: p.x, y: p.y, z: p.z });
            if (raw < 1) requestAnimationFrame(tick);
            else fillEl.setAttribute('visible', mode.fill > 0);
        }
        fillEl.setAttribute('visible', true);
        requestAnimationFrame(tick);
    }

    btnLighting.addEventListener('click', () => {
        lightIdx = (lightIdx + 1) % lightingModes.length;
        const mode = lightingModes[lightIdx];
        btnLighting.textContent = `Lighting: ${mode.name}`;
        transitionLighting(mode);
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
