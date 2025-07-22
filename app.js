import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

import julian from './astronomia/src/julian.js';
import { Planet } from './astronomia/src/planetposition.js';

import mercuryData from './astronomia/data/vsop87Bmercury.js';
import venusData from './astronomia/data/vsop87Bvenus.js';
import earthData from './astronomia/data/vsop87Bearth.js';
import marsData from './astronomia/data/vsop87Bmars.js';
import jupiterData from './astronomia/data/vsop87Bjupiter.js';
import saturnData from './astronomia/data/vsop87Bsaturn.js';
import uranusData from './astronomia/data/vsop87Buranus.js';
import neptuneData from './astronomia/data/vsop87Bneptune.js';

const canvas = document.getElementById('chartCanvas');

// Renderer setup with antialias and shadow maps enabled for better visuals
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // soft shadows

const scene = new THREE.Scene();

// CAMERA SETUP
const camera = new THREE.PerspectiveCamera(65, canvas.clientWidth / canvas.clientHeight, 0.1, 5000);

// Offset to place camera at a better vantage point around the system
const cameraOffset = new THREE.Vector3(300, 400, 500);

// ORBIT CONTROLS for user interaction
const controls = new OrbitControls(camera, canvas);

// Controls tweaking:
// - enable zoom but restrict min/max distance to prevent camera going too close or too far
// - limit polar angle so camera doesn't go below "ground"
// - pan is enabled but at moderate speed
controls.enableZoom = true;
controls.minDistance = 200;  // prevents zooming too close on the system
controls.maxDistance = 2000; // max zoom out distance for scale
controls.maxPolarAngle = Math.PI / 2; // restrict camera above horizon
controls.enablePan = true;
controls.panSpeed = 0.5;

// Function to clamp camera distance from solarSystem group to prevent clipping or drifting too far
function clampCameraDistance() {
  const minDistance = 50;
  const maxDistance = 1000;

  // Calculate distance from solarSystem center to camera
  const distance = camera.position.distanceTo(solarSystem.position);

  if (distance < minDistance) {
    // Push camera back to minDistance along current vector from solarSystem
    const direction = camera.position.clone().sub(solarSystem.position).normalize();
    camera.position.copy(solarSystem.position).add(direction.multiplyScalar(minDistance));
  } else if (distance > maxDistance) {
    // Pull camera in to maxDistance
    const direction = camera.position.clone().sub(solarSystem.position).normalize();
    camera.position.copy(solarSystem.position).add(direction.multiplyScalar(maxDistance));
  }
}

// Apply clamp whenever controls change (like zoom/pan)
controls.addEventListener('change', () => {
  clampCameraDistance();
});

// LIGHTS
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // soft ambient light
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 1.5); // bright light source at the sun's position
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

// SUN SETUP
const sunRadius = 69; // increased sun size for better scale
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // yellow emissive sun
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.castShadow = false;
sun.receiveShadow = false;

// COMETARY TAIL SETUP
// Using a series of transparent sprites that fade and shrink along a vector behind the sun

const tailLength = 123;             // how long the tail is
const tailParticlesCount = 333;     // number of particles making up the tail
const tailParticles = [];

const tailTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png'); // soft round gradient texture

for (let i = 0; i < tailParticlesCount; i++) {
  const tailMaterial = new THREE.SpriteMaterial({
    map: tailTexture,
    color: 0xffcc00,
    transparent: true,
    opacity: 0.3 * (1 - i / tailParticlesCount), // fade out from sun to tail tip
    depthWrite: false,
    blending: THREE.AdditiveBlending, // glowing effect
  });
  const sprite = new THREE.Sprite(tailMaterial);
  sprite.scale.set(21, 30, 1); // initial scale (width, height)
  scene.add(sprite);
  tailParticles.push(sprite);
}

// PLANETS SETUP
const scaleFactor = 4; // scaling up all orbits and radii for visibility

// Add planetSize property to each planet for independent sizing
const planets = [
  { name: 'Mercury', data: new Planet(mercuryData), color: 0xc0c0c0, radius: 35 * scaleFactor, planetSize: 3 },
  { name: 'Venus',   data: new Planet(venusData),   color: 0xf5deb3, radius: 50 * scaleFactor, planetSize: 5 },
  { name: 'Earth',   data: new Planet(earthData),   color: 0x1e90ff, radius: 70 * scaleFactor, planetSize: 6 },
  { name: 'Mars',    data: new Planet(marsData),    color: 0xff4500, radius: 85 * scaleFactor, planetSize: 4 },
  { name: 'Jupiter', data: new Planet(jupiterData), color: 0xf4e2d8, radius: 110 * scaleFactor, planetSize: 10 },
  { name: 'Saturn',  data: new Planet(saturnData),  color: 0xdeB887, radius: 130 * scaleFactor, planetSize: 9 },
  { name: 'Uranus',  data: new Planet(uranusData),  color: 0x7fffd4, radius: 145 * scaleFactor, planetSize: 8 },
  { name: 'Neptune', data: new Planet(neptuneData), color: 0x4169e1, radius: 160 * scaleFactor, planetSize: 7 },
];

// Create meshes for each planet using their own sizes!
planets.forEach(p => {
  p.mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.planetSize, 32, 32), // use individual planet sizes here
    new THREE.MeshStandardMaterial({ color: p.color })
  );
  p.mesh.castShadow = true;
  p.mesh.receiveShadow = true;
});

// Group solar system objects for easy positioning
const solarSystem = new THREE.Group();
solarSystem.add(sun);
planets.forEach(p => solarSystem.add(p.mesh));
scene.add(solarSystem);

// Animation time counter
let t = 0;

// ANIMATION LOOP
function animate() {
  // Julian date for planet position calculations
  const jd = julian.DateToJD(new Date());

  // Update planets position and add slow rotation around sun
  planets.forEach((p, i) => {
    const pos = p.data.position(jd);
    const baseAngle = pos.lon; // base orbital longitude from astronomical data
    const spin = t * 0.003 * (1 + i * 0.1); // add small spin so planets slowly rotate around sun visually
    const angle = baseAngle + spin;

    // Calculate x,y orbit coordinates on ecliptic plane (z=0)
    const r = p.radius;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const z = 0;

    // Set planet mesh position
    p.mesh.position.set(x, y, z);
  });

  // Move solar system along a slow helix path for visual interest
  const helixRadius = 15;
  const helixFrequency = 0.01;
  const helixX = helixRadius * Math.cos(t * helixFrequency);
  const helixY = helixRadius * Math.sin(t * helixFrequency);
  const helixZ = t * 0.01;

  solarSystem.position.set(helixX, helixY, helixZ);

  // Move sun light with solar system center so lighting stays accurate
  sunLight.position.copy(solarSystem.position);

  // Calculate solar system velocity vector to orient comet tail behind sun
  const velocity = new THREE.Vector3(
    -helixRadius * helixFrequency * Math.sin(t * helixFrequency),
    helixRadius * helixFrequency * Math.cos(t * helixFrequency),
    0.8
  ).normalize();

  // Position tail particles behind sun, fading and shrinking
  tailParticles.forEach((particle, idx) => {
    // Distance along velocity vector behind sun position
    const distanceBehind = (idx / tailParticlesCount) * tailLength;
    const pos = new THREE.Vector3().copy(solarSystem.position).addScaledVector(velocity, -distanceBehind);
    particle.position.copy(pos);

    // Fade tail opacity & scale with distance
    particle.material.opacity = 0.3 * (1 - idx / tailParticlesCount);
    const scale = 30 * (1 - idx / tailParticlesCount);
    particle.scale.set(scale, scale, scale);
  });

  // If user isn't interacting, auto-follow solar system with camera offset
  if (!controls.userIsInteracting) {
    camera.position.copy(solarSystem.position).add(cameraOffset);
    controls.target.copy(solarSystem.position);
    controls.update();
  }

  // Render scene from camera perspective
  renderer.render(scene, camera);

  // Increase animation counter
  t += 1;

  // Request next frame
  requestAnimationFrame(animate);
}

// Track user interaction state on controls to prevent camera snapping
controls.userIsInteracting = false;
controls.addEventListener('start', () => {
  controls.userIsInteracting = true;
});
controls.addEventListener('end', () => {
  controls.userIsInteracting = false;
});

animate();

// Tab switching code (unchanged, for UI tabs)
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});
