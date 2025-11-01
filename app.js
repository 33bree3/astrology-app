import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

// ----------------------------------------------------  Imports from astronomia ---
import * as vsopEarth   from './astronomia/data/vsop87Bearth.js';
import * as vsopMars    from './astronomia/data/vsop87Bmars.js';
import * as vsopMercury from './astronomia/data/vsop87Bmercury.js';
import * as vsopVenus   from './astronomia/data/vsop87Bvenus.js';
import * as vsopJupiter from './astronomia/data/vsop87Bjupiter.js';
import * as vsopSaturn  from './astronomia/data/vsop87Bsaturn.js';
import * as vsopUranus  from './astronomia/data/vsop87Buranus.js';
import * as vsopNeptune from './astronomia/data/vsop87Bneptune.js';

// ---------------------------------------------------------- VSOP helper functions ----------
function vsopPosition(vsopModule, t) {
  const data = (vsopModule && (vsopModule.default || vsopModule)) || {};
  const Lset = data.L || {};
  const Bset = data.B || {};
  const Rset = data.R || {};

  const sumSeries = (series = []) =>
    Array.isArray(series)
      ? series.reduce((acc, [A, B, C]) => acc + A * Math.cos(B + C * t), 0)
      : 0;

  const accumulate = (setObj) =>
    Object.keys(setObj)
      .map(Number)
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b)
      .reduce((acc, n) => acc + sumSeries(setObj[n]) * t ** n, 0);

  const Lrad = accumulate(Lset);
  const Brad = accumulate(Bset);
  const Rval = accumulate(Rset);

  const Ldeg = ((Lrad * 180 / Math.PI) % 360 + 360) % 360;
  const Bdeg = Brad * 180 / Math.PI;

  return { Ldeg, Bdeg, R: Rval };
}

function heliocentricRect(vsopModule, t) {
  const p = vsopPosition(vsopModule, t);
  const L = p.Ldeg * Math.PI / 180;
  const B = p.Bdeg * Math.PI / 180;
  const R = p.R;
  const x = R * Math.cos(B) * Math.cos(L);
  const y = R * Math.cos(B) * Math.sin(L);
  const z = R * Math.sin(B);
  return { x, y, z };
}

function geocentricLongitude(vsopPlanetModule, vsopEarthModule, t) {
  const p = heliocentricRect(vsopPlanetModule, t);
  const e = heliocentricRect(vsopEarthModule, t);
  const x = p.x - e.x;
  const y = p.y - e.y;
  return ((Math.atan2(y, x) * 180 / Math.PI) % 360 + 360) % 360;
}

// ---------------------------------------------------------- PLANET MODULES ----------
const planetModules = {
  Mercury: vsopMercury, Venus: vsopVenus, Earth: vsopEarth, Mars: vsopMars,
  Jupiter: vsopJupiter, Saturn: vsopSaturn, Uranus: vsopUranus, Neptune: vsopNeptune
};


// ---------------------------------------------------------- DATE INPUT AND UPDATE ----------



// Ensure these IDs exist in your HTML
const dateInput = document.getElementById('dateInput'); // <input type="date" id="dateInput">
const calcButton = document.getElementById('calcButton'); // <button id="calcButton">

// ------------------ Set default date to today if input is empty
if (dateInput && !dateInput.value) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.value = `${yyyy}-${mm}-${dd}`;
}


// -------------------------------------------------------------------- Zodiac signs pos
const zodiacPositions = {
  Aries: 0, Taurus: 30, Gemini: 60, Cancer: 90, Leo: 120, Virgo: 150,
  Libra: 180, Scorpio: 210, Sag: 240, Capricorn: 270, Aquarius: 300, Pisces: 330
};


// ------------------ Convert longitude to zodiac sign
function longitudeToZodiac(lonDeg) {
  const signs = Object.entries(zodiacPositions); // zodiacPositions already defined
  let sign = 'Aries';
  for (const [name, start] of signs) {
    if (lonDeg >= start) sign = name;
    else break;
  }
  return sign;
}


// ------------------ Function to update planet longitudes

function updatePlanetLongitudes(selectedDate = null) {
  const date = selectedDate ? new Date(selectedDate) : new Date(dateInput?.value || new Date());
  const JD = 2451545.0 + (date - new Date('2000-01-01T12:00:00Z')) / 86400000;
  const t = (JD - 2451545.0) / 365250;

  const planetData = Object.entries(planetModules).map(([name, mod]) => {
    const lon = (name === "Earth") ? 0 : geocentricLongitude(mod, vsopEarth, t);
    const zodiac = longitudeToZodiac(lon);
    return { name, longitude: lon, zodiac };
  });

  const table = document.getElementById('planetTable');
  if (!table) return;
  table.innerHTML = '';
  planetData.forEach(p => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${p.name}</td><td>${(p.longitude || 0).toFixed(2)}°</td><td>${p.zodiac}</td>`;
    table.appendChild(row);
  });
}

// ------------------ Initial calculation for today
updatePlanetLongitudes();

// ------------------ Update on button click
if (calcButton) {
  calcButton.addEventListener('click', () => {
    const selectedDate = dateInput?.value; // format: "YYYY-MM-DD"
    if (selectedDate) updatePlanetLongitudes(selectedDate);
  });
}

// ----------------------------------- update in real-time if no date is selected
setInterval(() => {
  if (!dateInput?.value) updatePlanetLongitudes();
}, 1000);



// ------------------ Initial calculation for today
updatePlanetLongitudes();

// ------------------ Update on button click
if (calcButton) {
  calcButton.addEventListener('click', () => {
    const selectedDate = dateInput?.value; // format: "YYYY-MM-DD"
    if (selectedDate) updatePlanetLongitudes(selectedDate);
  });
}

// ------------------ Optional: update in real-time if no date is selected
setInterval(() => {
  if (!dateInput?.value) updatePlanetLongitudes();
}, 1000);


// ------------------------------------------------- initial calculation for today

updatePlanetLongitudes();

// -------------------------------------------------------- update on button click

if (calcButton) {
  calcButton.addEventListener('click', () => {
    const selectedDate = dateInput.value; // ------------------------ format: "YYYY-MM-DD"
    if (selectedDate) updatePlanetLongitudes(selectedDate);
  });
}

// ----------------------------------------------------- update in real time if no date is selected


setInterval(() => {
  // Only update if dateInput exists and no date is selected
  if (dateInput && !dateInput.value) {
    updatePlanetLongitudes();
  }
}, 1000);


// ------------------------------------------------------------   Tab logic
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ------------------------------------------------------------ Initialize Texture Loader

const textureLoader = new THREE.TextureLoader();








// ----------------------------------------------------------------------  PLANET SIZING CONSTANTS  AND SPEED ______________________





// ------------------------------------ RADIUS = 



const BASE_SCALE = 2222, PLANET_SIZE_MULTIPLIER = 3 , TIME_SPEED_FACTOR = 1, radius = 50000000000;
const degToRad = deg => deg * Math.PI / 180;





// ----------------------------------------------------   Orbital elements for each planet


const orbitalElementsData = {
  Mercury: { a: 0.5555, e: 0.2056, i: 0.36, o: 48.331, w: 29.124 },
  Venus: { a: 0.7777, e: 0.0068, i: 0.27, o: 76.680, w: 54.884 },
  Earth: { a: 1.1111, e: 0.0167, i: 0.00, o: 0.000, w: 114.207 },
  Mars: { a: 1.5555, e: 0.0934, i: 0.18, o: 49.558, w: 286.502 },
  Jupiter: { a: 2.0000, e: 0.0484, i: 0.15, o: 100.464, w: 273.867 },
  Saturn: { a: 2.5555, e: 0.0541, i: 0.24, o: 113.665, w: 339.392 },
  Uranus: { a: 3.1111, e: 0.0472, i: 0.09, o: 74.006, w: 96.998 },
  Neptune: { a: 3.5555, e: 0.0086, i: 0.18, o: 131.784, w: 272.846 }
};

// ------------------------------------------------------------------- Planet sizes in km


const planetSizes = { Mercury: 69, Venus: 101, Earth: 123, Mars: 72, Jupiter: 369, Saturn: 297, Uranus: 201, Neptune: 154 };



// ---------------------------- Load textures for zodiac signs

const zodiacTextures = {};
Object.keys(zodiacPositions).forEach(sign => {
  zodiacTextures[sign] = textureLoader.load(`constellations/${sign.toLowerCase()}.png`);
});
zodiacTextures['Sagittarius'] = textureLoader.load('constellations/sag.png');

// --------------------------------------------------- PLANET IMAGES
const planetTextures = {
  Mercury: textureLoader.load('planets/mercury.jpg'),
  Venus: textureLoader.load('planets/venus.jpg'),
  Earth: textureLoader.load('planets/earth.jpg'),
  Mars: textureLoader.load('planets/mars.jpg'),
  Jupiter: textureLoader.load('planets/jupiter.jpg'),
  Saturn: textureLoader.load('planets/saturn.jpg'),
  SaturnRings: textureLoader.load('planets/saturn.rings.png'),
  Uranus: textureLoader.load('planets/uranus.jpg'),
  Neptune: textureLoader.load('planets/neptune.jpg'),
  Sun: textureLoader.load('images/sun.cmap.jpg'),
  Asteroid: textureLoader.load('images/rock.png')
};

// ---------------------------------------------- Set up scene, camera, renderer
const canvas = document.getElementById('chartCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100000);
camera.position.set(0, 5000, 10000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// -------------------------------------------------- Lights
const pl = new THREE.PointLight(0xffffff, 2);
pl.position.set(0, 5000, 10000);
scene.add(pl);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));




// --------------------------------------------------------------------------------------SUN MESH ------



const sunGeometry = new THREE.SphereGeometry(888, 333, 333);
const sunMaterial = new THREE.MeshStandardMaterial({ map: planetTextures.Sun, emissive: 0xffff00, emissiveIntensity: 1 });
scene.add(new THREE.Mesh(sunGeometry, sunMaterial));






// ------------------------------------------------------------ Zodiac markers



const getZodiacPosition = angle => new THREE.Vector3(radius * Math.cos(degToRad(angle)), 0, radius * Math.sin(degToRad(angle)));

const zodiacMarkers = Object.entries(zodiacPositions).map(([sign, angle]) => {
  const spriteMaterial = new THREE.SpriteMaterial({
    map: zodiacTextures[sign],
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const marker = new THREE.Sprite(spriteMaterial);
  marker.position.copy(getZodiacPosition(angle));
  marker.scale.set(9999, 9999, 100);
  scene.add(marker);
  return marker;
});



// -------------------------------------------------------------------------------------------------------- Create planets


const planets = Object.keys(orbitalElementsData).map(name => {
  const geometry = new THREE.SphereGeometry(planetSizes[name] * PLANET_SIZE_MULTIPLIER, 32, 32);
  const material = new THREE.MeshStandardMaterial({ map: planetTextures[name] });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return { name, mesh };
});

// ---------------------------------------------------------------------------------- Orbit Lines
function createOrbitLine(el, segments = 256) {
  const points = [];
  const { a, e, i, o, w } = el;
  const b = a * Math.sqrt(1 - e * e);

  for (let t = 0; t <= 2 * Math.PI; t += (2 * Math.PI) / segments) {
    let x = a * (Math.cos(t) - e), y = b * Math.sin(t), z = 0;
    const cosO = Math.cos(o), sinO = Math.sin(o), cosI = Math.cos(i), sinI = Math.sin(i), cosW = Math.cos(w), sinW = Math.sin(w);

    let x1 = x * cosW - y * sinW, y1 = x * sinW + y * cosW, z1 = 0;
    let x2 = x1, y2 = y1 * cosI - z1 * sinI, z2 = y1 * sinI + z1 * cosI;
    let x3 = x2 * cosO - y2 * sinO, y3 = x2 * sinO + y2 * cosO, z3 = z2;

    points.push(new THREE.Vector3(x3, z3, y3).multiplyScalar(BASE_SCALE));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
}

Object.entries(orbitalElementsData).forEach(([name, el]) => scene.add(createOrbitLine(el)));






// 0------------------------------------------------------------------------------ Asteroid belts CREATION ----------------


function createAsteroidBelt(minRadius, maxRadius, count) {
  const positions = [];
  const sizes = [];
  const colors = [];

  for (let i = 0; i < count; i++) {
    const radius = Math.random() * (maxRadius - minRadius) + minRadius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    positions.push(x, y, z);
    sizes.push(Math.random() * 50 + 5);
    colors.push(Math.random(), Math.random(), Math.random());
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  particleGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 1,
    map: planetTextures.Asteroid,
    transparent: true,
    opacity: 0.8,
    vertexColors: true
  });

  return new THREE.Points(particleGeometry, particleMaterial);
}




//// ------------------------------------------------------------------------------ ASTEROID BELT SIZING ---------------------------


// --------------------------------------------------------------------- INNER , OUTER, DENSITY OF ASTEROIDS 





const innerAsteroidBelt = createAsteroidBelt(8888, 1212, 4444);
scene.add(innerAsteroidBelt);
const outerAsteroidBelt = createAsteroidBelt(55555, 77777, 1212);
scene.add(outerAsteroidBelt);






// --------------------------------------------------------------------------------- Animation Loop---------------------------------
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += TIME_SPEED_FACTOR;

  planets.forEach(p => {
    const { a, e, i, o, w } = orbitalElementsData[p.name];
    const M = (time / 1000 + a) % (2 * Math.PI);
    const E = M;
    const x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const cosO = Math.cos(o), sinO = Math.sin(o), cosI = Math.cos(i), sinI = Math.sin(i), cosW = Math.cos(w), sinW = Math.sin(w);
    let x1 = x * cosW - y * sinW, y1 = x * sinW + y * cosW, z1 = 0;
    let x2 = x1, y2 = y1 * cosI - z1 * sinI, z2 = y1 * sinI + z1 * cosI;
    let x3 = x2 * cosO - y2 * sinO, y3 = x2 * sinO + y2 * cosO, z3 = z2;
    p.mesh.position.set(x3, z3, y3).multiplyScalar(BASE_SCALE);
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

// ------------------------------------------------------------------------------- Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
});
