# Implementation Plan

## [Overview]

Fix the game initialization issue where paddles and ball don't appear on screen by properly adding 3D meshes to the Three.js scene.

The game fails to render gameplay elements because 3D objects (ball and paddles) are created but never added to the scene. The scene only contains the background shapes, causing the game to appear empty despite being properly initialized. This fix will ensure all game objects are properly registered with the Three.js scene so they render correctly.

## [Types]

### Three.js Mesh Objects

All game objects (Ball, Paddle) need to have their mesh objects added to the scene using `scene.add(mesh)`. The glow meshes are already being added properly.

### Game Object Structure

```javascript
// Each game object needs:
- mesh: Main 3D mesh (added to scene)
- glowMesh: Glow effect mesh (added to scene)
- position: Current world position
- isMoving: Movement state
```

## [Files]

### Files to Modify:

1. **src/main.js** - Add scene.add() calls for ball mesh and paddle meshes
   - Add `scene.add(ball.mesh)` after ball creation
   - Add `scene.add(playerPaddle.mesh)` after player paddle creation
   - Add `scene.add(aiPaddle.mesh)` after AI paddle creation

2. **src/game.js** - Already correct (uses modular approach with proper scene.add() calls)
   - No changes needed

### Files to Create:

None - only modifications needed.

### Files to Delete:

None - keep all existing files.

## [Functions]

### Modified Functions:

1. **initGame() in src/main.js** - Add scene.add() calls after mesh creation
   - Current issue: Ball mesh created but not added to scene
   - Current issue: Player and AI paddle meshes created but not added to scene
   - Fix: Add `scene.add(ball.mesh)`, `scene.add(playerPaddle.mesh)`, `scene.add(aiPaddle.mesh)`

2. **Ball constructor in src/main.js** - Add scene.add() for glow mesh
   - Current: `if (this.scene) this.scene.add(glow);`
   - Fix: Should be `if (this.scene) { this.scene.add(this.mesh); this.scene.add(glow); }`

## [Classes]

### Classes in src/main.js:

1. **Paddle class** - Fix scene.add() for glow mesh
   - Current: `if (this.scene) this.scene.add(glow);`
   - Fix: Add main mesh to scene, ensure glow mesh is added

2. **Ball class** - Fix scene.add() for both mesh and glow mesh
   - Current: Only glow mesh is added to scene
   - Fix: Add both mesh and glow mesh to scene

### Classes in src/game.js:

No changes needed - already properly implemented with modular architecture.

## [Dependencies]

No new dependencies required. All necessary classes and Three.js modules are already imported.

The existing Three.js dependency (`https://unpkg.com/three@0.160.0/build/three.module.js`) is sufficient.

## [Testing]

### Manual Testing Steps:

1. Open `index.html` in a browser
2. Verify all 4 game elements appear:
   - Player paddle (left side)
   - AI paddle (right side)
   - Ball (center top initially)
   - Background shapes
3. Press Space or wait for automatic start
4. Verify ball moves and bounces off paddles
5. Verify score displays update correctly

### Expected Results After Fix:

- Game starts automatically on page load
- All 3D objects render with glow effects
- Ball bounces between paddles
- Score tracking works
- Background animates correctly

## [Implementation Order]

1. **Fix src/main.js Ball class** - Add proper scene.add() calls for both mesh and glow mesh
2. **Fix src/main.js Paddle class** - Ensure proper scene.add() for both mesh and glow mesh  
3. **Test with index.html** - Verify all game objects render and gameplay works
4. **Verify background.js** - Ensure it's not conflicting with the fixes

### Step-by-Step Changes:

1. Read current src/main.js (completed)
2. Identify all places where meshes need scene.add() calls
3. Add missing scene.add() calls in proper order (create then add)
4. Test the changes
5. Verify game is fully playable