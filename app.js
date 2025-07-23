// Solar System Simulation using Three.js and Astronomia Data
// -----------------------------------------------------------
// This simulation visualizes the solar system using real planetary data (VSOP87)
// from the 'astronomia' library, with textured planets, elliptical orbits, and
// camera controls using OrbitControls from Three.js.

// --------------------------- IMPORTS ---------------------------
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

// --------------------------- TEXTURE LOADING ---------------------------
const textureLoader = new THREE.TextureLoader();

// --------------------------- RENDERER SETUP ---------------------------
const canvas = document.getElementById('chartCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// --------------------------- SCENE SETUP ---------------------------
const scene = new THREE.Scene();
const cubeLoader = new THREE.CubeTextureLoader();
const skyboxTexture = cubeLoader.load([
  './images/space.right.jpg',
  './images/space.left.jpg',
  './images/space.up.jpg',
  './images/space.down.jpg',
  './images/space.jpg',
  './images/space2.jpg'
]);
scene.background = skyboxTexture;

// --------------------------- CAMERA SETUP ---------------------------
const camera = new THREE.PerspectiveCamera(
  123,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  5000
);
const cameraOffset = new THREE.Vector3(300, 400, 500);

// --------------------------- ORBIT CONTROLS ---------------------------
const controls = new OrbitControls(camera, canvas);
controls.enableZoom = true;
controls.minDistance = 1111;
controls.maxDistance = 5555;
controls.maxPolarAngle = Math.PI / 2;
controls.enablePan = true;
controls.panSpeed = 0.5;
controls.userIsInteracting = false;
controls.addEventListener('start', () => { controls.userIsInteracting = true; });
controls.addEventListener('end', () => { controls.userIsInteracting = false; });

// --------------------------- LIGHTING ---------------------------
scene.add(new THREE.AmbientLight(0x404040, 0.5));
const sunLight = new THREE.PointLight(0xffffff, 3);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1000;
sunLight.shadow.mapSize.height = 1000;
scene.add(sunLight);

// --------------------------- SUN SETUP ---------------------------
const sunRadius = 93;
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
scene.add(sun); // Ensure sun is added to the scene

// --------------------------- COMET TAIL ---------------------------
const tailLength = 333;
const tailParticlesCount = 93;
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

// --------------------------- PLANET TEXTURES ---------------------------
const planetTextures = {
  Mercury: { color: textureLoader.load('./images/merc.cmap.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Venus:   { color: textureLoader.load('./images/venus.cmap.jpg'), bump: textureLoader.load('./images/venus.bump.jpg') },
  Earth:   { color: textureLoader.load('./images/earth.cmap.jpg'), bump: textureLoader.load('./images/earth.bump.jpg') },
  Mars:    { color: textureLoader.load('./images/mars.cmap.jpg'), bump: textureLoader.load('./images/mars.bump.jpg') },
  Jupiter: { color: textureLoader.load('./images/jupiter.cmap.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Saturn:  { color: textureLoader.load('./images/saturn.cmap.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Uranus:  { color: textureLoader.load('./images/uranus.cmap.jpg'), bump: textureLoader.load('./images/pluto.bump.jpg') },
  Neptune: { color: textureLoader.load('./images/neptune.cmap.jpg'), bump: textureLoader.load('./images/earth.bump.jpg') },
};

// --------------------------- PLANET DATA ---------------------------
const planets = [
  { name: 'Mercury', data: new Planet(mercuryData), radius: 1, planetSize: 69 },
  { name: 'Venus',   data: new Planet(venusData),   radius: 2, planetSize: 101 },
  { name: 'Earth',   data: new Planet(earthData),   radius: 3, planetSize: 123 },
  { name: 'Mars',    data: new Planet(marsData),    radius: 4, planetSize: 72 },
  { name: 'Jupiter', data: new Planet(jupiterData), radius: 5, planetSize: 369 },
  { name: 'Saturn',  data: new Planet(saturnData),  radius: 6, planetSize: 297 },
  { name: 'Uranus',  data: new Planet(uranusData),  radius: 7, planetSize: 201 },
  { name: 'Neptune', data: new Planet(neptuneData), radius: 8, planetSize: 154 },
];

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

// --------------------------- SOLAR SYSTEM GROUP ---------------------------
const solarSystem = new THREE.Group();
scene.add(solarSystem);
planets.forEach(p => solarSystem.add(p.mesh));

// --------------------------- CAMERA BEHAVIOR ---------------------------
function clampCameraDistance() {
  const minDistance = 1111;
  const maxDistance = 7777;
  const distance = camera.position.distanceTo(solarSystem.position);
  const direction = camera.position.clone().sub(solarSystem.position).normalize();
  if (distance < minDistance) {
    camera.position.copy(solarSystem.position).add(direction.multiplyScalar(minDistance));
  } else if (distance > maxDistance) {
    camera.position.copy(solarSystem.position).add(direction.multiplyScalar(maxDistance));
  }
}
controls.addEventListener('change', clampCameraDistance);

// Mirror initial camera position
function mirrorCameraPosition() {
  const offset = camera.position.clone().sub(solarSystem.position);
  const mirroredOffset = offset.multiplyScalar(-1);
  camera.position.copy(solarSystem.position).add(mirroredOffset);
  controls.target.copy(solarSystem.position);
  controls.update();
}
mirrorCameraPosition();

// --------------------------- ANIMATION LOOP ---------------------------
let t = 0;
function animate() {
  const jd = julian.DateToJD(new Date());
  solarSystem.position.set(0, 0, 0);
  sunLight.position.copy(solarSystem.position);

  planets.forEach((p, i) => {
    const pos = p.data.position2000(jd);
    const r = pos.range;
    const lon = pos.lon;
    const lat = pos.lat;

    const scaledR = Math.log(r + 1) * 1800;
    let orbitX = scaledR * Math.cos(lat) * Math.cos(lon);
    let orbitY = scaledR * Math.sin(lat);
    const orbitZ = scaledR * Math.cos(lat) * Math.sin(lon);

    if (p.name === 'Neptune') {
      orbitY += 150;
      orbitX -= 69;
    }

    p.mesh.position.set(orbitX, orbitY, orbitZ);
    p.mesh.rotation.x += 0.09 + 0.03 * i;
    p.mesh.rotation.y = Math.sin(t * (0.5 + 0.002 * i)) * (0.05 + 0.01 * i);
    p.mesh.lookAt(sun.position);
    p.mesh.rotateZ(THREE.MathUtils.degToRad(23.5));
  });

  const referencePlanet = planets.find(p => p.name === 'Earth') || planets[0];
  const tailDirection = new THREE.Vector3().subVectors(referencePlanet.mesh.position, sun.position).normalize();

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

  if (!controls.userIsInteracting) {
    camera.position.copy(solarSystem.position).add(cameraOffset);
    controls.target.copy(solarSystem.position);
    controls.update();
  }

  renderer.render(scene, camera);
  t += 1;
  requestAnimationFrame(animate);
}
animate();

// --------------------------- UI INTERACTIONS ---------------------------
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});
