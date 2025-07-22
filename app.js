// app.js

// Import THREE.js from CDN for 3D rendering
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

// Import astronomy calculation modules
import julian from './astronomia/src/julian.js';
import { Planet } from './astronomia/src/planetposition.js';

// Import planetary VSOP87 data for accurate positions
import mercuryData from './astronomia/data/vsop87Bmercury.js';
import venusData from './astronomia/data/vsop87Bvenus.js';
import earthData from './astronomia/data/vsop87Bearth.js';
import marsData from './astronomia/data/vsop87Bmars.js';
import jupiterData from './astronomia/data/vsop87Bjupiter.js';
import saturnData from './astronomia/data/vsop87Bsaturn.js';
import uranusData from './astronomia/data/vsop87Buranus.js';
import neptuneData from './astronomia/data/vsop87Bneptune.js';

// Grab the canvas element from the HTML page
const canvas = document.getElementById('chartCanvas');

// Setup the WebGL renderer using the canvas, enable anti-aliasing for smooth edges
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
// Set the size of the rendering viewport to the canvas dimensions
renderer.setSize(canvas.clientWidth, canvas.clientHeight);

// Create the main 3D scene where all objects will live
const scene = new THREE.Scene();

// Setup the camera to view the scene: 
// - Field of view: 65 degrees, 
// - Aspect ratio based on canvas size,
// - Near and far clipping planes to limit render distance
const camera = new THREE.PerspectiveCamera(
  65, 
  canvas.clientWidth / canvas.clientHeight, 
  0.1, 
  3000
);

// Position the camera slightly above and back on the Z-axis to get a good 3D view
camera.position.set(0, 100, 400);

// Add a white point light to illuminate the planets and sun
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(100, 100, 100);
scene.add(light);

// Create the Sun as a yellow sphere mesh, placed at the origin
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(10, 32, 32), // radius 10, smooth sphere
  new THREE.MeshBasicMaterial({ color: 0xffff00 }) // yellow, non-affected by lights (always bright)
);
scene.add(sun);

// Define your planets with:
// - name: string identifier
// - data: astronomy Planet instance for position calculations
// - color: hex color for visual appearance
// - radius: orbital radius for helix formation (scaled for visual clarity)
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

// For each planet, create a sphere mesh with appropriate color and size and add to scene
planets.forEach(p => {
  p.mesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 16, 16), // radius 2.5 for visible planets
    new THREE.MeshStandardMaterial({ color: p.color }) // material reacts to light
  );
  scene.add(p.mesh);
});

// Animation time counter for helix translation along Z axis
let t = 0;

/**
 * Main animation loop to update positions and render scene.
 * Called repeatedly via requestAnimationFrame for smooth animation.
 */
function animate() {
  // Get current Julian Date for astronomy position calculations
  const jd = julian.DateToJD(new Date());

  // Move the Sun forward along the Z-axis in the negative direction (towards the camera)
  sun.position.set(0, 0, -t);

  // For each planet, calculate its heliocentric longitude and position it on a helix path
  planets.forEach(p => {
    // Get planet's current heliocentric longitude in radians
    const pos = p.data.position(jd);
    const angle = pos.lon;

    // Radius for orbit in helix (predefined)
    const r = p.radius;

    // Calculate planet's X and Y based on circular orbit (cosine and sine of angle)
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);

    // Z position creates the helix: shifted back by time t plus an angle-based phase
    const z = -t + angle * 20;  // 20 controls helix tightness

    // Set the planet mesh position in 3D space
    p.mesh.position.set(x, y, z);
  });

  // Make the camera always look at the Sun's current position to maintain focus
  camera.lookAt(sun.position);

  // Render the updated scene from the camera's viewpoint
  renderer.render(scene, camera);

  // Increment time variable to move the solar system forward along the helix path
  t += 0.5;

  // Request the next animation frame (about 60fps)
  requestAnimationFrame(animate);
}

// Start the animation loop
animate();

/**
 * Tab switching event listeners to show/hide different sections of the app.
 * This keeps your UI interactive without affecting 3D visualization.
 */
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all tabs and sections
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));

    // Add active class to clicked tab and its corresponding section
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});
