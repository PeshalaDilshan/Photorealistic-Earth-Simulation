// Textures from Solar System Scope (https://www.solarsystemscope.com/textures/)
// Distributed under Attribution 4.0 International license
// Please include attribution if you use these textures in your project.

// Debug: Log to confirm scripts are loaded
console.log('main.js loaded. textureURLs:', typeof textureURLs !== 'undefined' ? textureURLs : 'undefined');

// Define shaders for Earth
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
        vec4 diffuseColor = mix(nightColor, dayColor, NdotL);
        vec3 viewDir = normalize(vViewPosition);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec4 specularColor = texture2D(specularMap, vUv) * spec * NdotL;
        gl_FragColor = diffuseColor + specularColor;
    }
`;

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
const container = document.getElementById('container');
if (container) {
    container.appendChild(renderer.domElement);
    console.log('Renderer appended to container');
} else {
    console.error('Container div not found');
}

// Set up OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1.5;
controls.maxDistance = 50;
camera.position.set(0, 0, 5);
controls.update();

// Animation parameters
const earthRotationSpeed = 0.005;
const cloudRotationSpeed = 0.006;
const moonOrbitRadius = 5;
const moonOrbitSpeed = 0.001;
let moonAngle = 0;
const satOrbitRadius1 = 1.2;
const satOrbitRadius2 = 1.3;
const satOrbitRadius3 = 1.4;
let satAngle1 = 0;
let satAngle2 = Math.PI / 2;
let satAngle3 = Math.PI;
const satOrbitSpeed1 = 0.01;
const satOrbitSpeed2 = 0.015;
const satOrbitSpeed3 = 0.02;

// Load textures with error handling
let earth, earthMaterial, clouds; // Declare globally for animation
const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = function() {
    console.log('All textures loaded successfully');
    initializeScene();
};
loadingManager.onError = function(url) {
    console.error('Error loading texture:', url);
};
const textureLoader = new THREE.TextureLoader(loadingManager);

// Load textures with fallbacks
function loadTexture(key) {
    return new Promise((resolve) => {
        textureLoader.load(
            textureURLs[key],
            (texture) => {
                console.log(`Texture ${key} loaded:`, textureURLs[key]);
                resolve(texture);
            },
            undefined,
            () => {
                console.warn(`Failed to load ${key}, using fallback`);
                const fallbackTexture = new THREE.TextureLoader().load(fallbackTextures[key]);
                resolve(fallbackTexture);
            }
        );
    });
}

Promise.all([
    loadTexture('earthDay'),
    loadTexture('earthNight'),
    loadTexture('earthSpecular'),
    loadTexture('clouds'),
    loadTexture('moon'),
    loadTexture('stars')
]).then(([earthDayTexture, earthNightTexture, earthSpecularTexture, cloudsTexture, moonTexture, starsTexture]) => {
    // Initialize scene even if some textures used fallbacks
    console.log('Textures resolved, initializing scene');

    // Starfield
    const starGeometry = new THREE.SphereGeometry(100, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({ map: starsTexture, side: THREE.BackSide });
    const stars = new THREE.Mesh(starGeometry, starMaterial);
    scene.add(stars);

    // Earth
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
    earthMaterial = new THREE.ShaderMaterial({
        uniforms: {
            dayTexture: { value: earthDayTexture },
            nightTexture: { value: earthNightTexture },
            specularMap: { value: earthSpecularTexture },
            lightDirection: { value: new THREE.Vector3() }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Clouds
    const cloudsGeometry = new THREE.SphereGeometry(1.01, 64, 64);
    const cloudsMaterial = new THREE.MeshPhongMaterial({
        map: cloudsTexture,
        alphaMap: cloudsTexture,
        transparent: true,
        opacity: 0.8
    });
    clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    scene.add(clouds);

    // Moon
    const moonGeometry = new THREE.SphereGeometry(0.27, 32, 32);
    const moonMaterial = new THREE.MeshPhongMaterial({ map: moonTexture });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    scene.add(moon);
    moon.position.set(moonOrbitRadius, 0, 0);

    // Satellites
    const satelliteGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const satelliteMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
    const satellite1 = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
    const satellite2 = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
    const satellite3 = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
    scene.add(satellite1, satellite2, satellite3);
    satellite1.position.set(satOrbitRadius1, 0, 0);
    satellite2.position.set(0, 0, satOrbitRadius2);
    satellite3.position.set(-satOrbitRadius3, 0, 0);

    // Sun light
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 0, 0);
    scene.add(sunLight);

    // Start animation
    animate();
}).catch((error) => {
    console.error('Error initializing textures:', error);
    // Fallback: Render a basic sphere
    const fallbackGeometry = new THREE.SphereGeometry(1, 32, 32);
    const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const fallbackEarth = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    scene.add(fallbackEarth);
    earth = fallbackEarth; // For rotation in animate
    animate();
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (earth) earth.rotation.y += earthRotationSpeed;
    if (clouds) clouds.rotation.y += cloudRotationSpeed;

    moonAngle += moonOrbitSpeed;
    moon.position.set(
        moonOrbitRadius * Math.cos(moonAngle),
        0,
        moonOrbitRadius * Math.sin(moonAngle)
    );

    satAngle1 += satOrbitSpeed1;
    satAngle2 += satOrbitSpeed2;
    satAngle3 += satOrbitSpeed3;
    satellite1.position.set(
        satOrbitRadius1 * Math.cos(satAngle1),
        0,
        satOrbitRadius1 * Math.sin(satAngle1)
    );
    satellite2.position.set(
        satOrbitRadius2 * Math.cos(satAngle2),
        0,
        satOrbitRadius2 * Math.sin(satAngle2)
    );
    satellite3.position.set(
        satOrbitRadius3 * Math.cos(satAngle3),
        0,
        satOrbitRadius3 * Math.sin(satAngle3)
    );

    if (earthMaterial) {
        const lightDirWorld = new THREE.Vector3(-1, 0, 0);
        const viewMatrix = camera.matrixWorldInverse;
        const rotationMatrix = new THREE.Matrix3().setFromMatrix4(viewMatrix);
        const lightDirView = lightDirWorld.clone().applyMatrix3(rotationMatrix);
        earthMaterial.uniforms.lightDirection.value = lightDirView;
    }

    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
    // Orbit Moon
    moonAngle += moonOrbitSpeed;
    moon.position.set(
        moonOrbitRadius * Math.cos(moonAngle),
        0,
        moonOrbitRadius * Math.sin(moonAngle)
    );

    // Orbit satellites
    satAngle1 += satOrbitSpeed1;
    satAngle2 += satOrbitSpeed2;
    satAngle3 += satOrbitSpeed3;
    satellite1.position.set(
        satOrbitRadius1 * Math.cos(satAngle1),
        0,
        satOrbitRadius1 * Math.sin(satAngle1)
    );
    satellite2.position.set(
        satOrbitRadius2 * Math.cos(satAngle2),
        0,
        satOrbitRadius2 * Math.sin(satAngle2)
    );
    satellite3.position.set(
        satOrbitRadius3 * Math.cos(satAngle3),
        0,
        satOrbitRadius3 * Math.sin(satAngle3)
    );

    // Update light direction for Earth shader
    const lightDirWorld = new THREE.Vector3(-1, 0, 0);
    const viewMatrix = camera.matrixWorldInverse;
    const rotationMatrix = new THREE.Matrix3().setFromMatrix4(viewMatrix);
    const lightDirView = lightDirWorld.clone().applyMatrix3(rotationMatrix);
    earthMaterial.uniforms.lightDirection.value = lightDirView;

    // Update controls and render
    controls.update();
    renderer.render(scene, camera);
}
