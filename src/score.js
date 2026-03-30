import { GameConfig } from './renderer.js';

let threeFont;

async function loadFont() {
  try {
    // Simple 3D text using planes instead of font loading
    return null;
  } catch (error) {
    console.warn('Font loading failed, using fallback text');
    return null;
  }
}

export class Score {
  constructor(config, scene) {
    this.playerScore = 0;
    this.aiScore = 0;
    this.winningScore = config.winScore;
    this.scene = scene;
    this.font = null;
    
    this.display = null;
    this.aiDisplay = null;
    
    this.initScoreMeshes();
  }
  
  async initScoreMeshes() {
    this.font = await loadFont();
    
    // Create simple planar text for scores
    this.createPlayerScoreDisplay();
    this.createAiScoreDisplay();
  }
  
  createPlayerScoreDisplay() {
    const playerScoreDiv = document.createElement('div');
    playerScoreDiv.className = 'score';
    playerScoreDiv.style.position = 'absolute';
    playerScoreDiv.style.left = '20px';
    playerScoreDiv.style.top = '50%';
    playerScoreDiv.style.transform = 'translateY(-50%)';
    playerScoreDiv.style.fontSize = '72px';
    playerScoreDiv.style.fontWeight = 'bold';
    playerScoreDiv.style.color = '#0ff';
    playerScoreDiv.style.textShadow = '0 0 20px #0ff, 0 0 40px #00f';
    playerScoreDiv.style.fontFamily = 'Arial, sans-serif';
    playerScoreDiv.textContent = '0';
    
    document.body.appendChild(playerScoreDiv);
    this.display = playerScoreDiv;
  }
  
  createAiScoreDisplay() {
    const aiScoreDiv = document.createElement('div');
    aiScoreDiv.className = 'score';
    aiScoreDiv.style.position = 'absolute';
    aiScoreDiv.style.right = '20px';
    aiScoreDiv.style.top = '50%';
    aiScoreDiv.style.transform = 'translateY(-50%)';
    aiScoreDiv.style.fontSize = '72px';
    aiScoreDiv.style.fontWeight = 'bold';
    aiScoreDiv.style.color = '#f0f';
    aiScoreDiv.style.textShadow = '0 0 20px #f0f, 0 0 40px #f00';
    aiScoreDiv.style.fontFamily = 'Arial, sans-serif';
    aiScoreDiv.textContent = '0';
    
    document.body.appendChild(aiScoreDiv);
    this.aiDisplay = aiScoreDiv;
  }
  
  update(playerScore, aiScore) {
    this.playerScore = playerScore;
    this.aiScore = aiScore;
    
    if (this.display) {
      this.display.textContent = String(this.playerScore);
    }
    
    if (this.aiDisplay) {
      this.aiDisplay.textContent = String(this.aiScore);
    }
    
    return this;
  }
  
  reset() {
    this.playerScore = 0;
    this.aiScore = 0;
    
    if (this.display) {
      this.display.textContent = '0';
    }
    
    if (this.aiDisplay) {
      this.aiDisplay.textContent = '0';
    }
    
    return this;
  }
  
  checkWin() {
    return this.playerScore >= this.winningScore || this.aiScore >= this.winningScore;
  }
}