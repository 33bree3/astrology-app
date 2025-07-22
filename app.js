// app.js

// Import Three.js from CDN (ES Modules)
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

// Import astronomy calculation utils from astronomia library
import julian from './astronomia/src/julian.js';
import { Planet } from './astronomia/src/planetposition.js';

// Import planetary VSOP87 data for position calculations
import mercuryData from './astronomia/data/vsop87Bmercury.js';
import venusData from './astronomia/data/vsop87Bvenus.js';
import earthData from './astronomia/data/vsop87Bearth.js';
import marsData from './astronomia/data/vsop87Bmars.js';
import jupiterData from './astronomia/data/vsop87Bjupiter.js';
import saturnData from './astronomia/data/vsop87Bsaturn.js';
import uranusData from './astronomia/data/vsop87Buranus.js';
import neptuneData from './astronomia/data/vsop87Bneptune.js';

// Get canvas element from DOM
const canvas = document.getElementById('chartCanvas');

// Setup Three.js WebGL renderer with antialiasing
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
// Set renderer size to match canvas size
renderer.setSize(canvas.clientWidth, canvas.clientHeight);

// Create the scene to hold objects
const scene = new THREE.Scene();

// Setup camera: perspective projection
const camera = new THREE.PerspectiveCamera(
  65,                                // fov in degrees
  canvas.clientWidth / canvas.clientHeight,  // aspect ratio
  0.1,                               // near clipping plane
  3000                               // far clipping plane
);

// Initial camera position set back so we can see the solar system
camera.position.set(0, 150, 800);

// Add a white point light source to illuminate the planets
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(100, 100, 100);
scene.add(light);

// Create the Sun as a yellow glowing sphere
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(10, 32, 32),      // radius 10 units
  new THREE.MeshBasicMaterial({ color: 0xffff00 }) // bright yellow, no shading
);
scene.add(sun);

// Array holding planet data and properties
const planets = [
  { name: 'Mercury', data: new Planet(mercuryData), color: 0xc0c0c0, radius: 30 },
  { name: 'Venus',   data: new Planet(venusData),   color: 0xf5deb3, radius: 45 },
  { name: 'Earth',   data: new Planet(earthData),   color: 0x1e90ff, radius: 60 },
  { name: 'Mars',    data: new Planet(marsData),    color: 0xff4500, radius: 75 },
  { name: 'Jupiter', data: new Planet(jupiterData), color: 0xf4e2d8, radius: 100 },
  { name: 'Saturn',  data: new Planet(saturnData),  color: 0xdeb887, radius: 120 },
  { name: 'Uranus',  data: new Planet(uranusData),  color: 0x7fffd4, radius: 135 },
  { name: 'Neptune', data: new Planet(neptuneData), color: 0x4169e1, radius: 150 },
];

// Create a Three.js Mesh for each planet and add to the scene
planets.forEach(p => {
  p.mesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 16, 16),           // smaller spheres for planets
    new THREE.MeshStandardMaterial({ color: p.color }) // shaded material with color
  );
  scene.add(p.mesh);
});

// Time variable to control the movement along the helix (solar system traveling forward)
let t = 0;

// Function to update planet info display in your UI tabs
function updatePlanetInfo(jd) {
  const container = document.getElementById('planetInfo');
  if (!container) return; // if no container, skip

  container.innerHTML = ''; // clear previous content

  // For each planet, get current position and display info
  planets.forEach(p => {
    const pos = p.data.position(jd);
    if (!pos) return;

    // Convert radians to degrees for display
    const lonDeg = (pos.lon * 180 / Math.PI).toFixed(2);
    const latDeg = (pos.lat * 180 / Math.PI).toFixed(2);
    const range = pos.range.toFixed(3);

    container.innerHTML += `
      <p><strong>${p.name}</strong>: Lon ${lonDeg}°, Lat ${latDeg}°, Distance ${range} AU</p>
    `;
  });
}

// Main animation loop - called every frame (~60fps)
function animate() {
  // Calculate current Julian Date
  const jd = julian.DateToJD(new Date());

  // Move the Sun forward along the Z-axis to create illusion of traveling through space (helix direction)
  sun.position.set(0, 0, 200 - t);

  // Update each planet’s position along a helix orbit around the Sun
  planets.forEach(p => {
    // Get planet heliocentric position (longitude, latitude, distance)
    const pos = p.data.position(jd);

    if (!pos || typeof pos.lon !== 'number') {
      console.warn(`Invalid position for planet ${p.name}`, pos);
      return;
    }

    const angle = pos.lon;   // Orbital angle around Sun in radians
    const r = p.radius;      // Radius of helix orbit for this planet

    // Calculate (x, y) position in circular orbit
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);

    // Calculate z position for helix effect (planets travel forward but with offset phase)
    const z = 200 - t + angle * 50;  // Adjust multiplier for spacing along helix

    // Set the mesh position for this planet
    p.mesh.position.set(x, y, z);
  });

  // Camera setup to keep looking at the Sun's current position
  camera.position.set(0, 150, 800);
  camera.lookAt(sun.position);

  // Render the scene from the perspective of the camera
  renderer.render(scene, camera);

  // Update your tab UI with live planet data
  updatePlanetInfo(jd);

  // Increment time to move solar system forward (controls speed)
  t += 0.5;

  // Request next frame for smooth animation
  requestAnimationFrame(animate);
}

// Start the animation loop
animate();

// Handle your tab switching UI - activate tabs and sections on click
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all tabs and sections
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));

    // Activate clicked tab and associated section
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});
