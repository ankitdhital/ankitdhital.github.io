// 3D viewer for the Mechanical Envelope page.
// Loads assets/models/envelope.glb (built from Ankit's SolidWorks STEP exports) and drives it from
// one number: rack travel. Constraints kept from the CAD: each plate slides only along X, the pinion
// (module 1, 20 teeth, pitch radius 10 mm) turns by travel / 10 rad, and the crank turns with it.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const PITCH_RADIUS = 10;   // mm
export const TRAVEL_MAX = 65;     // mm per plate; the 90 mm racks leave the pinion at about 70 mm

function letterTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 792;
  const x = c.getContext('2d');
  x.fillStyle = '#FBF6EC'; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = 'rgba(122,130,140,.55)'; x.lineWidth = 6; x.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const y = 250 + i * 62, end = i === 6 ? 520 : 820 - (i % 3) * 70;
    x.beginPath(); x.moveTo(210, y);
    for (let px = 210; px <= end; px += 6) x.lineTo(px, y + Math.sin(px / 23 + i) * 6);
    x.stroke();
  }
  x.fillStyle = '#C4161C';
  x.beginPath(); x.moveTo(512, 205); x.bezierCurveTo(470, 175, 440, 150, 440, 122); x.bezierCurveTo(440, 100, 458, 86, 478, 86); x.bezierCurveTo(495, 86, 507, 97, 512, 110); x.bezierCurveTo(517, 97, 529, 86, 546, 86); x.bezierCurveTo(566, 86, 584, 100, 584, 122); x.bezierCurveTo(584, 150, 554, 175, 512, 205); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export async function mountEnvelope3D(host, { url }) {
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('WebGL unavailable');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // keep the red PETG close to the photographed #F21A25
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-300, 500, 700); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d8d8, 0.35));

  const camera = new THREE.PerspectiveCamera(28, 1, 5, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, -12, 20);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 160; controls.maxDistance = 1200;
  // The wheel scrolls the page, not the model; zoom goes through zoomBy() (the page's + / − buttons).
  controls.enableZoom = false;
  controls.minPolarAngle = 0.25; controls.maxPolarAngle = Math.PI - 0.25;
  // One finger scrolls the page on phones; two fingers rotate and zoom the model.
  controls.touches = { ONE: -1, TWO: THREE.TOUCH.DOLLY_ROTATE };
  renderer.domElement.style.touchAction = 'pan-y';

  const gltf = await new GLTFLoader().loadAsync(url);
  const model = gltf.scene;
  const mats = {
    // Everything is printed in the same red PETG; trays and gearing are shaded slightly deeper so they read apart.
    plate: new THREE.MeshStandardMaterial({ color: 0xF21A25, roughness: 0.62, metalness: 0, envMapIntensity: 0.45, flatShading: true, transparent: true }),
    house: new THREE.MeshStandardMaterial({ color: 0xC9141D, roughness: 0.66, metalness: 0, envMapIntensity: 0.4, flatShading: true }),
    knob: new THREE.MeshStandardMaterial({ color: 0xF21A25, roughness: 0.5, metalness: 0, envMapIntensity: 0.5, flatShading: true }),
    steel: new THREE.MeshStandardMaterial({ color: 0xC4CAD2, roughness: 0.3, metalness: 0.7, envMapIntensity: 1.1, flatShading: true }),
  };
  const nodes = {};
  model.traverse(o => {
    if (o.name) nodes[o.name] = nodes[o.name] || o;
    if (!o.isMesh) return;
    const n = o.name || o.parent?.name || '';
    // Racks and the pinion render silver; the heart knob, plates and trays stay red.
    o.material = /plate/.test(n) ? mats.plate : /house|top-wall/.test(n) ? mats.house : /knob/.test(n) ? mats.knob : mats.steel;
  });
  scene.add(model);

  // Letter-size sheet (279.4 × 215.9 mm) in the tray, for scale.
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(279.4, 215.9), new THREE.MeshStandardMaterial({ map: letterTexture(), roughness: 0.9 }));
  sheet.position.set(0, -2, 3.2); scene.add(sheet);

  // Soft contact shadow behind the frame.
  const sh = document.createElement('canvas'); sh.width = sh.height = 128;
  const sx = sh.getContext('2d'), gr = sx.createRadialGradient(64, 64, 8, 64, 64, 64);
  gr.addColorStop(0, 'rgba(20,24,30,.22)'); gr.addColorStop(1, 'rgba(20,24,30,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(520, 420), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
  shadow.position.set(0, -6, -14); scene.add(shadow);

  // The pinion node carries Ankit's heart knob (gear, 5 mm shaft and knob in one printed part).
  const plateL = nodes['plate-left'], plateR = nodes['plate-right'], pinion = nodes['pinion'];
  const rackL = nodes['rack-left'], rackR = nodes['rack-right'];
  const houseL = nodes['house-left'], houseR = nodes['house-right'], topWall = nodes['top-wall'];
  const pinion0 = pinion.rotation.z, pinionZ0 = pinion.position.z;

  // ---- Exploded view -------------------------------------------------------------------------
  // Layers separate along the depth axis in sequence: trays + letter back, top wall up and back,
  // face plates forward, then racks and pinion settle in the middle layer with the racks pulled
  // off the gear. Offsets in mm; delay is the share of the timeline before a layer starts moving.
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const SPAN = 0.62;  // each layer's own move takes this share of the timeline
  let travel = 0, plateZ = 0, plateX = 0;
  const LAYERS = [
    { delay: 0.00, apply: e => { houseL.position.set(-16 * e, 0, -70 * e); houseR.position.set(16 * e, 0, -70 * e); sheet.position.z = 3.2 - 70 * e; shadow.position.z = -14 - 70 * e; } },
    { delay: 0.08, apply: e => { topWall.position.set(0, 30 * e, -70 * e); } },
    // Plates come forward and swing out sideways to open a window onto the gearing.
    { delay: 0.16, apply: e => { plateZ = 70 * e; plateX = 95 * e; } },
    // Racks are children of the plates: cancel the plates' sideways move so they stay centred,
    // pull them up and down off the pinion, and park them in the middle layer with it.
    { delay: 0.30, apply: e => { rackL.position.set(95 * e, 16 * e, -40 * e); rackR.position.set(-95 * e, -16 * e, -40 * e); pinion.position.z = pinionZ0 + 30 * e; axis.material.opacity = 0.9 * e; } },
    { delay: 0.38, apply: e => { knobLift = 14 * e; } },
  ];
  let knobLift = 0;
  const knob = nodes['knob'];
  // Dashed assembly axis through the pinion, visible only while exploded.
  const axis = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, pinion.position.y, -90), new THREE.Vector3(0, pinion.position.y, 150)]),
    new THREE.LineDashedMaterial({ color: 0x8A939E, dashSize: 4, gapSize: 3, transparent: true, opacity: 0 }));
  axis.computeLineDistances(); scene.add(axis);

  let ex = 0, exTarget = 0;              // timeline position 0 (assembled) .. 1 (exploded)
  function applyPose() {
    LAYERS.forEach(L => L.apply(ease(THREE.MathUtils.clamp((ex - L.delay) / SPAN, 0, 1))));
    plateL.position.set(-travel - plateX, 0, plateZ); plateR.position.set(travel + plateX, 0, plateZ);
    if (knob) knob.position.z = knobLift;
    pinion.rotation.z = pinion0 + travel / PITCH_RADIUS;   // rack above the pinion moves left: counterclockwise from the front
    dirty = true;
  }

  // Camera eases to a 3/4 view while exploding, and back home when assembling (cancelled if the visitor drags).
  let camTween = null;
  const EXPLODE_DIR = new THREE.Vector3(0.5, -0.3, 0.81).normalize();
  const HOME_DIR = new THREE.Vector3(0.36, -0.22, 0.9).normalize();
  const HOME_TARGET = new THREE.Vector3(0, -12, 20), EXPLODE_TARGET = new THREE.Vector3(0, -30, 25);
  controls.addEventListener('start', () => { camTween = null; });
  function tweenCamera(dir, dist, target) {
    const from = camera.position.clone().sub(controls.target);
    camTween = { from, fromLen: from.length(), to: dir.clone(), toLen: dist, t: 0, tFrom: controls.target.clone(), tTo: target.clone() };
  }

  function fit() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the fully open width (about 420 mm) in view at the starting distance.
    const vfov = THREE.MathUtils.degToRad(camera.fov), hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    camera.userData.dist = Math.max(160 / Math.tan(vfov / 2), 225 / Math.tan(hfov / 2)) * 1.05;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  let dirty = true, visible = true;
  const home = () => {
    const d = camera.userData.dist || 700;
    camera.position.copy(controls.target).add(new THREE.Vector3(0.36, -0.22, 0.9).normalize().multiplyScalar(d));
    controls.update();
  };
  new ResizeObserver(() => { const first = !camera.userData.dist; fit(); if (first) home(); }).observe(host);
  fit(); home();

  controls.addEventListener('change', () => { dirty = true; });
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(host);
  const DURATION = 1.6; // s, whole explode / assemble sequence
  function step(dt) {
    let moving = false;
    if (ex !== exTarget) {
      ex = exTarget > ex ? Math.min(exTarget, ex + dt / DURATION) : Math.max(exTarget, ex - dt / DURATION);
      applyPose(); moving = true;
    }
    if (camTween) {
      camTween.t = Math.min(1, camTween.t + dt / (DURATION * 0.9));
      const k = ease(camTween.t);
      const dir = camTween.from.clone().normalize().lerp(camTween.to, k).normalize();
      controls.target.lerpVectors(camTween.tFrom, camTween.tTo, k);
      camera.position.copy(controls.target).add(dir.multiplyScalar(THREE.MathUtils.lerp(camTween.fromLen, camTween.toLen, k)));
      if (camTween.t >= 1) camTween = null;
      moving = true;
    }
    return moving;
  }
  let last = performance.now();
  renderer.setAnimationLoop(now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible) return;
    const moving = step(dt);
    if (controls.update() || dirty || moving) { renderer.render(scene, camera); dirty = false; }
  });

  return {
    setTravel(mm) {
      travel = Math.min(TRAVEL_MAX, Math.max(0, mm));
      applyPose();
    },
    // Exploded view on/off. `instant` skips the animation (used for reduced motion and tests).
    setExplode(on, { instant = false } = {}) {
      exTarget = on ? 1 : 0;
      const dist = (camera.userData.dist || 700) * (on ? 1.45 : 1);
      const target = on ? EXPLODE_TARGET : HOME_TARGET;
      if (instant || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        ex = exTarget; applyPose();
        controls.target.copy(target);
        camera.position.copy(target).add((on ? EXPLODE_DIR : HOME_DIR).clone().multiplyScalar(dist));
        camTween = null; dirty = true; return;
      }
      tweenCamera(on ? EXPLODE_DIR : HOME_DIR, dist, target);
    },
    setXray(on) { this.setExplode(on); },
    zoomBy(f) {
      const d = camera.position.clone().sub(controls.target);
      d.setLength(THREE.MathUtils.clamp(d.length() * f, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(d);
      dirty = true;
    },
    reset() { home(); dirty = true; },
    renderNow() { controls.update(); renderer.render(scene, camera); return renderer.domElement; },
    seekExplode(v) { ex = exTarget = THREE.MathUtils.clamp(v, 0, 1); applyPose(); }, // tests: pose at a timeline point
    camera, controls,
  };
}
