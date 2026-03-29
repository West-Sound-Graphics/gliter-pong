import * as THREE from 'three';

// DOM elements
const canvas = document.getElementById('game-canvas');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const startButton = document.getElementById('start-btn');
const playerScoreDisplay = document.getElementById('player-score-val');
const aiScoreDisplay = document.getElementById('ai-score-val');

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Camera placement
camera.position.set(0, 8, 18);
camera.lookAt(0, 0, 0);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
keyLight.position.set(1, 2, 2);
scene.add(ambientLight, keyLight);

const discoColors = [0xff0040, 0x00f5d4, 0x7b2cbf, 0xff6b95];
const discoLights = [];
for (let i = 0; i < 4; i++) {
  const color = discoColors[i];
  const light = new THREE.PointLight(color, 1.4, 25);
  light.position.set((i - 1.5) * 5, 10, 5);
  discoLights.push(light);
  scene.add(light);
}

// Playfield
const playField = { width: 14, height: 8, depth: 0.8 };
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.15, transparent: true });
const court = new THREE.Mesh(
  new THREE.PlaneGeometry(playField.width, playField.height),
  new THREE.MeshBasicMaterial({ color: 0x001f50, opacity: 0.54, transparent: true })
);
court.rotation.x = -Math.PI / 2;
court.position.set(0, 0, 0);
scene.add(court);

const borderGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-playField.width / 2, 0.01, -playField.height / 2),
  new THREE.Vector3(playField.width / 2, 0.01, -playField.height / 2),
  new THREE.Vector3(playField.width / 2, 0.01, playField.height / 2),
  new THREE.Vector3(-playField.width / 2, 0.01, playField.height / 2),
  new THREE.Vector3(-playField.width / 2, 0.01, -playField.height / 2)
]);
const border = new THREE.Line(borderGeometry, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }));
scene.add(border);

const centerLinePoints = [];
for (let i = -playField.height / 2 + 0.5; i <= playField.height / 2; i += 0.5) {
  centerLinePoints.push(new THREE.Vector3(0, 0.02, i));
  centerLinePoints.push(new THREE.Vector3(0, 0.02, i + 0.25));
}
const centerLine = new THREE.LineSegments(
  new THREE.BufferGeometry().setFromPoints(centerLinePoints),
  new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true })
);
scene.add(centerLine);

// Disco geometric background elements
const discoGroup = new THREE.Group();
const geomColors = [0xff0040, 0x00f5d4, 0x7b2cbf, 0xff6b95, 0xffff00, 0x00aaff];
for (let i = 0; i < 50; i++) {
  const size = Math.random() * 0.3 + 0.15;
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshStandardMaterial({ color: geomColors[i % geomColors.length], emissive: geomColors[i % geomColors.length], emissiveIntensity: 0.6, transparent: true, opacity: 0.65 })
  );
  const radius = Math.random() * 8 + 6;
  const angle = Math.random() * Math.PI * 2;
  box.position.set(Math.cos(angle) * radius, 0.26, Math.sin(angle) * radius);
  box.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  discoGroup.add(box);
}
scene.add(discoGroup);

// Paddles + ball
const paddleHeight = 1.75;
const paddleWidth = 0.3;
const paddleDepth = 0.15;

const playerPaddle = new THREE.Mesh(
  new THREE.BoxGeometry(paddleWidth, paddleDepth, paddleHeight),
  new THREE.MeshStandardMaterial({ color: 0x00f5d4, emissive: 0x00f5d4, emissiveIntensity: 0.75 })
);
const aiPaddle = new THREE.Mesh(
  new THREE.BoxGeometry(paddleWidth, paddleDepth, paddleHeight),
  new THREE.MeshStandardMaterial({ color: 0xff0040, emissive: 0xff0040, emissiveIntensity: 0.75 })
);
playerPaddle.position.set(-playField.width / 2 + 0.8, paddleDepth / 2, 0);
aiPaddle.position.set(playField.width / 2 - 0.8, paddleDepth / 2, 0);
scene.add(playerPaddle, aiPaddle);

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.17, 18, 18),
  new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0 })
);
ball.position.set(0, 0.22, 0);
scene.add(ball);

// Gameplay state
let gameState = 'start';
let playerScore = 0;
let aiScore = 0;
let ballVelocity = new THREE.Vector3(0.45, 0, 0.24);
const maxScore = 7;

const input = {
  up: false,
  down: false,
};

const gameSpeed = {
  paddle: 0.13,
  ai: 0.10,
  ball: 1.0
};

function setOverlay(title, message) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

startButton?.addEventListener('click', () => {
  if (gameState === 'start' || gameState === 'ready' || gameState === 'gameover' || gameState === 'pause') {
    startGame();
  }
});

function updateScore() {
  playerScoreDisplay.textContent = playerScore.toString();
  aiScoreDisplay.textContent = aiScore.toString();
}

function resetBall(serving = 1) {
  ball.position.set(0, 0.22, 0);
  const angle = (Math.random() * Math.PI / 6) - Math.PI / 12; // small launch angle
  const speed = 0.5 * gameSpeed.ball;
  ballVelocity.set(serving * speed, 0, Math.sin(angle) * speed * 0.8);
  if (Math.random() > 0.5) ballVelocity.z *= -1;
}

function setGameStart() {
  gameState = 'ready';
  setOverlay('PRESS SPACE TO START', 'USE ARROW KEYS TO MOVE YOUR PADDLE');
}

function startGame() {
  if (gameState === 'gameover') {
    playerScore = 0;
    aiScore = 0;
    updateScore();
  }
  resetBall(Math.random() > 0.5 ? 1 : -1);
  hideOverlay();
  gameState = 'play';
}

function pauseGame() {
  if (gameState === 'play') {
    gameState = 'pause';
    setOverlay('PAUSED', 'PRESS SPACE TO RESUME');
  }
}

function resumeGame() {
  if (gameState === 'pause') {
    hideOverlay();
    gameState = 'play';
  }
}

function endGame(winner) {
  gameState = 'gameover';
  setOverlay(`${winner.toUpperCase()} WINS!`, 'PRESS SPACE TO PLAY AGAIN');
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function animate(time) {
  requestAnimationFrame(animate);
  if (gameState === 'play') {
    // Move player paddle
    if (input.up) playerPaddle.position.z -= gameSpeed.paddle;
    if (input.down) playerPaddle.position.z += gameSpeed.paddle;
    playerPaddle.position.z = clamp(playerPaddle.position.z, -playField.height / 2 + paddleHeight / 2 + 0.25, playField.height / 2 - paddleHeight / 2 - 0.25);

    // Move AI paddle toward ball
    const targetZ = ball.position.z;
    const aiDirection = targetZ - aiPaddle.position.z;
    aiPaddle.position.z += clamp(aiDirection, -gameSpeed.ai, gameSpeed.ai);
    aiPaddle.position.z = clamp(aiPaddle.position.z, -playField.height / 2 + paddleHeight / 2 + 0.25, playField.height / 2 - paddleHeight / 2 - 0.25);

    // Ball movement
    ball.position.add(ballVelocity);

    // Top/bottom bounce
    const maxZ = playField.height / 2 - 0.2;
    if (ball.position.z > maxZ || ball.position.z < -maxZ) {
      ball.position.z = clamp(ball.position.z, -maxZ, maxZ);
      ballVelocity.z *= -1;
    }

    // Paddle collision
    const checkPaddle = (paddle, side) => {
      const dx = ball.position.x - paddle.position.x;
      const dz = ball.position.z - paddle.position.z;
      const inX = Math.abs(dx) < paddleWidth + 0.3;
      const inZ = Math.abs(dz) < paddleHeight / 2 + 0.2;
      if (inX && inZ && ((side === 'left' && dx < 0) || (side === 'right' && dx > 0))) {
        const hitFactor = dz / (paddleHeight / 2);
        const outgoingX = (side === 'left' ? 1 : -1) * (0.5 + Math.abs(hitFactor) * 0.3);
        const outgoingZ = hitFactor * 0.6;
        const speedIncrease = 1.04;

        ballVelocity.set(outgoingX * ballVelocity.length() * speedIncrease, 0, outgoingZ * ballVelocity.length() * speedIncrease);
        // Ensure minimum x speed
        if (Math.abs(ballVelocity.x) < 0.24) ballVelocity.x = (ballVelocity.x < 0 ? -1 : 1) * 0.24;
      }
    };

    checkPaddle(playerPaddle, 'left');
    checkPaddle(aiPaddle, 'right');

    // Score triggers
    if (ball.position.x < -playField.width / 2 - 0.3) {
      aiScore += 1;
      updateScore();
      if (aiScore >= maxScore) {
        endGame('AI');
      } else {
        setOverlay('AI SCORES', 'PRESS SPACE TO CONTINUE');
        gameState = 'ready';
      }
      resetBall(1);
    }
    if (ball.position.x > playField.width / 2 + 0.3) {
      playerScore += 1;
      updateScore();
      if (playerScore >= maxScore) {
        endGame('PLAYER');
      } else {
        setOverlay('PLAYER SCORES', 'PRESS SPACE TO CONTINUE');
        gameState = 'ready';
      }
      resetBall(-1);
    }

    // Disco lights animate
    discoLights.forEach((light, idx) => {
      light.intensity = 1 + Math.sin(time * 0.002 + idx * 1.1) * 0.6;
      light.position.x = Math.sin(time * 0.001 + idx * Math.PI * 0.5) * 5;
      light.position.z = 5 + Math.cos(time * 0.001 + idx * Math.PI * 0.6) * 2;
    });

    // Background geometric rotation
    discoGroup.rotation.y += 0.002;
  }

  renderer.render(scene, camera);
}

// Input handlers
window.addEventListener('keydown', (event) => {
  if (event.code === 'ArrowUp' || event.code === 'KeyW') {
    input.up = true;
  }
  if (event.code === 'ArrowDown' || event.code === 'KeyS') {
    input.down = true;
  }

  if (event.code === 'Space') {
    event.preventDefault();
    if (gameState === 'start' || gameState === 'ready' || gameState === 'gameover') {
      startGame();
    } else if (gameState === 'play') {
      pauseGame();
    } else if (gameState === 'pause') {
      resumeGame();
    }
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowUp' || event.code === 'KeyW') {
    input.up = false;
  }
  if (event.code === 'ArrowDown' || event.code === 'KeyS') {
    input.down = false;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize
updateScore();
setGameStart();
animate();
