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
    gear: new THREE.MeshStandardMaterial({ color: 0xDA1620, roughness: 0.5, metalness: 0, envMapIntensity: 0.5, flatShading: true }),
  };
  const nodes = {};
  model.traverse(o => {
    if (o.name) nodes[o.name] = nodes[o.name] || o;
    if (!o.isMesh) return;
    const n = o.name || o.parent?.name || '';
    o.material = /plate/.test(n) ? mats.plate : /house|top-wall/.test(n) ? mats.house : mats.gear;
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
  const pinion0 = pinion.rotation.z;

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
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    if (controls.update() || dirty) { renderer.render(scene, camera); dirty = false; }
  });

  return {
    setTravel(mm) {
      const t = Math.min(TRAVEL_MAX, Math.max(0, mm));
      plateL.position.x = -t; plateR.position.x = t;
      pinion.rotation.z = pinion0 + t / PITCH_RADIUS;   // rack above the pinion moves left: counterclockwise from the front
      dirty = true;
    },
    setXray(on) {
      mats.plate.opacity = on ? 0.16 : 1; mats.plate.depthWrite = !on; mats.plate.needsUpdate = true;
      dirty = true;
    },
    reset() { home(); dirty = true; },
    renderNow() { controls.update(); renderer.render(scene, camera); return renderer.domElement; },
    camera, controls,
  };
}
