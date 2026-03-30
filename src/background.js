import { GameConfig, generateRainbowColors } from './renderer.js';

export class Background {
  constructor(scene) {
    this.scene = scene;
    this.colors = generateRainbowColors(GameConfig.visual.background.colorCount);
    this.shapes = [];
    this.time = 0;
    this.shapeCount = 12;
    this.rotationSpeed = 0.002;
    this.scaleSpeed = 0.001;
    
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
    let geometry, material;
    
    switch (type) {
      case 'cube':
        geometry = new THREE.OctahedronGeometry(8, 0);
        break;
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(8, 0);
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(8, 0);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(5, 12, 8);
        break;
      case 'sphere':
        geometry = new THREE.IcosahedronGeometry(8, 0);
        break;
      default:
        geometry = new THREE.OctahedronGeometry(8, 0);
    }
    
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    material = new THREE.MeshPhongMaterial({
      color: color.baseColor,
      specular: 0x555555,
      shininess: 30,
      transparent: true,
      opacity: 0.8
    });
    
    return new THREE.Mesh(geometry, material);
  }
  
  render() {
    this.updateShapes();
    this.scene.render();
  }
  
  updateShapes() {
    const now = Date.now() / 1000;
    this.time += 0.001;
    
    this.shapes.forEach((shape, index) => {
      const colorData = this.colors[index % this.colors.length];
      
      // Animate rotation
      shape.rotation.x = Math.sin(this.time + index) * 0.5 + 0.5;
      shape.rotation.y = Math.cos(this.time * 0.7 + index * 0.3) * 0.5 + 0.5;
      shape.rotation.z = Math.sin(this.time * 0.5 + index * 0.2) * 0.3;
      
      // Animate scale
      const scale = 0.5 + Math.sin(this.time * this.scaleSpeed + index) * 0.5;
      shape.scale.setScalar(scale);
      
      // Update material color for rainbow effect
      shape.material.color.setHSL((now * 0.1 + index * 0.1) % 1, 1, 0.5);
      shape.material.emissive.setHSL((now * 0.1 + index * 0.1) % 1, 0.8, 0.2);
      
      // Add subtle floating movement
      shape.position.y = Math.sin(this.time * 2 + index) * 5;
      shape.position.x = Math.cos(this.time * 1.5 + index * 0.5) * 10;
    });
  }
  
  animate() {
    this.updateShapes();
  }
  
  generateColors() {
    return this.colors;
  }
}