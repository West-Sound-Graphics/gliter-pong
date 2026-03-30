# Gliter Pong

A disco-themed Pong game built with Three.js featuring rainbow colors, animated geometric background patterns, and smooth gameplay!

## Features

- 🌈 **Disco Visuals** - Rainbow color palette with animated geometric background
- 🎮 **Player vs AI** - Play against a challenging AI opponent
- ⚡ **Increasing Difficulty** - Ball speeds up with each paddle hit
- 🎯 **Smooth Controls** - Arrow key movement with responsive input
- 🏆 **Scoring System** - First to 7 points wins
- ✨ **Glow Effects** - Neon glow on all game elements

## How to Play

1. **Open the game** - Simply open `index.html` in a modern web browser
2. **Move your paddle** - Use the arrow keys (↑ and ↓) to control your paddle
3. **Win the game** - Be the first to reach 7 points

## Controls

- **↑ (Up Arrow)** - Move paddle up
- **↓ (Down Arrow)** - Move paddle down
- **Space** - Restart game after game over

## Project Structure

```
gliter-pong/
├── index.html              # Main HTML file
├── README.md               # This file
├── src/
│   ├── renderer.js        # Three.js scene setup and color generation
│   ├── background.js      # Geometric background patterns
│   ├── paddle.js          # Paddle class (player and AI)
│   ├── ball.js            # Ball physics and collision
│   ├── score.js           # Score display management
│   ├── game.js            # Main game engine
│   └── main.js            # Entry point and initialization
└── assets/
    └── textures/          # Future texture assets
```

## How It Works

- **Three.js** is loaded via CDN (no build tools needed)
- All graphics are **procedurally generated** (no external assets)
- The game runs directly in the browser
- No installation or setup required!

## Technical Details

- Built with **Three.js ES modules** via CDN
- Uses **ES modules** for clean code organization
- No dependencies beyond Three.js
- Self-contained application

## Tips

- Hit the ball at the edges of your paddle for sharper angles
- The ball speeds up with each hit - keep up!
- Time your movements to predict where the ball will go
- The AI tries to follow the ball but has limitations

## Browser Compatibility

Works in all modern browsers that support:
- WebGL 2.0
- ES6 modules
- Three.js r160+

Enjoy the disco vibes! 🕺💃