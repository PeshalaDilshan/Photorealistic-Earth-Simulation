// Textures from Solar System Scope (https://www.solarsystemscope.com/textures/)
// Distributed under Attribution 4.0 International license
// Please include attribution if you use these textures in your project.

const textureURLs = {
    earthDay: 'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
    earthNight: 'https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg',
    earthSpecular: 'https://www.solarsystemscope.com/textures/download/2k_earth_specular_map.jpg',
    clouds: 'https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg',
    moon: 'https://www.solarsystemscope.com/textures/download/2k_moon.jpg',
    stars: 'https://www.solarsystemscope.com/textures/download/2k_stars.jpg'
};

// Fallback textures (solid colors) if online textures fail
const fallbackTextures = {
    earthDay: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYGD4z8ABAALk/jG8AAAAAElFTkSuQmCC', // Blue
    earthNight: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgI6C7k9AAAAAElFTkSuQmCC', // Dark gray
    earthSpecular: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgI6C7k9AAAAAElFTkSuQmCC', // Dark gray
    clouds: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', // White
    moon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/D/HwAFBQIAYeF0/gAAAABJRU5ErkJggg==', // Light gray
    stars: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgI6C7k9AAAAAElFTkSuQmCC' // Dark gray
};
