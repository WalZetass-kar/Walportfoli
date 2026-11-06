/* ═══════════════════════════════════════════════════════════
   WalZetass Portfolio — main.js
   Three.js Background · Scroll Animations · Interactions
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ───────────────────────────────────────────────
   0. RESET SCROLL ON RELOAD
   Browser sekaligus restore posisi scroll ke fragment (#about, dll)
   setiap page di-refresh. Kita buang hash-nya dan balik ke atas.
─────────────────────────────────────────────── */
(function resetScrollOnReload() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  window.addEventListener('load', function () {
    if (!location.hash) {
      window.scrollTo(0, 0);
      return;
    }
    history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo(0, 0);
  });
})();

/* ───────────────────────────────────────────────
   0B. THEME TOGGLE (DARK / LIGHT MODE + LOCALSTORAGE)
   Persists user preference across the entire site in localStorage
   under 'walzetass_theme' and notifies 3D WebGL scenes via 'themechange'.
─────────────────────────────────────────────── */
(function initThemeToggle() {
  const STORAGE_KEY = 'walzetass_theme';

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) { /* ignore storage errors */ }
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme, persist) {
    const normalized = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', normalized);

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, normalized);
      } catch (e) { /* ignore storage errors */ }
    }

    // Update <meta name="theme-color"> for browser chrome
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', normalized === 'light' ? '#f6f4ef' : '#111110');
    }

    // Update all theme toggle buttons & labels on the page
    const toggleBtns = document.querySelectorAll('#themeToggleBtn, .theme-toggle-btn');
    toggleBtns.forEach((btn) => {
      const isLight = normalized === 'light';
      btn.setAttribute('aria-pressed', String(isLight));
      btn.setAttribute(
        'aria-label',
        isLight ? 'Beralih ke mode gelap (Dark mode)' : 'Beralih ke mode terang (Light mode)'
      );
      btn.setAttribute(
        'title',
        isLight ? 'Beralih ke Dark Mode' : 'Beralih ke Light Mode'
      );
      const label = btn.querySelector('#themeToggleLabel, .theme-toggle-label');
      if (label) {
        label.textContent = isLight ? 'Dark' : 'Light';
      }
    });

    try {
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: normalized } }));
    } catch (e) { /* fallback */ }
  }

  // Apply initial theme immediately
  const initialTheme = getSavedTheme();
  applyTheme(initialTheme, false);

  // Bind click handlers to navbar theme toggle button(s)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#themeToggleBtn, .theme-toggle-btn');
    if (!btn) return;
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next, true);
  });

  // Sync theme if changed from another open tab/page
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
      applyTheme(e.newValue, false);
    }
  });
})();

/* ───────────────────────────────────────────────
   1. THREE.JS UNIFIED 3D ENGINE (ALL 4 CONCEPTS)
   01 · Interactive 3D Topological Wave / Shader Terrain
   02 · 3D Neural / Constellation Depth Network + Scroll-Driven Camera
   03 · Floating Glass & Brushed Metal Composite Artifacts (PBR Studio)
   04 · 3D Interactive Skill Orbit / Tech Globe (#skillsGlobeCanvas)
─────────────────────────────────────────────── */
(function initThreeJsPortfolioEngine() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') {
    document.documentElement.classList.add('webgl-fallback');
    return;
  }

  // Software-WebGL detection for adaptive rendering cost & frame pacing
  const isSoftwareGl = (function detectSoftwareWebGL() {
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || '');
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch (e) {
      return false;
    }
  })();

  function setSRGB(target, isRenderer) {
    if (!target) return;
    if (isRenderer) {
      if ('outputColorSpace' in target && THREE.SRGBColorSpace) {
        target.outputColorSpace = THREE.SRGBColorSpace;
      } else if ('outputEncoding' in target && THREE.sRGBEncoding) {
        target.outputEncoding = THREE.sRGBEncoding;
      }
    } else {
      if ('colorSpace' in target && THREE.SRGBColorSpace) {
        target.colorSpace = THREE.SRGBColorSpace;
      } else if ('encoding' in target && THREE.sRGBEncoding) {
        target.encoding = THREE.sRGBEncoding;
      }
    }
  }

  // Create procedural studio environment texture via PMREMGenerator
  function createStudioEnvironment(renderer) {
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x111110);

      // Warm studio key panel
      const warmPanel = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 6),
        new THREE.MeshBasicMaterial({ color: 0xe8dcc8, side: THREE.DoubleSide })
      );
      warmPanel.position.set(6, 5, 6);
      warmPanel.lookAt(0, 0, 0);
      envScene.add(warmPanel);

      // Gold rim light strip
      const goldStrip = new THREE.Mesh(
        new THREE.PlaneGeometry(12, 2.5),
        new THREE.MeshBasicMaterial({ color: 0xc8b89a, side: THREE.DoubleSide })
      );
      goldStrip.position.set(-7, 3, -5);
      goldStrip.lookAt(0, 0, 0);
      envScene.add(goldStrip);

      // Cool overhead softbox
      const coolSoftbox = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 14),
        new THREE.MeshBasicMaterial({ color: 0x384454, side: THREE.DoubleSide })
      );
      coolSoftbox.position.set(0, 9, 0);
      coolSoftbox.rotation.x = Math.PI / 2;
      envScene.add(coolSoftbox);

      const envTexture = pmremGenerator.fromScene(envScene, 0.04).texture;
      pmremGenerator.dispose();
      return envTexture;
    } catch (e) {
      return null;
    }
  }

  // Soft circular radial particle texture (100% procedural, zero external files)
  function createSoftDotTexture() {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const gCtx = c.getContext('2d');
    const grad = gCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(244, 241, 234, 1)');
    grad.addColorStop(0.45, 'rgba(200, 184, 154, 0.65)');
    grad.addColorStop(1, 'rgba(200, 184, 154, 0)');
    gCtx.fillStyle = grad;
    gCtx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    setSRGB(tex, false);
    return tex;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.warn('WebGLRenderer unavailable:', err);
    document.documentElement.classList.add('webgl-fallback');
    canvas.style.display = 'none';
    return;
  }

  setSRGB(renderer, true);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x111110, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x111110, 0.032);

  const envMap = createStudioEnvironment(renderer);
  if (envMap) {
    scene.environment = envMap;
  }

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    120
  );
  camera.position.set(0, 0.6, 11);

  // ── Balanced 3-Point Studio Lighting Rig (Warm Key + Cool Hemisphere + Rim) ──
  const hemiLight = new THREE.HemisphereLight(0xf4f1ea, 0x1c1c1a, 0.75);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xe8dcc8, 1.45);
  keyLight.position.set(6, 8, 7);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0xc8b89a, 1.25, 28);
  rimLight.position.set(-7, -3, 4);
  scene.add(rimLight);

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 01: INTERACTIVE 3D TOPOLOGICAL WAVE / SHADER TERRAIN (SUBTLE HORIZON)
  // ════════════════════════════════════════════════════════════════════════
  const waveGroup = new THREE.Group();
  scene.add(waveGroup);

  const segX = window.innerWidth < 768 ? 32 : 48;
  const segY = window.innerWidth < 768 ? 20 : 28;
  const waveGeo = new THREE.PlaneGeometry(34, 20, segX, segY);

  const waveUniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uScroll: { value: 0 },
    uColorBase: { value: new THREE.Color(0x524c42) },
    uColorCrest: { value: new THREE.Color(0xc8b89a) }
  };

  const waveMat = new THREE.ShaderMaterial({
    uniforms: waveUniforms,
    wireframe: true,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uScroll;
      varying float vElevation;
      varying float vEdgeFade;

      // Smooth 2D harmonic wave
      float waveNoise(vec2 p) {
        float n = sin(p.x * 0.42 + uTime * 0.38) * cos(p.y * 0.38 + uTime * 0.28);
        n += 0.35 * sin(p.x * 0.8 - uTime * 0.25 + p.y * 0.5);
        return n;
      }

      void main() {
        vec3 pos = position;
        float elev = waveNoise(pos.xy * 0.55) * 0.48;

        // Subtle cursor ripple elevation
        vec2 mouseWorld = uMouse * vec2(10.0, 5.0);
        float distToMouse = distance(pos.xy, mouseWorld);
        float mouseRipple = exp(-distToMouse * 0.32) * sin(distToMouse * 1.6 - uTime * 1.8) * 0.28;
        elev += mouseRipple;

        pos.z += elev;
        vElevation = elev;

        // Radial fade at terrain perimeter so no hard edges appear
        vec2 normUv = (uv - 0.5) * 2.0;
        vEdgeFade = 1.0 - smoothstep(0.25, 0.92, length(normUv));

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColorBase;
      uniform vec3 uColorCrest;
      varying float vElevation;
      varying float vEdgeFade;

      void main() {
        float mixFactor = smoothstep(-0.4, 0.65, vElevation);
        vec3 col = mix(uColorBase, uColorCrest, mixFactor);
        float alpha = (0.045 + mixFactor * 0.085) * vEdgeFade;
        gl_FragColor = vec4(col, alpha);
      }
    `
  });

  const topoWaveMesh = new THREE.Mesh(waveGeo, waveMat);
  topoWaveMesh.rotation.x = -Math.PI * 0.42;
  topoWaveMesh.position.set(0, -4.8, -4.5);
  waveGroup.add(topoWaveMesh);

  // Keep wavePointsMat reference for theme switching but omit noisy point-grid overlay
  const wavePointsMat = new THREE.PointsMaterial({
    color: 0xe8dcc8,
    size: 0.04,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 02: CURATED CONSTELLATION DEPTH NETWORK (ORGANIZED & CALM)
  // ════════════════════════════════════════════════════════════════════════
  const neuralGroup = new THREE.Group();
  scene.add(neuralGroup);

  const isMobile = window.innerWidth < 768;
  const nodeCount = isMobile ? 28 : 48;
  const maxConnectDist = isMobile ? 2.1 : 2.55;
  const nodePositions = new Float32Array(nodeCount * 3);
  const nodeColors = new Float32Array(nodeCount * 3);
  const nodeVelocities = [];

  const colorCream = new THREE.Color(0xf4f1ea);
  const colorGold = new THREE.Color(0xc8b89a);

  // Distribute particles along a golden-angle phyllotaxis spiral with a clear center zone
  // so particles frame the hero portrait neatly instead of cluttering the middle
  for (let i = 0; i < nodeCount; i++) {
    const t = i / nodeCount;
    const angle = i * 2.399963229728653; // Golden angle in radians
    const radius = 3.2 + Math.sqrt(t) * 9.5; // Clear inner radius 3.2 around center portrait
    const x = Math.cos(angle) * radius * 1.15;
    const y = Math.sin(angle) * radius * 0.68;
    const z = -2.5 - (i % 7) * 1.6; // Layered depth planes behind the subject

    nodePositions[i * 3] = x;
    nodePositions[i * 3 + 1] = y;
    nodePositions[i * 3 + 2] = z;

    const c = i % 3 === 0 ? colorGold : colorCream;
    nodeColors[i * 3] = c.r;
    nodeColors[i * 3 + 1] = c.g;
    nodeColors[i * 3 + 2] = c.b;

    nodeVelocities.push({
      vx: Math.cos(angle + 1.57) * 0.085,
      vy: Math.sin(angle + 1.57) * 0.065,
      vz: ((i % 2 === 0 ? 1 : -1) * 0.04)
    });
  }

  const nodesGeo = new THREE.BufferGeometry();
  nodesGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
  nodesGeo.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3));

  const dotTex = createSoftDotTexture();
  const nodesMat = new THREE.PointsMaterial({
    size: 0.13,
    map: dotTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  const neuralPoints = new THREE.Points(nodesGeo, nodesMat);
  neuralGroup.add(neuralPoints);

  // Pre-allocate LineSegments buffer for subtle, tidy constellation links
  const maxLines = nodeCount * 2;
  const linePositions = new Float32Array(maxLines * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
  lineGeo.setDrawRange(0, 0);

  const lineMat = new THREE.LineBasicMaterial({
    color: 0xc8b89a,
    transparent: true,
    opacity: 0.075,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const neuralLines = new THREE.LineSegments(lineGeo, lineMat);
  neuralGroup.add(neuralLines);

  // ════════════════════════════════════════════════════════════════════════
  // LAYER 03: FLOATING GLASS & BRUSHED METAL COMPOSITE ARTIFACTS (PBR)
  // Positioned cleanly on outer flanks with minimal, orderly orbital satellites
  // ════════════════════════════════════════════════════════════════════════
  const pbrGroup = new THREE.Group();
  scene.add(pbrGroup);

  const brushedGoldMat = new THREE.MeshPhysicalMaterial({
    color: 0xc8b89a,
    metalness: 0.92,
    roughness: 0.18,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.2
  });

  const darkTitaniumMat = new THREE.MeshStandardMaterial({
    color: 0x262522,
    metalness: 0.78,
    roughness: 0.48,
    envMapIntensity: 0.9
  });

  const crystalGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f1ea,
    metalness: 0.05,
    roughness: 0.08,
    transmission: isSoftwareGl ? 0 : 0.92,
    transparent: true,
    opacity: isSoftwareGl ? 0.32 : 0.88,
    ior: 1.65,
    thickness: 1.4,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.3
  });

  const accentWireMat = new THREE.LineBasicMaterial({
    color: 0xe8dcc8,
    transparent: true,
    opacity: 0.18
  });

  // ── Left Composite Artifact: Gyroscopic Astrolabe ──
  const leftArtifact = new THREE.Group();
  leftArtifact.position.set(isMobile ? -3.8 : -7.4, 1.5, -3.2);

  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.035, 20, 84), brushedGoldMat);
  leftArtifact.add(outerRing);

  const midGimbal = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.028, 18, 72), darkTitaniumMat);
  midGimbal.rotation.x = Math.PI / 3;
  leftArtifact.add(midGimbal);

  const innerGimbal = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.02, 16, 60), brushedGoldMat);
  innerGimbal.rotation.y = Math.PI / 4;
  leftArtifact.add(innerGimbal);

  const crystalCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), crystalGlassMat);
  leftArtifact.add(crystalCore);

  const coreCage = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.5, 0)),
    accentWireMat
  );
  leftArtifact.add(coreCage);

  pbrGroup.add(leftArtifact);

  // ── Right Composite Artifact: Geodesic Polyhedron & Orbital Ring ──
  const rightArtifact = new THREE.Group();
  rightArtifact.position.set(isMobile ? 3.8 : 7.5, -0.9, -2.8);

  const icoHull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 0), crystalGlassMat);
  rightArtifact.add(icoHull);

  const icoExoskeleton = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.18, 1)),
    accentWireMat
  );
  rightArtifact.add(icoExoskeleton);

  const innerGoldCore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46, 0), brushedGoldMat);
  rightArtifact.add(innerGoldCore);

  const collarRing = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.022, 16, 72), darkTitaniumMat);
  collarRing.rotation.x = Math.PI * 0.42;
  rightArtifact.add(collarRing);

  const satGroup = new THREE.Group();
  const satGeo = new THREE.SphereGeometry(0.065, 14, 14);
  for (let s = 0; s < 3; s++) {
    const angle = (s / 3) * Math.PI * 2;
    const sat = new THREE.Mesh(satGeo, brushedGoldMat);
    sat.position.set(Math.cos(angle) * 1.42, Math.sin(angle) * 1.42, 0);
    satGroup.add(sat);
  }
  satGroup.rotation.copy(collarRing.rotation);
  rightArtifact.add(satGroup);

  pbrGroup.add(rightArtifact);

  // ── Orderly Instanced Orbital Micro-Satellites (12 evenly spaced nodes) ──
  const instancedCount = 12;
  const microSatGeo = new THREE.OctahedronGeometry(0.038, 0);
  const orbitalInstancedMesh = new THREE.InstancedMesh(microSatGeo, brushedGoldMat, instancedCount);
  orbitalInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const _dummy = new THREE.Object3D();
  const microSatData = [];

  for (let i = 0; i < instancedCount; i++) {
    const cluster = i < 6 ? -1 : 1;
    const localIdx = i % 6;
    const orbitRadius = 1.75 + (localIdx % 2) * 0.28;
    const speed = 0.22 * (cluster > 0 ? 1 : -1);
    const phase = (localIdx / 6) * Math.PI * 2;
    const tiltX = 0.32 * cluster;
    const tiltZ = -0.24 * cluster;
    const scale = 0.85;

    microSatData.push({ cluster, orbitRadius, speed, phase, tiltX, tiltZ, scale });

    const cx = cluster < 0 ? leftArtifact.position.x : rightArtifact.position.x;
    const cy = cluster < 0 ? leftArtifact.position.y : rightArtifact.position.y;
    const cz = cluster < 0 ? leftArtifact.position.z : rightArtifact.position.z;

    _dummy.position.set(
      cx + Math.cos(phase) * orbitRadius,
      cy + Math.sin(phase) * orbitRadius * Math.cos(tiltX),
      cz + Math.sin(phase) * orbitRadius * Math.sin(tiltZ)
    );
    _dummy.scale.setScalar(scale);
    _dummy.updateMatrix();
    orbitalInstancedMesh.setMatrixAt(i, _dummy.matrix);
  }
  orbitalInstancedMesh.instanceMatrix.needsUpdate = true;
  if (typeof orbitalInstancedMesh.computeBoundingSphere === 'function') {
    orbitalInstancedMesh.computeBoundingSphere();
  }
  pbrGroup.add(orbitalInstancedMesh);

  // ── Theme-Reactive 3D Scene Adaptation (Dark vs Light Mode) ──
  function applySceneTheme(theme) {
    const isLight = theme === 'light';
    scene.fog.color.setHex(isLight ? 0xf6f4ef : 0x111110);

    waveUniforms.uColorBase.value.setHex(isLight ? 0xb5aa96 : 0x524c42);
    waveUniforms.uColorCrest.value.setHex(isLight ? 0x7d6030 : 0xc8b89a);
    wavePointsMat.color.setHex(isLight ? 0x7d6030 : 0xe8dcc8);

    nodesMat.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    nodesMat.opacity = isLight ? 0.42 : 0.48;
    nodesMat.needsUpdate = true;

    lineMat.color.setHex(isLight ? 0x8a6d3b : 0xc8b89a);
    lineMat.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    lineMat.opacity = isLight ? 0.11 : 0.075;
    lineMat.needsUpdate = true;

    accentWireMat.color.setHex(isLight ? 0x6e552b : 0xe8dcc8);
    accentWireMat.opacity = isLight ? 0.24 : 0.18;
    hemiLight.intensity = isLight ? 1.05 : 0.75;
  }

  applySceneTheme(document.documentElement.getAttribute('data-theme') || 'dark');
  window.addEventListener('themechange', (e) => {
    applySceneTheme(e.detail && e.detail.theme ? e.detail.theme : 'dark');
  });

  // ── Pre-warm shaders on GPU ──
  if (!isSoftwareGl && typeof renderer.compile === 'function') {
    renderer.compile(scene, camera);
  }

  // ── Mouse, Scroll & Velocity State (Exponential Damping) ──
  const pointer = { targetX: 0, targetY: 0, x: 0, y: 0 };
  let scrollY = window.scrollY || 0;
  let smoothScrollY = scrollY;
  let scrollVelocity = 0;
  let lastScrollY = scrollY;
  let isTabActive = !document.hidden;
  let frameId = 0;

  window.addEventListener('mousemove', (e) => {
    pointer.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY || 0;
  }, { passive: true });

  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    const mobileNow = w < 768;
    leftArtifact.position.x = mobileNow ? -3.2 : -6.4;
    rightArtifact.position.x = mobileNow ? 3.2 : 6.5;
  }, { passive: true });

  // ── Collapsible Bottom 3D Scene Mode Switcher (#threeHudDock) ──
  (function initThreeHudControls() {
    const dock = document.getElementById('threeHudDock');
    const toggleBtn = document.getElementById('threeHudToggle');
    const arrow = document.getElementById('threeHudArrow');
    const modeBtns = document.querySelectorAll('.three-mode-btn');

    if (toggleBtn && dock) {
      toggleBtn.addEventListener('click', () => {
        const isCollapsed = dock.classList.toggle('collapsed');
        toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
        if (arrow) arrow.textContent = isCollapsed ? '▴' : '▾';
      });
    }

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode') || 'all';
        waveGroup.visible = (mode === 'all' || mode === 'wave');
        neuralGroup.visible = (mode === 'all' || mode === 'neural');
        pbrGroup.visible = (mode === 'all' || mode === 'pbr');
      });
    });
  })();

  // Software-WebGL fence pacing helper
  function afterDraw(cb) {
    try {
      const gl = renderer.getContext();
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
        return;
      }
    } catch (e) { /* fallback */ }
    frameId = window.setTimeout(cb, 80);
  }

  const clock = new THREE.Clock();
  const heroSection = document.getElementById('hero') || document.querySelector('.page-hero');
  let isHeroIntersecting = true;

  function tick() {
    if (!isTabActive || !isHeroIntersecting) {
      frameId = 0;
      return;
    }

    const dt = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.getElapsedTime();

    // Exponential damping for silky-smooth pointer & scroll kinematics
    const damp = THREE.MathUtils && THREE.MathUtils.damp
      ? THREE.MathUtils.damp
      : (cur, tgt, l, d) => cur + (tgt - cur) * (1 - Math.exp(-l * d));

    pointer.x = damp(pointer.x, pointer.targetX, 4.5, dt);
    pointer.y = damp(pointer.y, pointer.targetY, 4.5, dt);
    smoothScrollY = damp(smoothScrollY, scrollY, 5.0, dt);

    const rawVel = (scrollY - lastScrollY);
    lastScrollY = scrollY;
    scrollVelocity = damp(scrollVelocity, rawVel, 6.0, dt);

    // Normalized page scroll progress (0 at top -> 1 at footer)
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollProgress = Math.min(1, Math.max(0, smoothScrollY / maxScroll));

    // Priority 5: Keep strongest 3D orbital effect in Hero, attenuate smoothly as Hero exits
    const heroFadeEnd = Math.max(420, window.innerHeight * 0.85);
    const contentFactor = Math.min(1, Math.max(0, smoothScrollY / heroFadeEnd));
    const isLightNow = document.documentElement.getAttribute('data-theme') === 'light';
    const heroBaseOpacity = isLightNow ? 0.48 : 0.42;
    const contentQuietOpacity = isLightNow ? 0.12 : 0.08;
    const targetCanvasOpacity = heroBaseOpacity - contentFactor * (heroBaseOpacity - contentQuietOpacity);
    canvas.style.opacity = targetCanvasOpacity.toFixed(3);

    // ── Scroll-Driven Camera Fly-Through & 3D Parallax ──
    const targetCamZ = 11.0 - scrollProgress * 3.2;
    const targetCamY = 0.6 - scrollProgress * 2.0 + pointer.y * (0.65 - contentFactor * 0.35);
    const targetCamX = pointer.x * (0.95 - contentFactor * 0.5) + Math.sin(scrollProgress * Math.PI * 2) * 0.3;

    camera.position.x = damp(camera.position.x, targetCamX, 4.0, dt);
    camera.position.y = damp(camera.position.y, targetCamY, 4.0, dt);
    camera.position.z = damp(camera.position.z, targetCamZ, 4.0, dt);
    camera.rotation.z = pointer.x * -0.02;
    camera.lookAt(pointer.x * 0.3, targetCamY - 0.35, -2.0);

    // ── Update 01: Topological Wave Shader Terrain ──
    if (waveGroup.visible) {
      waveUniforms.uTime.value = elapsed;
      waveUniforms.uMouse.value.set(pointer.x, pointer.y);
      waveUniforms.uScroll.value = scrollProgress;
      waveGroup.position.y = targetCamY * 0.45;
    }

    // ── Update 02: Curated Constellation Network ──
    if (neuralGroup.visible) {
      const posAttr = nodesGeo.attributes.position;
      const arr = posAttr.array;

      for (let i = 0; i < nodeCount; i++) {
        const i3 = i * 3;
        const vel = nodeVelocities[i];
        arr[i3] += vel.vx * dt;
        arr[i3 + 1] += vel.vy * dt;
        arr[i3 + 2] += vel.vz * dt;

        // Keep a clean central zone around the hero portrait so particles frame the subject
        const distCenter = Math.hypot(arr[i3], arr[i3 + 1]);
        if (distCenter < 2.8 && distCenter > 0.001) {
          const push = (2.8 - distCenter) * 0.5 * dt;
          arr[i3] += (arr[i3] / distCenter) * push;
          arr[i3 + 1] += (arr[i3 + 1] / distCenter) * push;
        }

        if (arr[i3] > 12) arr[i3] = -12;
        else if (arr[i3] < -12) arr[i3] = 12;
        if (arr[i3 + 1] > 8) arr[i3 + 1] = -8;
        else if (arr[i3 + 1] < -8) arr[i3 + 1] = 8;
        if (arr[i3 + 2] > -1.5) arr[i3 + 2] = -13;
        else if (arr[i3 + 2] < -13) arr[i3 + 2] = -1.5;
      }
      posAttr.needsUpdate = true;

      // Build tidy 3D proximity filaments (max 2 links per node to prevent messy webs)
      let lineIdx = 0;
      const maxDistSq = maxConnectDist * maxConnectDist;
      for (let i = 0; i < nodeCount; i++) {
        const ix = arr[i * 3], iy = arr[i * 3 + 1], iz = arr[i * 3 + 2];
        let linksForNode = 0;
        for (let j = i + 1; j < nodeCount; j++) {
          if (lineIdx >= maxLines || linksForNode >= 2) break;
          const jx = arr[j * 3], jy = arr[j * 3 + 1], jz = arr[j * 3 + 2];
          const dx = ix - jx, dy = iy - jy, dz = iz - jz;
          const dSq = dx * dx + dy * dy + dz * dz;
          if (dSq < maxDistSq) {
            const base = lineIdx * 6;
            linePositions[base] = ix;
            linePositions[base + 1] = iy;
            linePositions[base + 2] = iz;
            linePositions[base + 3] = jx;
            linePositions[base + 4] = jy;
            linePositions[base + 5] = jz;
            lineIdx++;
            linksForNode++;
          }
        }
      }
      lineGeo.setDrawRange(0, lineIdx * 2);
      lineGeo.attributes.position.needsUpdate = true;
      neuralGroup.rotation.y = pointer.x * 0.05 + scrollProgress * 0.22;
    }

    // ── Update 03: PBR Glass & Brushed Metal Artifacts ──
    if (pbrGroup.visible) {
      const velBoost = Math.min(Math.abs(scrollVelocity) * 0.012, 1.4);
      const speedMult = (1 + velBoost) * (1 - contentFactor * 0.45);
      const artifactScale = 1 - contentFactor * 0.32;
      leftArtifact.scale.setScalar(artifactScale);
      rightArtifact.scale.setScalar(artifactScale);

      leftArtifact.position.y = targetCamY + 0.6 + Math.sin(elapsed * 0.8) * 0.22;
      outerRing.rotation.x += dt * 0.22 * speedMult;
      outerRing.rotation.y += dt * 0.31 * speedMult;
      midGimbal.rotation.y -= dt * 0.45 * speedMult;
      innerGimbal.rotation.x += dt * 0.52 * speedMult;
      crystalCore.rotation.y -= dt * 0.38;
      coreCage.rotation.y = crystalCore.rotation.y;

      rightArtifact.position.y = targetCamY - 0.8 + Math.cos(elapsed * 0.75) * 0.24;
      icoHull.rotation.x += dt * 0.18 * speedMult;
      icoHull.rotation.y += dt * 0.26 * speedMult;
      icoExoskeleton.rotation.x = -icoHull.rotation.x * 0.7;
      icoExoskeleton.rotation.y = -icoHull.rotation.y * 0.7;
      innerGoldCore.rotation.z += dt * 0.42 * speedMult;
      satGroup.rotation.z += dt * 0.65 * speedMult;

      // Update InstancedMesh orbital micro-satellites using pre-allocated _dummy
      for (let i = 0; i < instancedCount; i++) {
        const d = microSatData[i];
        const angle = d.phase + elapsed * d.speed;
        const anchor = d.cluster < 0 ? leftArtifact.position : rightArtifact.position;
        _dummy.position.set(
          anchor.x + Math.cos(angle) * d.orbitRadius * artifactScale,
          anchor.y + Math.sin(angle) * d.orbitRadius * Math.cos(d.tiltX) * artifactScale,
          anchor.z + Math.sin(angle) * d.orbitRadius * Math.sin(d.tiltZ) * artifactScale
        );
        _dummy.rotation.set(angle * 0.8, angle * 1.1, 0);
        _dummy.scale.setScalar(d.scale * artifactScale);
        _dummy.updateMatrix();
        orbitalInstancedMesh.setMatrixAt(i, _dummy.matrix);
      }
      orbitalInstancedMesh.instanceMatrix.needsUpdate = true;
    }

    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  // Intersection Observer to activate 3D canvas animation only when navigating in #hero
  if (heroSection && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isHeroIntersecting = entry.isIntersecting;
        if (isHeroIntersecting) {
          if (isTabActive && !frameId) {
            clock.getDelta();
            tick();
          }
        } else {
          canvas.style.opacity = '0';
          if (frameId && !isSoftwareGl) {
            cancelAnimationFrame(frameId);
            frameId = 0;
          }
        }
      });
    }, {
      root: null,
      rootMargin: '80px 0px',
      threshold: 0.01
    });
    heroObserver.observe(heroSection);
  }

  document.addEventListener('visibilitychange', () => {
    isTabActive = !document.hidden;
    if (isTabActive && isHeroIntersecting && !frameId) {
      clock.getDelta();
      tick();
    }
  });

  tick();
})();

/* ───────────────────────────────────────────────
   1B. 3D INTERACTIVE SKILL ORBIT / TECH GLOBE (#skills)
   Dedicated interactive 3D WebGL globe in the Skills section with
   composite geodesic core, orbital rings, crisp CanvasTexture badges,
   drag-to-rotate inertia, and raycast click/hover skill highlighting.
─────────────────────────────────────────────── */
(function initSkillsOrbitGlobe() {
  const wrap = document.getElementById('skillsGlobeWrap');
  const canvas = document.getElementById('skillsGlobeCanvas');
  const stage = document.getElementById('skillsGlobeStage');
  const activeLabel = document.getElementById('skillsGlobeActiveLabel');
  const resetBtn = document.getElementById('skillsGlobeResetBtn');
  if (!canvas || !stage) return;
  if (typeof THREE === 'undefined') {
    if (wrap) wrap.style.display = 'none';
    return;
  }

  const isSoftwareGl = (function () {
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || '');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch (e) {
      return false;
    }
  })();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    if (wrap) wrap.style.display = 'none';
    return;
  }

  if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if ('outputEncoding' in renderer && THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.set(0, 0, 6.4);

  // Studio Lighting for the 3D Globe
  scene.add(new THREE.HemisphereLight(0xf4f1ea, 0x1c1c1a, 0.9));
  const dirLight = new THREE.DirectionalLight(0xe8dcc8, 1.3);
  dirLight.position.set(4, 5, 6);
  scene.add(dirLight);

  const globeRoot = new THREE.Group();
  scene.add(globeRoot);

  // ── Central Composite 4-Part Geodesic Core ──
  const coreGroup = new THREE.Group();
  globeRoot.add(coreGroup);

  // Part 1: Outer Geodesic Wireframe Sphere
  const geoWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.15, 1)),
    new THREE.LineBasicMaterial({ color: 0xc8b89a, transparent: true, opacity: 0.32 })
  );
  coreGroup.add(geoWire);

  // Part 2: Inner Brushed Gold Core
  const innerCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.58, 0),
    new THREE.MeshStandardMaterial({
      color: 0xc8b89a,
      metalness: 0.88,
      roughness: 0.22
    })
  );
  coreGroup.add(innerCore);

  // Part 3 & 4: Inclined Orbital Rings
  const ringMat = new THREE.LineBasicMaterial({ color: 0xe8dcc8, transparent: true, opacity: 0.2 });
  for (let r = 0; r < 3; r++) {
    const ringGeo = new THREE.EdgesGeometry(new THREE.TorusGeometry(1.85 + r * 0.22, 0.008, 8, 72));
    const ring = new THREE.LineSegments(ringGeo, ringMat);
    ring.rotation.x = (r * Math.PI) / 3 + 0.4;
    ring.rotation.y = (r * Math.PI) / 4;
    coreGroup.add(ring);
  }

  const nodesContainer = new THREE.Group();
  globeRoot.add(nodesContainer);

  const clickableNodes = [];
  const maxAniso = renderer.capabilities ? renderer.capabilities.getMaxAnisotropy() : 1;

  function createBadgeTexture(label, isHighlighted) {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 72;
    const ctx = c.getContext('2d');

    if (isHighlighted) {
      ctx.fillStyle = isLight ? 'rgba(138, 109, 59, 0.96)' : 'rgba(200, 184, 154, 0.96)';
      ctx.strokeStyle = isLight ? '#151413' : '#f4f1ea';
    } else {
      ctx.fillStyle = isLight ? 'rgba(246, 244, 239, 0.94)' : 'rgba(24, 24, 22, 0.92)';
      ctx.strokeStyle = isLight ? 'rgba(138, 109, 59, 0.75)' : 'rgba(200, 184, 154, 0.65)';
    }
    ctx.lineWidth = 3;

    const r = 10;
    ctx.beginPath();
    ctx.moveTo(r, 6);
    ctx.lineTo(250 - r, 6);
    ctx.quadraticCurveTo(250, 6, 250, 6 + r);
    ctx.lineTo(250, 66 - r);
    ctx.quadraticCurveTo(250, 66, 250 - r, 66);
    ctx.lineTo(r, 66);
    ctx.quadraticCurveTo(6, 66, 6, 66 - r);
    ctx.lineTo(6, 6 + r);
    ctx.quadraticCurveTo(6, 6, r, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 22px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (isHighlighted) {
      ctx.fillStyle = isLight ? '#f6f4ef' : '#111110';
    } else {
      ctx.fillStyle = isLight ? '#151413' : '#f4f1ea';
    }
    const shortLabel = label.length > 16 ? label.slice(0, 15) + '…' : label;
    ctx.fillText(shortLabel, 128, 37);

    const tex = new THREE.CanvasTexture(c);
    if ('colorSpace' in tex && THREE.SRGBColorSpace) {
      tex.colorSpace = THREE.SRGBColorSpace;
    } else if ('encoding' in tex && THREE.sRGBEncoding) {
      tex.encoding = THREE.sRGBEncoding;
    }
    tex.anisotropy = maxAniso;
    return tex;
  }

  const defaultSkills = [
    'JavaScript', 'TypeScript', 'React.js', 'Next.js',
    'Node.js', 'Express.js', 'Python', 'SQL / SQLite',
    'HTML & CSS', 'Tailwind CSS', 'Git & GitHub', 'Gemini AI'
  ];

  function rebuildSkillNodes(skillNames) {
    while (nodesContainer.children.length > 0) {
      const child = nodesContainer.children[0];
      nodesContainer.remove(child);
    }
    clickableNodes.length = 0;

    const list = (Array.isArray(skillNames) && skillNames.length > 0)
      ? skillNames.slice(0, 14)
      : defaultSkills;

    const n = list.length;
    const radius = 2.15;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    const sphereGeo = new THREE.SphereGeometry(0.11, 16, 16);
    const filamentMat = new THREE.LineBasicMaterial({
      color: 0xc8b89a,
      transparent: true,
      opacity: 0.25
    });

    list.forEach((name, i) => {
      // Fibonacci sphere distribution for even 3D orbital spacing
      const y = 1 - (i / Math.max(1, n - 1)) * 2;
      const rAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * rAtY * radius;
      const z = Math.sin(theta) * rAtY * radius;
      const py = y * radius;

      const nodeGroup = new THREE.Group();
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0xe8dcc8,
        metalness: 0.8,
        roughness: 0.2
      });
      const nodeMesh = new THREE.Mesh(sphereGeo, sphereMat);
      nodeMesh.position.set(x, py, z);
      nodeMesh.userData = { skillName: name, badgeSprite: null };

      // Radial filament connecting core to node
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x * 0.28, py * 0.28, z * 0.28),
        new THREE.Vector3(x, py, z)
      ]);
      const filament = new THREE.Line(lineGeo, filamentMat);
      nodeGroup.add(filament);

      // Crisp 3D Sprite Label slightly outward from node
      const badgeTex = createBadgeTexture(name, false);
      const spriteMat = new THREE.SpriteMaterial({
        map: badgeTex,
        transparent: true,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(x * 1.16, py * 1.16 + 0.14, z * 1.16);
      sprite.scale.set(1.25, 0.35, 1);

      nodeMesh.userData.badgeSprite = sprite;
      nodeGroup.add(nodeMesh);
      nodeGroup.add(sprite);
      nodesContainer.add(nodeGroup);
      clickableNodes.push(nodeMesh);
    });
  }

  rebuildSkillNodes(defaultSkills);

  // Expose updater so dynamic DB skills automatically populate the 3D globe
  window.updateSkillsGlobe = function (skillsArray) {
    if (!Array.isArray(skillsArray) || !skillsArray.length) return;
    const names = skillsArray.map(s => (typeof s === 'string' ? s : s.name)).filter(Boolean);
    if (names.length) rebuildSkillNodes(names);
  };

  function resizeGlobe() {
    const rect = stage.getBoundingClientRect();
    const w = Math.max(200, rect.width || 360);
    const h = Math.max(200, rect.height || 300);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resizeGlobe();
  window.addEventListener('resize', resizeGlobe, { passive: true });

  // ── Drag-to-Rotate & Raycast Selection ──
  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  let velRotX = 0;
  let velRotY = 0.005;
  let pointerDownX = 0;
  let pointerDownY = 0;
  let selectedSkill = '';

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function highlightSkillInDom(skillName) {
    selectedSkill = skillName;
    if (activeLabel) {
      activeLabel.textContent = skillName ? `✦ ${skillName}` : 'Geser untuk memutar';
    }

    // Update 3D node materials & badge textures
    clickableNodes.forEach(mesh => {
      const isMatch = mesh.userData.skillName.toLowerCase() === (skillName || '').toLowerCase();
      mesh.scale.setScalar(isMatch ? 1.55 : 1.0);
      mesh.material.color.setHex(isMatch ? 0xf4f1ea : 0xe8dcc8);
      if (mesh.userData.badgeSprite) {
        const oldMap = mesh.userData.badgeSprite.material.map;
        mesh.userData.badgeSprite.material.map = createBadgeTexture(mesh.userData.skillName, isMatch);
        if (oldMap) oldMap.dispose();
      }
    });

    // Highlight matching chip in #skillsContainer
    document.querySelectorAll('#skillsContainer .skill-item').forEach(chip => {
      const txt = chip.textContent.trim().toLowerCase();
      const target = (skillName || '').toLowerCase();
      const match = target && (txt === target || txt.includes(target) || target.includes(txt));
      chip.classList.toggle('globe-highlighted', Boolean(match));
    });
  }

  stage.addEventListener('pointerdown', (e) => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
    pointerDownX = e.clientX;
    pointerDownY = e.clientY;
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;
    velRotY = dx * 0.007;
    velRotX = dy * 0.007;
    globeRoot.rotation.y += velRotY;
    globeRoot.rotation.x = Math.max(-1.1, Math.min(1.1, globeRoot.rotation.x + velRotX));
  }, { passive: true });

  window.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const moved = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
    if (moved < 6) {
      // Treat as click -> Raycast 3D skill nodes
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableNodes, false);
      if (hits.length > 0) {
        const hitSkill = hits[0].object.userData.skillName;
        highlightSkillInDom(hitSkill === selectedSkill ? '' : hitSkill);
      }
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      globeRoot.rotation.set(0, 0, 0);
      velRotX = 0;
      velRotY = 0.005;
      highlightSkillInDom('');
    });
  }

  // Refresh 3D globe badge textures & wireframe tint when theme switches
  window.addEventListener('themechange', (e) => {
    const isLight = e.detail && e.detail.theme === 'light';
    geoWire.material.color.setHex(isLight ? 0x8a6d3b : 0xc8b89a);
    ringMat.color.setHex(isLight ? 0x6e552b : 0xe8dcc8);
    highlightSkillInDom(selectedSkill);
  });

  let globeVisible = true;
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        globeVisible = entry.isIntersecting;
      });
    }, { threshold: 0.05 });
    obs.observe(stage);
  }

  let gFrameId = 0;
  function animateGlobe() {
    if (globeVisible && !document.hidden) {
      if (!isDragging) {
        globeRoot.rotation.y += velRotY;
        globeRoot.rotation.x += velRotX;
        velRotX *= 0.92;
        velRotY = velRotY * 0.96 + 0.0038 * 0.04;
      }
      innerCore.rotation.y -= 0.012;
      innerCore.rotation.x += 0.008;
      renderer.render(scene, camera);
    }
    if (isSoftwareGl) {
      gFrameId = window.setTimeout(animateGlobe, 90);
    } else {
      gFrameId = requestAnimationFrame(animateGlobe);
    }
  }
  animateGlobe();
})();

/* ───────────────────────────────────────────────
   2. NAVIGATION SCROLL EFFECT
─────────────────────────────────────────────── */
(function initNav() {
  const nav = document.getElementById('nav');
  let lastY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    lastY = y;
  }, { passive: true });
})();

/* ───────────────────────────────────────────────
   3. MOBILE MENU
─────────────────────────────────────────────── */
(function initMobileMenu() {
  const btn  = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  const links = document.querySelectorAll('.mobile-link');

  if (!btn || !menu) return;

  function toggle() {
    const open = menu.classList.toggle('open');
    btn.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.style.touchAction = open ? 'none' : '';
  }

  function closeMenu() {
    menu.classList.remove('open');
    btn.classList.remove('open');
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }

  btn.addEventListener('click', toggle);

  links.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
    }
  });
})();

/* ───────────────────────────────────────────────
   4. SCROLL REVEAL (INTERSECTION OBSERVER API)
   Animates elements with '.reveal-up' and '.reveal-fade' as they
   enter the viewport, with staggered group delays & dynamic DOM support.
─────────────────────────────────────────────── */
(function initReveal() {
  const REVEAL_SELECTOR = '.reveal-up, .reveal-fade';
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let observer = null;

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const delay = Number(el.dataset.delay || 0);
          el.style.setProperty('--reveal-delay', `${delay}ms`);

          if (delay > 0) {
            setTimeout(() => {
              el.classList.add('visible');
            }, delay);
          } else {
            el.classList.add('visible');
          }
          obs.unobserve(el);
        });
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: '0px 0px -36px 0px',
      }
    );
  }

  window.observeDynamicReveals = function (container = document) {
    const root = container && typeof container.querySelectorAll === 'function' ? container : document;
    const els = root.querySelectorAll('.reveal-up:not(.visible), .reveal-fade:not(.visible)');

    if (!observer) {
      els.forEach((el) => el.classList.add('visible'));
      return;
    }

    els.forEach((el) => {
      if (el.dataset.revealObserved === 'true') return;
      el.dataset.revealObserved = 'true';

      // Compute natural stagger delay among sibling reveal elements in the same parent/section
      if (el.dataset.delay === undefined) {
        const parent = el.parentElement;
        if (parent) {
          const siblings = Array.from(parent.querySelectorAll(':scope > .reveal-up, :scope > .reveal-fade'));
          const idx = siblings.indexOf(el);
          if (idx > 0) {
            el.dataset.delay = String(Math.min(idx * 70, 420));
          } else {
            el.dataset.delay = '0';
          }
        }
      }

      observer.observe(el);
    });
  };

  window.observeDynamicReveals(document);

  // Automatically watch for dynamically injected portfolio items (projects, skills, timeline, certs)
  if ('MutationObserver' in window && document.body) {
    const mutObs = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes && mutations[i].addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) {
        window.observeDynamicReveals(document);
      }
    });
    mutObs.observe(document.body, { childList: true, subtree: true });
  }
})();

/* ───────────────────────────────────────────────
   5. SKILL BAR ANIMATION
─────────────────────────────────────────────── */
(function initSkillBars() {
  const fills = document.querySelectorAll('.skill-fill');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const w  = el.dataset.w || '0';
        setTimeout(() => { el.style.width = w + '%'; }, 200);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  fills.forEach(f => observer.observe(f));
})();

/* ───────────────────────────────────────────────
   6. CUSTOM CURSOR
─────────────────────────────────────────────── */
(function initCursor() {
  // Skip on touch / mobile
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';

  document.body.appendChild(cursor);
  document.body.appendChild(ring);

  let cx = -100, cy = -100;
  let rx = -100, ry = -100;

  document.addEventListener('mousemove', (e) => {
    cx = e.clientX; cy = e.clientY;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
  });

  // Lag ring
  function animateCursor() {
    rx += (cx - rx) * 0.12;
    ry += (cy - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover effect
  const hovers = document.querySelectorAll('a, button, .project-card, .cert-item');
  hovers.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hover');
      ring.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover');
      ring.classList.remove('hover');
    });
  });
})();

/* ───────────────────────────────────────────────
   7. CONTACT FORM (demo)
─────────────────────────────────────────────── */
(function initContactForm() {
  const form   = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('.btn-primary');
    const txt = btn ? btn.querySelector('.btn-text') : null;

    const name = form.name ? form.name.value.trim() : '';
    const email = form.email ? form.email.value.trim() : '';
    const project = form.project ? form.project.value.trim() : '';
    const message = form.message ? form.message.value.trim() : '';

    if (!name || !email || !message) {
      status.textContent = 'Harap lengkapi semua kolom yang wajib diisi.';
      status.style.color = '#f0a070';
      return;
    }

    if (btn) btn.disabled = true;
    if (txt) txt.textContent = 'Mengirim…';
    status.textContent = '';

    try {
      if (typeof PortfolioAPI !== 'undefined' && PortfolioAPI.sendContact) {
        await PortfolioAPI.sendContact({ name, email, project, message });
      } else {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, project, message })
        });
        if (!res.ok) throw new Error('Gagal mengirim pesan');
      }
      status.textContent = '✓ Pesan terkirim. Saya akan segera menghubungi Anda.';
      status.style.color = '#5fdb6f';
      form.reset();
    } catch (err) {
      console.error('Gagal mengirim pesan:', err);
      status.textContent = '✕ Gagal mengirim pesan: ' + (err.message || 'Koneksi bermasalah');
      status.style.color = '#ff6b6b';
    } finally {
      if (btn) btn.disabled = false;
      if (txt) txt.textContent = 'Kirim Pesan';
      setTimeout(() => { status.textContent = ''; }, 6000);
    }
  });
})();

/* ───────────────────────────────────────────────
   8. SMOOTH LINK HOVER — letter spacing
─────────────────────────────────────────────── */
(function initNavHover() {
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      link.style.letterSpacing = '0.06em';
    });
    link.addEventListener('mouseleave', () => {
      link.style.letterSpacing = '0.02em';
    });
  });
})();

/* ───────────────────────────────────────────────
   9. ACTIVE SECTION NAV HIGHLIGHT
─────────────────────────────────────────────── */
/* ───────────────────────────────────────────────
   9. ACTIVE SECTION NAV HIGHLIGHT (SCROLLSPY)
─────────────────────────────────────────────── */
(function initActiveSection() {
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
  const sections = Array.from(document.querySelectorAll('section[id]'));

  if (!sections.length || !navLinks.length) return;

  function updateActiveNav() {
    const scrollPos = window.scrollY + 160;
    let currentId = '';

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
        break;
      }
    }

    // Default to first section if at top
    if (!currentId && window.scrollY < 200 && sections.length) {
      currentId = sections[0].getAttribute('id');
    }

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      const isMatch = href === `#${currentId}`;
      link.classList.toggle('active', isMatch);
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  window.addEventListener('resize', updateActiveNav, { passive: true });
  updateActiveNav();
})();

/* ───────────────────────────────────────────────
   9B. ONE-CLICK EMAIL COPY MICRO-INTERACTION
─────────────────────────────────────────────── */
(function initCopyEmail() {
  const btn = document.getElementById('copyEmailBtn');
  const textEl = document.getElementById('contactEmailDisplay');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const email = textEl ? textEl.textContent.trim() : 'mihwalmaulana09@gmail.com';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const ta = document.createElement('textarea');
        ta.value = email;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const prev = btn.textContent;
      btn.textContent = '✓ Tersalin!';
      btn.style.background = 'var(--accent)';
      btn.style.color = 'var(--bg)';
      setTimeout(() => {
        btn.textContent = prev;
        btn.style.background = '';
        btn.style.color = '';
      }, 2400);
    } catch (e) {
      console.warn('Gagal menyalin email:', e);
    }
  });
})();

/* ───────────────────────────────────────────────
   10. HERO TEXT — stagger on load + IntersectionObserver sync
─────────────────────────────────────────────── */
(function initHeroLoad() {
  const heroEls = document.querySelectorAll('#hero .reveal-up, #hero .reveal-fade');
  heroEls.forEach((el, i) => {
    el.dataset.delay = String(80 + i * 95);
    el.style.setProperty('--reveal-delay', `${80 + i * 95}ms`);
  });
  if (typeof window.observeDynamicReveals === 'function') {
    const heroSection = document.getElementById('hero');
    if (heroSection) window.observeDynamicReveals(heroSection);
  }
})();

/* ───────────────────────────────────────────────
   11. DYNAMIC PORTFOLIO DATA & LIVE SYNC
─────────────────────────────────────────────── */
(function initDynamicPortfolio() {
  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatHeading(raw) {
    if (!raw) return '';
    if (raw.includes('<br>') || raw.includes('<em>')) {
      return escapeHTML(raw)
        .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
        .replace(/&lt;em&gt;/gi, '<em>')
        .replace(/&lt;\/em&gt;/gi, '</em>');
    }
    const parts = raw.trim().split(/\s+/);
    if (parts.length > 1) {
      const first = parts.slice(0, parts.length - 1).join(' ');
      const last = parts[parts.length - 1];
      return `${escapeHTML(first)}<br><em>${escapeHTML(last)}</em>`;
    }
    return `<em>${escapeHTML(raw)}</em>`;
  }

  function renderPortfolio(data) {
    if (!data) return;
    const { profile, landing, projects, skills, experience, education, certificates, sections, three, seo, social, settings } = data;

    // Derived states
    const publishedProjects = (projects || []).filter(p => p.status !== 'draft');
    // Homepage hanya memajang project yang ditandai unggulan (featured).
    // Sisanya tetap ada, tapi hanya di halaman projects.html.
    const featuredProjects = publishedProjects.filter(p => p.featured);
    const homeProjects = (featuredProjects.length ? featuredProjects : publishedProjects).slice(0, 6);
    const hasProjects = homeProjects.length > 0;
    const hasSkills = Array.isArray(skills) && skills.length > 0;
    // Combine experience + education for the "Perjalanan" section
    const allTimeline = [
      ...(Array.isArray(experience) ? experience.map(e => ({ ...e, _type: 'exp' })) : []),
      ...(Array.isArray(education) ? education.map(e => ({ ...e, _type: 'edu', role: e.degree, company: e.institution, desc: e.detail || '', period: e.period })) : [])
    ];
    const hasExp = allTimeline.length > 0;
    const hasCerts = Array.isArray(certificates) && certificates.length > 0;

    // 1. Profile & Avatar
    if (profile) {
      let av = profile.avatar || 'assets/profil.png';
      if (av.startsWith('/') && !av.startsWith('//')) av = av.slice(1);
      const heroPortrait = document.getElementById('heroPortraitImg') || document.querySelector('.portrait-img img');
      if (heroPortrait) {
        heroPortrait.src = av;
      }

      // Nama/judul/bio hero sekarang HANYA dari tabel profile,
      // supaya form admin benar-benar mengubah apa yang tampil.
      const heroName = document.querySelector('.hero-name');
      if (heroName) {
        heroName.innerHTML = formatHeading(profile.name || '');
      }

      const heroRole = document.querySelector('.hero-role');
      if (heroRole) {
        const roleRaw = profile.title || '';
        const cleanRole = escapeHTML(roleRaw).replace(/<br\s*\/?>/gi, ' ').trim();
        heroRole.innerHTML = '<span id="heroRoleText"></span><span class="typing-cursor">|</span>';
        const roleTextEl = document.getElementById('heroRoleText');
        
        if (window.heroTypingTimeout) clearTimeout(window.heroTypingTimeout);
        
        // Split by pipeline, bullet, unicode replacement char (), or comma
        let phrases = cleanRole.split(/[\|•\-\uFFFD,]/).map(s => s.trim()).filter(Boolean);
        if (phrases.length === 0) phrases = [cleanRole];
        
        let phraseIdx = 0;
        let charIdx = 0;
        let isDeleting = false;

        function typeWriter() {
          if (!document.getElementById('heroRoleText')) return;
          const currentPhrase = phrases[phraseIdx % phrases.length];
          
          if (isDeleting) {
            roleTextEl.innerHTML = currentPhrase.substring(0, charIdx - 1);
            charIdx--;
          } else {
            roleTextEl.innerHTML = currentPhrase.substring(0, charIdx + 1);
            charIdx++;
          }
          
          let speed = isDeleting ? 30 : 70;
          
          if (!isDeleting && charIdx === currentPhrase.length) {
            speed = 2500; // pause before delete
            isDeleting = true;
          } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            phraseIdx++;
            speed = 500; // pause before next word
          }
          
          window.heroTypingTimeout = setTimeout(typeWriter, speed);
        }
        
        window.heroTypingTimeout = setTimeout(typeWriter, 500);
      }

      const heroBio = document.querySelector('#hero .hero-desc, #hero .hero-bio, .hero-desc, .hero-bio');
      if (heroBio) {
        heroBio.textContent = profile.bio || '';
      }

      if (profile.location) {
        const locTag = document.querySelector('.portrait-tag .tag-mono');
        if (locTag) locTag.textContent = profile.location;
      }
    }

    // 2. Hero Section
    if (landing && landing.hero) {
      const heroEl = document.getElementById('hero');
      if (heroEl) heroEl.style.display = landing.hero.enabled !== false ? '' : 'none';
      const eyebrow = document.querySelector('#hero .hero-eyebrow');
      if (eyebrow) {
        if (landing.hero.eyebrow && landing.hero.eyebrow.trim()) {
          eyebrow.style.display = '';
          eyebrow.textContent = landing.hero.eyebrow.trim();
        }
      }

      const b1 = document.querySelector('#hero .hero-actions .btn-primary');
      if (b1) {
        b1.style.display = '';
        b1.textContent = landing.hero.btn1Text || 'Lihat Proyek';
        b1.href = landing.hero.btn1Link || '#projects';
      }

      const b2 = document.querySelector('#hero .hero-actions .btn-ghost');
      if (b2) {
        b2.style.display = '';
        b2.textContent = landing.hero.btn2Text || 'Hubungi Saya';
        b2.href = landing.hero.btn2Link || '#contact';
      }
    }

    // Hero Meta Row Statistics (from landing.about or landing.hero)
    const metaRow = document.querySelector('.hero-meta-row');
    if (metaRow) {
      const s1Num = (landing && landing.about && landing.about.stat1Num) || (landing && landing.hero && landing.hero.stat1Num) || '';
      const s1Lbl = (landing && landing.about && landing.about.stat1Label) || (landing && landing.hero && landing.hero.stat1Label) || '';
      const s2Num = (landing && landing.about && landing.about.stat2Num) || (landing && landing.hero && landing.hero.stat2Num) || '';
      const s2Lbl = (landing && landing.about && landing.about.stat2Label) || (landing && landing.hero && landing.hero.stat2Label) || '';
      const s3Num = (landing && landing.about && landing.about.stat3Num) || (landing && landing.hero && landing.hero.stat3Num) || '';
      const s3Lbl = (landing && landing.about && landing.about.stat3Label) || (landing && landing.hero && landing.hero.stat3Label) || '';

      const hasStats = Boolean((s1Num && s1Num.trim()) || (s2Num && s2Num.trim()) || (s3Num && s3Num.trim()));
      if (!hasStats) {
        metaRow.style.display = 'none';
      } else {
        metaRow.style.display = '';
        const items = metaRow.querySelectorAll('.hero-meta-item');
        if (items[0]) {
          items[0].style.display = (s1Num && s1Num.trim()) ? '' : 'none';
          const v = items[0].querySelector('.hero-meta-value');
          const l = items[0].querySelector('.hero-meta-label');
          if (v) v.textContent = s1Num;
          if (l) l.textContent = s1Lbl;
        }
        if (items[1]) {
          items[1].style.display = (s2Num && s2Num.trim()) ? '' : 'none';
          const v = items[1].querySelector('.hero-meta-value');
          const l = items[1].querySelector('.hero-meta-label');
          if (v) v.textContent = s2Num;
          if (l) l.textContent = s2Lbl;
        }
        if (items[2]) {
          items[2].style.display = (s3Num && s3Num.trim()) ? '' : 'none';
          const v = items[2].querySelector('.hero-meta-value');
          const l = items[2].querySelector('.hero-meta-label');
          if (v) v.textContent = s3Num;
          if (l) l.textContent = s3Lbl;
        }
      }
    }

    // Hero Right Column: Glance Panel (01 FOCUS / 02 CORE TECH / 03 KARYA UNGGULAN)
    const glanceFocus = document.getElementById('heroGlanceFocus');
    if (glanceFocus) {
      const focusText = (landing && landing.hero && landing.hero.focusText) || '';
      if (focusText) {
        glanceFocus.textContent = focusText;
      }
    }

    const glanceStack = document.getElementById('heroGlanceStack');
    if (glanceStack && landing && landing.hero && Array.isArray(landing.hero.coreTech) && landing.hero.coreTech.length > 0) {
      glanceStack.innerHTML = landing.hero.coreTech.map(s => {
        const sName = escapeHTML(typeof s === 'string' ? s : (s.name || s.title || ''));
        return `<span class="tech-pill">${sName}</span>`;
      }).join('');
    }

    const glanceProjects = document.getElementById('heroGlanceProjects');
    if (glanceProjects && landing && landing.hero && Array.isArray(landing.hero.featuredProjects) && landing.hero.featuredProjects.length > 0) {
      glanceProjects.innerHTML = landing.hero.featuredProjects.map(p => {
        const pTitle = escapeHTML(p.title || 'Project');
        const pSub = escapeHTML(p.desc || p.tagline || p.subtitle || '');
        const pLink = escapeHTML(p.link || '#projects');
        return `
          <a href="${pLink}" class="proj-entry">
            <span class="proj-link-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </span>
            <div class="proj-text">
              <div class="proj-name">${pTitle}</div>
              <div class="proj-sub">${pSub}</div>
            </div>
          </a>
        `;
      }).join('');
    }

    // Marquee
    const marqueeEl = document.getElementById('marquee') || document.querySelector('.marquee-wrap');
    if (marqueeEl) {
      const rawText = (landing && landing.marquee && landing.marquee.text) ? landing.marquee.text.trim() : '';
      const isMarqueeEnabled = landing && landing.marquee ? landing.marquee.enabled !== false : false;
      if (!rawText || !isMarqueeEnabled) {
        marqueeEl.style.display = 'none';
      } else {
        marqueeEl.style.display = '';
        const track = marqueeEl.querySelector('.marquee-track');
        if (track) {
          const rawItems = rawText.split(/[·✦•|]/).map(s => s.trim()).filter(Boolean);
          if (rawItems.length) {
            const fullItems = [...rawItems, ...rawItems];
            track.innerHTML = fullItems.map(item => `<span>${escapeHTML(item)}</span><span class="marquee-dot">✦</span>`).join('');
          }
        }
      }
    }

    // About Section
    if (landing && landing.about) {
      const aboutEl = document.getElementById('about');
      if (aboutEl) aboutEl.style.display = landing.about.enabled !== false ? '' : 'none';
      const lbl = document.querySelector('#about .section-label');
      if (lbl) lbl.textContent = landing.about.label || '02 — Tentang';
      const head = document.querySelector('#about .section-heading');
      if (head) head.innerHTML = formatHeading(landing.about.headline || 'Rekayasa sistem<br>yang <em>berdaya guna</em>');

      const paragraphs = document.querySelectorAll('#about .about-right p.about-text');
      if (paragraphs.length >= 1) {
        const t1 = landing.about.text1 || (profile && profile.longbio) || '';
        paragraphs[0].innerHTML = escapeHTML(t1)
          .replace(/&lt;strong&gt;/gi, '<strong>')
          .replace(/&lt;\/strong&gt;/gi, '</strong>')
          .replace(/&lt;em&gt;/gi, '<em>')
          .replace(/&lt;\/em&gt;/gi, '</em>');
      }
      if (paragraphs.length >= 2) {
        paragraphs[1].textContent = landing.about.text2 || '';
      }

      const statsWrap = document.querySelector('#about .about-stats');
      if (statsWrap) {
        const s1Num = landing.about.stat1Num || '';
        const s1Lbl = landing.about.stat1Label || '';
        const s2Num = landing.about.stat2Num || '';
        const s2Lbl = landing.about.stat2Label || '';
        const s3Num = landing.about.stat3Num || '';
        const s3Lbl = landing.about.stat3Label || '';
        const hasAboutStats = Boolean((s1Num && s1Num.trim()) || (s2Num && s2Num.trim()) || (s3Num && s3Num.trim()));

        if (!hasAboutStats) {
          statsWrap.style.display = 'none';
        } else {
          statsWrap.style.display = '';
          const stats = statsWrap.querySelectorAll('.stat');
          if (stats[0]) {
            stats[0].style.display = (s1Num && s1Num.trim()) ? '' : 'none';
            const num = stats[0].querySelector('.stat-number');
            const slbl = stats[0].querySelector('.stat-label');
            if (num) num.textContent = s1Num;
            if (slbl) slbl.textContent = s1Lbl;
          }
          if (stats[1]) {
            stats[1].style.display = (s2Num && s2Num.trim()) ? '' : 'none';
            const num = stats[1].querySelector('.stat-number');
            const slbl = stats[1].querySelector('.stat-label');
            if (num) num.textContent = s2Num;
            if (slbl) slbl.textContent = s2Lbl;
          }
          if (stats[2]) {
            stats[2].style.display = (s3Num && s3Num.trim()) ? '' : 'none';
            const num = stats[2].querySelector('.stat-number');
            const slbl = stats[2].querySelector('.stat-label');
            if (num) num.textContent = s3Num;
            if (slbl) slbl.textContent = s3Lbl;
          }
        }
      }
    }

    // Projects Section & Navigation
    const projEl = document.getElementById('projects');
    const projNavLinks = document.querySelectorAll('a[href="#projects"], a[href="projects.html"]');
    const isProjEnabled = !landing || !landing.projects || landing.projects.enabled !== false;

    if (!isProjEnabled) {
      if (projEl) projEl.style.display = 'none';
      projNavLinks.forEach(l => l.style.display = 'none');
    } else {
      if (projEl) projEl.style.display = '';
      projNavLinks.forEach(l => l.style.display = '');

      if (landing && landing.projects) {
        const lbl = document.querySelector('#projects .section-label');
        if (lbl) lbl.textContent = landing.projects.label || '03 — Karya Pilihan';
        const head = document.querySelector('#projects .section-heading');
        if (head) head.innerHTML = formatHeading(landing.projects.headline || 'Showcase<br><em>Proyek Nyata</em>');
        const btn = document.querySelector('#projects .projects-header .btn-ghost, #projects .btn-ghost');
        if (btn) {
          const archived = publishedProjects.length - homeProjects.length;
          btn.textContent = archived > 0
            ? `Lihat Semua ${publishedProjects.length} Proyek →`
            : (landing.projects.btnText || 'Lihat Arsip Lengkap →');
          if (landing.projects.btnLink) btn.href = landing.projects.btnLink;
        }
      }

      const listContainer = document.getElementById('projectListContainer') || document.querySelector('.project-showcase, .project-list');
      if (listContainer) {
        listContainer.className = 'project-showcase';
        if (!hasProjects) {
          listContainer.innerHTML = `<div class="empty-state" style="padding: 4rem 0; text-align: center; color: var(--text-dim); width: 100%;"><p>Belum ada karya yang dipublikasikan.</p></div>`;
        } else {
          listContainer.innerHTML = homeProjects.map((p, idx) => {
            const num = p.num || String(idx + 1).padStart(2, '0');
            const cat = p.category ? p.category.toUpperCase() : 'WEB APPLICATION';
            const year = p.year || '2025';
            const role = p.role || 'Developer';
            const tags = Array.isArray(p.stack) ? p.stack : [];
            const slugOrId = p.slug || p.id;
            const cover = p.cover || `assets/mockups/${p.slug || 'dashboard'}-main.svg`;
            const isIcon = cover.includes('-icon') || cover.endsWith('icon.png');

            const cleanUrl = v => { const s = (v || '').trim(); return !s || s === '#' || s === 'undefined' ? '' : s; };
            const liveUrl = cleanUrl(p.live || p.liveUrl);
            const ghUrl = cleanUrl(p.github || p.githubUrl);

            return `
            <article class="project-showcase-item reveal-up">
              <div class="showcase-content">
                <div class="showcase-meta">
                  <span class="showcase-index">${escapeHTML(num)} // ${escapeHTML(cat)}</span>
                  <span class="showcase-year">${escapeHTML(year)} · ${escapeHTML(role)}</span>
                </div>
                <h3 class="showcase-title">${escapeHTML(p.titlePlain || p.title)}</h3>
                <p class="showcase-tagline">${escapeHTML(p.tagline || p.desc || '')}</p>
                <div class="showcase-tags" aria-label="Teknologi yang digunakan">
                  ${tags.map(t => `<span class="showcase-tag">${escapeHTML(t)}</span>`).join('')}
                </div>
                <div class="showcase-actions-row">
                  <a href="project-detail.html?id=${encodeURIComponent(slugOrId)}" class="showcase-action">
                    Lihat Studi Kasus <span aria-hidden="true">→</span>
                  </a>
                  ${liveUrl ? `<a href="${escapeHTML(liveUrl)}" target="_blank" rel="noopener" class="showcase-secondary-link">${liveUrl.includes('/releases') ? 'Rilis Unduhan ↗' : 'Demo Langsung ↗'}</a>` : ''}
                  ${ghUrl ? `<a href="${escapeHTML(ghUrl)}" target="_blank" rel="noopener" class="showcase-secondary-link">Kode Sumber (GitHub) ↗</a>` : ''}
                </div>
              </div>
              <div class="showcase-visual">
                <a href="project-detail.html?id=${encodeURIComponent(slugOrId)}" class="showcase-mockup-frame" aria-label="Lihat Detail ${escapeHTML(p.titlePlain || p.title)}">
                  <img src="${escapeHTML(cover)}" alt="Pratinjau ${escapeHTML(p.titlePlain || p.title)}" class="${isIcon ? 'contain-fit' : ''}" loading="lazy" onerror="this.onerror=null;this.src='assets/mockups/dashboard-main.svg'" />
                  <span class="mockup-corner-badge">${escapeHTML(cat)}</span>
                </a>
              </div>
            </article>`;
          }).join('');
        }
      }
    }

    // Skills Section & Navigation
    const skillsEl = document.getElementById('skills');
    const skillsNavLinks = document.querySelectorAll('a[href="#skills"]');
    const isSkillsEnabled = !landing || !landing.skills || landing.skills.enabled !== false;

    if (!isSkillsEnabled) {
      if (skillsEl) skillsEl.style.display = 'none';
      skillsNavLinks.forEach(l => l.style.display = 'none');
    } else {
      if (skillsEl) skillsEl.style.display = '';
      skillsNavLinks.forEach(l => l.style.display = '');

      if (landing && landing.skills) {
        const lbl = document.querySelector('#skills .section-label');
        if (lbl) lbl.textContent = landing.skills.label || '04 — Keahlian';
        const head = document.querySelector('#skills .section-heading');
        if (head) head.innerHTML = formatHeading(landing.skills.headline || 'Alat &<br><em>Teknologi Nyata</em>');
        const intro = document.querySelector('#skills .skills-intro');
        if (intro) intro.textContent = landing.skills.intro || '';
      }

      const skillsRight = document.getElementById('skillsContainer') || document.querySelector('.skills-right');
      if (skillsRight) {
        if (!hasSkills) {
          skillsRight.innerHTML = `<div class="empty-state" style="padding: 4rem 0; text-align: center; color: var(--text-dim); width: 100%;"><p>Belum ada alat atau teknologi yang ditambahkan.</p></div>`;
        } else {
          const cats = {};
          skills.forEach(s => {
          const c = s.category || 'General';
          if (!cats[c]) cats[c] = [];
          cats[c].push(s.name);
        });

        skillsRight.innerHTML = `
          <div class="skills-categories-grid">
            ${Object.entries(cats).map(([catName, skillNames], idx) => `
              <div class="skills-category-col reveal-up">
                <div class="category-header">
                  <span class="category-title">${String(idx + 1).padStart(2, '0')} // ${escapeHTML(catName)}</span>
                  <span class="category-count">${skillNames.length} Alat</span>
                </div>
                <div class="skills-chips-wrap">
                  ${skillNames.map(name => `<span class="skill-item">${escapeHTML(name)}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `;
          if (typeof window.updateSkillsGlobe === 'function') {
            window.updateSkillsGlobe(skills);
          }
        }
      }
    }

    // Experience Section & Navigation
    const expEl = document.getElementById('experience');
    const expNavLinks = document.querySelectorAll('a[href="#experience"]');
    const isExpEnabled = !landing || !landing.experience || landing.experience.enabled !== false;

    if (!isExpEnabled) {
      if (expEl) expEl.style.display = 'none';
      expNavLinks.forEach(l => l.style.display = 'none');
    } else {
      if (expEl) expEl.style.display = '';
      expNavLinks.forEach(l => l.style.display = '');

      if (landing && landing.experience) {
        const lbl = document.querySelector('#experience .section-label');
        if (lbl) lbl.textContent = landing.experience.label || '05 — Jejak Perjalanan';
        const head = document.querySelector('#experience .section-heading');
        if (head) head.innerHTML = formatHeading(landing.experience.headline || 'Pendidikan &<br><em>Kontribusi</em>');
      }

      const timeline = document.getElementById('timelineContainer') || document.querySelector('#experience .timeline-wrap, #experience .timeline');
      if (timeline) {
        timeline.className = 'timeline-wrap';
        if (!hasExp) {
          timeline.innerHTML = `<div class="empty-state" style="padding: 4rem 0; text-align: center; color: var(--text-dim); width: 100%;"><p>Belum ada riwayat pengalaman pendidikan atau organisasi.</p></div>`;
        } else {
          timeline.innerHTML = allTimeline.map((exp, idx) => `
          <div class="timeline-item ${exp.current || idx === 0 ? 'current' : ''} reveal-up">
            <div class="timeline-marker">
              <div class="timeline-marker-dot"></div>
            </div>
            <div class="timeline-date-col">
              <span class="timeline-period">${escapeHTML(exp.period || '')}</span>
              <span class="timeline-type-badge">${escapeHTML(exp._type === 'edu' ? (exp.gpa ? 'GPA ' + exp.gpa : 'Pendidikan') : (exp.type || 'Penuh waktu'))}</span>
            </div>
            <div class="timeline-body">
              <h3 class="timeline-role-title">${escapeHTML(exp.role || exp.degree || '')}</h3>
              <p class="timeline-company-line">${escapeHTML(exp.company || exp.institution || '')}${exp.location ? ' · ' + escapeHTML(exp.location) : ''}</p>
              <p class="timeline-description">${escapeHTML(exp.desc || exp.detail || '')}</p>
              ${Array.isArray(exp.highlights) && exp.highlights.length ? `
                <div class="timeline-highlights">
                  ${exp.highlights.map(h => `<span class="timeline-pill">${escapeHTML(h)}</span>`).join('')}
                </div>
              ` : ''}
              ${Array.isArray(exp.tags) && exp.tags.length ? `
                <div class="timeline-highlights">
                  ${exp.tags.map(t => `<span class="timeline-pill">${escapeHTML(t)}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('');
        }
      }
    }

    // Certificates Section & Navigation
    const certsEl = document.getElementById('certificates');
    const certsNavLinks = document.querySelectorAll('a[href="#certificates"]');
    const isCertsEnabled = !landing || !landing.certs || landing.certs.enabled !== false;

    if (!isCertsEnabled) {
      if (certsEl) certsEl.style.display = 'none';
      certsNavLinks.forEach(l => l.style.display = 'none');
    } else {
      if (certsEl) certsEl.style.display = '';
      certsNavLinks.forEach(l => l.style.display = '');

      if (landing && landing.certs) {
        const lbl = document.querySelector('#certificates .section-label');
        if (lbl) lbl.textContent = landing.certs.label || '06 — Pembelajaran & Kredensial';
        const head = document.querySelector('#certificates .section-heading');
        if (head) head.innerHTML = formatHeading(landing.certs.headline || 'Validasi & <em>Sertifikasi Keahlian</em>');
      }

      const certsGrid = document.getElementById('certsContainer') || document.querySelector('#certificates .certs-gallery, #certificates .certs-grid');
      if (certsGrid) {
        certsGrid.className = 'certs-gallery';
        if (!hasCerts) {
          certsGrid.innerHTML = `<div class="empty-state" style="padding: 4rem 0; text-align: center; color: var(--text-dim); grid-column: 1 / -1; width: 100%;"><p>Belum ada sertifikat atau lisensi kredensial.</p></div>`;
        } else {
          certsGrid.innerHTML = certificates.map(c => `
          <article class="cert-card reveal-up">
            <div>
              <div class="cert-header">
                <span class="cert-id">${escapeHTML(c.credid || 'KREDENSIAL')}</span>
                <span class="cert-badge">TERVERIFIKASI</span>
              </div>
              <div class="cert-main">
                <h3 class="cert-title">${escapeHTML(c.title)}</h3>
                <div class="cert-issuer-line">
                  <span>${escapeHTML(c.issuer)}</span>
                  <span>${escapeHTML(c.year)}</span>
                </div>
                <p class="cert-desc">${escapeHTML(c.desc || '')}</p>
                ${Array.isArray(c.skills) && c.skills.length ? `
                  <div class="cert-skills-wrap">
                    ${c.skills.map(s => `<span class="cert-skill-tag">${escapeHTML(s)}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
            <div class="cert-footer">
              <a href="${escapeHTML(c.url || '#')}" target="_blank" rel="noopener" class="cert-verify-link">Lihat Referensi <span aria-hidden="true">↗</span></a>
            </div>
          </article>`).join('');
        }
      }
    }

    // Contact Section
    if (landing && landing.contact) {
      const contactEl = document.getElementById('contact');
      if (contactEl) contactEl.style.display = landing.contact.enabled !== false ? '' : 'none';
      const lbl = document.querySelector('#contact .section-label');
      if (lbl) lbl.textContent = landing.contact.label || '07 — Kontak & Kolaborasi';
      const head = document.querySelector('#contact .section-heading');
      if (head) head.innerHTML = formatHeading(landing.contact.headline || 'Mari bangun sesuatu yang <em>berdampak</em>');
      const sub = document.querySelector('#contact .contact-sub');
      if (sub) sub.textContent = landing.contact.sub || '';
    }

    // Dynamic Social Links & Contact Info
    const emailDisplay = document.getElementById('contactEmailDisplay');
    const contactSocials = document.getElementById('contactSocialsContainer') || document.querySelector('.contact-socials');
    const contactEmail = (landing && landing.contact && landing.contact.email) || (profile && profile.email) || 'mihwalmaulana09@gmail.com';
    if (emailDisplay) {
      emailDisplay.textContent = contactEmail;
    }
    // Update all mailto links across page
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      a.href = `mailto:${contactEmail}`;
    });

    if (contactSocials) {
      const links = [];
      if (social && Array.isArray(social.links)) {
        social.links.filter(l => l.visible !== false && l.platform !== 'Email').forEach(l => {
          links.push(`<a href="${escapeHTML(l.url)}" target="_blank" rel="noopener" class="social-link"><span>${escapeHTML(l.platform)}</span><span aria-hidden="true">↗</span></a>`);
        });
      } else {
        if (profile && profile.github) links.push(`<a href="${escapeHTML(profile.github)}" target="_blank" rel="noopener" class="social-link"><span>GitHub</span><span aria-hidden="true">↗</span></a>`);
        if (profile && profile.linkedin) links.push(`<a href="${escapeHTML(profile.linkedin)}" target="_blank" rel="noopener" class="social-link"><span>LinkedIn</span><span aria-hidden="true">↗</span></a>`);
        if (profile && profile.twitter) links.push(`<a href="${escapeHTML(profile.twitter)}" target="_blank" rel="noopener" class="social-link"><span>Twitter / X</span><span aria-hidden="true">↗</span></a>`);
        if (profile && (profile.dribbble || profile.website)) {
          const otherUrl = profile.dribbble || profile.website;
          const otherLabel = otherUrl.includes('instagram') ? 'Instagram' : 'Website';
          links.push(`<a href="${escapeHTML(otherUrl)}" target="_blank" rel="noopener" class="social-link"><span>${otherLabel}</span><span aria-hidden="true">↗</span></a>`);
        }
      }
      if (contactEmail) {
        links.push(`<a href="mailto:${escapeHTML(contactEmail)}" class="social-link"><span>Kirim Email Langsung</span><span aria-hidden="true">↗</span></a>`);
      }
      if (links.length) {
        contactSocials.innerHTML = links.join('\n');
      }
    }

    // Dynamic Footer
    const footerLogo = document.querySelector('#footer .footer-logo');
    if (footerLogo) footerLogo.textContent = (profile && profile.handle) || 'WalZetass';
    const footerCopy = document.querySelector('#footer .footer-copy');
    if (footerCopy) {
      const year = new Date().getFullYear();
      const pName = (profile && profile.name) || 'M Ihwal Maulana';
      footerCopy.textContent = `© ${year} ${pName}`;
    }
    const footerMono = document.querySelector('#footer .footer-mono');
    if (footerMono) {
      const pLoc = (profile && profile.location) || 'Pekanbaru · Indonesia';
      footerMono.textContent = pLoc;
    }

    // Preserve Black-Cyan theme variables unless a custom non-default accent is explicitly set
    const accent = (three && three.accentColor) || (settings && settings.accent);
    if (accent && accent.toLowerCase() !== '#c8b89a' && accent.toLowerCase() !== '#00b4d8') {
      document.documentElement.style.setProperty('--accent', accent);
    }

    // Keep scroll-attenuated 3D canvas intensity managed by the render loop
    if (three && three.pages && three.pages.homepage && three.pages.homepage.enabled === false) {
      const canvas = document.getElementById('bg-canvas');
      if (canvas) canvas.style.display = 'none';
    }

    // ── Chrome global: brand, nav, tombol, form, footer ──
    // Semua string yang sebelumnya ditulis langsung di HTML,
    // sekarang bisa diubah dari admin.
    const chrome = landing.chrome || {};
    const heroSec = landing.hero || {};

    const setText = (root, sel, val) => {
      if (!val) return;
      root.querySelectorAll(sel).forEach(el => { el.textContent = val; });
    };

    if (chrome.brand) {
      document.querySelectorAll('.nav-logo, #footer .footer-logo').forEach(el => {
        if (!el.dataset.chromeBound) { el.textContent = chrome.brand; el.dataset.chromeBound = '1'; }
      });
    }

    // Label menu navigasi (desktop + mobile) mengikuti urutan chrome.navLabels
    if (Array.isArray(chrome.navLabels) && chrome.navLabels.length) {
      const navLinks = document.querySelectorAll('.nav-link, .mobile-link');
      navLinks.forEach(link => {
        // Cocokkan berdasarkan posisi, tapi lewati link yang bukan menu utama
        const i = Array.from(navLinks).indexOf(link);
        const perGroup = Math.ceil(navLinks.length / 2);
        const idx = i < perGroup ? i : i - perGroup;
        const nextLabel = chrome.navLabels[idx];
        if (nextLabel && link.dataset.chromeBound !== '1') {
          link.textContent = nextLabel;
          link.dataset.chromeBound = '1';
        }
      });
    }

    if (chrome.scrollTag) setText(document, '.scroll-tag', chrome.scrollTag);
    if (heroSec.portraitAlt) {
      const p = document.getElementById('heroPortraitImg');
      if (p) p.alt = heroSec.portraitAlt;
    }
    if (heroSec.anonAvatar) {
      const a = document.getElementById('heroPortraitAnon');
      if (a) a.src = heroSec.anonAvatar;
    }
    if (heroSec.anonAlt) {
      const a = document.getElementById('heroPortraitAnon');
      if (a) a.alt = heroSec.anonAlt;
    }
    if (Array.isArray(heroSec.glanceLabels)) {
      const labelEls = document.querySelectorAll('#hero .glance-label');
      if (labelEls.length === heroSec.glanceLabels.length) {
        labelEls.forEach((el, i) => {
          if (heroSec.glanceLabels[i]) el.textContent = heroSec.glanceLabels[i];
        });
      }
    }

    if (chrome.formName) document.querySelectorAll('label[for="name"]').forEach(el => el.textContent = chrome.formName);
    if (chrome.formEmail) document.querySelectorAll('label[for="email"]').forEach(el => el.textContent = chrome.formEmail);
    if (chrome.formProject) document.querySelectorAll('label[for="project"]').forEach(el => el.textContent = chrome.formProject);
    if (chrome.formMessage) document.querySelectorAll('label[for="message"]').forEach(el => el.textContent = chrome.formMessage);
    if (chrome.formPlaceholderName) { const e = document.getElementById('name'); if (e) e.placeholder = chrome.formPlaceholderName; }
    if (chrome.formPlaceholderEmail) { const e = document.getElementById('email'); if (e) e.placeholder = chrome.formPlaceholderEmail; }
    if (chrome.formPlaceholderProject) { const e = document.getElementById('project'); if (e) e.placeholder = chrome.formPlaceholderProject; }
    if (chrome.formPlaceholderMessage) { const e = document.getElementById('message'); if (e) e.placeholder = chrome.formPlaceholderMessage; }
    if (chrome.formSubmit) document.querySelectorAll('#contactForm .btn-text, #contactForm .btn-icon').forEach(el => {
      if (el.classList.contains('btn-text')) el.textContent = chrome.formSubmit;
    });
    if (chrome.copyEmailBtn) {
      const b = document.getElementById('copyEmailBtn');
      if (b && !b.dataset.chromeBound) {
        const span = b.querySelector('span') || b;
        span.textContent = chrome.copyEmailBtn;
        b.dataset.chromeBound = '1';
      }
    }

    if (chrome.emptyProjects) window.__chromeEmpty = Object.assign(window.__chromeEmpty || {}, { projects: chrome.emptyProjects });
    if (chrome.emptySkills) window.__chromeEmpty = Object.assign(window.__chromeEmpty || {}, { skills: chrome.emptySkills });
    if (chrome.emptyTimeline) window.__chromeEmpty = Object.assign(window.__chromeEmpty || {}, { timeline: chrome.emptyTimeline });
    if (chrome.emptyCerts) window.__chromeEmpty = Object.assign(window.__chromeEmpty || {}, { certs: chrome.emptyCerts });

    // ── SEO untuk halaman selain home ──
    // Dulu hanya seo.pages.home yang pernah dipakai; about/projects/detail
    // sudah ada di DB tapi tidak pernah ditulis ke DOM.
    // Halamanabout/projects/detail memakai <body class="page-*">
    const bodyClass = document.body ? document.body.className : '';
    const pageKey = bodyClass.match(/page-(about|projects|detail)/) ?
      bodyClass.match(/page-(about|projects|detail)/)[1] : null;
    // project-detail memakai SEO halaman projects
    const seoKey = pageKey === 'detail' ? 'projects' : pageKey;
    const seoPage = (seo && seo.pages) ? (seoKey ? seo.pages[seoKey] : null) : null;
    if (seoPage) {
      if (seoPage.title) document.title = seoPage.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (seoPage.desc && metaDesc) metaDesc.setAttribute('content', seoPage.desc);
    }

    // Open Graph / Twitter — sebelumnya tidak pernah ditulis sama sekali
    const applyMeta = (selector, attr, value) => {
      if (!value) return;
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [, name, content] = selector.match(/meta\[(\w+)="([^"]+)"\]/);
        el.setAttribute(name, content);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    const activeSeo = seoPage || (seo && seo.pages ? seo.pages.home : null);
    if (activeSeo) {
      applyMeta('meta[property="og:title"]', 'content', activeSeo.ogTitle || activeSeo.title);
      applyMeta('meta[property="og:description"]', 'content', activeSeo.ogDesc || activeSeo.desc);
      applyMeta('meta[property="og:image"]', 'content', activeSeo.ogImage);
      applyMeta('meta[name="twitter:title"]', 'content', activeSeo.twitterTitle || activeSeo.ogTitle || activeSeo.title);
      applyMeta('meta[name="twitter:description"]', 'content', activeSeo.twitterDesc || activeSeo.ogDesc || activeSeo.desc);
      applyMeta('meta[name="twitter:image"]', 'content', activeSeo.twitterImage || activeSeo.ogImage);
      if (activeSeo.canonical) {
        let link = document.head.querySelector('link[rel="canonical"]');
        if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
        link.href = activeSeo.canonical;
      }
    }

    // SEO home tetap dipasang apa pun halamannya
    if (seo && seo.pages && seo.pages.home) {
      const hSeo = seo.pages.home;
      if (hSeo.title && !seoPage) document.title = hSeo.title;
      if (hSeo.desc && !seoPage) {
        const mDesc = document.querySelector('meta[name="description"]');
        if (mDesc) mDesc.setAttribute('content', hSeo.desc);
      }
    }

    // Observe newly injected elements for smooth scroll reveal animations
    if (typeof window.observeDynamicReveals === 'function') {
      window.observeDynamicReveals(document);
    }
  }

  /* ─────────────────────────────────────────────────────────────
     INTERACTIVE DUAL-LAYER SPOTLIGHT PORTRAIT
     - Base: Formal photo (#heroPortraitImg)
     - Top: Anonymous photo (#heroPortraitAnon with radial-mask)
     - Cursor-following radial mask (radius 120-180px, feathered)
     - Subtle 3D tilt & smooth 350-450ms fade-out on exit
     - High-performance 60-120fps via requestAnimationFrame
  ───────────────────────────────────────────────────────────── */
  function initInteractivePortrait() {
    const frame = document.getElementById('heroInteractivePortrait');
    const anonLayer = document.getElementById('portraitAnonLayer');
    if (!frame || !anonLayer) return;
    if (frame._portraitControllerInitialized) return;
    frame._portraitControllerInitialized = true;

    let rafId = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let isHovered = false;
    const maskRadius = 240; // optimal radius for grand enlarged portrait

    function renderFrame() {
      if (!isHovered) {
        // Smooth reset tilt
        currentTiltX += (0 - currentTiltX) * 0.14;
        currentTiltY += (0 - currentTiltY) * 0.14;
        if (Math.abs(currentTiltX) > 0.05 || Math.abs(currentTiltY) > 0.05) {
          frame.style.transform = `perspective(1000px) rotateX(${currentTiltX.toFixed(2)}deg) rotateY(${currentTiltY.toFixed(2)}deg) scale3d(1, 1, 1)`;
          rafId = requestAnimationFrame(renderFrame);
        } else {
          frame.style.transform = '';
          rafId = null;
        }
        return;
      }

      // Smooth interpolation for mouse position & 3D tilt
      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;
      currentTiltX += (targetTiltX - currentTiltX) * 0.18;
      currentTiltY += (targetTiltY - currentTiltY) * 0.18;

      const mx = `${currentX.toFixed(1)}px`;
      const my = `${currentY.toFixed(1)}px`;
      const mr = `${maskRadius}px`;
      frame.style.setProperty('--mask-x', mx);
      frame.style.setProperty('--mask-y', my);
      frame.style.setProperty('--mask-r', mr);
      anonLayer.style.setProperty('--mask-x', mx);
      anonLayer.style.setProperty('--mask-y', my);
      anonLayer.style.setProperty('--mask-r', mr);
      anonLayer.style.setProperty('--mask-opacity', '1');

      frame.style.transform = `perspective(1000px) rotateX(${currentTiltX.toFixed(2)}deg) rotateY(${currentTiltY.toFixed(2)}deg) scale3d(1.02, 1.02, 1)`;

      rafId = requestAnimationFrame(renderFrame);
    }

    function onPointerMove(clientX, clientY) {
      const rect = frame.getBoundingClientRect();
      targetX = clientX - rect.left;
      targetY = clientY - rect.top;

      const normX = (targetX / rect.width) * 2 - 1;
      const normY = (targetY / rect.height) * 2 - 1;
      targetTiltY = normX * 4;
      targetTiltX = -normY * 4;

      if (!isHovered) {
        isHovered = true;
        currentX = targetX;
        currentY = targetY;
        const mx = `${currentX}px`;
        const my = `${currentY}px`;
        const mr = `${maskRadius}px`;
        frame.classList.add('is-spotlight-active');
        frame.style.setProperty('--mask-x', mx);
        frame.style.setProperty('--mask-y', my);
        frame.style.setProperty('--mask-r', mr);
        anonLayer.style.setProperty('--mask-x', mx);
        anonLayer.style.setProperty('--mask-y', my);
        anonLayer.style.setProperty('--mask-r', mr);
        anonLayer.style.setProperty('--mask-opacity', '1');
        if (!rafId) rafId = requestAnimationFrame(renderFrame);
      }
    }

    function onPointerLeave() {
      isHovered = false;
      frame.classList.remove('is-spotlight-active');
      anonLayer.style.setProperty('--mask-opacity', '0');
      if (!rafId) rafId = requestAnimationFrame(renderFrame);
    }

    frame.addEventListener('pointerenter', (e) => onPointerMove(e.clientX, e.clientY));
    frame.addEventListener('pointermove', (e) => onPointerMove(e.clientX, e.clientY));
    frame.addEventListener('pointerleave', onPointerLeave);

    // Touch support for mobile
    frame.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    frame.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    frame.addEventListener('touchend', onPointerLeave, { passive: true });
    frame.addEventListener('touchcancel', onPointerLeave, { passive: true });
  }

  async function fetchAndRender() {
    try {
      initInteractivePortrait();
      if (typeof PortfolioAPI !== 'undefined') {
        const data = await PortfolioAPI.getPortfolio();
        renderPortfolio(data);
      } else {
        const res = await fetch('/api/portfolio');
        const json = await res.json();
        if (json.success && json.data) {
          renderPortfolio(json.data);
        }
      }
    } catch (err) {
      console.error('[Portfolio] Gagal memuat data dinamis:', err);
    }
  }

  // Initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndRender);
  } else {
    fetchAndRender();
  }

  // Real-time synchronization
  if (typeof PortfolioAPI !== 'undefined' && PortfolioAPI.onUpdate) {
    PortfolioAPI.onUpdate(() => {
      fetchAndRender();
    });
  }

    try {
    const channel = new BroadcastChannel('wz_cms_channel');
    channel.onmessage = () => {
      fetchAndRender();
    };
  } catch (e) {}

  window.addEventListener('storage', (event) => {
    if (
      event.key === 'wz_cms_state' ||
      event.key === 'wz_portfolio_controls' ||
      event.key === 'cache_portfolio' ||
      event.key === 'cache_portfolio_update'
    ) {
      fetchAndRender();
    }
  });

  window.addEventListener('message', (event) => {
    if (
      event.data &&
      (event.data.type === 'WZ_CONTROLS_UPDATE' ||
        event.data.type === 'WZ_CMS_UPDATE' ||
        event.data.type === 'CMS_STATE_UPDATED')
    ) {
      fetchAndRender();
    }
  });
})();


