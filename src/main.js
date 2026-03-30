import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

class Background {
  constructor(scene) {
    this.scene = scene;
    this.colors = [];
    this.shapes = [];
    this.time = 0;
    this.shapeCount = 12;
    
    const colors = [];
    for (let i = 0; i < 12; i++) {
      const hue = (i * 30) % 360;
      colors.push({
        baseColor: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
        secondaryColor: new THREE.Color(`hsl(${hue}, 100%, 75%)`),
        glowColor: new THREE.Color(`hsl(${hue}, 100%, 30%)`)
      });
    }
    this.colors = colors;
    
    this.initShapes();
  }
  
  initShapes() {
    const shapeTypes = ['cube', 'tetrahedron', 'octahedron', 'cone', 'sphere'];
    for (let i = 0; i < this.shapeCount; i++) {
      const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
      const shape = this.createShape(shapeType);
      shape.userData.type = shapeType;
      this.shapes.push(shape);
      this.scene.add(shape);
    }
  }
  
  createShape(type) {
    let geometry;
    switch (type) {
      case 'cube': geometry = new THREE.OctahedronGeometry(8, 0); break;
      case 'tetrahedron': geometry = new THREE.TetrahedronGeometry(8, 0); break;
      case 'octahedron': geometry = new THREE.OctahedronGeometry(8, 0); break;
      case 'cone': geometry = new THREE.ConeGeometry(5, 12, 8); break;
      case 'sphere': geometry = new THREE.IcosahedronGeometry(8, 0); break;
      default: geometry = new THREE.OctahedronGeometry(8, 0);
    }
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    const material = new THREE.MeshPhongMaterial({
      color: color.baseColor,
      specular: 0x555555,
      shininess: 30,
      transparent: true,
      opacity: 0.8
    });
    return new THREE.Mesh(geometry, material);
  }
  
  animate() {
    const now = Date.now() / 1000;
    this.time += 0.001;
    this.shapes.forEach((shape, index) => {
      shape.rotation.x = Math.sin(this.time + index) * 0.5 + 0.5;
      shape.rotation.y = Math.cos(this.time * 0.7 + index * 0.3) * 0.5 + 0.5;
      shape.rotation.z = Math.sin(this.time * 0.5 + index * 0.2) * 0.3;
      shape.position.y = Math.sin(this.time * 2 + index) * 5;
      shape.position.x = Math.cos(this.time * 1.5 + index * 0.5) * 10;
    });
  }
}

class Paddle {
  constructor(type, position, dimensions, color, scene) {
    this.type = type;
    this.position = { ...position };
    this.dimensions = { ...dimensions };
    this.velocity = { x: 0, y: 0 };
    this.color = color;
    this.mesh = null;
    this.targetY = position.y;
    this.isMoving = false;
    this.direction = 1;
    this.scene = scene;
    this.createMesh();
  }
  
  createMesh() {
    const geometry = new THREE.BoxGeometry(this.dimensions.width, this.dimensions.height, 2);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.3
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    if (this.scene) this.scene.add(this.mesh);
    
    const glowGeometry = new THREE.BoxGeometry(this.dimensions.width + 0.5, this.dimensions.height + 0.5, 2.5);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(this.mesh.position);
    if (this.scene) this.scene.add(glow);
    this.glowMesh = glow;
  }
  
  update() {
    if (this.isMoving) {
      this.position.y += this.velocity.y * 0.14;
      const minBound = 8 + this.dimensions.height / 2;
      const maxBound = 100 - 8 - this.dimensions.height / 2;
      this.position.y = Math.max(minBound, Math.min(maxBound, this.position.y));
    }
    this.mesh.position.copy(this.position);
    if (this.glowMesh) this.glowMesh.position.copy(this.mesh.position);
  }
  
  handleInput(input) {
    if (input.key === 'ArrowUp') {
      this.velocity.y = 1;
      this.direction = 1;
      this.isMoving = true;
    } else if (input.key === 'ArrowDown') {
      this.velocity.y = -1;
      this.direction = -1;
      this.isMoving = true;
    } else {
      this.velocity.y = 0;
      this.isMoving = false;
    }
  }
  
  moveTowards(targetY) {
    this.targetY = targetY;
    const distance = targetY - this.position.y;
    if (Math.abs(distance) > 1) {
      if (distance > 0) {
        this.velocity.y = Math.min(0.14, 0.14 * 0.5);
      } else {
        this.velocity.y = Math.max(-0.14, -0.14 * 0.5);
      }
      this.isMoving = true;
    } else {
      this.velocity.y = 0;
      this.isMoving = false;
    }
  }
}

class Ball {
  constructor(config) {
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.radius = config.radius;
    this.color = config.color;
    this.mesh = null;
    this.isMoving = false;
    this.speed = config.speed;
    this.createMesh();
  }
  
  createMesh() {
    const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.5
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    if (this.scene) this.scene.add(this.mesh);
    
    const glowGeometry = new THREE.SphereGeometry(this.radius + 0.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(this.mesh.position);
    if (this.scene) this.scene.add(glow);
    this.glowMesh = glow;
  }
  
  update() {
    if (!this.isMoving) return;
    this.position.x += this.velocity.x * this.speed;
    this.position.y += this.velocity.y * this.speed;
    this.mesh.position.copy(this.position);
    if (this.glowMesh) this.glowMesh.position.copy(this.mesh.position);
    
    const leftBound = -100 + this.radius;
    const rightBound = 100 - this.radius;
    const topBound = 50 - this.radius;
    const bottomBound = -50 + this.radius;
    
    if (this.position.x < leftBound) { this.position.x = leftBound; this.velocity.x *= -1; }
    if (this.position.x > rightBound) { this.position.x = rightBound; this.velocity.x *= -1; }
    if (this.position.y > topBound) { this.position.y = topBound; this.velocity.y *= -1; }
    if (this.position.y < bottomBound) { this.position.y = bottomBound; this.velocity.y *= -1; }
  }
  
  checkPaddleCollision(paddle) {
    const paddleTop = paddle.position.y + paddle.dimensions.height / 2;
    const paddleBottom = paddle.position.y - paddle.dimensions.height / 2;
    
    if (Math.abs(this.position.x - paddle.position.x) < this.radius + paddle.dimensions.width / 2) {
      if (this.position.y >= paddleBottom && this.position.y <= paddleTop) {
        const paddleCenter = paddle.position.y;
        const hitPoint = this.position.y - paddleCenter;
        const paddleHalfHeight = paddle.dimensions.height / 2;
        const normalizedHit = hitPoint / paddleHalfHeight;
        const maxAngle = Math.PI / 4;
        const newAngle = normalizedHit * maxAngle;
        
        this.velocity.x = Math.abs(this.velocity.x) * 1.1;
        this.velocity.y = -newAngle * 25;
        
        if (paddle.type === 'player') {
          this.velocity.x = Math.abs(this.velocity.x);
        } else {
          this.velocity.x = -Math.abs(this.velocity.x);
        }
        
        if (paddle.type === 'player') {
          this.position.x = paddle.position.x + paddle.dimensions.width / 2 + this.radius + 0.1;
        } else {
          this.position.x = paddle.position.x - paddle.dimensions.width / 2 - this.radius - 0.1;
        }
        return true;
      }
    }
    return false;
  }
  
  serve(direction) {
    this.isMoving = true;
    this.speed = 0.15;
    this.position = { x: 0, y: 50 - 12 / 2 - 5 };
    this.velocity = { x: direction * this.speed, y: (Math.random() * 0.2 - 0.1) };
    return this;
  }
}

class Score {
  constructor(config) {
    this.playerScore = 0;
    this.aiScore = 0;
    this.winningScore = config.winScore;
    this.createDisplays();
  }
  
  createDisplays() {
    const playerScoreDiv = document.createElement('div');
    playerScoreDiv.textContent = '0';
    playerScoreDiv.style.cssText = 'position: fixed; left: 20px; top: 50%; transform: translateY(-50%); font-size: 72px; font-weight: bold; color: #0ff; text-shadow: 0 0 20px #0ff, 0 0 40px #00f; font-family: Arial, sans-serif;';
    document.body.appendChild(playerScoreDiv);
    this.display = playerScoreDiv;
    
    const aiScoreDiv = document.createElement('div');
    aiScoreDiv.textContent = '0';
    aiScoreDiv.style.cssText = 'position: fixed; right: 20px; top: 50%; transform: translateY(-50%); font-size: 72px; font-weight: bold; color: #f0f; text-shadow: 0 0 20px #f0f, 0 0 40px #f00; font-family: Arial, sans-serif;';
    document.body.appendChild(aiScoreDiv);
    this.aiDisplay = aiScoreDiv;
  }
  
  update(playerScore, aiScore) {
    this.playerScore = playerScore;
    this.aiScore = aiScore;
    if (this.display) this.display.textContent = String(this.playerScore);
    if (this.aiDisplay) this.aiDisplay.textContent = String(this.aiScore);
  }
  
  checkWin() {
    return this.playerScore >= this.winningScore || this.aiScore >= this.winningScore;
  }
}

export function initGame(canvas) {
  const canvasElement = canvas || document.getElementById('gameCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: true });
  renderer.setSize(1024, 768);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, canvasElement.clientWidth / canvasElement.clientHeight, 0.1, 1000);
  camera.position.z = 150;
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(50, 50, 50);
  scene.add(directionalLight);
  const pointLight = new THREE.PointLight(0xffffff, 0.5, 200);
  scene.add(pointLight);
  
  const background = new Background(scene);
  
  const paddleConfig = { width: 3, height: 12, spacing: 8 };
  const paddlePosLeft = { x: -100 + paddleConfig.spacing, y: 0 };
  const paddlePosRight = { x: 100 - paddleConfig.spacing, y: 0 };
  
  const playerPaddle = new Paddle('player', paddlePosLeft, { width: paddleConfig.width, height: paddleConfig.height }, 0xff6600, scene);
  const aiPaddle = new Paddle('ai', paddlePosRight, { width: paddleConfig.width, height: paddleConfig.height }, 0xff6600, scene);
  
  const ball = new Ball({ radius: 0.3, speed: 0.15, maxSpeed: 0.4, color: 0xff6600 });
  ball.scene = scene;
  
  const score = new Score({ winScore: 7, servePlayer: true });
  
  let lastTime = 0;
  let isRunning = false;
  
  function loop() {
    if (!isRunning) return;
    
    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;
    
    ball.update();
    
    if (ball.checkPaddleCollision(playerPaddle)) {
      ball.speed = Math.min(ball.speed * 1.1, 0.4);
      playerPaddle.handleInput({ key: '' });
    }
    
    if (ball.checkPaddleCollision(aiPaddle)) {
      ball.speed = Math.min(ball.speed * 1.1, 0.4);
    }
    
    playerPaddle.update();
    aiPaddle.update();
    
    if (aiPaddle.type === 'ai' && ball.position.x >= 0) {
      const targetY = ball.position.y * 0.3 + (Math.random() - 0.5) * 5;
      aiPaddle.moveTowards(targetY);
    } else if (aiPaddle.type === 'ai' && ball.position.x < 0) {
      aiPaddle.moveTowards(aiPaddle.dimensions.height / 2);
    }
    
    if (ball.position.x <= -100) {
      score.aiScore++;
      score.update(score.playerScore, score.aiScore);
      if (score.checkWin()) {
        showGameOver('AI WINS! 🤖');
      } else {
        ball.serve(-1);
      }
    } else if (ball.position.x >= 100) {
      score.playerScore++;
      score.update(score.playerScore, score.aiScore);
      if (score.checkWin()) {
        showGameOver('YOU WIN! 🎉');
      } else {
        ball.serve(1);
      }
    }
    
    background.animate();
    renderer.render(scene, camera);
    
    requestAnimationFrame(loop);
  }
  
  function showGameOver(message) {
    isRunning = false;
    const gameOverDiv = document.createElement('div');
    gameOverDiv.textContent = message;
    gameOverDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 48px; font-weight: bold; color: #fff; text-shadow: 0 0 20px #fff; background: rgba(0,0,0,0.7); padding: 20px 40px; border-radius: 10px; z-index: 1000; text-align: center;';
    document.body.appendChild(gameOverDiv);
    
    gameOverDiv.addEventListener('click', () => {
      gameOverDiv.remove();
      isRunning = true;
      lastTime = performance.now();
      loop();
    });
  }
  
  document.addEventListener('keydown', (e) => {
    if (!ball.isMoving) return;
    if (e.key === 'ArrowUp') playerPaddle.handleInput({ key: 'ArrowUp' });
    else if (e.key === 'ArrowDown') playerPaddle.handleInput({ key: 'ArrowDown' });
    else if (e.key === ' ') {
      gameOverDiv?.remove();
      isRunning = true;
      ball.serve(1);
      lastTime = performance.now();
      loop();
    }
  });
  
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
  
  ball.serve(1);
  lastTime = performance.now();
  isRunning = true;
  loop();
  
  return { scene, camera, renderer, ball, playerPaddle, aiPaddle, score, background };
}

export { Background, Paddle, Ball, Score };