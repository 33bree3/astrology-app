// Solar System Simulation using Three.js and Astronomia Data
// -----------------------------------------------------------
// Visualizes planets with real orbital data, textured spheres, elliptical orbits,
// moon position and illumination, comet tail particles, and camera controls.

// --------------------------- IMPORTS ---------------------------

import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

import julian from './astronomia/src/julian.js';
import { Planet } from './astronomia/src/planetposition.js';
import moonPosition from './astronomia/src/moonposition.js';
import { phaseAngleEquatorial } from './astronomia/src/moonillum.js';

// *** FIXED IMPORT: only import Equatorial from coord.js ***
import { Equatorial } from './astronomia/src/coord.js';

import mercuryData from './astronomia/data/vsop87Bmercury.js';
import venusData from './astronomia/data/vsop87Bvenus.js';
import earthData from './astronomia/data/vsop87Bearth.js';
import marsData from './astronomia/data/vsop87Bmars.js';
import jupiterData from './astronomia/data/vsop87Djupiter.js';
import saturnData from './astronomia/data/vsop87Dsaturn.js';
import uranusData from './astronomia/data/vsop87Duranus.js';
import neptuneData from './astronomia/data/vsop87Dneptune.js';

// --------------------------- CONSTANTS & SETTINGS ---------------------------

const BASE_SCALE = 4;
const PLANET_SIZE_MULTIPLIER = 3;
const TIME_SPEED_FACTOR = 5;

const degToRad = deg => deg * Math.PI / 180;
const orbitalElementsData = {
  Mercury: { a: 2.3871, e: 0.35, i: degToRad(7.005),   o: degToRad(48.331),  w: degToRad(29.124) },
  Venus:   { a: 3.7233, e: 0.02, i: degToRad(3.3946),  o: degToRad(76.680),  w: degToRad(54.884) },
  Earth:   { a: 5.0000, e: 0.03, i: degToRad(0.000),   o: degToRad(0.000),   w: degToRad(114.207) },
  Mars:    { a: 6.5237, e: 0.15, i: degToRad(1.850),   o: degToRad(49.558),  w: degToRad(286.502) },
  Jupiter: { a: 8.2026, e: 0.07, i: degToRad(1.303),   o: degToRad(100.464), w: degToRad(273.867) },
  Saturn:  { a: 10.5549, e: 0.1, i: degToRad(2.489),   o: degToRad(113.665), w: degToRad(339.392) },
  Uranus:  { a: 12.218, e: 0.07, i: degToRad(0.773),   o: degToRad(74.006),  w: degToRad(96.998) },
  Neptune: { a: 15.110, e: 0.09, i: degToRad(1.770),   o: degToRad(131.784), w: degToRad(272.846) },
};

// --------------------------- SETUP ---------------------------

const canvas = document.getElementById('chartCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const cubeLoader = new THREE.CubeTextureLoader();
const skyboxUrls = [
  './images/space.right.jpg',
  './images/space.left.jpg',
  './images/space.up.jpg',
  './images/space.down.jpg',
  './images/space.jpg',
  './images/space2.jpg'
];
scene.background = cubeLoader.load(skyboxUrls);

const camera = new THREE.PerspectiveCamera(123, canvas.clientWidth / canvas.clientHeight, 0.1, 50000);
camera.position.set(0, 500, 2500);
const controls = new OrbitControls(camera, canvas);
controls.enableZoom = true;
controls.minDistance = 2000;
controls.maxDistance = 40000;
controls.maxPolarAngle = Math.PI / 2;
controls.enablePan = true;

scene.add(new THREE.AmbientLight(0x404040, 0.5));
const sunLight = new THREE.PointLight(0xffffff, 3, 0, 2);
sunLight.castShadow = false;
scene.add(sunLight);
scene.add(new THREE.PointLightHelper(sunLight, 10));

const textureLoader = new THREE.TextureLoader();

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(999, 32, 32),
  new THREE.MeshStandardMaterial({
    map: textureLoader.load('./images/sun.cmap.jpg'),
    emissive: new THREE.Color(0xffffaa),
    emissiveIntensity: 69,
  })
);
sun.position.set(0, 0, 0);
scene.add(sun);
sunLight.position.copy(sun.position);

// --------------------------- PLANETS ---------------------------

const planetTextures = { /* unchanged */ };

const planets = [ /* unchanged */ ];

const solarSystem = new THREE.Group();
scene.add(solarSystem);

planets.forEach(p => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.planetSize * PLANET_SIZE_MULTIPLIER, 32, 32),
    new THREE.MeshPhongMaterial({
      map: planetTextures[p.name].color,
      bumpMap: planetTextures[p.name].bump,
      bumpScale: 1,
      shininess: 7,
      specular: new THREE.Color(0x666666),
      emissive: new THREE.Color(0x000000)
    })
  );
  p.mesh = mesh;
  solarSystem.add(mesh);
});

// --------------------------- MOON ---------------------------

const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(333, 333, 333),
  new THREE.MeshPhongMaterial({
    map: textureLoader.load('./planets/moon.jpg'),
    bumpMap: textureLoader.load('./images/pluto.bump.jpg'),
    bumpScale: 0.3,
    shininess: 5,
    emissive: new THREE.Color(0xffffff)
  })
);
moonMesh.scale.set(50, 50, 50);
scene.add(moonMesh);

// --------------------------- ORBITS ---------------------------

const orbitLines = new THREE.Group();
scene.add(orbitLines);

function createOrbitLineFromElements({a, e, i, o, w}, segments = 256) {
  const points = [];
  const b = a * Math.sqrt(1 - e * e);
  const focusOffset = a * e;

  for (let t = 0; t <= 2 * Math.PI; t += (2 * Math.PI) / segments) {
    const x = a * Math.cos(t) - focusOffset;
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
  return new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true }));
}

planets.forEach(p => {
  const el = orbitalElementsData[p.name];
  if (!el) return;
  const orbitLine = createOrbitLineFromElements(el);
  orbitLines.add(orbitLine);
});

// --------------------------- TIME & ANIMATION ---------------------------

let startJulianDate = julian.CalendarToJD(new Date().getFullYear(), new Date().getMonth()+1, new Date().getDate());
let timeElapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  timeElapsed += TIME_SPEED_FACTOR;
  const currentJD = startJulianDate + timeElapsed;

  planets.forEach(p => {
    const el = orbitalElementsData[p.name];
    const eq = p.data.position(currentJD);

    // Calculate ellipse position from orbital elements
    const e = el.e;
    const a = el.a * BASE_SCALE;
    const b = a * Math.sqrt(1 - e * e);
    const focusOffset = a * e;

    const theta = Math.atan2(eq.y, eq.x); // approx true anomaly
    const x = a * Math.cos(theta) - focusOffset;
    const z = b * Math.sin(theta);
    const y = eq.z * BASE_SCALE;

    p.mesh.position.set(x, y, z);
  });

  const earth = planets.find(p => p.name === 'Earth');
  if (earth) {
    const moonEquatorial = moonPosition.position(currentJD);
    const moonX = moonEquatorial.x * BASE_SCALE * 0.00257;
    const moonY = moonEquatorial.z * BASE_SCALE * 0.00257;
    const moonZ = moonEquatorial.y * BASE_SCALE * 0.00257;
    moonMesh.position.set(earth.mesh.position.x + moonX, earth.mesh.position.y + moonY, earth.mesh.position.z + moonZ);
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});


