import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

import julian from './astronomia/src/julian.js';
import { Planet } from './astronomia/src/planetposition.js';

import mercuryData from './astronomia/data/vsop87Bmercury.js';
import venusData from './astronomia/data/vsop87Bvenus.js';
import earthData from './astronomia/data/vsop87Bearth.js';
import marsData from './astronomia/data/vsop87Bmars.js';
import jupiterData from './astronomia/data/vsop87Djupiter.js';
import saturnData from './astronomia/data/vsop87Dsaturn.js';
import uranusData from './astronomia/data/vsop87Duranus.js';
import neptuneData from './astronomia/data/vsop87Dneptune.js';

// Texture loader for planet and background images
const textureLoader = new THREE.TextureLoader();

// Renderer setup
const canvas = document.getElementById('chartCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene background (skybox)
const scene = new THREE.Scene();
const cubeLoader = new THREE.CubeTextureLoader();
const skyboxTexture = cubeLoader.load([
  'https://threejs.org/examples/textures/cube/Bridge2/posx.jpg',
  'https://threejs.org/examples/textures/cube/Bridge2/negx.jpg',
  'https://threejs.org/examples/textures/cube/Bridge2/posy.jpg',
  'https://threejs.org/examples/textures/cube/Bridge2/negy.jpg',
  'https://threejs.org/examples/textures/cube/Bridge2/posz.jpg',
  'https://threejs.org/examples/textures/cube/Bridge2/negz.jpg',
]);
scene.background = skyboxTexture;

// Camera setup
const camera = new THREE.PerspectiveCamera(123, canvas.clientWidth / canvas.clientHeight, 0.1, 5000);
const cameraOffset = new THREE.Vector3(300, 400, 500);

// OrbitControls to move around the scene
const controls = new OrbitControls(camera, canvas);
controls.enableZoom = true;
controls.minDistance = 100;
controls.maxDistance = 1000;
controls.maxPolarAngle = Math.PI / 2;
controls.enablePan = true;
controls.panSpeed = 0.5;

// Clamp camera distance around solar system center
function clampCameraDistance() {
  const minDistance = 100;
  const maxDistance = 500;
  const distance = camera.position.distanceTo(solarSystem.position);
  const direction = camera.position.clone().sub(solarSystem.position).normalize();
  if (distance < minDistance) camera.position.copy(solarSystem.position).add(direction.multiplyScalar(minDistance));
  else if (distance > maxDistance) camera.position.copy(solarSystem.position).add(direction.multiplyScalar(maxDistance));
}
controls.addEventListener('change', clampCameraDistance);

// Lighting setup
scene.add(new THREE.AmbientLight(0x404040, 0.5));
const sunLight = new THREE.PointLight(0xffffff, 1.5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1000;
sunLight.shadow.mapSize.height = 1000;
scene.add(sunLight);

// Sun mesh setup
const sunRadius = 69;
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunTexture = textureLoader.load('./images/sun.cmap.jpg');
const sunMaterial = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissive: new THREE.Color(0xffffaa),
  emissiveIntensity: 7,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.castShadow = false;
sun.receiveShadow = false;

// Comet tail particles
const tailLength = 333;
const tailParticlesCount = 21;
const tailParticles = [];
const tailTexture = textureLoader.load('https://threejs.org/examples/textures/sprites/disc.png');

for (let i = 0; i < tailParticlesCount; i++) {
  const tailMaterial = new THREE.SpriteMaterial({
    map: tailTexture,
    color: 0xffcc00,
    transparent: true,
    opacity: 3 * (3 - i / tailParticlesCount),
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(tailMaterial);
  sprite.scale.set(21, 30, 1);
  scene.add(sprite);
  tailParticles.push(sprite);
}

// Planet texture loading
const planetTextures = {
  Mercury: { color: textureLoader.load('./images/merc.cmap.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Venus:   { color: textureLoader.load('./images/venus.cmap.jpg'), bump: textureLoader.load('./images/venus.bump.jpg') },
  Earth:   { color: textureLoader.load('./images/earth.cmap.jpg'), bump: textureLoader.load('./images/earth.bump.jpg') },
  Mars:    { color: textureLoader.load('./images/mars.cmap.jpg'), bump: textureLoader.load('./images/mars.bump.jpg') },
  Jupiter: { color: textureLoader.load('./images/jupiter.cmap.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Saturn:  { color: textureLoader.load('./images/saturn.cmap.jpg'), bump: textureLoader.load('./images/saturn.ring.jpg') },
  Uranus:  { color: textureLoader.load('./images/uranus.cmap.jpg'), bump: textureLoader.load('./images/uranus.ring.bump.jpg') },
  Neptune: { color: textureLoader.load('./images/neptune.cmap.jpg'), bump: textureLoader.load('./images/earth.bump.jpg') },
};

// Planet configuration: orbital radius and size
const scaleFactor = 0.1;
const planets = [
  { name: 'Mercury', data: new Planet(mercuryData), radius: 121.2, planetSize: 12 },
  { name: 'Venus',   data: new Planet(venusData),   radius: 139.2, planetSize: 18 },
  { name: 'Earth',   data: new Planet(earthData),   radius: 152.4, planetSize: 21 },
  { name: 'Mars',    data: new Planet(marsData),    radius: 169.2, planetSize: 15 },
  { name: 'Jupiter', data: new Planet(jupiterData), radius: 191.9, planetSize: 36 },
  { name: 'Saturn',  data: new Planet(saturnData),  radius: 202.0, planetSize: 30 },
  { name: 'Uranus',  data: new Planet(uranusData),  radius: 212.1, planetSize: 24 },
  { name: 'Neptune', data: new Planet(neptuneData), radius: 222.2, planetSize: 24 },
];

// Create planet mesh objects with material
planets.forEach(p => {
  p.mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.planetSize, 32, 32),
    new THREE.MeshStandardMaterial({
      map: planetTextures[p.name].color,
      bumpMap: planetTextures[p.name].bump,
      bumpScale: 1,
    })
  );
  p.mesh.castShadow = true;
  p.mesh.receiveShadow = true;
});

// Add sun and planets to solarSystem group
const solarSystem = new THREE.Group();
solarSystem.add(sun);
planets.forEach(p => solarSystem.add(p.mesh));
scene.add(solarSystem);

// Animation variables
let t = 0;



// Updated Solar System Simulation with Elliptical Orbits Around the Sun
// --------------------------------------------------
// This version ensures each planet orbits the Sun elliptically while the sun and system continue
// to move forward in a helix-like trajectory through space.

function animate() {
  const jd = julian.DateToJD(new Date());

  // Tail direction for comet tail particles
  const tailDirection = new THREE.Vector3().subVectors(solarSystem.position, sun.position).normalize();

  // Parameters for group helix motion (solarSystem group)
  const helixRadius = 39;
  const helixFrequency = 0.005;
  const helixZSpeed = 0.7;

  // Compute position of the solarSystem group along a helix
  const helixX = helixRadius * Math.cos(t * helixFrequency);
  const helixY = helixRadius * Math.sin(t * helixFrequency);
  const helixZ = t * helixZSpeed;
  solarSystem.position.set(helixX, helixY, helixZ);
  sunLight.position.copy(solarSystem.position);

  // Parameters for elliptical orbits
  const orbitA = 50; // semi-major axis (X)
  const orbitB = 30; // semi-minor axis (Y)
  const orbitSpeed = 0.0015;
  const helixZSpacing = -69;

  planets.forEach((p, i) => {
    const angle = t * orbitSpeed + i * 0.5; // phase shift by index

    const orbitX = orbitA * Math.cos(angle);
    const orbitY = orbitB * Math.sin(angle);
    const orbitZ = (i + 1) * helixZSpacing;

    // Position planet around sun (sun is at center of orbit in local solarSystem space)
    p.mesh.position.set(orbitX, orbitY, orbitZ);

    // Spin on their X-axis
    p.mesh.rotation.x += 0.1 + 0.03 * i;

    // Optional wobble
    const wobbleAmplitude = 0.05 + 0.01 * i;
    const wobbleSpeed = 0.005 + 0.002 * i;
    p.mesh.rotation.y = Math.sin(t * wobbleSpeed) * wobbleAmplitude;

    // Axial tilt toward sun
    p.mesh.lookAt(sun.position);
    p.mesh.rotateZ(THREE.MathUtils.degToRad(23.5));
  });

  // Animate comet tail
  tailParticles.forEach((particle, idx) => {
    const distanceBehind = (idx / tailParticlesCount) * tailLength;
    const jitter = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).multiplyScalar(0.3);

    const pos = new THREE.Vector3()
      .copy(solarSystem.position)
      .addScaledVector(tailDirection, -distanceBehind)
      .add(jitter);

    particle.position.copy(pos);
    particle.material.opacity = 0.3 * (1 - idx / tailParticlesCount);
    const scale = 100 * (1 - idx / tailParticlesCount);
    particle.scale.set(scale, scale, scale);
  });

  // Auto-follow camera unless user is interacting
  if (!controls.userIsInteracting) {
    camera.position.copy(solarSystem.position).add(cameraOffset);
    controls.target.copy(solarSystem.position);
    controls.update();
  }

  renderer.render(scene, camera);
  t += 1;
  requestAnimationFrame(animate);
}



//----------------------------------------------------------------------------------------------





controls.userIsInteracting = false;
controls.addEventListener('start', () => { controls.userIsInteracting = true; });
controls.addEventListener('end', () => { controls.userIsInteracting = false; });

animate();

// Tab switching UI logic
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});
