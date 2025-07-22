// app.js

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

// Perspective camera
const camera = new THREE.PerspectiveCamera(65, canvas.clientWidth / canvas.clientHeight, 0.1, 3000);

const controls = new OrbitControls(camera, canvas);
controls.minDistance = 50;
controls.maxDistance = 1000;
controls.maxPolarAngle = Math.PI / 2;

const cameraOffset = new THREE.Vector3(100, 150, 200);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 1.5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

// Sun mesh
const sunRadius = 15;
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.castShadow = false;
sun.receiveShadow = false;

// Add comet-like tail to sun
const tailGeometry = new THREE.ConeGeometry(10, 60, 16, 1, true);
const tailMaterial = new THREE.MeshBasicMaterial({
  color: 0xffcc00,
  transparent: true,
  opacity: 0.3,
  side: THREE.BackSide
});
const tail = new THREE.Mesh(tailGeometry, tailMaterial);
tail.position.set(0, 0, -35);  // place it behind the sun
tail.rotation.x = Math.PI;    // point it backwards
sun.add(tail);                // attach to sun so it follows motion

// Planet data
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

// Create meshes
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

let t = 0; // animation time counter

function animate() {
  const jd = julian.DateToJD(new Date());

  // Update each planet's position with simulated orbital rotation
  planets.forEach((p, i) => {
    const pos = p.data.position(jd);
    const baseAngle = pos.lon;

    // Simulated orbital animation speed (custom per planet)
    const spin = t * 0.0005 * (1 + i * 0.1);
    const angle = baseAngle + spin;

    const r = p.radius;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const z = 0;

    p.mesh.position.set(x, y, z);
  });

  // Solar system follows a helix path
  const helixRadius = 5;
  const helixFrequency = 0.02;
  const helixX = helixRadius * Math.cos(t * helixFrequency);
  const helixY = helixRadius * Math.sin(t * helixFrequency);
  const helixZ = t * 1.2;

  solarSystem.position.set(helixX, helixY, helixZ);

  // Update light to follow solar system
  sunLight.position.copy(solarSystem.position);

  // Camera auto-tracking
  if (!controls.userIsInteracting) {
    camera.position.copy(solarSystem.position).add(cameraOffset);
    controls.target.copy(solarSystem.position);
    controls.update();
  }

  renderer.render(scene, camera);
  t += 1;

  requestAnimationFrame(animate);
}

// Detect user interaction to pause camera tracking
controls.userIsInteracting = false;
controls.addEventListener('start', () => {
  controls.userIsInteracting = true;
});
controls.addEventListener('end', () => {
  controls.userIsInteracting = false;
});

animate();

// Tab switching logic
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});
