import julian from './astronomia/src/julian.js';
import base from './astronomia/src/base.js';
import solar from './astronomia/src/solar.js';
import nutation from './astronomia/src/nutation.js';
import { Planet } from './astronomia/src/planetposition.js';

// Planet data imports
import mercuryData from './astronomia/data/vsop87Bmercury.js';
import venusData from './astronomia/data/vsop87Bvenus.js';
import earthData from './astronomia/data/vsop87Bearth.js';
import marsData from './astronomia/data/vsop87Bmars.js';
import jupiterData from './astronomia/data/vsop87Bjupiter.js';
import saturnData from './astronomia/data/vsop87Bsaturn.js';
import uranusData from './astronomia/data/vsop87Buranus.js';
import neptuneData from './astronomia/data/vsop87Bneptune.js';
// Pluto omitted for now

// Canvas setup
const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');
const cx = canvas.width / 2;
const cy = canvas.height / 2;
const solarInfo = document.getElementById('solarInfo');
const planetTable = document.getElementById('planetTable');
const chartInfo = document.getElementById('chartInfo');

// Planet setup with colors and orbit radii
const planets = [
  { name: 'Mercury', data: new Planet(mercuryData), color: '#c0c0c0', radius: 200 },   // Gray/Silver
  { name: 'Venus',   data: new Planet(venusData),   color: '#f5deb3', radius: 234 },   // Wheat/Gold
  { name: 'Earth',   data: new Planet(earthData),   color: '#1e90ff', radius: 246 },  // Blue
  { name: 'Mars',    data: new Planet(marsData),    color: '#ff4500', radius: 279 },  // Red-Orange
  { name: 'Jupiter', data: new Planet(jupiterData), color: '#f4e2d8', radius: 355 },  // Beige
  { name: 'Saturn',  data: new Planet(saturnData),  color: '#deb887', radius: 387 },  // Light Brown
  { name: 'Uranus',  data: new Planet(uranusData),  color: '#7fffd4', radius: 393 },  // Aqua
  { name: 'Neptune', data: new Planet(neptuneData), color: '#4169e1', radius: 400 }   // Royal Blue
];

// Get current Julian Day
function getCurrentJD() {
  return julian.DateToJD(new Date());
}

// DRAW CIRCLE CHART MF 

function drawHeliocentricChart(jd) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Planet size map (for aesthetics)
  const sizeMap = {
    Mercury: 9,
    Venus: 15,
    Earth: 15,
    Mars: 12,
    Jupiter: 24,
    Saturn: 21,
    Uranus: 18,
    Neptune: 18,
  };

  // Draw Sun at center
  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
  ctx.fill();

  // Draw each planet's orbit and position
  for (const planet of planets) {
    const lon = planet.data.position(jd).lon; // radians
    const angle = lon;

    // Orbit circle
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.arc(cx, cy, planet.radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Planet position
    const x = cx + planet.radius * Math.cos(angle);
    const y = cy + planet.radius * Math.sin(angle);
    const size = sizeMap[planet.name] || 6;

    ctx.fillStyle = planet.color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
  }
}

  // Draw Sun at center
  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
  ctx.fill();

  // Draw each planet's orbit and position
  for (const planet of planets) {
    const lon = planet.data.position(jd).lon; // radians
    const angle = lon;

    // Orbit circle
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.arc(cx, cy, planet.radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Planet position on orbit
    const x = cx + planet.radius * Math.cos(angle);
    const y = cy + planet.radius * Math.sin(angle);
    ctx.fillStyle = planet.color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Label next to planet
    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.fillText(planet.name, x + 8, y);
  }
}

// Update solar info UI
function updateSolarInfo(jd) {
  const T = base.J2000Century(jd);
  const lon = solar.apparentLongitude(T);
  const ε = nutation.meanObliquity(jd);

  solarInfo.innerHTML = `
    <p><b>Solar Longitude:</b> ${(lon * 180 / Math.PI).toFixed(2)}°</p>
    <p><b>Mean Obliquity (ε):</b> ${(ε * 180 / Math.PI).toFixed(2)}°</p>
    <p><b>Sunrise:</b> 6:00 AM (placeholder)</p>
    <p><b>Sunset:</b> 8:00 PM (placeholder)</p>
    <p><b>Solar Noon:</b> 1:00 PM (placeholder)</p>
    <p><b>Next Equinox:</b> Sep 22, 2025 (placeholder)</p>
  `;
}

// Update planetary positions table
function updatePlanetTable(jd) {
  planetTable.innerHTML = '';
  for (const planet of planets) {
    const lon = planet.data.position(jd).lon;
    const degrees = (lon * 180 / Math.PI) % 360;
    const row = document.createElement('tr');
    row.innerHTML = `<td>${planet.name}</td><td>${degrees.toFixed(2)}</td>`;
    planetTable.appendChild(row);
  }
}

// Main animation loop
function animate() {
  const jd = getCurrentJD();
  drawHeliocentricChart(jd);
  updateSolarInfo(jd);
  updatePlanetTable(jd);
  chartInfo.textContent = 'Sun-centered planetary orbits';
  requestAnimationFrame(animate);
}

animate();

// Tab switching logic
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});
