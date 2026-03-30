import { GameConfig } from './renderer.js';

export class Paddle {
  constructor(type, position, dimensions, color, scene) {
    this.type = type; // 'player' or 'ai'
    this.position = { ...position };
    this.dimensions = { ...dimensions };
    this.velocity = { x: 0, y: 0 };
    this.color = color;
    this.mesh = null;
    this.targetY = position.y;
    this.isMoving = false;
    this.direction = 1; // 1 for up, -1 for down
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
    
    // Add glow effect
    const glowGeometry = new THREE.BoxGeometry(this.dimensions.width + 0.5, this.dimensions.height + 0.5, 2.5);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.3
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(this.mesh.position);
    if (this.scene) {
      this.scene.add(glow);
    }
    this.glowMesh = glow;
  }
  
  update(delta) {
    if (this.isMoving) {
      this.position.y += this.velocity.y * GameConfig.ai.speed;
      
      // Clamp to bounds
      const minBound = GameConfig.game.paddles.spacing + this.dimensions.height / 2;
      const maxBound = GameConfig.game.worldHeight - GameConfig.game.paddles.spacing - this.dimensions.height / 2;
      
      this.position.y = Math.max(minBound, Math.min(maxBound, this.position.y));
    }
    
    this.mesh.position.copy(this.position);
    
    if (this.glowMesh) {
      this.glowMesh.position.copy(this.mesh.position);
    }
  }
  
  handleInput(input) {
    // input: { key: 'ArrowUp' | 'ArrowDown' }
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
    // AI movement logic
    this.targetY = targetY;
    
    // Smoothly interpolate towards target
    const distance = targetY - this.position.y;
    
    if (Math.abs(distance) > 1) {
      // Move towards target
      if (distance > 0) {
        this.velocity.y = Math.min(GameConfig.ai.speed, GameConfig.ai.speed * 0.5);
        this.direction = 1;
      } else {
        this.velocity.y = Math.max(-GameConfig.ai.speed, GameConfig.ai.speed * -0.5);
        this.direction = -1;
      }
      this.isMoving = true;
    } else {
      // Reached target
      this.velocity.y = 0;
      this.isMoving = false;
    }
  }
  
  calculateSpeed() {
    return GameConfig.ai.speed;
  }
  
  reset(position, color) {
    this.position = position;
    this.velocity = { x: 0, y: 0 };
    this.isMoving = false;
    this.targetY = position.y;
    
    if (this.glowMesh) {
      this.glowMesh.position.set(position.x, position.y, 0);
    }
  }
  
  getMesh() {
    return this.mesh;
  }
}