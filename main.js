// Shaders for Earth with day/night blending and specular highlights
const vertexShader = `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vViewPosition;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform sampler2D specularMap;
    uniform vec3 lightDirection;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vViewPosition;
    void main() {
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(lightDirection);
        float NdotL = max(dot(normal, lightDir), 0.0);
        vec4 dayColor = texture2D(dayTexture, vUv);
        vec4 nightColor = texture2D(nightTexture, vUv);
        float nightFactor = smoothstep(0.1, -0.1, dot(normal, lightDir));
        vec4 diffuseColor = mix(dayColor, nightColor, nightFactor);
        vec3 viewDir = normalize(-vViewPosition);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec4 specularColor = texture2D(specularMap, vUv) * spec * NdotL;
        gl_FragColor = diffuseColor + specularColor;
    }
`;

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1.5;
controls.maxDistance = 50;
camera.position.set(0, 0, 5);
controls.update();

// Simulation variables
let simulationTime = Date.now();
let timeMultiplier = 1;
let lastRealTime = Date.now();
const moonOrbitRadius = 5;
let cinematicMode = false;

// Load textures
const textureLoader = new THREE.TextureLoader();
const earthDayTexture = textureLoader.load(textureURLs.earthDay);
const earthNightTexture = textureLoader.load(textureURLs.earthNight);
const earthSpecularTexture = textureLoader.load(textureURLs.earthSpecular);
const cloudsTexture = textureLoader.load(textureURLs.clouds);
const moonTexture = textureLoader.load(textureURLs.moon);
const starsTexture = textureLoader.load(textureURLs.stars);

// Earth with custom shader
const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
const earthMaterial = new THREE.ShaderMaterial({
    uniforms: {
        dayTexture: { value: earthDayTexture },
        nightTexture: { value: earthNightTexture },
        specularMap: { value: earthSpecularTexture },
        lightDirection: { value: new THREE.Vector3() }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Clouds layer
const cloudsGeometry = new THREE.SphereGeometry(1.01, 64, 64);
const cloudsMaterial = new THREE.MeshPhongMaterial({
    map: cloudsTexture,
    transparent: true,
    opacity: 0.8
});
const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
scene.add(clouds);

// Moon
const moonGeometry = new THREE.SphereGeometry(0.27, 32, 32);
const moonMaterial = new THREE.MeshPhongMaterial({ map: moonTexture });
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
scene.add(moon);

// Moon orbit trail
const moonOrbitGeometry = new THREE.RingGeometry(moonOrbitRadius - 0.01, moonOrbitRadius + 0.01, 64);
const moonOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
const moonOrbit = new THREE.Line(moonOrbitGeometry, moonOrbitMaterial);
moonOrbit.rotation.x = Math.PI / 2;
scene.add(moonOrbit);
moonOrbit.visible = false;

// Satellites
const satelliteGeometry = new THREE.SphereGeometry(0.05, 16, 16);
const satelliteMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
const satellite1 = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
scene.add(satellite1);
const satOrbitRadius1 = 1.2;
let satAngle1 = 0;

// Satellite orbit trail
const satOrbitGeometry = new THREE.RingGeometry(satOrbitRadius1 - 0.01, satOrbitRadius1 + 0.01, 64);
const satOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
const satOrbit = new THREE.Line(satOrbitGeometry, satOrbitMaterial);
satOrbit.rotation.x = Math.PI / 2;
scene.add(satOrbit);
satOrbit.visible = false;

// Starfield
const starGeometry = new THREE.SphereGeometry(100, 32, 32);
const starMaterial = new THREE.MeshBasicMaterial({ map: starsTexture, side: THREE.BackSide });
const stars = new THREE.Mesh(starGeometry, starMaterial);
scene.add(stars);

// Sun light
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.target = earth;
scene.add(sunLight);

// Coordinate grid
const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x888888);
scene.add(gridHelper);
gridHelper.visible = false;

// Datetime picker
flatpickr('#datetime-picker', {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    time_24hr: true,
    defaultDate: new Date(),
    onChange: (selectedDates) => {
        simulationTime = selectedDates[0].getTime();
    }
});

// UI event listeners
document.getElementById('now-button').addEventListener('click', () => {
    simulationTime = Date.now();
});
document.getElementById('pause').addEventListener('click', () => timeMultiplier = 0);
document.getElementById('1x').addEventListener('click', () => timeMultiplier = 1);
document.getElementById('10x').addEventListener('click', () => timeMultiplier = 10);
document.getElementById('100x').addEventListener('click', () => timeMultiplier = 100);

document.getElementById('reset-view').addEventListener('click', () => {
    camera.position.set(0, 0, 5);
    controls.target.set(0, 0, 0);
    controls.update();
});

const cameraTargetSelect = document.getElementById('camera-target');
cameraTargetSelect.addEventListener('change', () => {
    const target = cameraTargetSelect.value;
    if (target === 'earth') controls.target.set(0, 0, 0);
    else if (target === 'moon') controls.target.copy(moon.position);
    else if (target === 'satellite1') controls.target.copy(satellite1.position);
    controls.update();
});

document.getElementById('cinematic-mode').addEventListener('change', (e) => {
    cinematicMode = e.target.checked;
});

// Customization panel with dat.GUI
const gui = new dat.GUI({ autoPlace: false });
document.body.appendChild(gui.domElement);
gui.domElement.style.position = 'absolute';
gui.domElement.style.top = '150px';
gui.domElement.style.right = '10px';

const layersFolder = gui.addFolder('Layers');
layersFolder.add(clouds, 'visible').name('Clouds');
layersFolder.add(satellite1, 'visible').name('Satellites');

const timeFolder = gui.addFolder('Time Control');
timeFolder.add({ timeSpeed: timeMultiplier }, 'timeSpeed', [0, 1, 10, 100]).name('Time Speed').onChange((value) => {
    timeMultiplier = value;
});

const visualsFolder = gui.addFolder('Visuals');
visualsFolder.add(moonOrbit, 'visible').name('Moon Orbit Trail');
visualsFolder.add(satOrbit, 'visible').name('Satellite Orbit Trail');
visualsFolder.add(gridHelper, 'visible').name('Coordinate Grid');

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update simulation time
    const now = Date.now();
    const realDelta = (now - lastRealTime) / 1000;
    simulationTime += realDelta * timeMultiplier * 1000;
    lastRealTime = now;

    // Sun position
    const dayOfYear = moment(simulationTime).utc().dayOfYear();
    const declination = 23.45 * Math.sin(2 * Math.PI * (dayOfYear - 81) / 365) * (Math.PI / 180);
    const siderealTime = (simulationTime % (86164.0905 * 1000)) / (86164.0905 * 1000) * 2 * Math.PI;
    const sunX = Math.cos(declination) * Math.cos(siderealTime);
    const sunZ = Math.cos(declination) * Math.sin(siderealTime);
    const sunY = Math.sin(declination);
    sunLight.position.set(sunX * 100, sunY * 100, sunZ * 100);
    earthMaterial.uniforms.lightDirection.value.copy(sunLight.position).normalize();

    // Earth rotation
    const rotationPerMs = (2 * Math.PI) / (24 * 3600 * 1000);
    earth.rotation.y = (simulationTime % (24 * 3600 * 1000)) * rotationPerMs;
    clouds.rotation.y = earth.rotation.y * 0.8; // Slower cloud movement

    // Moon position
    const lunarPeriod = 27.3 * 24 * 3600 * 1000;
    const moonAngle = (simulationTime % lunarPeriod) / lunarPeriod * 2 * Math.PI;
    moon.position.set(
        moonOrbitRadius * Math.cos(moonAngle),
        0,
        moonOrbitRadius * Math.sin(moonAngle)
    );

    // Satellite position
    satAngle1 += 0.01 * timeMultiplier;
    satellite1.position.set(
        satOrbitRadius1 * Math.cos(satAngle1),
        0,
        satOrbitRadius1 * Math.sin(satAngle1)
    );

    // Cinematic mode
    if (cinematicMode) {
        const angle = now * 0.0005;
        const radius = camera.position.distanceTo(controls.target);
        camera.position.set(
            controls.target.x + radius * Math.sin(angle),
            controls.target.y + radius * 0.5,
            controls.target.z + radius * Math.cos(angle)
        );
        camera.lookAt(controls.target);
    } else {
        controls.update();
    }

    // Update current time display
    document.getElementById('current-time').innerText = moment(simulationTime).utc().format('YYYY-MM-DD HH:mm:ss');

    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
