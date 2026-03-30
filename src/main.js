import { Game } from './game.js';

export function initGame(container) {
  // Create game instance
  const game = new Game();
  
  // Setup keyboard event listener
  setupEventListeners(game);
  
  return game;
}

function setupEventListeners(game) {
  // Handle keyboard input for player paddle
  const handleKeyDown = (e) => {
    // Only handle if game is running
    if (!game.ball.isMoving) return;
    
    switch (e.key) {
      case 'ArrowUp':
        game.playerPaddle.handleInput({ key: 'ArrowUp' });
        break;
      case 'ArrowDown':
        game.playerPaddle.handleInput({ key: 'ArrowDown' });
        break;
      case ' ':
        // Restart game if in game over state
        game.start();
        break;
      default:
        break;
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  
  // Handle window resize
  const handleResize = () => {
    if (game.renderer) {
      game.renderer.setSize(window.innerWidth, window.innerHeight);
      game.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  };
  
  window.addEventListener('resize', handleResize);
}

export function startGame(container) {
  const game = initGame(container);
  game.start();
  return game;
}