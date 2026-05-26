# 🥔 Potato - .io Style Action Game

A fast-paced, roguelike-inspired action game where you battle endless waves of enemies, collect loot, and customize your loadout to survive boss encounters. Built with Vite, Canvas, and vanilla JavaScript.

## 🎮 Core Features

### **Loadout System**
Equip items in three customizable slots for permanent run bonuses:
- **Healing Slot**: Regeneration, Medkit, or healing items
- **Combat Slot**: Damage boosts, speed boosts, or weapons (Pistol, Rifle, Shotgun)
- **Utility Slot**: Loot Magnet, Loot Boost, or Armour Piece

### **Class Selection**
Choose from 11 unique classes, each with different base stats:
- **Noob** (Free) - Balanced starter
- **Pro** (100g) - Better loot rate
- **Speedster** (200g) - Fast but fragile
- **Epic** (500g) - Enhanced stats
- **Flash** (800g) - Speed specialist
- **Mechanic** (500g) - High loot chance
- **Bloodthirsty Killer** (2000g) - Attack boost ability
- **Genius** (2000g) - Robot support
- **Speed Demon** (3000g) - Invisibility ability
- **Tech Savvy** (5000g) - Ultimate tech class

### **Boss Encounters**
Four legendary bosses guard different biomes:
- **Boss of Plains** (Center) - Purple elite
- **Boss of Snow** (Northwest) - Blue frost guardian
- **Boss of Volcano** (Northeast) - Red lava beast
- **Boss of Jungle** (Southwest) - Green nature lord
- **Boss of Desert** (Southeast) - Golden sand titan

Each boss actively attacks with projectiles and has significant health pools.

### **Shop System**
Purchase items between runs at the home base:

**Healing Items**
- Health Potion (50g) - Instant 50 HP restore
- Regeneration (120g) - Healing over time
- Medkit (80g) - Slow passive healing

**Combat Weapons**
- Damage Boost (100g) - +5 damage
- Speed Boost (150g) - +10 movement speed
- Boost Potion (200g) - +5 damage & +15 speed
- Pistol (80g) - +8 damage
- Rifle (250g) - +15 damage
- Shotgun (350g) - +25 damage

**Utility Items**
- Loot Magnet (75g) - Attracts nearby items
- Loot Boost (120g) - Increases drop rates
- Armour Piece (180g) - 15% damage reduction

### **Beautiful Biomes**
Explore five distinct biomes with unique visuals:
- **Grass Plains**: Lush green grassland (starting area)
- **Snowy Mountains**: Frozen tundra with icy effects
- **Volcano**: Magma-filled landscape with rocky terrain
- **Jungle**: Dense foliage and natural colors
- **Desert**: Golden sand with rippling dunes

### **Loot & Progression**
- Kill mobs to collect XP, Gold, and random loot
- Loot drops include: Medkits, Meat, and Guns
- Level up as you defeat enemies
- All earned gold persists between runs
- Build your loadout from collected items

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install
```

### Running Locally
```bash
# Development server with hot reload
npm run dev
```

Open `http://localhost:5173` in your browser.

### Building for Production
```bash
npm run build
npm run preview
```

## 🎮 Controls

| Key | Action |
|-----|--------|
| **W/A/S/D** | Move up/left/down/right |
| **Mouse** | Aim direction |
| **Left Click** | Shoot |
| **Space** | Alternative shoot |
| **Z** | Use ability |
| **E** | Open inventory |
| **P** | Open shop (home) / Return home (battle) |
| **O** | Open settings |

## 📋 Gameplay Flow

1. **Home Screen**: Start here. Select class and manage inventory
2. **Enter Shop**: Browse and purchase upgrades with gold
3. **Open Inventory**: View your loadout and equip items
4. **Start Run**: Enter the battlefield with your equipped items
5. **Battle**: Defeat mobs, collect loot, dodge boss attacks
6. **Return Home**: Press P to return, keep your gold and items

## 🏆 Game Mechanics

### Loadout System
- Equip one item per slot (Healing/Combat/Utility)
- Each item provides passive bonuses during gameplay
- Switch loadouts between runs using your inventory
- Some items have special effects (armor reduces damage, loot magnet attracts items)

### Leveling
- Defeat mobs to gain experience
- Each level increases max health by 10
- Leveling resets each run but gold persists

### Difficulty Scaling
- Mob strength increases based on distance from center
- Farther zones have tougher enemies and better loot
- Boss fights are challenging - prepare well!

### Economy
- Earn gold by defeating mobs
- Bosses drop massive gold rewards (1000g each)
- Gold carries over between runs
- Spend gold to unlock new classes and items

## 📁 Project Structure

```
.
├── index.html              # Main game page
├── src/
│   ├── main.js            # Entry point & initialization
│   └── game/
│       ├── game.js        # Core game logic
│       ├── renderer.js    # Canvas rendering
│       └── network.js     # Socket.io networking
├── server/
│   └── server.js          # Backend server
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies
└── README.md              # This file
```

## 🛠 Configuration

### Customizing Controls
Open the settings menu (O key) to rebind controls to your preference.

### Game Settings
- Adjust mob spawn rates in `src/game/game.js`
- Modify biome colors and textures in `src/game/renderer.js`
- Update boss stats in `initializeBosses()` method
- Tune class stats in the `classes` object

## 🐛 Known Features
- Single-player local gameplay (multiplayer via server in development)
- Canvas-based rendering at 60 FPS
- Persistent gold between runs
- Full loadout customization
- Boss projectile attacks

## 📝 License
MIT License - Feel free to modify and extend!

## 🎨 Credits
Built with Vite, vanilla JavaScript, and Canvas API.
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
