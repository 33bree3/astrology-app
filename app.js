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
import { Ecliptic } from './astronomia/src/coord.js';

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
const BASE_SCALE = 2222;          // Used for logarithmic distance scaling
const PLANET_SIZE_MULTIPLIER = 1; // Adjust planet size scaling here

// Speed factor for advancing time in Julian Days
const TIME_SPEED_FACTOR = 21;

// Compression factor for outer planets to bring them visually closer
const OUTER_PLANETS_COMPRESSION = 0.3;

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
const cameraOffset = new THREE.Vector3(300, 400, 500);
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

const sunRadius = 666;
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
  let orbitRadius = (Math.log(p.radius) * BASE_SCALE);
  if (p.radius > 4) orbitRadius *= OUTER_PLANETS_COMPRESSION;

  const orbit = createOrbitLine(orbitRadius, ECCENTRICITIES[p.name]);
  orbitLines.add(orbit);
  p.orbitRadius = orbitRadius;
});

// --------------------------- COMET & TAIL ---------------------------

// Comet parameters
const comet = {
  velocity: 0,
  acceleration: 0.00001,
  tailParticles: [],
  tailLength: 1000,
};

// Create comet mesh (simple white sphere)
const cometGeometry = new THREE.SphereGeometry(11, 8, 8);
const cometMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const cometMesh = new THREE.Mesh(cometGeometry, cometMaterial);
scene.add(cometMesh);

// Particle system for comet tail (points)
const cometTailGeometry = new THREE.BufferGeometry();
const tailPositions = new Float32Array(comet.tailLength * 3); // x,y,z for each particle
cometTailGeometry.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
const cometTailMaterial = new THREE.PointsMaterial({ size: 7, color: 0xffffff, transparent: true, opacity: 0.8 });
const cometTail = new THREE.Points(cometTailGeometry, cometTailMaterial);
scene.add(cometTail);

// --------------------------- UTILITY FUNCTIONS ---------------------------

/**
 * Convert planetary heliocentric equatorial coordinates (from Astronomia)
 * to Three.js Vector3 in the simulation space with scaling.
 */
function heliocentricToVector3(helioCoords, scaleFactor) {
  // Coordinates from Astronomia are in AU, convert and scale
  return new THREE.Vector3(helioCoords.x * scaleFactor, 0, helioCoords.y * scaleFactor);
}

// --------------------------- TIME ---------------------------

let julianDate = julian.CalendarToJD(2023, 7, 21); // Start date July 21, 2023

// --------------------------- ANIMATION LOOP ---------------------------

function animate() {
  requestAnimationFrame(animate);

  // Advance time
  julianDate += TIME_SPEED_FACTOR;

  // Update planet positions and rotations
  planets.forEach(p => {
    // Compute heliocentric equatorial coordinates for current date
    const pos = p.data.position(julianDate);
    // Apply distance scaling & compression for outer planets
    let scale = (Math.log(p.radius) * BASE_SCALE);
    if (p.radius > 4) scale *= OUTER_PLANETS_COMPRESSION;

    // Convert to Three.js coordinates
    const planetPos = heliocentricToVector3(pos, scale);
    p.mesh.position.copy(planetPos);

    // Rotate planet slowly for a bit of animation
    p.mesh.rotation.y += 0.01;
  });

  // ----------------- Update Moon -----------------

  // Calculate moon position relative to Earth
  const moonPos = moonPosition.position(julianDate);
  const ecl = Ecliptic.fromEquatorial(moonPos.ra, moonPos.dec, julianDate);
  const moonDistanceAU = moonPos.range;
  const earthScale = Math.log(3) * BASE_SCALE;  // Earth radius scaling

  // Moon position in simulation space relative to Earth
  const moonX = earthScale + ecl.lon * 10 * 2;  // Adjust scaling here for visibility
  const moonZ = earthScale + ecl.lat * 10 * 2;

  moonMesh.position.set(moonX, 0, moonZ);

  // Moon rotation for some realism
  moonMesh.rotation.y += 0.01;

  // ----------------- Moon Illumination -----------------
  // Compute phase angle for illumination
  const phaseAngle = phaseAngleEquatorial(julianDate);
  moonMesh.material.emissiveIntensity = phaseAngle / Math.PI;

  // ----------------- Comet Movement & Tail -----------------

  // Update comet velocity and position
  comet.velocity += comet.acceleration;
  cometMesh.position.x -= comet.velocity;
  cometMesh.position.z -= comet.velocity;

  // Update tail particles positions, shift backwards, add new particle at comet position
  for (let i = comet.tailLength - 1; i > 0; i--) {
    tailPositions[i * 3] = tailPositions[(i - 1) * 3];
    tailPositions[i * 3 + 1] = tailPositions[(i - 1) * 3 + 1];
    tailPositions[i * 3 + 2] = tailPositions[(i - 1) * 3 + 2];
  }
  tailPositions[0] = cometMesh.position.x;
  tailPositions[1] = cometMesh.position.y;
  tailPositions[2] = cometMesh.position.z;

  cometTailGeometry.attributes.position.needsUpdate = true;

  // ----------------- Camera & Controls -----------------

  if (!controls.userIsInteracting) {
    // Automatic camera rotation around the sun
    const angle = Date.now() * 0.0001;
    camera.position.x = 1000 * Math.sin(angle);
    camera.position.z = 1000 * Math.cos(angle);
    camera.position.y = 500;
    camera.lookAt(sun.position);
  } else {
    controls.update();
  }

  // Render scene
  renderer.render(scene, camera);
}

// Start animation
animate();

// --------------------------- END ---------------------------
