import { GameConfig, setupScene, setupLighting } from './renderer.js';
import { Ball } from './ball.js';
import { Paddle } from './paddle.js';
import { Score } from './score.js';
import { Background } from './background.js';

export class Game {
  constructor(scene) {
    this.scene = scene;
    this.camera = null;
    this.renderer = null;
    this.background = null;
    this.playerPaddle = null;
    this.aiPaddle = null;
    this.ball = null;
    this.score = null;
    this.isRunning = false;
    this.lastTime = 0;
    
    this.init();
  }
  
  init() {
    // Setup lighting
    setupLighting(this.scene);
    
    // Create background
    this.background = new Background(this.scene);
    
    // Create paddles
    const paddleConfig = GameConfig.game.paddles;
    const paddlePosLeft = { 
      x: -GameConfig.game.worldWidth / 2 + paddleConfig.spacing,
      y: 0 
    };
    const paddlePosRight = { 
      x: GameConfig.game.worldWidth / 2 - paddleConfig.spacing,
      y: 0 
    };
    
    this.playerPaddle = new Paddle('player', paddlePosLeft, {
      width: paddleConfig.width,
      height: paddleConfig.height
    }, this.scene);
    
    this.aiPaddle = new Paddle('ai', paddlePosRight, {
      width: paddleConfig.width,
      height: paddleConfig.height
    }, this.scene);
    
    // Create ball
    const ballConfig = GameConfig.game.ball;
    
    this.ball = new Ball({
      radius: ballConfig.radius,
      speed: ballConfig.speed,
      maxSpeed: ballConfig.maxSpeed,
      color: 0xff6600,
      scene: this.scene
    });
    
    // Create score display
    this.score = new Score({
      winScore: GameConfig.game.scoring.winScore,
      servePlayer: GameConfig.game.scoring.servePlayer
    }, this.scene);
    
    this.isRunning = false;
  }
  
  start() {
    this.isRunning = true;
    this.ball.serve(GameConfig.game.scoring.servePlayer ? 1 : -1);
    this.lastTime = performance.now();
    this.loop();
  }
  
  loop() {
    if (!this.isRunning) return;
    
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    
    // Update ball
    this.ball.update(delta);
    
    // Check paddle collisions
    const ball = this.ball;
    const playerPaddle = this.playerPaddle;
    const aiPaddle = this.aiPaddle;
    
    // Check player paddle collision
    if (ball.checkPaddleCollision(playerPaddle)) {
      // Increase speed and change color on paddle hit
      ball.speed = Math.min(ball.speed * GameConfig.ball.speedMultiplier, GameConfig.ball.maxSpeed);
      
      // Update colors
      this.updateColors();
    }
    
    // Check AI paddle collision
    if (ball.checkPaddleCollision(aiPaddle)) {
      // Increase speed
      ball.speed = Math.min(ball.speed * GameConfig.ball.speedMultiplier, GameConfig.ball.maxSpeed);
      this.updateColors();
    }
    
    // Update paddles
    playerPaddle.update(delta);
    aiPaddle.update(delta);
    
    // AI movement
    if (aiPaddle.type === 'ai') {
      const ballY = ball.position.y;
      
      // Only react when ball is on AI side
      if (ball.position.x >= 0) {
        // Target Y with some offset for difficulty
        const targetY = ballY * 0.3 + (Math.random() - 0.5) * 5;
        aiPaddle.moveTowards(targetY);
      } else {
        // Return to center when ball is on other side
        aiPaddle.moveTowards(aiPaddle.dimensions.height / 2);
      }
    }
    
    // Check score
    if (ball.position.x <= -GameConfig.game.worldWidth / 2) {
      // AI scored
      this.handleScore('ai');
    } else if (ball.position.x >= GameConfig.game.worldWidth / 2) {
      // Player scored
      this.handleScore('player');
    }
    
    // Update background
    this.background.animate();
    
    // Render
    this.renderer.render(this.scene, this.camera);
    
    requestAnimationFrame(() => this.loop());
  }
  
  updateColors() {
    const ball = this.ball;
    
    // Update ball color
    const hue = Date.now() / 10000;
    ball.mesh.material.color.setHSL((hue + 2) % 1, 1, 0.5);
    ball.glowMesh.material.color.setHSL((hue + 2) % 1, 1, 0.2);
    
    // Update paddle colors
    this.playerPaddle.mesh.material.color.setHSL((hue + 0.5) % 1, 1, 0.6);
    this.aiPaddle.mesh.material.color.setHSL((hue + 0.2) % 1, 1, 0.6);
    
    // Update glow effects
    if (this.playerPaddle.glowMesh) {
      this.playerPaddle.glowMesh.material.color.setHSL((hue + 0.5) % 1, 1, 0.3);
    }
    if (this.aiPaddle.glowMesh) {
      this.aiPaddle.glowMesh.material.color.setHSL((hue + 0.2) % 1, 1, 0.3);
    }
  }
  
  handleScore(scoringPaddle) {
    if (scoringPaddle === 'player') {
      this.score.playerScore++;
    } else {
      this.score.aiScore++;
    }
    
    this.score.update(this.score.playerScore, this.score.aiScore);
    
    // Check win condition
    if (this.score.checkWin()) {
      this.end();
    } else {
      // Reset ball
      const serveDirection = scoringPaddle === 'player' ? 1 : -1;
      this.ball.serve(serveDirection);
    }
  }
  
  reset() {
    this.score.reset();
    this.ball.reset(0, 0, 1);
  }
  
  end() {
    this.isRunning = false;
    
    // Show game over message
    const gameOverDiv = document.createElement('div');
    gameOverDiv.style.position = 'fixed';
    gameOverDiv.style.top = '50%';
    gameOverDiv.style.left = '50%';
    gameOverDiv.style.transform = 'translate(-50%, -50%)';
    gameOverDiv.style.fontSize = '48px';
    gameOverDiv.style.fontWeight = 'bold';
    gameOverDiv.style.color = '#fff';
    gameOverDiv.style.textShadow = '0 0 20px #fff';
    gameOverDiv.style.fontFamily = 'Arial, sans-serif';
    gameOverDiv.style.background = 'rgba(0,0,0,0.7)';
    gameOverDiv.style.padding = '20px 40px';
    gameOverDiv.style.borderRadius = '10px';
    gameOverDiv.style.textAlign = 'center';
    
    if (this.score.playerScore >= this.score.winningScore) {
      gameOverDiv.textContent = 'YOU WIN! 🎉';
    } else {
      gameOverDiv.textContent = 'AI WINS! 🤖';
    }
    
    gameOverDiv.style.zIndex = '1000';
    document.body.appendChild(gameOverDiv);
    
    // Play game over sound (simple beep)
    this.playGameOverSound();
  }
  
  playGameOverSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (e) {
      console.log('Audio not supported or blocked');
    }
  }
}