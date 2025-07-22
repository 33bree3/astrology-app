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
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();

// CAMERA & CONTROLS SETUP
const camera = new THREE.PerspectiveCamera(65, canvas.clientWidth / canvas.clientHeight, 0.1, 5000);

// Adjusted camera offset for bigger scale
const cameraOffset = new THREE.Vector3(300, 400, 500);

const controls = new OrbitControls(camera, canvas);

// Control tweaks:
// - Disable zoom along Z axis (no dolly moving closer/farther on Z specifically)
// - Enable zoom via dolly but limit min/max distances
// - Pan enabled but restricted so you don't drift too far away
controls.enableZoom = true;
controls.minDistance = 200;  // min zoom out distance (bigger scale)
controls.maxDistance = 2000; // max zoom in distance (bigger scale)
controls.maxPolarAngle = Math.PI / 2; // only above horizon
controls.enablePan = true;
controls.panSpeed = 0.5;

// Override dolly function to prevent camera moving strictly along Z
// This keeps zooming as moving closer/farther from target, but no Z-only shifts
function clampCameraDistance() {
  const distance = camera.position.distanceTo(controls.target);
  if (distance < controls.minDistance) {
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    camera.position.copy(controls.target).add(dir.multiplyScalar(controls.minDistance));
  } else if (distance > controls.maxDistance) {
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    camera.position.copy(controls.target).add(dir.multiplyScalar(controls.maxDistance));
  }
  controls.update();
}

// Listen to control changes to clamp zoom/distance
controls.addEventListener('change', () => {
  clampCameraDistance();
});


// LIGHTS
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 1.5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

// SUN
const sunRadius = 50; // bigger sun radius for scale
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.castShadow = false;
sun.receiveShadow = false;

// COMETARY TAIL: Particle trail behind the sun
const tailLength = 100;
const tailParticlesCount = 40;
const tailParticles = [];

// Create simple transparent planes fading out to simulate tail
const tailTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png'); // soft round gradient texture

for (let i = 0; i < tailParticlesCount; i++) {
  const tailMaterial = new THREE.SpriteMaterial({
    map: tailTexture,
    color: 0xffcc00,
    transparent: true,
    opacity: 0.3 * (1 - i / tailParticlesCount),
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(tailMaterial);
  sprite.scale.set(30, 30, 1);
  scene.add(sprite);
  tailParticles.push(sprite);
}

// PLANETS (scaled up radii & distances)
const scaleFactor = 4; // to increase size & orbit radii

const planets = [
  { name: 'Mercury', data: new Planet(mercuryData), color: 0xc0c0c0, radius: 35 * scaleFactor },
  { name: 'Venus',   data: new Planet(venusData),   color: 0xf5deb3, radius: 50 * scaleFactor },
  { name: 'Earth',   data: new Planet(earthData),   color: 0x1e90ff, radius: 70 * scaleFactor },
  { name: 'Mars',    data: new Planet(marsData),    color: 0xff4500, radius: 85 * scaleFactor },
  { name: 'Jupiter', data: new Planet(jupiterData), color: 0xf4e2d8, radius: 110 * scaleFactor },
  { name: 'Saturn',  data: new Planet(saturnData),  color: 0xdeB887, radius: 130 * scaleFactor },
  { name: 'Uranus',  data: new Planet(uranusData),  color: 0x7fffd4, radius: 145 * scaleFactor },
  { name: 'Neptune', data: new Planet(neptuneData), color: 0x4169e1, radius: 160 * scaleFactor },
];

// Planet meshes
planets.forEach(p => {
  p.mesh = new THREE.Mesh(
    new THREE.SphereGeometry(8, 32, 32), // bigger planet sizes
    new THREE.MeshStandardMaterial({ color: p.color })
  );
  p.mesh.castShadow = true;
  p.mesh.receiveShadow = true;
});

const solarSystem = new THREE.Group();
solarSystem.add(sun);
planets.forEach(p => solarSystem.add(p.mesh));
scene.add(solarSystem);

let t = 0; // time counter for animation

function animate() {
  const jd = julian.DateToJD(new Date());

  // Update planets orbital positions with smooth rotation effect
  planets.forEach((p, i) => {
    const pos = p.data.position(jd);
    const baseAngle = pos.lon;
    const spin = t * 0.0003 * (1 + i * 0.1); // slower spin for better view
    const angle = baseAngle + spin;

    const r = p.radius;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const z = 0;

    p.mesh.position.set(x, y, z);
  });

  // Move solar system along helix path
  const helixRadius = 15;
  const helixFrequency = 0.01;
  const helixX = helixRadius * Math.cos(t * helixFrequency);
  const helixY = helixRadius * Math.sin(t * helixFrequency);
  const helixZ = t * 0.8;

  solarSystem.position.set(helixX, helixY, helixZ);

  // Update light to follow solar system center
  sunLight.position.copy(solarSystem.position);

  // Update comet tail positions behind sun along direction opposite to solarSystem velocity vector
  const velocity = new THREE.Vector3(
    -helixRadius * helixFrequency * Math.sin(t * helixFrequency),
    helixRadius * helixFrequency * Math.cos(t * helixFrequency),
    0.8
  ).normalize();

  // Place tail particles behind sun with decreasing opacity and size
  tailParticles.forEach((particle, idx) => {
    const distanceBehind = (idx / tailParticlesCount) * tailLength;
    const pos = new THREE.Vector3().copy(solarSystem.position).addScaledVector(velocity, -distanceBehind);
    particle.position.copy(pos);

    // Fade out and shrink tail particles gradually
    particle.material.opacity = 0.3 * (1 - idx / tailParticlesCount);
    const scale = 30 * (1 - idx / tailParticlesCount);
    particle.scale.set(scale, scale, scale);
  });

  // Camera auto follow solar system with offset if user not interacting
  if (!controls.userIsInteracting) {
    camera.position.copy(solarSystem.position).add(cameraOffset);
    controls.target.copy(solarSystem.position);
    controls.update();
  }

  renderer.render(scene, camera);
  t += 1;

  requestAnimationFrame(animate);
}

controls.userIsInteracting = false;
controls.addEventListener('start', () => {
  controls.userIsInteracting = true;
});
controls.addEventListener('end', () => {
  controls.userIsInteracting = false;
});

animate();

// Tab switching (unchanged)
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});
