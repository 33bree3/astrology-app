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
import moonData from './astronomia/src/moonposition.js';

// --------------------------- TEXTURE LOADING ---------------------------

const textureLoader = new THREE.TextureLoader();

textureLoader.load('./images/earth.cmap.jpg',
  (texture) => console.log('Earth texture loaded', texture),
  undefined,
  (err) => console.error('Error loading earth texture:', err)
);


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
  './images/space.right.jpg', // POSITIVE_X
  './images/space.left.jpg',  // NEGATIVE_X
  './images/space.up.jpg',    // POSITIVE_Y
  './images/space.down.jpg',  // NEGATIVE_Y
  './images/space.jpg',       // POSITIVE_Z (FRONT)
  './images/space2.jpg'       // NEGATIVE_Z (BACK)
];

const skyboxTexture = cubeLoader.load(
  skyboxUrls,
  () => {
    console.log('✅ Skybox loaded');
    // Optional: log sizes
    skyboxTexture.image.forEach((img, i) => {
      console.log(`Cube face ${i}: ${img.width} x ${img.height}`);
    });
  },
  undefined,
  (err) => {
    console.error('❌ Skybox load error:', err);
  }
);

skyboxTexture.magFilter = THREE.LinearFilter;
skyboxTexture.minFilter = THREE.LinearFilter;
skyboxTexture.wrapS = THREE.ClampToEdgeWrapping;
skyboxTexture.wrapT = THREE.ClampToEdgeWrapping;
skyboxTexture.generateMipmaps = false;


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
const sunLight = new THREE.PointLight(0xffffff, 333333333, 0, 2);


sunLight.castShadow = false;
sunLight.shadow.mapSize.width = 1000;
sunLight.shadow.mapSize.height = 1000;
scene.add(sunLight);

const lightHelper = new THREE.PointLightHelper(sunLight, 10);
scene.add(lightHelper);




// --------------------------- SUN SETUP ---------------------------


const sunRadius = 234;
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
  Mercury: { color: textureLoader.load('./planets/mercury.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Venus:   { color: textureLoader.load('./planets/venus.jpg'), bump: textureLoader.load('./images/venus.bump.jpg') },
  Earth:   { color: textureLoader.load('./planets/ earth.jpg'), bump: textureLoader.load('./images/earth.bump.jpg') },
  Mars:    { color: textureLoader.load('./planets/mars.jpg'), bump: textureLoader.load('./images/mars.bump.jpg') },
  Jupiter: { color: textureLoader.load('./planets/jupiter.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Saturn:  { color: textureLoader.load('./planets/saturn.jpg'), bump: textureLoader.load('./images/merc.bump.jpg') },
  Uranus:  { color: textureLoader.load('./planets/uranus.jpg'), bump: textureLoader.load('./images/pluto.bump.jpg') },
  Neptune: { color: textureLoader.load('./planets/neptune.jpg'), bump: textureLoader.load('./images/earth.bump.jpg') },
  
}

// mooooooooooooooooooooooooooooooooooooooon 

const moonTextures = {
  color: textureLoader.load('./planets/moon.cmap.jpg'),
  bump: textureLoader.load('./images/pluto.bump.jpg')
};


// --------------------------- PLANET DATA ---------------------------
const planets = [
  { name: 'Mercury', data: new Planet(mercuryData), radius: 1, planetSize: 69 },
  { name: 'Venus',   data: new Planet(venusData),   radius: 2, planetSize: 101 },
  { name: 'Earth',   data: new Planet(earthData),   radius: 3, planetSize: 123 },
  { name: 'Mars',    data: new Planet(marsData),    radius: 4, planetSize: 72 },
  { name: 'Jupiter', data: new Planet(jupiterData), radius: 5, planetSize: 279 },
  { name: 'Saturn',  data: new Planet(saturnData),  radius: 6, planetSize: 234 },
  { name: 'Uranus',  data: new Planet(uranusData),  radius: 7, planetSize: 201 },
  { name: 'Neptune', data: new Planet(neptuneData), radius: 8, planetSize: 154 },
   { name: 'Moon', data: new Planet(moonData), radius: 3, planetSize: 39 },
  
];

planets.forEach(p => {
  p.mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.planetSize, 32, 32),
    new THREE.MeshPhongMaterial({
      map: planetTextures[p.name].color,
      bumpMap: planetTextures[p.name].bump,
      bumpScale: 1,
      shininess: 7, // optional: tweak for different material effect
      specular: new THREE.Color(0x666666), // ensure specular highlights are visible
    emissive: new THREE.Color(0x000000)  // no glow — let lighting do the work
    })
  );
  p.mesh.castShadow = true;
  p.mesh.receiveShadow = true;
});



/////// MOOOOOOOOOOOOOOOON STUFFFFFFFFFFFF


const moonSize = 33; // Scaled moon size
const moonGeometry = new THREE.SphereGeometry(moonSize, 32, 32);
const moonMaterial = new THREE.MeshStandardMaterial({
  map: moonTexture,
  bumpMap: textureLoader.load('./planets/moon.jpg'),
  bumpScale: 1,
  metalness: 0.1,
  roughness: 1
});
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.receiveShadow = true;
moon.castShadow = false;
scene.add(moon);








// --------------------------- SOLAR SYSTEM GROUP ---------------------------


const solarSystem = new THREE.Group();
scene.add(solarSystem);
planets.forEach(p => solarSystem.add(p.mesh));

sun.position.set(0, 0, 0);        // make sure sun is centered
sunLight.position.copy(sun.position); // move the light to the Sun!





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


// Time counter for rotations

let t = 0;

function animate() {
  
  // Convert current date to Julian Date for astronomy calculations
  
  const jd = julian.DateToJD(new Date());

  // Ensure the entire solar system is centered at origin
  
  solarSystem.position.set(0, 0, 0);

  // Ensure sunLight is positioned at the sun's location
  
  sunLight.position.copy(sun.position); // 

  // Update each planet's position and rotation
  
  planets.forEach((p, i) => {
    // Get heliocentric coordinates for planet
    
    const pos = p.data.position2000(jd);
    const r = pos.range;
    const lon = pos.lon;
    const lat = pos.lat;

    // Scale and convert spherical coords to Cartesian 3D space
    
    const scaledR = Math.log(r + 1) * 1800;
    let orbitX = scaledR * Math.cos(lat) * Math.cos(lon);
    let orbitY = scaledR * Math.sin(lat);
    const orbitZ = scaledR * Math.cos(lat) * Math.sin(lon);

    // Neptune adjustment to fit visually
    
    if (p.name === 'Neptune') {
      orbitY += 150;
      orbitX -= 69;
    }

    // Set planet mesh position in space
    
    p.mesh.position.set(orbitX, orbitY, orbitZ);

    // Animate rotation of planet (arbitrary spin behavior)
    
    p.mesh.rotation.x += 0.09 + 0.03 * i;
    p.mesh.rotation.y = Math.sin(t * (0.5 + 0.002 * i)) * (0.05 + 0.01 * i);

    // Make planets face the sun + tilt like Earth
    
    p.mesh.lookAt(sun.position);
    p.mesh.rotateZ(THREE.MathUtils.degToRad(23.5)); // axial tilt
  });

//////// M0OOOOOOOOOOOOOOOOOOOONS DATA POSITIONS // ORBITTTT 

// ------------------ MOON POSITION ------------------

const moonData = moonposition.position(jd); // Geocentric (Earth-centered)
const moonRange = moonData.range * 6371; // Earth radii to km
const moonLon = moonData.lon;
const moonLat = moonData.lat;

// Find Earth position
const earth = planets.find(p => p.name === 'Earth');
if (earth) {
  const moonOffset = new THREE.Vector3(
    moonRange * Math.cos(moonLat) * Math.cos(moonLon),
    moonRange * Math.sin(moonLat),
    moonRange * Math.cos(moonLat) * Math.sin(moonLon)
  ).multiplyScalar(0.1); // Scaled down to match visual scale

  moon.position.copy(earth.mesh.position.clone().add(moonOffset));
  moon.rotation.y += 0.09; // Simple rotation
}



  
  // ------------------ COMET TAIL PARTICLES ------------------
  

  // Choose Earth as reference for tail direction
  
// Tail direction: From Sun to Earth, normalized
  

if (earth) {
  const tailDirection = new THREE.Vector3().subVectors(earth.mesh.position, sun.position).normalize();

  tailParticles.forEach((particle, idx) => {
    const distanceFromSun = (idx / tailParticlesCount) * tailLength;

    const jitter = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).multiplyScalar(1.2); // adjust for some glow/spread

    const pos = new THREE.Vector3()
      .copy(sun.position)
      .addScaledVector(tailDirection, distanceFromSun)
      .add(jitter);

    particle.position.copy(pos);
    particle.material.opacity = 0.3 * (1 - idx / tailParticlesCount);
    const scale = 100 * (1 - idx / tailParticlesCount);
    particle.scale.set(scale, scale, scale);
  });
}


  // ------------------ CAMERA AUTO-TRACKING ------------------

  // If the user isn't interacting, orbit around system
  if (!controls.userIsInteracting) {
    camera.position.copy(solarSystem.position).add(cameraOffset);
    controls.target.copy(solarSystem.position);
    controls.update();
  }

  // Render the scene from the current camera view
  renderer.render(scene, camera);

  // Increment time step
  t += 1;

  // Request the next animation frame
  requestAnimationFrame(animate);
}

// Start the animation loop
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

