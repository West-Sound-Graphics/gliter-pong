import * as THREE from 'three';

// DOM elements
const canvas = document.getElementById('game-canvas');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const startButton = document.getElementById('start-btn');
const playerScoreDisplay = document.getElementById('player-score-val');
const aiScoreDisplay = document.getElementById('ai-score-val');
const difficultySelect = document.getElementById('difficulty-select');

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

const discoColors = [0xff0040, 0x00f5d4, 0x7b2cbf, 0xff6b95, 0xffff00, 0x00aaff];
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
  new THREE.MeshBasicMaterial({ color: 0x1a1a2e })
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

// Disco geometric background elements
const discoGroup = new THREE.Group();
const geomColors = [0xff0040, 0x00f5d4, 0x7b2cbf, 0xff6b95, 0xffff00, 0x00aaff];
for (let i = 0; i < 30; i++) {
  const size = Math.random() * 0.3 + 0.15;
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshStandardMaterial({ 
      color: geomColors[i % geomColors.length], 
      emissive: geomColors[i % geomColors.length], 
      emissiveIntensity: 0.6, 
      transparent: true, 
      opacity: 0.65 
    })
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
  new THREE.MeshStandardMaterial({ 
    color: 0x00f5d4, 
    emissive: 0x00f5d4, 
    emissiveIntensity: 0.75,
    roughness: 0.2,
    metalness: 0.8
  })
);
const aiPaddle = new THREE.Mesh(
  new THREE.BoxGeometry(paddleWidth, paddleDepth, paddleHeight),
  new THREE.MeshStandardMaterial({ 
    color: 0xff0040, 
    emissive: 0xff0040, 
    emissiveIntensity: 0.75,
    roughness: 0.2,
    metalness: 0.8
  })
);
playerPaddle.position.set(-playField.width / 2 + 0.8, paddleDepth / 2, 0);
aiPaddle.position.set(playField.width / 2 - 0.8, paddleDepth / 2, 0);
scene.add(playerPaddle, aiPaddle);

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.17, 18, 18),
  new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    emissive: 0xffffff, 
    emissiveIntensity: 1.0,
    roughness: 0.1,
    metalness: 0.9
  })
);
ball.position.set(0, 0.22, 0);
scene.add(ball);

// Gameplay state
const GAME_STATE = {
  play: 'play',
  pause: 'pause',
  ready: 'ready',
  gameover: 'gameover'
};

const AI_DIFFICULTY = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
  impossible: 'impossible'
};

let gameState = GAME_STATE.play;
let playerScore = 0;
let aiScore = 0;
let ballSpeed = 1.0;
let ballSpeedFactor = 0.45;
let aiSpeedMultiplier = 0.12;
let currentServe = 1; // 1 = player serves, -1 = AI serves
let serveCount = 0;
let rallyCount = 0; // Tracks consecutive hits for speed increase
const maxScore = 7;

// Ball speed progression configuration
const BALL_SPEED_CONFIG = {
  initialSpeed: 0.45,
  speedIncrease: 0.03, // Increase per rally hit
  maxSpeedFactor: 2.5,
  speedIncreaseAfterRally: 5, // Increase speed every X successful rallies
};

// Difficulty configuration
let aiDifficulty = AI_DIFFICULTY.medium; // Default difficulty

// Apply difficulty from selector on load and change
function applyDifficulty() {
  aiDifficulty = difficultySelect.value;
  aiSpeedMultiplier = getAISpeedMultiplier();
}

// Apply difficulty on load
applyDifficulty();

// Update difficulty when selector changes
if (difficultySelect) {
  difficultySelect.addEventListener('change', applyDifficulty);
}

const input = {
  up: false,
  down: false,
};

function updateScore() {
  playerScoreDisplay.textContent = playerScore.toString();
  aiScoreDisplay.textContent = aiScore.toString();
}

function resetBall(serving) {
  ball.position.set(0, 0.22, 0);
  const speed = calculateBallSpeed();
  const angle = (Math.random() * Math.PI / 6) - Math.PI / 12;
  ballVelocity.set(serving * speed, 0, Math.sin(angle) * speed * 0.8);
  if (Math.random() > 0.5) ballVelocity.z *= -1;
  return serving;
}

function calculateBallSpeed() {
  return BALL_SPEED_CONFIG.initialSpeed * ballSpeed;
}

function switchServe() {
  currentServe = currentServe === 1 ? -1 : 1;
  serveCount++;
  resetBall(currentServe);
  return currentServe;
}

function handleReadyState() {
  if (gameState === 'ready') {
    overlay.classList.add('hidden');
    gameState = GAME_STATE.play;
    // Reset to center serve after ready state
    resetBall(currentServe);
    return true;
  }
  return false;
}

function pauseGame() {
  if (gameState === GAME_STATE.play) {
    gameState = GAME_STATE.pause;
    overlay.classList.remove('hidden');
    overlayTitle.textContent = 'PAUSED';
    overlayMessage.textContent = 'PRESS SPACE TO RESUME';
  }
}

function resumeGame() {
  if (gameState === GAME_STATE.pause) {
    overlay.classList.add('hidden');
    gameState = GAME_STATE.play;
  }
}

function startGame() {
  overlay.classList.remove('hidden');
  gameState = GAME_STATE.play;
}

function endGame(winner) {
  overlay.classList.add('hidden');
  gameState = GAME_STATE.gameover;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Get AI speed multiplier based on difficulty
function getAISpeedMultiplier() {
  switch (aiDifficulty) {
    case AI_DIFFICULTY.easy:
      return 0.08; // AI reacts slowly
    case AI_DIFFICULTY.medium:
      return 0.10; // Standard speed
    case AI_DIFFICULTY.hard:
      return 0.12; // Fast reaction
    case AI_DIFFICULTY.impossible:
      return 0.14; // Almost perfect tracking
    default:
      return 0.12;
  }
}

// Get current AI difficulty
function getAIDifficulty() {
  // Default to medium difficulty if none configured
  return aiDifficulty;
}

// AI target prediction
function predictBallPaddleSide() {
  // Predict which side the ball will hit based on its trajectory
  // Returns 'player' if ball will hit player paddle, 'ai' if ball will hit AI paddle
  if (ballVelocity.x > 0) {
    return 'player';
  } else {
    return 'ai';
  }
}

// Enhanced AI with target prediction and limited tracking
function updateAI() {
  if (gameState !== GAME_STATE.play) return;
  
  const targetZ = ball.position.z;
  const aiDirection = targetZ - aiPaddle.position.z;
  const baseSpeed = getAISpeedMultiplier();
  
  // Only move towards the ball if ball is coming towards AI
  if (ballVelocity.x < 0) {
    aiPaddle.position.z += clamp(aiDirection * baseSpeed, -baseSpeed, baseSpeed);
  } else if (ballVelocity.x > 0) {
    // Ball moving away, only move if ball is very close (defensive positioning)
    const distanceToBall = Math.abs(ball.position.z - aiPaddle.position.z);
    if (distanceToBall < 2.0) {
      // Move towards center as defensive position
      aiPaddle.position.z += clamp(-aiDirection * baseSpeed * 0.5, -baseSpeed, baseSpeed);
    }
  }
  
  aiPaddle.position.z = clamp(aiPaddle.position.z, -playField.height / 2 + paddleHeight / 2 + 0.25, playField.height / 2 - paddleHeight / 2 - 0.25);
}

function animate(time) {
  requestAnimationFrame(animate);
  
  if (gameState === GAME_STATE.play) {
    // Disco lights animate
    discoLights.forEach((light, idx) => {
      light.intensity = 1 + Math.sin(time * 0.002 + idx * 1.1) * 0.6;
      light.position.x = Math.sin(time * 0.001 + idx * Math.PI * 0.5) * 5;
      light.position.z = 5 + Math.cos(time * 0.001 + idx * Math.PI * 0.6) * 2;
    });
    
    // Move player paddle
    if (input.up) playerPaddle.position.z -= 0.12;
    if (input.down) playerPaddle.position.z += 0.12;
    playerPaddle.position.z = clamp(playerPaddle.position.z, -playField.height / 2 + paddleHeight / 2 + 0.25, playField.height / 2 - paddleHeight / 2 - 0.25);

    // Update AI
    updateAI();

    // Ball movement with speed progression
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
      const inX = Math.abs(dx) < paddleWidth + 0.2;
      const inZ = Math.abs(dz) < paddleHeight / 2 + 0.2;
      
      if (inX && inZ && ((side === 'left' && dx < 0) || (side === 'right' && dx > 0))) {
        const hitFactor = dz / (paddleHeight / 2);
        const outgoingX = (side === 'left' ? 1 : -1) * (0.5 + Math.abs(hitFactor) * 0.4);
        const outgoingZ = hitFactor * 0.6;

        // Increase speed on paddle hit with ball speed factor
        const currentSpeed = ballVelocity.length();
        ballVelocity.set(outgoingX * currentSpeed * 1.02, 0, outgoingZ * currentSpeed * 1.02);
        
        // Increase speed with rallies
        if (rallyCount >= BALL_SPEED_CONFIG.speedIncreaseAfterRally) {
          ballSpeed += 0.1;
          rallyCount = 0;
        }
        rallyCount++;
        
        // Ensure minimum ball speed
        if (currentSpeed < BALL_SPEED_CONFIG.initialSpeed * 0.9) {
          ballVelocity.normalize().multiplyScalar(BALL_SPEED_CONFIG.initialSpeed * ballSpeed);
        }
      }
    };

    checkPaddle(playerPaddle, 'left');
    checkPaddle(aiPaddle, 'right');

    // Score triggers
    if (ball.position.x < -playField.width / 2 - 0.3) {
      aiScore += 1;
      updateScore();
      
      // Check win condition first
      if (aiScore >= maxScore) {
        endGame('AI');
        return;
      }
      
      // Show ready state for serve
      overlay.classList.remove('hidden');
      overlayTitle.textContent = 'AI SCORES!';
      overlayMessage.textContent = 'PRESS SPACE FOR SERVE';
      gameState = GAME_STATE.ready;
      
      // Switch serve to player
      currentServe = 1;
      resetBall(1);
    }
    if (ball.position.x > playField.width / 2 + 0.3) {
      playerScore += 1;
      updateScore();
      
      // Check win condition first
      if (playerScore >= maxScore) {
        endGame('PLAYER');
        return;
      }
      
      // Show ready state for serve
      overlay.classList.remove('hidden');
      overlayTitle.textContent = 'PLAYER SCORES!';
      overlayMessage.textContent = 'PRESS SPACE FOR SERVE';
      gameState = GAME_STATE.ready;
      
      // Switch serve to AI
      currentServe = -1;
      resetBall(-1);
    }
  } else if (gameState === GAME_STATE.gameover && !overlay.classList.contains('hidden')) {
    // Show win message
    overlayTitle.textContent = `WINNER: ${gameState === GAME_STATE.gameover ? 'AI WINS!' : 'PLAYER WINS!'}\nGAME OVER`;
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
    
    if (gameState === GAME_STATE.play) {
      pauseGame();
    } else if (gameState === GAME_STATE.pause) {
      resumeGame();
    } else if (gameState === GAME_STATE.ready) {
      if (handleReadyState()) {
        overlay.classList.remove('hidden');
      }
    } else if (gameState === GAME_STATE.gameover) {
      // Reset game
      playerScore = 0;
      aiScore = 0;
      ballSpeed = 1.0;
      serveCount = 0;
      rallyCount = 0;
      ballSpeedFactor = BALL_SPEED_CONFIG.initialSpeed;
      updateScore();
      startGame();
      overlay.classList.add('hidden');
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
startGame();
animate();