import { GameConfig } from './renderer.js';

export class Ball {
  constructor(config, scene) {
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.radius = config.radius;
    this.color = config.color;
    this.mesh = null;
    this.isMoving = false;
    this.speed = config.speed;
    this.scene = scene;
    
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
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(this.radius + 0.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.2
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(this.mesh.position);
    if (this.scene) {
      this.scene.add(glow);
    }
    this.glowMesh = glow;
    
    return this.mesh;
  }
  
  update(delta) {
    if (!this.isMoving) return;
    
    // Update position
    this.position.x += this.velocity.x * this.speed;
    this.position.y += this.velocity.y * this.speed;
    
    // Update mesh position
    this.mesh.position.copy(this.position);
    
    if (this.glowMesh) {
      this.glowMesh.position.copy(this.mesh.position);
    }
    
    // Wall collisions
    const leftBound = -GameConfig.game.worldWidth / 2 + this.radius;
    const rightBound = GameConfig.game.worldWidth / 2 - this.radius;
    const topBound = GameConfig.game.worldHeight / 2 - this.radius;
    const bottomBound = -GameConfig.game.worldHeight / 2 + this.radius;
    
    // Left wall
    if (this.position.x < leftBound) {
      this.position.x = leftBound;
      this.velocity.x *= -1;
    }
    
    // Right wall
    if (this.position.x > rightBound) {
      this.position.x = rightBound;
      this.velocity.x *= -1;
    }
    
    // Top wall
    if (this.position.y > topBound) {
      this.position.y = topBound;
      this.velocity.y *= -1;
    }
    
    // Bottom wall
    if (this.position.y < bottomBound) {
      this.position.y = bottomBound;
      this.velocity.y *= -1;
    }
  }
  
  checkPaddleCollision(paddle) {
    const paddleTop = paddle.position.y + paddle.dimensions.height / 2;
    const paddleBottom = paddle.position.y - paddle.dimensions.height / 2;
    
    // Check if ball is at paddle x position
    if (Math.abs(this.position.x - paddle.position.x) < this.radius + paddle.dimensions.width / 2) {
      // Check vertical collision
      if (this.position.y >= paddleBottom && this.position.y <= paddleTop) {
        // Determine if hitting top or bottom of paddle for angle change
        const paddleCenter = paddle.position.y;
        const hitPoint = this.position.y - paddleCenter;
        const paddleHalfHeight = paddle.dimensions.height / 2;
        
        // Normalize hit point (-1 = bottom, 0 = center, 1 = top)
        const normalizedHit = hitPoint / paddleHalfHeight;
        
        // Calculate new angle based on where ball hit paddle
        const maxAngle = Math.PI / 4; // 45 degrees
        const newAngle = normalizedHit * maxAngle;
        
        // Set velocity based on hit location
        this.velocity.x = Math.abs(this.velocity.x) * GameConfig.ball.speedMultiplier;
        this.velocity.y = -newAngle * 25; // Scale angle to velocity
        
        // Ensure ball moves away from paddle
        if (paddle.type === 'player') {
          this.velocity.x = Math.abs(this.velocity.x);
        } else {
          this.velocity.x = -Math.abs(this.velocity.x);
        }
        
        // Push ball out of paddle to prevent sticking
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
  
  checkWallCollision(wall) {
    // This is a placeholder for any special wall collision logic
    // Currently handled in update()
    return false;
  }
  
  reset(x, y, direction) {
    this.position = { x: x, y: y };
    this.velocity = { x: 0, y: 0 };
    this.isMoving = false;
    this.speed = GameConfig.ball.speed;
    
    if (this.glowMesh) {
      this.glowMesh.position.set(x, y, 0);
    }
    
    return this;
  }
  
  serve(direction) {
    this.isMoving = true;
    this.speed = GameConfig.ball.speed;
    
    // Serve from center
    this.position = { 
      x: 0, 
      y: GameConfig.game.worldHeight / 2 - GameConfig.game.paddles.height / 2 - 5 
    };
    
    // Initial velocity towards player's side
    this.velocity = {
      x: direction * this.speed,
      y: (Math.random() * 0.2 - 0.1) // Slight random vertical velocity
    };
    
    return this;
  }
  
  getMesh() {
    return this.mesh;
  }
}