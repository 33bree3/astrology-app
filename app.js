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

// --- TEXTURE LOADER ----------------------------------------------


const textureLoader = new THREE.TextureLoader();



const canvas = document.getElementById('chartCanvas');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// SETTING DA SCENEE BACKGROUND SKY BOX CREATION -----------------------------

const scene = new THREE.Scene();

//  Add space skybox as cube map background--------------------------

const cubeLoader = new THREE.CubeTextureLoader();
const skyboxTexture = cubeLoader.load([
  './images/space.right.jpg', // right
  './images/space.left.jpg', // left
  './images/space.up.jpg', // top
  './images/space.down.jpg', // bottom
  './images/space2.jpg', // front
  './images/space.jpg', // back
]);
scene.background = skyboxTexture;

// camera set uppppppppppp-------------------------------------------

const camera = new THREE.PerspectiveCamera(123, canvas.clientWidth / canvas.clientHeight, 0.1, 5000);
const cameraOffset = new THREE.Vector3(300, 400, 500);

const controls = new OrbitControls(camera, canvas);
controls.enableZoom = true;
controls.minDistance = 100;
controls.maxDistance = 1000;
controls.maxPolarAngle = Math.PI / 2;
controls.enablePan = true;
controls.panSpeed = 0.5;

function clampCameraDistance() {
  const minDistance = 100;
  const maxDistance = 500;
  const distance = camera.position.distanceTo(solarSystem.position);
  if (distance < minDistance) {
    const direction = camera.position.clone().sub(solarSystem.position).normalize();
    camera.position.copy(solarSystem.position).add(direction.multiplyScalar(minDistance));
  } else if (distance > maxDistance) {
    const direction = camera.position.clone().sub(solarSystem.position).normalize();
    camera.position.copy(solarSystem.position).add(direction.multiplyScalar(maxDistance));
  }
}

controls.addEventListener('change', clampCameraDistance);

const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 1.5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1000 ;
sunLight.shadow.mapSize.height = 1000  ;
scene.add(sunLight);

// SUN SET UPPPPP ------------------------------------------------------------------------

const sunRadius = 69; // increased sun size for better scale
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);

const sunTexture = textureLoader.load('./images/sun.cmap.jpg');

const sunMaterial = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissive: new THREE.Color(0xffffaa),
  emissiveIntensity: 2,
});


const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.castShadow = false;
sun.receiveShadow = false;

// Comet tail setup omitted here for brevity (----------------------------------

const tailLength = 333;
const tailParticlesCount = 333;
const tailParticles = [];
const tailTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');

for (let i = 0; i < tailParticlesCount; i++) {
  const tailMaterial = new THREE.SpriteMaterial({
    map: tailTexture,
    color: 0xffcc00,
    transparent: true,
    opacity: 0.3 * (1 - i / tailParticlesCount),
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(tailMaterial);
  sprite.scale.set(21, 30, 1);
  scene.add(sprite);
  tailParticles.push(sprite);
}


// Map planet names to their color and bump map textures
const planetTextures = {
  Mercury: {
    color: textureLoader.load('./images/merc.cmap.jpg'),
    bump: textureLoader.load('./images/merc.bump.jpg'),
  },
  Venus: {
    color: textureLoader.load('./images/venus.cmap.jpg'),
    bump: textureLoader.load('./images/venus.bump.jpg'),
  },
  Earth: {
    color: textureLoader.load('./images/earth.cmap.jpg'),
    bump: textureLoader.load('./images/earth.bump.jpg'),
  },
  Mars: {
    color: textureLoader.load('./images/mars.cmap.jpg'),
    bump: textureLoader.load('./images/mars.bump.jpg'),
  },
  Jupiter: {
    color: textureLoader.load('./images/jupiter.cmap.jpg'),
    bump: textureLoader.load('./images/merc.bump.jpg'),
  },
  Saturn: {
    color: textureLoader.load('./images/saturn.cmap.jpg'),
    bump: textureLoader.load('./images/saturn.ring.jpg'),
  },
  Uranus: {
    color: textureLoader.load('./images/uranus.cmap.jpg'),
    bump: textureLoader.load('./images/uranus.ring.bump.jpg'),
  },
  Neptune: {
    color: textureLoader.load('./images/neptune.cmap.jpg'),
    bump: textureLoader.load('./images/earth.bump.jpg'),
  },
};

const scaleFactor = 0.1;

const planets = [
  { name: 'Mercury', data: new Planet(mercuryData), radius: 603 *scaleFactor, planetSize: 9 },
  { name: 'Venus',   data: new Planet(venusData),   radius: 699* scaleFactor, planetSize: 15 },
  { name: 'Earth',   data: new Planet(earthData),   radius: 793 * scaleFactor, planetSize: 18 },
  { name: 'Mars',    data: new Planet(marsData),    radius: 872 * scaleFactor, planetSize: 12 },
  { name: 'Jupiter', data: new Planet(jupiterData), radius: 939 * scaleFactor, planetSize: 30 },
  { name: 'Saturn',  data: new Planet(saturnData),  radius: 1212* scaleFactor, planetSize: 27 },
  { name: 'Uranus',  data: new Planet(uranusData),  radius: 1313 * scaleFactor, planetSize: 24 },
  { name: 'Neptune', data: new Planet(neptuneData), radius: 1414 * scaleFactor, planetSize: 21 },
];

// Create PLANET meshes with color and bump maps applied

planets.forEach(p => {
  p.mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.planetSize, 32, 32),
    new THREE.MeshStandardMaterial({
      map: planetTextures[p.name].color,  // Color texture
      bumpMap: planetTextures[p.name].bump, // Bump texture
      bumpScale: 0.1,                      // Bump effect strength (tweak if needed) - hEIGHT MAP  // soft glow
                           // specular highlight sharpness

    })
  );
  p.mesh.castShadow = true;
  p.mesh.receiveShadow = true;
});

// Group and add to scene
const solarSystem = new THREE.Group();
solarSystem.add(sun);
planets.forEach(p => solarSystem.add(p.mesh));
scene.add(solarSystem);

let t = 0;

// ANIMATION FUNCTION ------------------------
function animate() {
  
  // Convert current date to Julian Date for accurate planet positions
  
  const jd = julian.DateToJD(new Date());

  // Vector from sun to solar system for use in tail positioning
  
  const tailDirection = new THREE.Vector3()
    .subVectors(solarSystem.position, sun.position)
    .normalize();

  // Update each planet's orbital position and self-rotation
  
 planets.forEach((p, i) => {
  const pos = p.data.position(julian.DateToJD(new Date()));
  const baseAngle = pos.lon;
  const orbitalSpin = t * 0.003 * (1.2 + i * 0.3);
  const angleOffset = i * 0.5;
  const angle = baseAngle + orbitalSpin + angleOffset;

  const r = p.radius;
  const x = r * Math.cos(angle);
  const y = r * Math.sin(angle);

  // Depth stagger: farther planets trail more in Z-axis
  const zOffset = -r * 0.05;
  p.mesh.position.set(x, y, solarSystem.position.z + zOffset);

  // Planet self-spin
  p.mesh.rotation.x += 0.01 + 0.001 * i;

  const wobbleAmplitude = 1 + 0.01 * i;
  const wobbleSpeed = 1 + 0.001 * i;
  p.mesh.rotation.y = Math.sin(t * wobbleSpeed) * wobbleAmplitude;
});

  
  // ---- HELICAL SYSTEM MOTION ----
  
  const helixRadius = 3;
  const helixFrequency = 0.03;
  const helixX = helixRadius * Math.cos(t * helixFrequency);
  const helixY = helixRadius * Math.sin(t * helixFrequency);
  const helixZ = t * 0.03;

  // Move entire solar system in a helix path
  
  solarSystem.position.set(helixX, helixY, helixZ);
  sunLight.position.copy(solarSystem.position); // Keep light centered on system

  // ---- COMET TAIL PARTICLES ----
  
  const velocity = new THREE.Vector3(
    -helixRadius * helixFrequency * Math.sin(t * helixFrequency),
    helixRadius * helixFrequency * Math.cos(t * helixFrequency),
    0.8 // slight Z incline for 3D realism
  ).normalize();

  tailParticles.forEach((particle, idx) => {
    const distanceBehind = (idx / tailParticlesCount) * tailLength;

    // Add jitter/curve to tail path
    
    const jitter = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).multiplyScalar(0.3);

    // Position particle behind solar system center
    
    const pos = new THREE.Vector3()
      .copy(solarSystem.position)
      .addScaledVector(tailDirection, -distanceBehind)
      .add(jitter);

    // Set particle visual properties
    
    particle.position.copy(pos);
    particle.material.opacity = 0.3 * (1 - idx / tailParticlesCount);

    const scale = 100 * (1 - idx / tailParticlesCount);
    particle.scale.set(scale, scale, scale);
  });

  // ---- CAMERA AUTO-FOLLOW ----
  
  if (!controls.userIsInteracting) {
    camera.position.copy(solarSystem.position).add(cameraOffset);
    controls.target.copy(solarSystem.position);
    controls.update();
  }

  // ---- RENDER SCENE ----
  
  renderer.render(scene, camera);
  t += 1;
  requestAnimationFrame(animate);
}

// ---- CAMERA CONTROL EVENT HOOKS ----

controls.userIsInteracting = false;
controls.addEventListener('start', () => { controls.userIsInteracting = true; });
controls.addEventListener('end', () => { controls.userIsInteracting = false; });

animate();

// UI tab switching (unchanged)

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});
