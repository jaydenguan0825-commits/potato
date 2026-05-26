import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: { origin: '*' }
})

// Route handlers FIRST - before static file serving
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'))
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'))
})

// Serve static files from parent directory and dist
app.use(express.static(path.join(__dirname, '..')))
app.use(express.static(path.join(__dirname, '..', 'dist')))

// Fallback: serve index.html for any unmapped routes (SPA fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'))
})

const PORT = 3000
const WORLD_WIDTH = 2000
const WORLD_HEIGHT = 2000
const TILE_SIZE = 50

// Game state
let players = {}
let mobs = []
let bosses = []
let items = []
let bullets = []
let gameMap = generateMap()

// Player class definitions
const CLASSES = {
    gunner: { damage: 10, speed: 4, health: 100, reload: 200 },
    sniper: { damage: 25, speed: 3, health: 80, reload: 600, range: 300 },
    bomber: { damage: 30, speed: 3, health: 90, reload: 800 },
    archer: { damage: 20, speed: 4, health: 60, reload: 150 },
    assassin: { damage: 15, speed: 5.5, health: 70, reload: 100 },
    medic: { damage: 8, speed: 4.5, health: 75, reload: 250 },
    hunter: { damage: 18, speed: 4, health: 95, reload: 200 }
}

function generateMap() {
    const map = []
    const rows = Math.ceil(WORLD_HEIGHT / TILE_SIZE)
    const cols = Math.ceil(WORLD_WIDTH / TILE_SIZE)

    for (let y = 0; y < rows; y++) {
        map[y] = []
        for (let x = 0; x < cols; x++) {
            map[y][x] = Math.random() > 0.85 ? 1 : 0
        }
    }
    return map
}

function initializeBosses() {
    bosses = [
        { id: 'boss_snowy', x: 200, y: 200, health: 1000, maxHealth: 1000, size: 50, color: '#6495ed', biome: 'snowy' },
        { id: 'boss_volcano', x: 1800, y: 200, health: 1000, maxHealth: 1000, size: 50, color: '#ff4500', biome: 'volcano' },
        { id: 'boss_jungle', x: 200, y: 1800, health: 1000, maxHealth: 1000, size: 50, color: '#228b22', biome: 'jungle' },
        { id: 'boss_desert', x: 1800, y: 1800, health: 1000, maxHealth: 1000, size: 50, color: '#daa520', biome: 'desert' },
        { id: 'boss_plain', x: 1000, y: 1000, health: 2000, maxHealth: 2000, size: 60, color: '#8b008b', biome: 'plain' }
    ]
}

function spawnMobs() {
    if (mobs.length < 100) {
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * WORLD_WIDTH
            const y = Math.random() * WORLD_HEIGHT

            // Calculate mob strength based on distance from center
            const centerDist = Math.sqrt((x - WORLD_WIDTH / 2) ** 2 + (y - WORLD_HEIGHT / 2) ** 2)
            const level = Math.max(1, Math.floor(centerDist / 200))

            mobs.push({
                id: Date.now() + Math.random(),
                x: x,
                y: y,
                size: 12 + level * 2,
                health: 20 + level * 15,
                maxHealth: 20 + level * 15,
                speed: 1.5 + level * 0.3,
                damage: 5 + level * 2,
                exp: 10 + level * 10,
                color: ['#ff6b6b', '#ff8c42', '#a64dff'][Math.floor(Math.random() * 3)]
            })
        }
    }
}

function mobAI() {
    mobs.forEach(mob => {
        if (Object.keys(players).length > 0) {
            const targetId = Object.keys(players)[Math.floor(Math.random() * Object.keys(players).length)]
            const target = players[targetId]
            if (target) {
                const dx = target.x - mob.x
                const dy = target.y - mob.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist > 0) {
                    mob.x += (dx / dist) * mob.speed
                    mob.y += (dy / dist) * mob.speed
                }
            }
        }
    })
}

function handleBulletCollisions() {
    bullets.forEach((bullet, bIndex) => {
        // Check collision with mobs
        for (let i = mobs.length - 1; i >= 0; i--) {
            const mob = mobs[i]
            const dist = Math.sqrt((bullet.x - mob.x) ** 2 + (bullet.y - mob.y) ** 2)
            if (dist < mob.size) {
                mob.health -= bullet.damage
                bullets.splice(bIndex, 1)

                if (mob.health <= 0) {
                    items.push({
                        id: Date.now() + Math.random(),
                        x: mob.x,
                        y: mob.y,
                        type: 'exp',
                        value: mob.exp,
                        size: 8
                    })
                    mobs.splice(i, 1)

                    // Award player
                    if (players[bullet.owner]) {
                        players[bullet.owner].exp += mob.exp
                        if (players[bullet.owner].exp >= 100) {
                            players[bullet.owner].level++
                            players[bullet.owner].exp -= 100
                        }
                    }
                }
                return
            }
        }

        // Check collision with bosses
        bosses.forEach((boss, bIndex) => {
            const dist = Math.sqrt((bullet.x - boss.x) ** 2 + (bullet.y - boss.y) ** 2)
            if (dist < boss.size) {
                boss.health -= bullet.damage
                bullets.splice(bIndex, 1)

                if (boss.health <= 0) {
                    items.push({
                        id: Date.now() + Math.random(),
                        x: boss.x,
                        y: boss.y,
                        type: 'powerup',
                        value: 500,
                        size: 12
                    })
                    bosses.splice(bIndex, 1)

                    if (players[bullet.owner]) {
                        players[bullet.owner].exp += 500
                        players[bullet.owner].level += 5
                    }
                }
            }
        })
    })
}

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id)

    players[socket.id] = {
        id: socket.id,
        x: 1000,
        y: 1000,
        size: 20,
        health: 100,
        maxHealth: 100,
        level: 1,
        exp: 0,
        direction: 0,
        class: 'gunner',
        damage: 10,
        speed: 4
    }

    socket.emit('init', { 
        playerId: socket.id,
        players,
        mobs,
        bosses,
        items,
        bullets,
        map: gameMap
    })

    socket.broadcast.emit('playerJoined', { playerId: socket.id })

    socket.on('playerUpdate', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = Math.max(0, Math.min(WORLD_WIDTH, data.x))
            players[socket.id].y = Math.max(0, Math.min(WORLD_HEIGHT, data.y))
            players[socket.id].direction = data.direction
        }
    })

    socket.on('shoot', (data) => {
        bullets.push({
            id: Date.now() + Math.random(),
            x: data.x,
            y: data.y,
            dx: Math.cos(data.direction) * 8,
            dy: Math.sin(data.direction) * 8,
            damage: data.damage,
            owner: socket.id
        })
    })

    socket.on('dash', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = Math.max(0, Math.min(WORLD_WIDTH, data.x))
            players[socket.id].y = Math.max(0, Math.min(WORLD_HEIGHT, data.y))
        }
    })

    socket.on('teleport', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = Math.max(0, Math.min(WORLD_WIDTH, data.x))
            players[socket.id].y = Math.max(0, Math.min(WORLD_HEIGHT, data.y))
        }
    })

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id)
        delete players[socket.id]
        io.emit('playerLeft', { playerId: socket.id })
    })
})

// Game loop
setInterval(() => {
    spawnMobs()
    mobAI()

    // Update bullets
    bullets = bullets.filter(bullet => {
        bullet.x += bullet.dx
        bullet.y += bullet.dy
        return bullet.x > 0 && bullet.x < WORLD_WIDTH && bullet.y > 0 && bullet.y < WORLD_HEIGHT
    })

    handleBulletCollisions()

    // Item pickup
    Object.values(players).forEach(player => {
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i]
            const dist = Math.sqrt((player.x - item.x) ** 2 + (player.y - item.y) ** 2)
            if (dist < 30) {
                if (item.type === 'exp') {
                    player.exp += item.value
                    if (player.exp >= 100) {
                        player.level++
                        player.exp -= 100
                    }
                } else if (item.type === 'powerup') {
                    player.exp += item.value
                    player.level += 5
                }
                items.splice(i, 1)
            }
        }
    })

    io.emit('gameState', {
        players,
        mobs,
        bosses,
        items,
        bullets
    })
}, 1000 / 60)

server.listen(PORT, () => {
    initializeBosses()
    console.log(`Game server running on port ${PORT}`)
})
