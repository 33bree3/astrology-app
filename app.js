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
import { position as moonPosition } from './astronomia/src/moonposition.js'; // NEW: Moon position
import { phase as moonPhase } from './astronomia/src/moonphase.js'; // UPDATED: moonPhase function to get phase fraction

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

textureLoader.load('./images/earth.cmap.jpg',
  (texture) => console.log('Earth texture loaded', texture),
  undefined,
  (err) => console.error('Error loading earth texture:', err)
);

// --------------------------- MOON TEXTURE ---------------------------
const moonTextures = {
  color: textureLoader.load('./planets/moon.jpg'),
  bump: textureLoader.load('./images/pluto.bump.jpg')
};

// --------------------------- RENDERER SETUP ---------------------------
const canvas = document.getElementById('chartCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// --------------------------- SCENE SETUP ---------------------------
const scene = new THREE.Scene();
const cubeLoader = new THREE.CubeTextureLoader();
const skyboxUrls = [
  './images/space.right.jpg',
  './images/space.left.jpg',
  './images/space.up.jpg',
  './images/space.down.jpg',
  './images/space.jpg',
  './images/space2.jpg'
];

const skyboxTexture = cubeLoader.load(skyboxUrls);
skyboxTexture.magFilter = THREE.LinearFilter;
skyboxTexture.minFilter = THREE.LinearFilter;
skyboxTexture.wrapS = THREE.ClampToEdgeWrapping;
skyboxTexture.wrapT = THREE.ClampToEdgeWrapping;
skyboxTexture.generateMipmaps = false;
scene.background = skyboxTexture;

// --------------------------- CAMERA SETUP ---------------------------
const camera = new THREE.PerspectiveCamera(123, canvas.clientWidth / canvas.clientHeight, 0.1, 5000);
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
const sunLight = new THREE.PointLight(0xffffff, 3333, 0, 2);
sunLight.castShadow = false;
sunLight.shadow.mapSize.width = 1000;
sunLight.shadow.mapSize.height = 1000;
scene.add(sunLight);
scene.add(new THREE.PointLightHelper(sunLight, 10));

// --------------------------- SUN SETUP ---------------------------
const sunRadius = 93;
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunTexture = textureLoader.load('./images/sun.cmap.jpg');
const sunMaterial = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissive: new THREE.Color(0xffffaa),
  emissiveIntensity: 69,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.castShadow = false;
sun.receiveShadow = false;
scene.add(sun);

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
  Mercury: { color: textureLoader.load('./planets.mercury.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Venus:   { color: textureLoader.load('./planet/venus.jpg'), bump: textureLoader.load('./images/venus.bump.jpg') },
  Earth:   { color: textureLoader.load('./planets/earth.jpg'), bump: textureLoader.load('./images/earth.bump.jpg') },
  Mars:    { color: textureLoader.load('./planets/mars.jpg'), bump: textureLoader.load('./images/mars.bump.jpg') },
  Jupiter: { color: textureLoader.load('./planets/jupiter.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Saturn:  { color: textureLoader.load('./planets/saturn.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Uranus:  { color: textureLoader.load('./planets/uranus.jpg'), bump: textureLoader.load('./images/pluto.bump.jpg') },
  Neptune: { color: textureLoader.load('./planets/neptune.jpg'), bump: textureLoader.load('./images/earth.bump.jpg') },
  Moob: { color: textureLoader.load('./planets/moon.jpg'), bump: textureLoader.load('./images/mars.bump.jpg') },
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
    new THREE.MeshPhongMaterial({
      map: planetTextures[p.name].color,
      bumpMap: planetTextures[p.name].bump,
      bumpScale: 1,
      shininess: 7,
      specular: new THREE.Color(0x666666),
      emissive: new THREE.Color(0x000000)
    })
  );
  p.mesh.castShadow = false;
  p.mesh.receiveShadow = true;
});

// --------------------------- MOON MESH SETUP ---------------------------
const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(30, 32, 32),
  new THREE.MeshPhongMaterial({
    map: moonTextures.color,
    bumpMap: moonTextures.bump,
    bumpScale: 0.3,
    shininess: 5,
    emissive: new THREE.Color(0x111111)
  })
);
moonMesh.castShadow = false;
moonMesh.receiveShadow = true;
scene.add(moonMesh);

// --------------------------- SOLAR SYSTEM GROUP ---------------------------
const solarSystem = new THREE.Group();
scene.add(solarSystem);
planets.forEach(p => solarSystem.add(p.mesh));
sun.position.set(0, 0, 0);
sunLight.position.copy(sun.position);

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
  sunLight.position.copy(sun.position);

  // Scale factor to keep planets visible and spread nicely
  const scale = 300;

  planets.forEach((p, i) => {
    // Get VSOP87 position for planet at JD (equinox 2000)
    const pos = p.data.position2000(jd);
    const r = pos.range; // Distance from sun in AU
    const lon = pos.lon;  // Longitude in radians
    const lat = pos.lat;  // Latitude in radians

    // Convert spherical coordinates (r, lat, lon) to Cartesian and scale for visualization
    let orbitX = r * Math.cos(lat) * Math.cos(lon) * scale;
    let orbitY = r * Math.sin(lat) * scale;
    let orbitZ = r * Math.cos(lat) * Math.sin(lon) * scale;

    // Slight positional adjustment for Neptune for better visibility (as per original code)
    if (p.name === 'Neptune') {
      orbitY += 150;
      orbitX -= 69;
    }

    p.mesh.position.set(orbitX, orbitY, orbitZ);

    // Rotate planets slowly, giving a little spin
    p.mesh.rotation.x += 0.09 + 0.03 * i;
    p.mesh.rotation.y = Math.sin(t * (0.5 + 0.002 * i)) * (0.05 + 0.01 * i);

    // Planets face the sun
    p.mesh.lookAt(sun.position);

    // Tilt planet rotation to simulate Earth's axial tilt, for all planets similarly
    p.mesh.rotateZ(THREE.MathUtils.degToRad(23.5));
  });

  // --------------------------- MOON POSITION LOGIC ---------------------------
  const earth = planets.find(p => p.name === 'Earth');
  if (earth) {
    // Get moon position at JD in spherical coords
    const moonGeo = moonPosition(jd);
    // moonGeo: { range (AU), lon (rad), lat (rad) }

    // Calculate moon position relative to Earth
    const moonVector = new THREE.Vector3(
      moonGeo.range * Math.cos(moonGeo.lat) * Math.cos(moonGeo.lon),
      moonGeo.range * Math.sin(moonGeo.lat),
      moonGeo.range * Math.cos(moonGeo.lat) * Math.sin(moonGeo.lon)
    ).multiplyScalar(scale * 0.1); // Scaled for visualization (moon closer to Earth)

    moonMesh.position.copy(earth.mesh.position.clone().add(moonVector));

    // Calculate moon phase illumination (0 to 1) using astronomia's moonphase.phase()
    const phaseFraction = moonPhase(jd); // Returns 0 (new) to 1 (next new moon)
    const illumination = 1 - Math.abs(phaseFraction - 0.5) * 2; // Full moon ~1, new moon ~0

    // Use illumination to affect moon emissive intensity (brightness)
    moonMesh.material.emissiveIntensity = illumination * 3;

    // Moon looks toward the sun for lighting effect
    moonMesh.lookAt(sun.position);

    // --------------------------- TAIL ANIMATION ---------------------------
    const tailDirection = new THREE.Vector3().subVectors(earth.mesh.position, sun.position).normalize();
    tailParticles.forEach((particle, idx) => {
      const distanceFromSun = (idx / tailParticlesCount) * tailLength;
      const jitter = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2).multiplyScalar(1.2);
      const pos = new THREE.Vector3().copy(sun.position).addScaledVector(tailDirection, distanceFromSun).add(jitter);
      particle.position.copy(pos);
      particle.material.opacity = 0.3 * (1 - idx / tailParticlesCount);
      const scaleParticle = 100 * (1 - idx / tailParticlesCount);
      particle.scale.set(scaleParticle, scaleParticle, scaleParticle);
    });
  }

  // Smooth camera follow unless user interacts
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
