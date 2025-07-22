// app.js
import * as THREE from 'three';
import julian from './astronomia/src/julian.js';
import { Planet } from './astronomia/src/planetposition.js';

// Planet data
import mercuryData from './astronomia/data/vsop87Bmercury.js';
import venusData from './astronomia/data/vsop87Bvenus.js';
import earthData from './astronomia/data/vsop87Bearth.js';
import marsData from './astronomia/data/vsop87Bmars.js';
import jupiterData from './astronomia/data/vsop87Bjupiter.js';
import saturnData from './astronomia/data/vsop87Bsaturn.js';
import uranusData from './astronomia/data/vsop87Buranus.js';
import neptuneData from './astronomia/data/vsop87Bneptune.js';

// Grab the canvas from HTML
const canvas = document.getElementById('chartCanvas');

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);

// Scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, canvas.clientWidth / canvas.clientHeight, 0.1, 3000);
camera.position.set(0, 100, 400);

// Lighting
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(100, 100, 100);
scene.add(light);

// Create Sun
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(10, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffff00 })
);
scene.add(sun);

// Planets with colors and radii
const planets = [
  { name: 'Mercury', data: new Planet(mercuryData), color: 0xc0c0c0, radius: 30 },
  { name: 'Venus',   data: new Planet(venusData),   color: 0xf5deb3, radius: 45 },
  { name: 'Earth',   data: new Planet(earthData),   color: 0x1e90ff, radius: 60 },
  { name: 'Mars',    data: new Planet(marsData),    color: 0xff4500, radius: 75 },
  { name: 'Jupiter', data: new Planet(jupiterData), color: 0xf4e2d8, radius: 100 },
  { name: 'Saturn',  data: new Planet(saturnData),  color: 0xdeB887, radius: 120 },
  { name: 'Uranus',  data: new Planet(uranusData),  color: 0x7fffd4, radius: 135 },
  { name: 'Neptune', data: new Planet(neptuneData), color: 0x4169e1, radius: 150 },
];

// Create meshes for planets
planets.forEach(p => {
  p.mesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 16, 16),
    new THREE.MeshStandardMaterial({ color: p.color })
  );
  scene.add(p.mesh);
});

// Main animation state
let t = 0;

function animate() {
  const jd = julian.DateToJD(new Date());

  // Move Sun forward in Z (helix direction)
  sun.position.set(0, 0, -t);

  // Update planet positions along helix path
  planets.forEach(p => {
    const pos = p.data.position(jd);
    const angle = pos.lon;
    const r = p.radius;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const z = -t + angle * 20;  // angle controls phase in Z
    p.mesh.position.set(x, y, z);
  });

  // Camera follows Sun
  camera.lookAt(sun.position);
  renderer.render(scene, camera);

  t += 0.5; // move solar system forward
  requestAnimationFrame(animate);
}

animate();

// Handle tab switching
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});
