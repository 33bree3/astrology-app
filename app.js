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
const BASE_SCALE = 2222;          // Used for distance scaling (adjusted for visibility)
const PLANET_SIZE_MULTIPLIER = 30; // Adjust planet size scaling here

// Speed factor for advancing time in Julian Days
const TIME_SPEED_FACTOR = 5;

// Eccentricities and orbital elements for planets (J2000 epoch)
const degToRad = deg => deg * Math.PI / 180;
const orbitalElementsData = {
  Mercury: { a: 2.3871, e: 0.5056, i: degToRad(7.005),   o: degToRad(48.331),  w: degToRad(29.124) },
  Venus:   { a: 3.7233, e: 0.4068, i: degToRad(3.3946),  o: degToRad(76.680),  w: degToRad(54.884) },
  Earth:   { a: 5.0000, e: 0.3167, i: degToRad(0.000),   o: degToRad(0.000),   w: degToRad(114.207) },
  Mars:    { a: 6.5237, e: 0.3034, i: degToRad(1.850),   o: degToRad(49.558),  w: degToRad(286.502) },
  Jupiter: { a: 8.2026, e: 0.4484, i: degToRad(1.303),   o: degToRad(100.464), w: degToRad(273.867) },
  Saturn:  { a: 10.5549, e: 0.5555, i: degToRad(2.489),   o: degToRad(113.665), w: degToRad(339.392) },
  Uranus:  { a: 12.218, e: 0.0463, i: degToRad(0.773),   o: degToRad(74.006),  w: degToRad(96.998) },
  Neptune: { a: 15.110, e: 0.0190, i: degToRad(1.770),   o: degToRad(131.784), w: degToRad(272.846) },
};

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
const camera = new THREE.PerspectiveCamera(123, canvas.clientWidth / canvas.clientHeight, 0.1, 50000);
const controls = new OrbitControls(camera, canvas);
controls.enableZoom = true;
controls.minDistance = 2000;
controls.maxDistance = 40000;
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
  { name: 'Mercury', data: new Planet(mercuryData), radius: 0.3871, planetSize: 69 },
  { name: 'Venus',   data: new Planet(venusData),   radius: 0.7233, planetSize: 101 },
  { name: 'Earth',   data: new Planet(earthData),   radius: 1.0000, planetSize: 123 },
  { name: 'Mars',    data: new Planet(marsData),    radius: 1.5237, planetSize: 72 },
  { name: 'Jupiter', data: new Planet(jupiterData), radius: 5.2026, planetSize: 369 },
  { name: 'Saturn',  data: new Planet(saturnData),  radius: 9.5549, planetSize: 297 },
  { name: 'Uranus',  data: new Planet(uranusData),  radius: 19.218, planetSize: 201 },
  { name: 'Neptune', data: new Planet(neptuneData), radius: 30.110, planetSize: 154 },
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
 * Creates a 3D elliptical orbit line from orbital elements:
 * a (semi-major axis in AU),
 * e (eccentricity),
 * i (inclination in radians),
 * o (longitude of ascending node in radians),
 * w (argument of perihelion in radians)
 * 
 * The ellipse is calculated in 3D space and rotated to correct orbital plane.
 */
function createOrbitLineFromElements({a, e, i, o, w}, segments = 256) {
  const points = [];

  // semi-minor axis
  const b = a * Math.sqrt(1 - e * e);

  // We'll sample the ellipse parametrically from 0 to 2PI (true anomaly approx)
  for (let t = 0; t <= 2 * Math.PI; t += (2 * Math.PI) / segments) {
    // Parametric ellipse coordinates before rotation
    const x = a * Math.cos(t) - a * e; // offset by a*e to shift focus to origin
    const y = b * Math.sin(t);
    const z = 0;

    // Rotate point according to orbital elements (3D rotation)
    // Rotation matrix: Rz(-o) * Rx(-i) * Rz(-w)
    // This orients the ellipse correctly in 3D space

    // Precompute sines and cosines
    const cosO = Math.cos(o);
    const sinO = Math.sin(o);
    const cosI = Math.cos(i);
    const sinI = Math.sin(i);
    const cosW = Math.cos(w);
    const sinW = Math.sin(w);

    // Apply argument of perihelion (w)
    let x1 = x * cosW - y * sinW;
    let y1 = x * sinW + y * cosW;
    let z1 = z;

    // Apply inclination (i)
    let x2 = x1;
    let y2 = y1 * cosI - z1 * sinI;
    let z2 = y1 * sinI + z1 * cosI;

    // Apply longitude of ascending node (o)
    let x3 = x2 * cosO - y2 * sinO;
    let y3 = x2 * sinO + y2 * cosO;
    let z3 = z2;

    // Scale from AU to your visualization scale
    points.push(new THREE.Vector3(x3, z3, y3).multiplyScalar(BASE_SCALE));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
  return new THREE.LineLoop(geometry, material);
}

// Create orbits for all planets
planets.forEach(p => {
  const el = orbitalElementsData[p.name];
  if (!el) {
    console.warn(`No orbital elements for ${p.name}`);
    return;
  }
  const orbitLine = createOrbitLineFromElements(el);
  orbitLines.add(orbitLine);
});

// --------------------------- TIME & ANIMATION ---------------------------

let startJulianDate = julian.CalendarToJD(new Date().getFullYear(), new Date().getMonth()+1, new Date().getDate());
let timeElapsed = 0;

function animate() {
  requestAnimationFrame(animate);

  timeElapsed += TIME_SPEED_FACTOR;

  // Current simulation Julian Date
  const currentJD = startJulianDate + timeElapsed;

  // Update planet positions based on VSOP87 data and place meshes accordingly
  planets.forEach(p => {
    const eq = p.data.position(currentJD);
    // eq is rectangular equatorial coords, convert to Three.js xyz
    // Equatorial coords: x = x, y = y, z = z in AU
    // Our coordinate system: x = x, y = z, z = y (swapping for visualization)
    const x = eq.x * BASE_SCALE;
    const y = eq.z * BASE_SCALE;
    const z = eq.y * BASE_SCALE;
    p.mesh.position.set(x, y, z);
  });

  // Update Moon position relative to Earth
  const earth = planets.find(p => p.name === 'Earth');
  if (earth) {
    const moonEquatorial = moonPosition.position(currentJD);
    // Moon position is relative to Earth, scale accordingly
    const moonX = moonEquatorial.x * BASE_SCALE * 0.00257; // scaled down
    const moonY = moonEquatorial.z * BASE_SCALE * 0.00257;
    const moonZ = moonEquatorial.y * BASE_SCALE * 0.00257;
    moonMesh.position.set(earth.mesh.position.x + moonX, earth.mesh.position.y + moonY, earth.mesh.position.z + moonZ);
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

// --------------------------- WINDOW RESIZE ---------------------------

window.addEventListener('resize', () => {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
