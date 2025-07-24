<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Solar System Simulation Fixed</title>
<style>
  body, html { margin: 0; overflow: hidden; height: 100%; }
  #chartCanvas { width: 100vw; height: 100vh; display: block; }
</style>
</head>
<body>

<canvas id="chartCanvas"></canvas>

<script type="module">

import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

// Astronomia CDN imports for needed modules
import julian from 'https://cdn.jsdelivr.net/npm/astronomia@1.10.2/src/julian.js';
import { Planet } from 'https://cdn.jsdelivr.net/npm/astronomia@1.10.2/src/planetposition.js';
import moonPosition from 'https://cdn.jsdelivr.net/npm/astronomia@1.10.2/src/moonposition.js';
import { phaseAngleEquatorial } from 'https://cdn.jsdelivr.net/npm/astronomia@1.10.2/src/moonillum.js';
import { coord } from 'https://cdn.jsdelivr.net/npm/astronomia@1.10.2/src/coord.js';

// You must provide VSOP87 data URLs or replace with dummy data here
// For the demo, I'll use dummy planets with zero orbital data
const mercuryData = { position: (jd) => ({ x: 0.387, y: 0, z: 0 }) };
const venusData = { position: (jd) => ({ x: 0.723, y: 0, z: 0 }) };
const earthData = { position: (jd) => ({ x: 1, y: 0, z: 0 }) };
const marsData = { position: (jd) => ({ x: 1.5, y: 0, z: 0 }) };
const jupiterData = { position: (jd) => ({ x: 5.2, y: 0, z: 0 }) };
const saturnData = { position: (jd) => ({ x: 9.5, y: 0, z: 0 }) };
const uranusData = { position: (jd) => ({ x: 19.2, y: 0, z: 0 }) };
const neptuneData = { position: (jd) => ({ x: 30, y: 0, z: 0 }) };

// Setup constants and THREE.js stuff (same as yours)
const BASE_SCALE = 2222;
const PLANET_SIZE_MULTIPLIER = 1;
const TIME_SPEED_FACTOR = 21;
const OUTER_PLANETS_COMPRESSION = 0.3;
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

const canvas = document.getElementById('chartCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();

// Basic background color (no skybox for simplicity)
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(123, window.innerWidth / window.innerHeight, 0.1, 5000);
const controls = new OrbitControls(camera, canvas);
controls.enableZoom = true;
controls.minDistance = 3333;
controls.maxDistance = 7777;
controls.maxPolarAngle = Math.PI / 2;
controls.enablePan = true;
controls.panSpeed = 0.5;

scene.add(new THREE.AmbientLight(0x404040, 0.5));

const sunLight = new THREE.PointLight(0xffffff, 3, 0, 2);
sunLight.castShadow = false;
scene.add(sunLight);
scene.add(new THREE.PointLightHelper(sunLight, 10));

const textureLoader = new THREE.TextureLoader();

const sunRadius = 666;
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffaa,
  emissive: 0xffffaa,
  emissiveIntensity: 2,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);
sun.position.set(0, 0, 0);
sunLight.position.copy(sun.position);

const planets = [
  { name: 'Mercury', data: new Planet(mercuryData), radius: 1, planetSize: 69 },
  { name: 'Venus', data: new Planet(venusData), radius: 2, planetSize: 101 },
  { name: 'Earth', data: new Planet(earthData), radius: 3, planetSize: 123 },
  { name: 'Mars', data: new Planet(marsData), radius: 4, planetSize: 72 },
  { name: 'Jupiter', data: new Planet(jupiterData), radius: 5, planetSize: 369 },
  { name: 'Saturn', data: new Planet(saturnData), radius: 6, planetSize: 297 },
  { name: 'Uranus', data: new Planet(uranusData), radius: 7, planetSize: 201 },
  { name: 'Neptune', data: new Planet(neptuneData), radius: 8, planetSize: 154 },
];

const solarSystem = new THREE.Group();
scene.add(solarSystem);

planets.forEach(p => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.planetSize * PLANET_SIZE_MULTIPLIER, 32, 32),
    new THREE.MeshPhongMaterial({ color: 0x8888ff })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  p.mesh = mesh;
  solarSystem.add(mesh);
});

const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(50, 32, 32),
  new THREE.MeshPhongMaterial({ color: 0xdddddd, emissive: 0x444444 })
);
scene.add(moonMesh);

let julianDate = julian.CalendarToJD(2023, 7, 21);

function heliocentricToVector3(pos, scaleFactor) {
  // x,y,z from Astronomia to Vector3, assuming y=0 plane in simulation
  return new THREE.Vector3(pos.x * scaleFactor, 0, pos.y * scaleFactor);
}

function animate() {
  requestAnimationFrame(animate);

  julianDate += TIME_SPEED_FACTOR;

  planets.forEach(p => {
    const pos = p.data.position(julianDate);
    let scale = Math.log(p.radius) * BASE_SCALE;
    if (p.radius > 4) scale *= OUTER_PLANETS_COMPRESSION;

    const planetPos = heliocentricToVector3(pos, scale);
    p.mesh.position.copy(planetPos);
    p.mesh.rotation.y += 0.01;
  });

  // Moon position relative to Earth
  const moonPos = moonPosition.position(julianDate);

  // Convert moon equatorial coords to ecliptic using proper method
  const moonEquatorial = new coord.Equatorial(moonPos.ra, moonPos.dec, 0);
  const moonEcliptic = coord.equatorialToEcliptic(moonEquatorial, julianDate);

  const earthScale = Math.log(3) * BASE_SCALE;

  // Scale moon ecliptic coords for simulation (adjust as needed)
  const moonX = earthScale + moonEcliptic.lon * 10 * 2;
  const moonZ = earthScale + moonEcliptic.lat * 10 * 2;

  moonMesh.position.set(moonX, 0, moonZ);
  moonMesh.rotation.y += 0.01;

  // Moon illumination phase angle
  const phaseAngle = phaseAngleEquatorial(julianDate);
  moonMesh.material.emissiveIntensity = phaseAngle / 4;

  controls.update();
  renderer.render(scene, camera);
}

camera.position.set(0, 3000, 3333);
animate();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

</script>

</body>
</html>
