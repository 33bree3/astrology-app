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

// Renderer with shadows
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene and fixed camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, canvas.clientWidth / canvas.clientHeight, 0.1, 3000);

// Camera fixed looking at origin, positioned back a bit on Z
camera.position.set(0, 80, 250);
camera.lookAt(0, 0, 0);

// Ambient light for basic illumination
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Point light (Sun light) with shadows enabled
const sunLight = new THREE.PointLight(0xffffff, 1.5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

// Sun mesh (bigger, glowing)
const sunRadius = 15;
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.castShadow = false;
sun.receiveShadow = false;
scene.add(sun);

// Planets with colors and orbital radii
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

// Create planet meshes
planets.forEach(p => {
  p.mesh = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 16, 16),
    new THREE.MeshStandardMaterial({ color: p.color })
  );
  p.mesh.castShadow = true;
  p.mesh.receiveShadow = true;
  scene.add(p.mesh);
});

// Group to hold entire solar system so we can move it as one unit
const solarSystem = new THREE.Group();
solarSystem.add(sun);
planets.forEach(p => solarSystem.add(p.mesh));
scene.add(solarSystem);

let t = 0; // time progression

function animate() {
  const jd = julian.DateToJD(new Date());

  // Orbit planets around Sun (inside solarSystem group)
  planets.forEach(p => {
    const pos = p.data.position(jd);
    const angle = pos.lon;
    const r = p.radius;

    // Circular orbit position relative to Sun at origin inside group
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const z = 0; // planets orbit in xy plane inside solarSystem

    p.mesh.position.set(x, y, z);
  });

  // Move entire solar system forward in Z in a helix motion
  // x and y oscillate slightly to create helix path while moving forward in z
  const helixRadius = 5; // small sideways radius for helix
  const helixFrequency = 0.02; // controls tightness of helix

  const helixX = helixRadius * Math.cos(t * helixFrequency);
  const helixY = helixRadius * Math.sin(t * helixFrequency);
  const helixZ =  (t * 1.2); // moving towards camera along negative Z axis

  solarSystem.position.set(helixX, helixY, helixZ);

  // Keep Sun light synced to solarSystem center
  sunLight.position.copy(solarSystem.position);

  // Camera fixed, looking at solarSystem center
  camera.lookAt(solarSystem.position);

  renderer.render(scene, camera);

  t += 1; // progress time

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
