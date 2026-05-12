# Potato - A Multiplayer .io Game

A modern, fast-paced multiplayer PvE .io-style game built with Vite, Canvas, and Node.js/Socket.io.

## Features

- **Class System**: Choose from 3 different classes, each with unique abilities, and each upgrading to a stronger class
- **Dynamic Progression**: Level up, gain exp, and unlock abilities
- **Boss Battles**: Defeat 5 unique bosses scattered across the map
- **Biome System**: Explore 5 distinct biomes (Plain, Snowy Mountain, Volcano, Jungle, Desert)
- **Abilities**: 
  - Shadow Dash (Z): Dash forward quickly
  - Dark Strider (E): Teleport to cursor position
- **Scalable Difficulty**: Mobs get stronger the farther from the center

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

### Running the Game

**Terminal 1 - Start the game server:**
```bash
npm run server
```

**Terminal 2 - Start the dev server:**
```bash
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Building for Production

```bash
npm run build
npm run preview
```

## Controls

- **WASD**: Move
- **Mouse**: Aim
- **Click**: Shoot
- **Z**: Dash (Shadow Dash ability)
- **E**: Teleport (Dark Strider ability)

## Game Mechanics

### Player Classes

- **Gunner**: Balanced all-around (starting class)
- **Sniper**: High damage, long range, slow reload
- **Bomber**: AOE damage specialist
- **Archer**: Quick, medium damage
- **Assassin**: Fast with low health
- **Medic**: Support class with healing
- **Hunter**: Better loot and exp drops

### Progression

- Gain experience by defeating mobs
- Level up for increased stats
- Defeat bosses to progress towards winning a run
- Collect powerups for temporary boosts

### Biomes & Bosses

1. **Plain** (Center): Boss_Plain - Purple elite boss
2. **Snowy Mountain** (Top-left): Boss_Snowy - Blue ice boss
3. **Volcano** (Top-right): Boss_Volcano - Red magma boss
4. **Jungle** (Bottom-left): Boss_Jungle - Green nature boss
5. **Desert** (Bottom-right): Boss_Desert - Golden sand boss

## Project Structure

```
src/
├── main.js              # Entry point
├── game/
│   ├── game.js         # Main game class
│   ├── renderer.js     # Canvas rendering
│   └── network.js      # Socket.io networking
server/
└── server.js           # Game server logic
index.html              # Game page
vite.config.js          # Vite configuration
```

## Technologies

- **Frontend**: Vanilla JavaScript, Canvas API, Vite
- **Backend**: Node.js, Express, Socket.io
- **Real-time Communication**: Socket.io
- **Build Tool**: Vite

## Art Style

The game features a classic .io aesthetic with:
- Bright, contrasting colors
- Cartoon-style circles and shapes
- Simple yet recognizable visual hierarchy
- Smooth animations and effects

## Performance

- 60 FPS client-side rendering
- Optimized network updates (60 Hz)
- Efficient collision detection
- Off-screen entity culling

## Known Limitations

- Currently single-server (no clustering)
- Map is procedurally generated but fixed per session
- No persistence between sessions

## Future Enhancements

- Leaderboards
- More abilities and abilities trees
- Power-ups and special events
- Skins and cosmetics
- Ranked mode
- Friends system

## License

ISC

## Credits

Inspired by popular .io games like Agar.io, Slither.io, and Surviv.io
