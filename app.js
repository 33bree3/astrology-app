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

// ---------------------------------------------------------- COMPUTE VSOP POSITION ----------
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

// -------------------------------------- CONVERT HELIOCENTRIC (L,B,R) -> RECTANGULAR COORDS ----------
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

// --------------------------------------------- COMPUTE GEOCENTRIC ECLIPTIC LONGITUDE ----------
function geocentricLongitude(vsopPlanetModule, vsopEarthModule, t) {
  const p = heliocentricRect(vsopPlanetModule, t);
  const e = heliocentricRect(vsopEarthModule, t);

  const x = p.x - e.x;
  const y = p.y - e.y;

  const lonDeg = ((Math.atan2(y, x) * 180 / Math.PI) % 360 + 360) % 360;
  return lonDeg;
}

// ---------------------------------------------------------- PLANET MODULES ----------
const planetModules = {
  Mercury: vsopMercury, Venus: vsopVenus, Earth: vsopEarth, Mars: vsopMars,
  Jupiter: vsopJupiter, Saturn: vsopSaturn, Uranus: vsopUranus, Neptune: vsopNeptune
};

// -------------------------------------------- RENDER PLANET LONGITUDES IN TABLE (REAL TIME) ----------
const table = document.getElementById('planetTable');

function updatePlanetLongitudes() {
  const now = new Date();
  const JD = 2451545.0 + (now - new Date('2000-01-01T12:00:00Z')) / 86400000;
  const t = (JD - 2451545.0) / 365250;

  const planetData = Object.entries(planetModules).map(([name, mod]) => {
    const lon = (name === "Earth") ? 0 : geocentricLongitude(mod, vsopEarth, t);
    return { name, longitude: lon };
  });

  table.innerHTML = '';
  planetData.forEach(p => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${p.name}</td><td>${(p.longitude || 0).toFixed(2)}°</td>`;
    table.appendChild(row);
  });
}

// update every second

setInterval(updatePlanetLongitudes, 1000);

// ------------------ initial render

updatePlanetLongitudes();


// ------------------------------------------------------------   Tab logic


document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});


// ------------------------------------------ Tab switching


document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {

    
    // ------------------------------------------- update active button
    
    
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // -----------------------------------------------  show the matching section
    
    
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});


// ----------------------------------------- Initialize Texture Loader


const textureLoader = new THREE.TextureLoader();


// ------------------------------------------------------  Constants


const BASE_SCALE = 888, PLANET_SIZE_MULTIPLIER = 1, TIME_SPEED_FACTOR = 5, radius = 100000;

//  ------------------------------------------------------------------------- Convert degrees to radians

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



// -------------------------------------------------------------------- Zodiac signs and images

const zodiacPositions = {
  Aries: 0, Taurus: 30, Gemini: 60, Cancer: 90, Leo: 120, Virgo: 150,
  Libra: 180, Scorpio: 210, Sag: 240, Capricorn: 270, Aquarius: 300, Pisces: 330
};

// ---------------------------- ----------  ----- Load textures for zodiac signs (ensure paths are correct)

const zodiacTextures = {};
Object.keys(zodiacPositions).forEach(sign => {
  zodiacTextures[sign] = textureLoader.load(`constellations/${sign.toLowerCase()}.png`);
});
// ----------------------------------------------------------------- Ensure 'Sagittarius' texture is loaded

zodiacTextures['Sagittarius'] = textureLoader.load('constellations/sag.png'); // ------------------ Fix this path if necessary


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
  Asteroid: textureLoader.load('images/rock.png') // ------------------------ Texture for the asteroid particles
};


// ---------------------------------------------- --  Set up scene, camera, renderer


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


//  --------------------------------------------------   Lights


// ---------------------------------------------------- --- FIX POINT LIGHT CREATION ----------

const pl = new THREE.PointLight(0xffffff, 2);
pl.position.set(0, 5000, 10000);
scene.add(pl);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));



// Sun Mesh
const sunGeometry = new THREE.SphereGeometry(333, 33, 33);
const sunMaterial = new THREE.MeshStandardMaterial({ map: planetTextures.Sun, emissive: 0xffff00, emissiveIntensity: 1 });
scene.add(new THREE.Mesh(sunGeometry, sunMaterial));


// ------------------------------------------------------------ ----- Create zodiac marker using Sprite?

const getZodiacPosition = angle => new THREE.Vector3(radius * Math.cos(degToRad(angle)), 0, radius * Math.sin(degToRad(angle)));

const zodiacMarkers = Object.entries(zodiacPositions).map(([sign, angle]) => {
  const spriteMaterial = new THREE.SpriteMaterial({
    map: zodiacTextures[sign], // ----------------------------------------------------------- Make sure this texture is loaded correctly
    transparent: true,
    depthTest: false,  // -------------------------------------------------------------------------------- Prevent z-fighting
    depthWrite: false  // -------------------------------------------------------------------------------------Don't block other objects
  });

  const marker = new THREE.Sprite(spriteMaterial);
  marker.position.copy(getZodiacPosition(angle));

  // ---------------------------------------------------------- Adjust sprite size for visibility
  
  marker.scale.set(9999, 9999, 100);

  // ------------------------------------------- Add marker 
  
  scene.add(marker);

  return marker;
});



// --------------------------------------------------------------------------------------------------------    Create planets


const planets = Object.keys(orbitalElementsData).map(name => {
  const geometry = new THREE.SphereGeometry(planetSizes[name] * PLANET_SIZE_MULTIPLIER, 32, 32);
  const material = new THREE.MeshStandardMaterial({ map: planetTextures[name] });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return { name, mesh };
});

// ----------------------------------------------------------------------------------           Orbit Lines


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



// 0------------------------------------------------------------------------------ Function to create asteroid belts in spherical coordinates (3D)



function createAsteroidBelt(minRadius, maxRadius, count) {
  const positions = [];
  const sizes = [];
  const colors = [];

  for (let i = 0; i < count; i++) {
    // -----------------------------------------------------------------------------------    Random radius within the specified range
    const radius = Math.random() * (maxRadius - minRadius) + minRadius;

    // -----------------------------------------------------------------------          Random theta (azimuthal angle) from 0 to 2 * PI (full circle)
    const theta = Math.random() * Math.PI * 2;

    // -----------------------------------------------        Random phi (polar angle) from 0 to PI (full sphere)
    const phi = Math.random() * Math.PI;

    // ----------------------------------------------------- Convert to Cartesian coordinates (x, y, z) using spherical coordinates
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi); // ------------------------------- `y` is directly determined by `phi` (polar angle)
    const z = radius * Math.sin(phi) * Math.sin(theta);

    positions.push(x, y, z);
    sizes.push(Math.random() * 50 + 5); // ---------------------------------  Random size for each asteroid
    colors.push(Math.random(), Math.random(), Math.random()); //--------------------------  Random color for each asteroid
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

// -------------------------------------------------------  Inner asteroid belt (closer to the Sun)


const innerAsteroidBelt = createAsteroidBelt(1200, 2222, 1111); // ------  Min radius, max radius, and number of asteroids
scene.add(innerAsteroidBelt);

// -----------------------------------------------------------------------------  Outer asteroid belt (further out in the solar system)

const outerAsteroidBelt = createAsteroidBelt(15000, 21000, 8888); // ---- Different radius and more asteroids
scene.add(outerAsteroidBelt);



// ---------------------------------------------------------------------------------   Animation Loop

let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += TIME_SPEED_FACTOR;

  planets.forEach(p => {
    const { a, e, i, o, w } = orbitalElementsData[p.name];
    const M = (time / 1000 + a) % (2 * Math.PI);
    const E = M;  // ----------------------------------------------------------------------   Simplified for the example

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
