// app.js
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

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

// Initial camera position will be behind the solar system along negative Z
const camera = new THREE.PerspectiveCamera(65, canvas.clientWidth / canvas.clientHeight, 0.1, 3000);
// We'll update camera.position dynamically in animate()

// Ambient light for soft lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Sun's point light with shadows
const sunLight = new THREE.PointLight(0xffffff, 1.5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

const sunRadius = 15;
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.castShadow = false;
sun.receiveShadow = false;

// Planets data
const planets = [
  { name: 'Mercury', data: new Planet(mercuryData), color: 0xc0c0c0, radius: 35 },
  { name: 'Venus',   data: new Planet(venusData),   color: 0xf5deb3, radius: 50 },
  { name: 'Earth',   data: new Planet(earthData),   color: 0x1e90ff, radius: 70 },
  { name: 'Mars',    data: new Planet(marsData),    color: 0xff4500, radius: 85 },
  { name: 'Jupiter', data: new Planet(jupiterData), color: 0xf4e2d8, radius: 110 },
  { name: 'Saturn',  data: new Planet(saturnData),  color: 0xdeB887, radius: 130 },
  { name: 'Uranus',  data: new Planet(uranusData),  color: 0x7fffd4, radius: 145 },
  { name: 'Neptune', data: new Planet(neptuneData), color: 0x4169e1, radius: 160 },
];

// Create planet meshes and add to scene later
planets.forEach(p => {
  p.mesh = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 16, 16),
    new THREE.MeshStandardMaterial({ color: p.color })
  );
  p.mesh.castShadow = true;
  p.mesh.receiveShadow = true;
});

const solarSystem = new THREE.Group();
solarSystem.add(sun);
planets.forEach(p => solarSystem.add(p.mesh));
scene.add(solarSystem);

let t = 0; // time progression

// Camera offset from solar system's position to keep view on planets
const cameraOffset = new THREE.Vector3(0, 80, -250);

function animate() {
  const jd = julian.DateToJD(new Date());

  // Update planet orbits relative to Sun inside solarSystem group
  planets.forEach(p => {
    const pos = p.data.position(jd);
    const angle = pos.lon;
    const r = p.radius;

    // Planets orbit on XY plane relative to Sun
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const z = 0;

    p.mesh.position.set(x, y, z);
  });

  // Move entire solar system forward along positive Z with a helix path in X/Y
  const helixRadius = 5;       // sideways radius for helix motion
  const helixFrequency = 0.02; // helix tightness

  // Calculate helix offsets
  const helixX = helixRadius * Math.cos(t * helixFrequency);
  const helixY = helixRadius * Math.sin(t * helixFrequency);
  const helixZ = t * 1.2;      // Moving forward along positive Z axis

  // Set solar system position on helix path
  solarSystem.position.set(helixX, helixY, helixZ);

  // Sun light follows solar system center
  sunLight.position.copy(solarSystem.position);

  // Update camera position to follow solar system, maintaining offset
  camera.position.copy(solarSystem.position).add(cameraOffset);

  // Camera looks at solar system center
  camera.lookAt(solarSystem.position);

  renderer.render(scene, camera);

  t += 1; // increment time

  requestAnimationFrame(animate);
}

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
