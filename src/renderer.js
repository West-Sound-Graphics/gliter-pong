export const GameConfig = {
  canvas: {
    width: 1024,
    height: 768
  },
  game: {
    worldWidth: 200,
    worldHeight: 100,
    paddles: {
      width: 3,
      height: 12,
      spacing: 8
    },
    ball: {
      radius: 0.3,
      speed: 0.15,
      maxSpeed: 0.4,
      speedMultiplier: 1.1
    },
    ai: {
      speed: 0.14,
      reactionDelay: 0.02
    },
    scoring: {
      winScore: 7,
      servePlayer: true
    }
  },
  visual: {
    background: {
      geometricPattern: true,
      colorCount: 12
    },
    lighting: {
      ambientIntensity: 0.3,
      directionalIntensity: 0.6
    }
  }
};

export function generateRainbowColors(count) {
  const colors = [];
  const hueStep = 360 / count;
  
  for (let i = 0; i < count; i++) {
    const hue = (i * hueStep) % 360;
    colors.push({
      baseColor: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
      secondaryColor: new THREE.Color(`hsl(${hue}, 100%, 75%)`),
      glowColor: new THREE.Color(`hsl(${hue}, 100%, 30%)`)
    });
  }
  
  return colors;
}

export function setupScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a0a0a');
  
  const camera = new THREE.PerspectiveCamera(
    75,
    GameConfig.canvas.width / GameConfig.canvas.height,
    0.1,
    1000
  );
  camera.position.z = 150;
  
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true 
  });
  renderer.setSize(GameConfig.canvas.width, GameConfig.canvas.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  return { scene, camera, renderer };
}

export function setupLighting(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, GameConfig.visual.lighting.ambientIntensity);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, GameConfig.visual.lighting.directionalIntensity);
  directionalLight.position.set(50, 50, 50);
  scene.add(directionalLight);
  
  const pointLight = new THREE.PointLight(0xffffff, 0.5, 200);
  scene.add(pointLight);
  
  return { ambientLight, directionalLight, pointLight };
}

export function createMaterial(color, shininess = 50) {
  return new THREE.MeshStandardMaterial({
    color: color,
    shininess: shininess,
    roughness: 0.3,
    metalness: 0.2
  });
}

export function createGlowMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.3,
    roughness: 0.1,
    metalness: 0.8
  });
}