// Solar System Simulation using Three.js and Astronomia Data
// -----------------------------------------------------------
// Visualizes planets with elliptical orbits using orbital elements.

// --------------------------- IMPORTS ---------------------------

import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

// --------------------------- CONSTANTS ---------------------------

const BASE_SCALE = 4444;
const PLANET_SIZE_MULTIPLIER = 1111111;
const TIME_SPEED_FACTOR = 5;
const degToRad = deg => deg * Math.PI / 180;

const orbitalElementsData = {
  Mercury: { a: 0.3871, e: 0.35, i: degToRad(7.005),   o: degToRad(48.331),  w: degToRad(29.124) },
  Venus:   { a: 0.7233, e: 0.02, i: degToRad(3.3946),  o: degToRad(76.680),  w: degToRad(54.884) },
  Earth:   { a: 1.0000, e: 0.03, i: degToRad(0.000),   o: degToRad(0.000),   w: degToRad(114.207) },
  Mars:    { a: 1.5237, e: 0.15, i: degToRad(1.850),   o: degToRad(49.558),  w: degToRad(286.502) },
  Jupiter: { a: 5.2026, e: 0.07, i: degToRad(1.303),   o: degToRad(100.464), w: degToRad(273.867) },
  Saturn:  { a: 9.5549, e: 0.1,  i: degToRad(2.489),   o: degToRad(113.665), w: degToRad(339.392) },
  Uranus:  { a: 19.218, e: 0.07, i: degToRad(0.773),   o: degToRad(74.006),  w: degToRad(96.998) },
  Neptune: { a: 30.110, e: 0.09, i: degToRad(1.770),   o: degToRad(131.784), w: degToRad(272.846) }
};

const planetSizes = {
  Mercury: 69, Venus: 101, Earth: 123, Mars: 72,
  Jupiter: 369, Saturn: 297, Uranus: 201, Neptune: 154
};

// --------------------------- SCENE SETUP ---------------------------

const canvas = document.getElementById('chartCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100000);
camera.position.set(0, 5000, 10000);
const controls = new OrbitControls(camera, canvas);

const light = new THREE.PointLight(0xffffff, 3);
scene.add(light);

// --------------------------- PLANET MESHES ---------------------------

const planets = [];

Object.keys(orbitalElementsData).forEach(name => {
  const geometry = new THREE.SphereGeometry(planetSizes[name] * PLANET_SIZE_MULTIPLIER, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  planets.push({ name, mesh });
});

// --------------------------- ORBIT LINES ---------------------------

function createOrbitLine(el, segments = 256) {
  const points = [];
  const { a, e, i, o, w } = el;
  const b = a * Math.sqrt(1 - e * e);

  for (let t = 0; t <= 2 * Math.PI; t += (2 * Math.PI) / segments) {
    const x = a * Math.cos(t) - a * e;
    const y = b * Math.sin(t);
    const z = 0;

    const cosO = Math.cos(o), sinO = Math.sin(o);
    const cosI = Math.cos(i), sinI = Math.sin(i);
    const cosW = Math.cos(w), sinW = Math.sin(w);

    let x1 = x * cosW - y * sinW;
    let y1 = x * sinW + y * cosW;
    let z1 = z;

    let x2 = x1;
    let y2 = y1 * cosI - z1 * sinI;
    let z2 = y1 * sinI + z1 * cosI;

    let x3 = x2 * cosO - y2 * sinO;
    let y3 = x2 * sinO + y2 * cosO;
    let z3 = z2;

    points.push(new THREE.Vector3(x3, z3, y3).multiplyScalar(BASE_SCALE));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  return new THREE.LineLoop(geometry, material);
}

Object.entries(orbitalElementsData).forEach(([name, el]) => {
  const line = createOrbitLine(el);
  scene.add(line);
});

// --------------------------- ANIMATION ---------------------------

let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += TIME_SPEED_FACTOR;

  planets.forEach(p => {
    const { a, e, i, o, w } = orbitalElementsData[p.name];
    const M = (time / 1000 + a) % (2 * Math.PI); // crude mean anomaly
    const E = M; // approximation
    const x = a * (Math.cos(E) - e);
    const y = a * Math.sqrt(1 - e * e) * Math.sin(E);

    const cosO = Math.cos(o), sinO = Math.sin(o);
    const cosI = Math.cos(i), sinI = Math.sin(i);
    const cosW = Math.cos(w), sinW = Math.sin(w);

    let x1 = x * cosW - y * sinW;
    let y1 = x * sinW + y * cosW;
    let z1 = 0;

    let x2 = x1;
    let y2 = y1 * cosI - z1 * sinI;
    let z2 = y1 * sinI + z1 * cosI;

    let x3 = x2 * cosO - y2 * sinO;
    let y3 = x2 * sinO + y2 * cosO;
    let z3 = z2;

    p.mesh.position.set(x3, z3, y3).multiplyScalar(BASE_SCALE);
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
});
