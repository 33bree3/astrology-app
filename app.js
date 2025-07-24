// Solar System Simulation using Three.js and Astronomia Data
// -----------------------------------------------------------
// Visualizes planets with real elliptical orbits in 3D space,
// planets moving correctly on their orbital planes,
// with accurate elliptical orbits as frames of reference.

// --------------------------- IMPORTS ---------------------------

import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

import julian from './astronomia/src/julian.js';
import { Planet } from './astronomia/src/planetposition.js';
import moonPosition from './astronomia/src/moonposition.js';
import { phaseAngleEquatorial } from './astronomia/src/moonillum.js';

import { Equatorial } from './astronomia/src/coord.js';
import { orbit } from './astronomia/src/orbit.js';

import mercuryData from './astronomia/data/vsop87Bmercury.js';
import venusData from './astronomia/data/vsop87Bvenus.js';
import earthData from './astronomia/data/vsop87Bearth.js';
import marsData from './astronomia/data/vsop87Bmars.js';
import jupiterData from './astronomia/data/vsop87Djupiter.js';
import saturnData from './astronomia/data/vsop87Dsaturn.js';
import uranusData from './astronomia/data/vsop87Duranus.js';
import neptuneData from './astronomia/data/vsop87Dneptune.js';

// --------------------------- CONSTANTS & SETTINGS ---------------------------

const BASE_SCALE = 5000;          // Scale orbital distances for visualization
const PLANET_SIZE_MULTIPLIER = 3; // Planet size scaling factor
const TIME_SPEED_FACTOR = 10;     // Speed up time for animation

// --------------------------- SETUP ---------------------------

const canvas = document.getElementById('chartCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();

// Skybox setup
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
scene.background = skyboxTexture;

const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 100000);
camera.position.set(0, 10000, 20000);

const controls = new OrbitControls(camera, canvas);
controls.enableZoom = true;
controls.minDistance = 1000;
controls.maxDistance = 50000;
controls.maxPolarAngle = Math.PI / 2;
controls.enablePan = true;
controls.panSpeed = 0.5;

// Lighting
scene.add(new THREE.AmbientLight(0x404040, 0.5));

const sunLight = new THREE.PointLight(0xffffff, 3, 0, 2);
sunLight.castShadow = false;
scene.add(sunLight);
scene.add(new THREE.PointLightHelper(sunLight, 200));

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// --------------------------- SUN ---------------------------

const sunRadius = 696340 * 0.01; // Sun radius scaled down (real radius in km)
const sunGeometry = new THREE.SphereGeometry(sunRadius, 64, 64);
const sunTexture = textureLoader.load('./images/sun.cmap.jpg');
const sunMaterial = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissive: new THREE.Color(0xffffaa),
  emissiveIntensity: 10,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 0, 0);
scene.add(sun);
sunLight.position.copy(sun.position);

// --------------------------- PLANETS ---------------------------

// Planet texture map and bump maps
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

// Real planet radii (in km) scaled down to fit scene
const planetRealRadii = {
  Mercury: 2439.7,
  Venus:   6051.8,
  Earth:   6371,
  Mars:    3389.5,
  Jupiter: 69911,
  Saturn:  58232,
  Uranus:  25362,
  Neptune: 24622,
};

// Create planet data objects including Astronomia Planet and mesh placeholder
const planets = [
  { name: 'Mercury', data: new Planet(mercuryData) },
  { name: 'Venus',   data: new Planet(venusData) },
  { name: 'Earth',   data: new Planet(earthData) },
  { name: 'Mars',    data: new Planet(marsData) },
  { name: 'Jupiter', data: new Planet(jupiterData) },
  { name: 'Saturn',  data: new Planet(saturnData) },
  { name: 'Uranus',  data: new Planet(uranusData) },
  { name: 'Neptune', data: new Planet(neptuneData) },
];

// Group to hold planets and orbits
const solarSystem = new THREE.Group();
scene.add(solarSystem);

// Helper function: create a planet mesh with texture and bump
function createPlanetMesh(name) {
  const radius = planetRealRadii[name] * 0.01 * PLANET_SIZE_MULTIPLIER; // scale radius for visualization
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const mat = new THREE.MeshPhongMaterial({
    map: planetTextures[name].color,
    bumpMap: planetTextures[name].bump,
    bumpScale: 0.1,
    shininess: 7,
    specular: new THREE.Color(0x666666),
    emissive: new THREE.Color(0x000000),
  });
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Add planet meshes
planets.forEach(p => {
  p.mesh = createPlanetMesh(p.name);
  solarSystem.add(p.mesh);
});

// --------------------------- ORBITS ---------------------------

// Group to hold orbit lines
const orbitLines = new THREE.Group();
scene.add(orbitLines);

// Create orbit line geometry for elliptical orbits based on orbital elements
// Orbital elements: a (semi-major axis in AU), e (eccentricity), i (inclination), Ω (longitude ascending node), ω (argument of perihelion)

function createOrbitLineFromElements(elements, segments = 180) {
  const points = [];
  const a = elements.a; // semi-major axis in AU
  const e = elements.e;
  const i = elements.i;
  const Ω = elements.o;  // longitude of ascending node
  const ω = elements.w;  // argument of perihelion

  // We'll calculate points along the ellipse in orbital plane and then rotate to ecliptic coords

  for (let j = 0; j <= segments; j++) {
    const M = (j / segments) * 2 * Math.PI; // mean anomaly around orbit (0 to 2pi)
    
    // Solve Kepler's Equation for Eccentric Anomaly E
    let E = M;
    for (let iter = 0; iter < 5; iter++) {
      E = M + e * Math.sin(E);
    }

    // True anomaly ν from eccentric anomaly
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const sqrt1e2 = Math.sqrt(1 - e*e);
    const ν = Math.atan2(sqrt1e2 * sinE, cosE - e);

    // Distance r from focus to planet
    const r = a * (1 - e * cosE);

    // Position in orbital plane (x', y')
    const x_prime = r * Math.cos(ν);
    const y_prime = r * Math.sin(ν);

    // Rotate from orbital plane to ecliptic coords:
    // Use classical orbital elements rotation:
    // r_vec = R3(-Ω) * R1(-i) * R3(-ω) * [x', y', 0]^T

    // Rotation matrices combined:
    // x = r*(cosΩ*cos(ν+ω) - sinΩ*sin(ν+ω)*cosi)
    // y = r*(sinΩ*cos(ν+ω) + cosΩ*sin(ν+ω)*cosi)
    // z = r*(sin(ν+ω)*sini)

    const cosΩ = Math.cos(Ω);
    const sinΩ = Math.sin(Ω);
    const cosων = Math.cos(ν + ω);
    const sinων = Math.sin(ν + ω);
    const cosi = Math.cos(i);
    const sini = Math.sin(i);

    const x = r * (cosΩ * cosων - sinΩ * sinων * cosi);
    const y = r * (sinΩ * cosων + cosΩ * sinων * cosi);
    const z = r * (sinων * sini);

    // Scale AU to visualization scale
    points.push(new THREE.Vector3(x * BASE_SCALE, z * BASE_SCALE, y * BASE_SCALE));
    // Note: y and z swapped here to orient orbits in Three.js XY plane with Z up
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
  const ellipse = new THREE.LineLoop(geometry, material);
  return ellipse;
}

// Create orbits and store for planets
planets.forEach(p => {
  // Get orbital elements from Astronomia orbit module
  const jd = julian.J2000; // Reference epoch J2000
  const elements = orbit.vsop87(p.data, jd);
  // elements: {a, e, i, o (Ω), w (ω), ma (mean anomaly)}

  // Create orbit line
  const orbitLine = createOrbitLineFromElements(elements);
  orbitLines.add(orbitLine);

  // Store orbit elements for animation
  p.orbitElements = elements;
});

// --------------------------- MOON ---------------------------

const moonTextures = {
  color: textureLoader.load('./planets/moon.jpg'),
  bump: textureLoader.load('./images/pluto.bump.jpg')
};

const moonRadius = 1737 * 0.01 * PLANET_SIZE_MULTIPLIER; // Moon radius scaled

const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(moonRadius, 32, 32),
  new THREE.MeshPhongMaterial({
    map: moonTextures.color,
    bumpMap: moonTextures.bump,
    bumpScale: 0.1,
    shininess: 5,
    emissive: new THREE.Color(0x222222)
  })
);
moonMesh.castShadow = true;
moonMesh.receiveShadow = true;
scene.add(moonMesh);

// --------------------------- TIME & ANIMATION ---------------------------

let julianDate = julian.CalendarGregorianToJD(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  new Date().getDate()
);

let lastTimestamp = 0;

// Kepler equation solver for E from M and e (improved with iterative method)
function solveKepler(M, e, tolerance=1e-6, maxIter=20) {
  let E = M;
  for(let i=0; i<maxIter; i++) {
    let delta = E - e * Math.sin(E) - M;
    if (Math.abs(delta) < tolerance) break;
    E = E - delta / (1 - e * Math.cos(E));
  }
  return E;
}

// Animate loop: update planet positions along orbit
function animate(timestamp = 0) {
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  julianDate += delta * TIME_SPEED_FACTOR;

  planets.forEach(p => {
    const e = p.orbitElements.e;
    const a = p.orbitElements.a;
    const i = p.orbitElements.i;
    const Ω = p.orbitElements.o;
    const ω = p.orbitElements.w;
    // Calculate mean anomaly M at current jd, advancing from epoch
    // M = ma + n * (jd - epoch)
    // n = mean motion = sqrt(mu / a^3), mu sun grav param in AU^3/d^2 approx 0.01720209895^2

    const mu = 0.01720209895 ** 2;
    const epoch = julian.J2000;
    const n = Math.sqrt(mu / (a*a*a)); // rad/day
    let M = p.orbitElements.ma + n * (julianDate - epoch);
    M = M % (2 * Math.PI);
    if (M < 0) M += 2 * Math.PI;

    // Solve Kepler's equation to get eccentric anomaly E
    const E = solveKepler(M, e);

    // Compute true anomaly ν
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const sqrt1e2 = Math.sqrt(1 - e*e);
    const ν = Math.atan2(sqrt1e2 * sinE, cosE - e);

    // Radius vector r
    const r = a * (1 - e * cosE);

    // Position in orbital plane
    const x_prime = r * Math.cos(ν);
    const y_prime = r * Math.sin(ν);

    // Rotate to ecliptic coordinates:
    const cosΩ = Math.cos(Ω);
    const sinΩ = Math.sin(Ω);
    const cosων = Math.cos(ν + ω);
    const sinων = Math.sin(ν + ω);
    const cosi = Math.cos(i);
    const sini = Math.sin(i);

    const x = r * (cosΩ * cosων - sinΩ * sinων * cosi);
    const y = r * (sinΩ * cosων + cosΩ * sinων * cosi);
    const z = r * (sinων * sini);

    // Scale AU to visualization scale
    p.mesh.position.set(x * BASE_SCALE, z * BASE_SCALE, y * BASE_SCALE);
  });

  // -------- MOON --------
  // Moon relative to Earth, simple approximation

  const moonPos = moonPosition.position(julianDate);

  // Moon equatorial to ecliptic
  const moonEq = new Equatorial(moonPos.ra, moonPos.dec, moonPos.range);
  const moonEcl = moonEq.toEcliptic(julianDate);

  // Earth's position for offset
  const earth = planets.find(p => p.name === 'Earth');

  // Moon's cartesian relative position to Earth
  // Moon distance ~ 384400 km scaled similarly

  const moonDistanceAU = moonPos.range; // approx in AU
  const xMoon = moonDistanceAU * Math.cos(moonEcl.lon) * BASE_SCALE;
  const yMoon = moonDistanceAU * Math.sin(moonEcl.lon) * BASE_SCALE;
  const zMoon = moonDistanceAU * Math.sin(moonEcl.lat) * BASE_SCALE;

  moonMesh.position.set(
    earth.mesh.position.x + xMoon,
    earth.mesh.position.y + zMoon,
    earth.mesh.position.z + yMoon
  );

  // -------- UPDATE SUN LIGHT POSITION --------

  sunLight.position.copy(sun.position);

  // -------- RENDER --------

  controls.update();
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

animate();
