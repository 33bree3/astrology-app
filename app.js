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
const BASE_SCALE = 5555;          // Used for logarithmic distance scaling
const PLANET_SIZE_MULTIPLIER = 333; // Adjust planet size scaling here

// Speed factor for advancing time in Julian Days
const TIME_SPEED_FACTOR = 3;

// Compression factor for outer planets to bring them visually closer
const OUTER_PLANETS_COMPRESSION = 1;

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
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
  return new THREE.LineLoop(geometry, material);
}

// Create and add orbit lines for planets
planets.forEach(p => {
  // Calculate orbit radius scaled and compressed for outer planets
  let scaledA = (Math.log10(p.radius) + 1) * BASE_SCALE;
  if (p.radius > 4) scaledA *= OUTER_PLANETS_COMPRESSION;

  const orbit = createOrbitLine(scaledA, ECCENTRICITIES[p.name]);
  orbitLines.add(orbit);
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

  // Position planets on orbits
  planets.forEach(p => {
    const planetPos = p.data.position(julianDate);

    // Convert equatorial coordinates (ra, dec) to ecliptic using Astronomia
    const eq = new Equatorial(planetPos.ra, planetPos.dec, planetPos.range);
    const ecl = eq.toEcliptic(julianDate);

    // Calculate scaled and compressed orbital radius
    let scaledRadius = (Math.log10(p.radius) + 1) * BASE_SCALE;
    if (p.radius > 4) scaledRadius *= OUTER_PLANETS_COMPRESSION;

    // Convert polar to cartesian
    const y = Math.cos(ecl.lon) * scaledRadius;
    const z = Math.sin(ecl.lon) * scaledRadius;
    const x = Math.sin(ecl.lat) * scaledRadius;

    // Update planet mesh position
    p.mesh.position.set(x, y, z);
  });

  // -------- MOON POSITION --------

  const moonPos = moonPosition.position(julianDate);

  // Convert moon equatorial coordinates to ecliptic
  const moonEq = new Equatorial(moonPos.ra, moonPos.dec, moonPos.range);
  const moonEcl = moonEq.toEcliptic(julianDate);

  // Calculate Earth's orbital radius scaled & compressed
  let earthRadiusScaled = (Math.log10(3) + 1) * BASE_SCALE; // Earth radius is 3 in our data
  if (3 > 4) earthRadiusScaled *= OUTER_PLANETS_COMPRESSION; // Not compressed because radius=3

  // Moon's cartesian position relative to Earth
  const moonY = Math.cos(moonEcl.lon) * earthRadiusScaled;
  const moonZ = Math.sin(moonEcl.lon) * earthRadiusScaled;
  const moonX = Math.sin(moonEcl.lat) * earthRadiusScaled;

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
