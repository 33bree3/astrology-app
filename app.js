// Solar System Simulation using Three.js and Astronomia Data
// -----------------------------------------------------------
// This simulation visualizes the solar system using real planetary data (VSOP87)
// from the 'astronomia' library, with textured planets, elliptical orbits, and
// camera controls using OrbitControls from Three.js.
// Now includes Moon phase illumination calculation using astronomia's moonillum.js.

// --------------------------- IMPORTS ---------------------------
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

// Astronomia core imports for Julian date, planet positions, moon illumination
import julian from './astronomia/src/julian.js';
import base from './astronomia/src/base.js'; // base functions, includes illuminated()
import { Planet } from './astronomia/src/planetposition.js';
import { phaseAngleEquatorial } from './astronomia/src/moonillum.js';

// VSOP87 planetary data imports
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

// Load Earth texture (example)
textureLoader.load('./images/earth.cmap.jpg',
  (texture) => console.log('Earth texture loaded', texture),
  undefined,
  (err) => console.error('Error loading earth texture:', err)
);

// --------------------------- MOON TEXTURE ---------------------------
// Moon color and bump textures (used below for Moon mesh)
const moonTextures = {
  color: textureLoader.load('./planets/moon.jpg'),  // <-- your moon image path
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

// Create planet meshes and add materials
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

// --------------------------- MOON SETUP ---------------------------
// Moon parameters
const moonRadius = 35;  // Scaled moon size
const moonGeometry = new THREE.SphereGeometry(moonRadius, 32, 32);
const moonMaterial = new THREE.MeshPhongMaterial({
  map: moonTextures.color,
  bumpMap: moonTextures.bump,
  bumpScale: 0.5,
  shininess: 5,
  specular: new THREE.Color(0x222222),
  emissive: new THREE.Color(0x000000)
});
const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
moonMesh.castShadow = false;
moonMesh.receiveShadow = true;

// Add Moon mesh to solar system group later after creation

// --------------------------- SOLAR SYSTEM GROUP ---------------------------
const solarSystem = new THREE.Group();
scene.add(solarSystem);
planets.forEach(p => solarSystem.add(p.mesh));
solarSystem.add(moonMesh); // Add Moon mesh to the solar system group

// Position Sun and SunLight at origin
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

// --------------------------- MAIN ANIMATION LOOP ---------------------------
function animate() {
  requestAnimationFrame(animate);

  // Update current Julian Day from current Date
  const now = new Date();
  const jde = julian.CalendarGregorianToJD(now.getFullYear(), now.getMonth() + 1, now.getDate());

  // Update each planet position and rotation based on VSOP87 data
  planets.forEach(planet => {
    // Get heliocentric ecliptic rectangular coordinates for planet at jde
    const pos = planet.data.position2000(jde);
    // Scale and position planets on solar system group
    planet.mesh.position.set(pos.x * 111, pos.y * 111, pos.z * 111);
    planet.mesh.rotation.y += 0.002;
  });

  // Earth data needed for Moon calculations
  const earth = planets.find(p => p.name === 'Earth');

  // Compute Moon position relative to Earth (simplified approximation)
  // We'll get the Moon's geocentric equatorial coords using moonillum.js and planetposition.js

  // Get Sun position (heliocentric)
  const sunPos = { ra: 0, dec: 0, range: 0 }; // Placeholder - compute below

  // Use astronomia for Sun coordinates (approximate)
  // VSOP87 provides heliocentric coords; convert to geocentric coords for Moon
  // For demo, approximate sun coords as zero (you can improve this)

  // Moon's approximate geocentric equatorial coordinates - substitute actual calculation
  // Here, for demo, just place Moon near Earth in orbit visually and then calculate illumination

  // Moon orbit radius and speed (simplified for animation)
  const moonOrbitRadius = 40; // Scaled distance from Earth
  const moonOrbitSpeed = 0.01; // Orbit speed radians/frame
  const time = now.getTime() * 0.0001;

  // Moon's position orbiting Earth on the XY plane (simplified)
  moonMesh.position.set(
    earth.mesh.position.x + moonOrbitRadius * Math.cos(time),
    earth.mesh.position.y,
    earth.mesh.position.z + moonOrbitRadius * Math.sin(time)
  );

  // ----- MOON PHASE ILLUMINATION CALCULATION -----
  // For real moon phase illumination, we need Moon and Sun equatorial coordinates with distance

  // Here we create Coord objects to simulate moon and sun for phase calculation
  // Replace these with actual precise coords from astronomia if needed

  // Create dummy Coord objects for moon and sun in radians and distances
  // For demonstration, these values would come from astronomia calculations for precise positions

  // Example dummy Coord object structure:
  // Coord = { ra: rightAscension, dec: declination, range: distance }

  // Using Earth's position as proxy for moon's range (not precise)
  const moonCoord = { ra: 0, dec: 0, range: 1 }; // Placeholder: Replace with astronomia moon equatorial coords
  const sunCoord = { ra: Math.PI, dec: 0, range: 1 }; // Placeholder: Replace with astronomia sun equatorial coords

  // Calculate phase angle (radians) between Moon and Sun
  const phaseAngle = phaseAngleEquatorial(moonCoord, sunCoord);

  // Calculate illuminated fraction of Moon's disk (0 to 1)
  const illuminatedFraction = base.illuminated(phaseAngle);

  // Rotate moon mesh slightly to simulate spinning
  moonMesh.rotation.y += 0.01;

  // For debugging: print illuminated fraction (Moon phase)
  console.log('Moon illumination fraction:', illuminatedFraction.toFixed(3));

  // Adjust Moon mesh brightness based on illumination
  moonMaterial.emissiveIntensity = 0.5 + illuminatedFraction; // brightens Moon when illuminated

  // Update comet tail particles positions to trail sun position (for fun)
  tailParticles.forEach((particle, i) => {
    particle.position.set(
      sun.position.x + (i * 3),
      sun.position.y,
      sun.position.z - (i * 4)
    );
  });

  // Update controls and camera clamp
  controls.update();
  clampCameraDistance();

  // Render the scene from camera perspective
  renderer.render(scene, camera);
}

// --------------------------- INITIALIZE CAMERA ---------------------------
camera.position.copy(cameraOffset);
controls.update();

// --------------------------- START ANIMATION ---------------------------
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

