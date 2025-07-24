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
const BASE_SCALE = 2000;          // Scale orbital radii to fit scene nicely
const PLANET_SIZE_MULTIPLIER = 3; // Adjust planet size scaling here

// Speed factor for advancing time in Julian Days
const TIME_SPEED_FACTOR = 3;

// Eccentricities for planets (used for elliptical orbits)
const ECCENTRICITIES = {
  Mercury: 0.2056,
  Venus: 0.0067,
  Earth: 0.0167,
  Mars: 0.0934,
  Jupiter: 0.0489,
  Saturn: 0.0565,
  Uranus: 0.0457,
  Neptune: 0.0113,
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
const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 20000);
const controls = new OrbitControls(camera, canvas);
controls.enableZoom = true;
controls.minDistance = 500;
controls.maxDistance = 15000;
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
scene.add(new THREE.PointLightHelper(sunLight, 50));

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// --------------------------- SUN ---------------------------

const sunRadius = 999;
const sunGeometry = new THREE.SphereGeometry(sunRadius, 64, 64);
const sunTexture = textureLoader.load('./images/sun.cmap.jpg');
const sunMaterial = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissive: new THREE.Color(0xffffaa),
  emissiveIntensity: 50,
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

// Planets data with radius and size scaling (radius here just used for distance scale)
const planets = [
  { name: 'Mercury', data: new Planet(mercuryData), radiusAU: 0.39, planetSize: 69 },
  { name: 'Venus',   data: new Planet(venusData), radiusAU: 0.72, planetSize: 101 },
  { name: 'Earth',   data: new Planet(earthData), radiusAU: 1.00, planetSize: 123 },
  { name: 'Mars',    data: new Planet(marsData), radiusAU: 1.52, planetSize: 72 },
  { name: 'Jupiter', data: new Planet(jupiterData), radiusAU: 5.20, planetSize: 369 },
  { name: 'Saturn',  data: new Planet(saturnData), radiusAU: 9.58, planetSize: 297 },
  { name: 'Uranus',  data: new Planet(uranusData), radiusAU: 19.20, planetSize: 201 },
  { name: 'Neptune', data: new Planet(neptuneData), radiusAU: 30.05, planetSize: 154 },
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
  new THREE.SphereGeometry(333, 32, 32),
  new THREE.MeshPhongMaterial({
    map: moonTextures.color,
    bumpMap: moonTextures.bump,
    bumpScale: 0.3,
    shininess: 5,
    emissive: new THREE.Color(0xffffff)
  })
);
moonMesh.scale.set(0.27 * PLANET_SIZE_MULTIPLIER, 0.27 * PLANET_SIZE_MULTIPLIER, 0.27 * PLANET_SIZE_MULTIPLIER); // Moon scaled relative to Earth
moonMesh.castShadow = true;
moonMesh.receiveShadow = true;
scene.add(moonMesh);

// --------------------------- ORBITS ---------------------------

// Group to hold orbit lines
const orbitLines = new THREE.Group();
scene.add(orbitLines);

/**
 * Creates an elliptical orbit line using semi-major axis (a) and eccentricity (e).
 * The ellipse is shifted so the Sun is at one focus.
 */
function createOrbitLine(a, e, segments = 128) {
  const b = a * Math.sqrt(1 - e * e);       // semi-minor axis
  const focusOffset = a * e;                 // offset so Sun is at focus
  const curve = new THREE.EllipseCurve(
    -focusOffset, 0,                        // center shifted by focus offset
    a, b,                                   // xRadius (a), yRadius (b)
    0, 2 * Math.PI,                         // full ellipse
    false, 0
  );
  const points = curve.getPoints(segments);
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0, p.y)));
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });
  return new THREE.LineLoop(geometry, material);
}

// Create and add orbit lines for planets scaled properly in AU * BASE_SCALE
planets.forEach(p => {
  const a = p.radiusAU * BASE_SCALE;   // semi-major axis in scaled units
  const e = ECCENTRICITIES[p.name];
  const orbit = createOrbitLine(a, e);
  orbitLines.add(orbit);
});

// --------------------------- TIME ---------------------------

// Start with current Julian date (UTC now)
let now = new Date();
let julianDate = julian.CalendarGregorianToJD(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate() + (now.getUTCHours() / 24));

// To update smoothly
let lastTimestamp = 0;

// --------------------------- ANIMATION LOOP ---------------------------

function animate(timestamp = 0) {
  // Calculate delta time for smooth animations
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // Advance Julian date by speed factor
  julianDate += delta * TIME_SPEED_FACTOR;

  // Position planets on orbits using Astronomia VSOP87 data
  planets.forEach(p => {
    const pos = p.data.position(julianDate); // Returns {ra, dec, range}

    // Convert from equatorial spherical to ecliptic rectangular coordinates in AU
    // Astronomia returns ra, dec in radians, range in AU
    // Convert spherical to Cartesian equatorial coordinates:
    // x = range * cos(dec) * cos(ra)
    // y = range * cos(dec) * sin(ra)
    // z = range * sin(dec)

    // Then convert equatorial XYZ to ecliptic XYZ by rotating by obliquity of ecliptic
    // But Astronomia's Planet.position returns heliocentric ecliptic coordinates already in ra/dec,
    // so instead convert ra/dec/range directly to Cartesian:

    // We'll convert ra/dec to Cartesian in equatorial system first:
    let x_eq = pos.range * Math.cos(pos.dec) * Math.cos(pos.ra);
    let y_eq = pos.range * Math.cos(pos.dec) * Math.sin(pos.ra);
    let z_eq = pos.range * Math.sin(pos.dec);

    // Now convert equatorial XYZ to ecliptic XYZ by rotating around x-axis by -epsilon
    // Obliquity of ecliptic (approximate) in radians:
    const epsilon = 23.439281 * Math.PI / 180;

    const x_ecl = x_eq;
    const y_ecl = y_eq * Math.cos(-epsilon) - z_eq * Math.sin(-epsilon);
    const z_ecl = y_eq * Math.sin(-epsilon) + z_eq * Math.cos(-epsilon);

    // Scale to scene units
    const scale = BASE_SCALE;
    const posX = x_ecl * scale;
    const posY = y_ecl * scale;
    const posZ = z_ecl * scale;

    // Update planet mesh position
    p.mesh.position.set(posX, posY, posZ);
  });

  // -------- MOON POSITION RELATIVE TO EARTH --------

  // Get Moon geocentric position in equatorial coordinates (ra, dec, range in AU)
  const moonPos = moonPosition.position(julianDate);

  // Earth's heliocentric position to offset Moon relative to Sun position (convert same way)
  const earthPos = planets.find(p => p.name === 'Earth').data.position(julianDate);
  // Earth equatorial Cartesian
  const x_eq_e = earthPos.range * Math.cos(earthPos.dec) * Math.cos(earthPos.ra);
  const y_eq_e = earthPos.range * Math.cos(earthPos.dec) * Math.sin(earthPos.ra);
  const z_eq_e = earthPos.range * Math.sin(earthPos.dec);

  // Earth ecliptic Cartesian
  const epsilon = 23.439281 * Math.PI / 180;
  const x_ecl_e = x_eq_e;
  const y_ecl_e = y_eq_e * Math.cos(-epsilon) - z_eq_e * Math.sin(-epsilon);
  const z_ecl_e = y_eq_e * Math.sin(-epsilon) + z_eq_e * Math.cos(-epsilon);

  // Moon equatorial Cartesian (geocentric)
  const x_eq_m = moonPos.range * Math.cos(moonPos.dec) * Math.cos(moonPos.ra);
  const y_eq_m = moonPos.range * Math.cos(moonPos.dec) * Math.sin(moonPos.ra);
  const z_eq_m = moonPos.range * Math.sin(moonPos.dec);

  // Moon ecliptic Cartesian
  const x_ecl_m = x_eq_m;
  const y_ecl_m = y_eq_m * Math.cos(-epsilon) - z_eq_m * Math.sin(-epsilon);
  const z_ecl_m = y_eq_m * Math.sin(-epsilon) + z_eq_m * Math.cos(-epsilon);

  // Moon position relative to Sun = Earth position + Moon geocentric position
  const moonX = (x_ecl_e + x_ecl_m) * BASE_SCALE;
  const moonY = (y_ecl_e + y_ecl_m) * BASE_SCALE;
  const moonZ = (z_ecl_e + z_ecl_m) * BASE_SCALE;

  moonMesh.position.set(moonX, moonY, moonZ);

  // -------- UPDATE SUN LIGHT POSITION --------
  sunLight.position.copy(sun.position);

  // -------- RENDER --------
  renderer.render(scene, camera);
  controls.update();

  requestAnimationFrame(animate);
}

// Start camera position and begin animation
camera.position.set(0, 5000, 7000);
controls.update();
animate();
