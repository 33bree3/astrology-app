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

// Base scaling factors for distances and planet sizes
const BASE_SCALE = 3333;          // Used for logarithmic distance scaling
const PLANET_SIZE_MULTIPLIER = 3; // Adjust planet size scaling here

// Speed factor for advancing time in Julian Days
const TIME_SPEED_FACTOR = 3;

// Compression factor for outer planets to bring them visually closer
const OUTER_PLANETS_COMPRESSION = 1;

// --------------------------- SETUP ---------------------------

// Canvas & Renderer
const canvas = document.getElementById('chartCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene & Background (Skybox)

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
const skyboxTexture = cubeLoader.load(skyboxUrls);
skyboxTexture.magFilter = THREE.LinearFilter;
skyboxTexture.minFilter = THREE.LinearFilter;
skyboxTexture.wrapS = THREE.ClampToEdgeWrapping;
skyboxTexture.wrapT = THREE.ClampToEdgeWrapping;
skyboxTexture.generateMipmaps = false;
scene.background = skyboxTexture;

// Camera & Controls
const camera = new THREE.PerspectiveCamera(123, canvas.clientWidth / canvas.clientHeight, 0.1, 5000);
const controls = new OrbitControls(camera, canvas);
controls.enableZoom = true;
controls.minDistance = 3333;
controls.maxDistance = 7777;
controls.maxPolarAngle = Math.PI / 2;
controls.enablePan = true;
controls.panSpeed = 0.5;
controls.userIsInteracting = false;
controls.addEventListener('start', () => { controls.userIsInteracting = true; });
controls.addEventListener('end', () => { controls.userIsInteracting = false; });

// Lighting Setup
scene.add(new THREE.AmbientLight(0x404040, 0.5));
const sunLight = new THREE.PointLight(0xffffff, 3, 0, 2);
sunLight.castShadow = false;
sunLight.shadow.mapSize.width = 1000;
sunLight.shadow.mapSize.height = 1000;
scene.add(sunLight);
scene.add(new THREE.PointLightHelper(sunLight, 10));

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// --------------------------- SUN ---------------------------

const sunRadius = 999;
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunTexture = textureLoader.load('./images/sun.cmap.jpg');
const sunMaterial = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissive: new THREE.Color(0xffffaa),
  emissiveIntensity: 69,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.castShadow = false;
sun.receiveShadow = false;
scene.add(sun);
sun.position.set(0, 0, 0);
sunLight.position.copy(sun.position);

// --------------------------- PLANETS ---------------------------

// Textures for planets (color + bump maps)
const planetTextures = {
  Mercury: { color: textureLoader.load('./planets/mercury.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Venus:   { color: textureLoader.load('./planets/venus.jpg'), bump: textureLoader.load('./images/venus.bump.jpg') },
  Earth:   { color: textureLoader.load('./planets/earth.jpg'), bump: textureLoader.load('./images/earth.bump.jpg') },
  Mars:    { color: textureLoader.load('./planets/mars.jpg'), bump: textureLoader.load('./images/mars.bump.jpg') },
  Jupiter: { color: textureLoader.load('./planets/jupiter.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Saturn:  { color: textureLoader.load('./planets/saturn.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Uranus:  { color: textureLoader.load('./planets/uranus.jpg'), bump: textureLoader.load('./images/pluto.bump.jpg') },
  Neptune: { color: textureLoader.load('./planets/neptune.jpg'), bump: textureLoader.load('./images/earth.bump.jpg') },
};

// Planets data with radius and size scaling
const planets = [
  { name: 'Mercury', data: new Planet(mercuryData), radius: 1, planetSize: 69 },
  { name: 'Venus',   data: new Planet(venusData), radius: 2, planetSize: 101 },
  { name: 'Earth',   data: new Planet(earthData), radius: 3, planetSize: 123 },
  { name: 'Mars',    data: new Planet(marsData), radius: 4, planetSize: 72 },
  { name: 'Jupiter', data: new Planet(jupiterData), radius: 5, planetSize: 369 },
  { name: 'Saturn',  data: new Planet(saturnData), radius: 6, planetSize: 297 },
  { name: 'Uranus',  data: new Planet(uranusData), radius: 7, planetSize: 201 },
  { name: 'Neptune', data: new Planet(neptuneData), radius: 8, planetSize: 154 },
];

// Create meshes for each planet and add to solarSystem group

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
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  p.mesh = mesh;
  solarSystem.add(mesh);
});

// --------------------------- MOON ---------------------------

const moonTextures = {
  color: textureLoader.load('./planets/moon.jpg'),
  bump: textureLoader.load('./images/pluto.bump.jpg')
};

const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(333, 333, 333),
  new THREE.MeshPhongMaterial({
    map: moonTextures.color,
    bumpMap: moonTextures.bump,
    bumpScale: 0.3,
    shininess: 5,
    emissive: new THREE.Color(0xffffff)
  })
);
moonMesh.scale.set(50, 50, 50); // Scale moon size appropriately
moonMesh.castShadow = true;
moonMesh.receiveShadow = true;
scene.add(moonMesh);

// --------------------------- ORBITS ---------------------------

// Group to hold orbit lines
const orbitLines = new THREE.Group();
scene.add(orbitLines);

/**
 * Creates an elliptical orbit line in 3D space from orbital elements:
 * a (semi-major axis, AU),
 * e (eccentricity),
 * i (inclination, radians),
 * o (longitude of ascending node, radians),
 * w (argument of periapsis, radians).
 *
 * The ellipse is rotated according to inclination and node, centered so the Sun is at one focus.
 */
function createOrbitLineFromElements(elements, segments = 256) {
  const a = elements.a;       // semi-major axis in AU
  const e = elements.e;       // eccentricity
  const i = elements.i;       // inclination
  const o = elements.o;       // longitude of ascending node
  const w = elements.w;       // argument of periapsis

  // Semi-minor axis
  const b = a * Math.sqrt(1 - e * e);
  // Focus offset
  const focusOffset = a * e;

  // Points in orbital plane (2D ellipse, centered on focus)
  const points = [];

  for (let t = 0; t <= segments; t++) {
    const theta = (t / segments) * 2 * Math.PI;
    // Parametric ellipse, center shifted by focusOffset along x-axis
    const x = a * Math.cos(theta) - focusOffset;
    const y = b * Math.sin(theta);
    points.push(new THREE.Vector3(x, y, 0));
  }

  // Create geometry from points
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  // Apply rotation matrices to tilt the orbit into correct 3D orientation

  // Rotation order: 
  // 1. Rotate by argument of periapsis (w) around Z axis
  // 2. Rotate by inclination (i) around X axis
  // 3. Rotate by longitude of ascending node (o) around Z axis

  // We'll use Euler rotations in order: Z(w), X(i), Z(o)

  const matrix = new THREE.Matrix4();

  const rotW = new THREE.Matrix4().makeRotationZ(w);
  const rotI = new THREE.Matrix4().makeRotationX(i);
  const rotO = new THREE.Matrix4().makeRotationZ(o);

  // Combined rotation: O * I * W
  matrix.multiply(rotO);
  matrix.multiply(rotI);
  matrix.multiply(rotW);

  geometry.applyMatrix4(matrix);

  // Scale AU to scene scale
  const scale = BASE_SCALE;
  geometry.scale(scale, scale, scale);

  // Material
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });

  return new THREE.LineLoop(geometry, material);
}

// Create and add orbit lines for planets
planets.forEach(p => {
  // Get orbital elements at J2000 epoch for stable orbit lines
  const elements = p.data.orbit(julian.J2000);
  const orbit = createOrbitLineFromElements(elements);
  orbitLines.add(orbit);
  p.orbitElements = elements; // cache for later if needed
});

// --------------------------- TIME ---------------------------

// Start with current Julian date
let julianDate = julian.CalendarGregorianToJD(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  new Date().getDate()
);

let lastTimestamp = 0;

// --------------------------- ANIMATION LOOP ---------------------------

function animate(timestamp = 0) {
  // Calculate delta time for smooth animations
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // Advance Julian date by speed factor
  julianDate += delta * TIME_SPEED_FACTOR;

  // Position planets on orbits using Astronomia's position() for accuracy
  planets.forEach(p => {
    // Get heliocentric ecliptic rectangular coordinates (x,y,z) in AU from Astronomia
    const pos = p.data.position(julianDate);

    // Scale AU to scene scale
    const x = pos.x * BASE_SCALE;
    const y = pos.y * BASE_SCALE;
    const z = pos.z * BASE_SCALE;

    // Update planet mesh position
    p.mesh.position.set(x, y, z);
  });

  // -------- MOON POSITION --------

  const moonPos = moonPosition.position(julianDate);

  // Convert moon equatorial coordinates to ecliptic
  const moonEq = new Equatorial(moonPos.ra, moonPos.dec, moonPos.range);
  const moonEcl = moonEq.toEcliptic(julianDate);

  // Earth's position for reference
  const earthPos = planets.find(p => p.name === 'Earth').mesh.position;

  // Moon's position relative to Earth in AU scaled
  const moonX = earthPos.x + moonEcl.lon * BASE_SCALE * 0.00257; // Moon avg distance ~0.00257 AU
  const moonY = earthPos.y + Math.sin(moonEcl.lat) * BASE_SCALE * 0.00257;
  const moonZ = earthPos.z + Math.cos(moonEcl.lat) * BASE_SCALE * 0.00257;

  moonMesh.position.set(moonX, moonY, moonZ);

  // -------- UPDATE SUN LIGHT POSITION --------

  sunLight.position.copy(sun.position);

  // -------- RENDER --------

  renderer.render(scene, camera);
  controls.update();

  requestAnimationFrame(animate);
}

// Start camera position and begin animation
camera.position.set(1000, 1000, 3000);
controls.update();
animate();

