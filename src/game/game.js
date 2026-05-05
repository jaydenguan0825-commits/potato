import { Renderer } from './renderer.js'

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas')
        this.renderer = new Renderer(this.canvas)
        this.resizeCanvas()
        window.addEventListener('resize', () => this.resizeCanvas())

        // Player stats
        this.player = {
            x: 1000,
            y: 1000,
            size: 20,
            health: 100,
            maxHealth: 100,
            level: 1,
            exp: 0,
            expToNext: 100,
            direction: 0,
            damage: 10,
            speed: 100,
            gold: 0,
            class: null,
            classLevel: 0,
            abilityCooldown: 0,
            abilityActive: false,
            abilityDuration: 0,
            invisible: false,
            attackBoost: 1,
            shield: false,
            shieldDuration: 0,
            flamethrower: false,
            flamethrowerDuration: 0,
            megaRobot: null,
            megaRobotDuration: 0
        }

        // Game state
        this.mobs = []
        this.bosses = []
        this.items = []
        this.bullets = []
        this.particles = []
        this.kills = 0
        this.lastMobCount = 0
        this.shopOpen = false

        // World
        this.worldWidth = 2000
        this.worldHeight = 2000
        this.camera = { x: 0, y: 0 }

        // Input
        this.keys = {}
        this.mouse = { x: 0, y: 0 }
        this.lastShootTime = 0
        this.shootCooldown = 200

        // Classes
        this.classes = {
            noob: {
                rarity: 'common',
                cost: 0,
                stats: { health: 100, speed: 100, damage: 10, lootRate: 0.5 },
                upgrades: ['pro', 'epic', 'bloodthirsty_killer'],
                ability: null
            },
            pro: {
                rarity: 'common',
                cost: 100,
                stats: { health: 120, speed: 112.5, damage: 12, lootRate: 0.7 },
                upgrades: ['epic', 'bloodthirsty_killer'],
                ability: null
            },
            epic: {
                rarity: 'epic',
                cost: 500,
                stats: { health: 140, speed: 125, damage: 15, lootRate: 0.9 },
                upgrades: ['bloodthirsty_killer'],
                ability: null
            },
            bloodthirsty_killer: {
                rarity: 'legendary',
                cost: 2000,
                stats: { health: 160, speed: 137.5, damage: 20, lootRate: 1.2 },
                upgrades: [],
                ability: 'attack_boost'
            },
            speedster: {
                rarity: 'rare',
                cost: 200,
                stats: { health: 80, speed: 150, damage: 8, lootRate: 0.8 },
                upgrades: ['flash', 'speed_demon'],
                ability: null
            },
            flash: {
                rarity: 'rare',
                cost: 800,
                stats: { health: 90, speed: 175, damage: 10, lootRate: 1.0 },
                upgrades: ['speed_demon'],
                ability: null
            },
            speed_demon: {
                rarity: 'mythic',
                cost: 3000,
                stats: { health: 100, speed: 200, damage: 12, lootRate: 1.1 },
                upgrades: [],
                ability: 'invisibility'
            },
            mechanic: {
                rarity: 'epic',
                cost: 500,
                stats: { health: 90, speed: 100, damage: 12, lootRate: 1.3 },
                upgrades: ['genius', 'tech_savvy'],
                ability: null
            },
            genius: {
                rarity: 'legendary',
                cost: 2000,
                stats: { health: 110, speed: 112.5, damage: 15, lootRate: 1.5 },
                upgrades: ['tech_savvy'],
                ability: null
            },
            tech_savvy: {
                rarity: 'godly',
                cost: 5000,
                stats: { health: 130, speed: 125, damage: 18, lootRate: 1.8 },
                upgrades: [],
                ability: 'tech_abilities'
            }
        }

        // Initialize bosses
        this.initializeBosses()

        // Setup
        this.setupInputHandlers()
        this.startGameLoop()
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        this.renderer.width = this.canvas.width
        this.renderer.height = this.canvas.height
    }

    initializeBosses() {
        this.bosses = [
            { id: 'boss_plain', x: 1000, y: 1000, health: 2000, maxHealth: 2000, size: 60, color: '#8b008b', biome: 'plain', defeated: false },
            { id: 'boss_snowy', x: 200, y: 200, health: 1500, maxHealth: 1500, size: 50, color: '#6495ed', biome: 'snowy', defeated: false },
            { id: 'boss_volcano', x: 1800, y: 200, health: 1800, maxHealth: 1800, size: 55, color: '#ff4500', biome: 'volcano', defeated: false },
            { id: 'boss_jungle', x: 200, y: 1800, health: 1600, maxHealth: 1600, size: 52, color: '#228b22', biome: 'jungle', defeated: false },
            { id: 'boss_desert', x: 1800, y: 1800, health: 1700, maxHealth: 1700, size: 53, color: '#daa520', biome: 'desert', defeated: false }
        ]
    }

    setupInputHandlers() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true

            if (e.key === ' ') {
                this.shoot()
                e.preventDefault()
            }
            if (e.key === 'z' || e.key === 'Z') {
                this.useAbility()
            }
            if (e.key === 'e' || e.key === 'E') {
                this.openClassMenu()
            }
            if (e.key === 'p' || e.key === 'P') {
                this.toggleShop()
            }
        })

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false
        })

        document.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect()
            this.mouse.x = e.clientX - rect.left
            this.mouse.y = e.clientY - rect.top
        })

        document.addEventListener('click', (e) => {
            this.shoot()
        })
    }

    update(deltaTime) {
        this.updatePlayer(deltaTime)
        this.updateMobs(deltaTime)
        this.updateBullets(deltaTime)
        this.updateItems(deltaTime)
        this.updateAbilities(deltaTime)
        this.spawnMobs()
        this.updateCamera()
        this.updateUI()
    }

    updatePlayer(deltaTime) {
        // Movement
        let moveX = 0
        let moveY = 0

        if (this.keys['w']) moveY -= 1
        if (this.keys['s']) moveY += 1
        if (this.keys['a']) moveX -= 1
        if (this.keys['d']) moveX += 1

        // Mouse movement
        if (this.mouse.x !== 0 || this.mouse.y !== 0) {
            const centerX = this.canvas.width / 2
            const centerY = this.canvas.height / 2
            const dx = this.mouse.x - centerX
            const dy = this.mouse.y - centerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist > 10) {
                moveX = dx / dist
                moveY = dy / dist
            }
        }

        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY)
            moveX /= length
            moveY /= length
        }

        // Update position
        this.player.x += moveX * this.player.speed * deltaTime
        this.player.y += moveY * this.player.speed * deltaTime

        // Keep in bounds
        this.player.x = Math.max(0, Math.min(this.worldWidth, this.player.x))
        this.player.y = Math.max(0, Math.min(this.worldHeight, this.player.y))

        // Update direction
        if (moveX !== 0 || moveY !== 0) {
            this.player.direction = Math.atan2(moveY, moveX)
        }
    }

    shoot() {
        const now = Date.now()
        if (now - this.lastShootTime < this.shootCooldown) return

        this.lastShootTime = now

        const bullet = {
            x: this.player.x,
            y: this.player.y,
            dx: Math.cos(this.player.direction) * 250,
            dy: Math.sin(this.player.direction) * 250,
            damage: this.player.damage * this.player.attackBoost,
            owner: 'player'
        }

        this.bullets.push(bullet)
    }

    useAbility() {
        if (this.player.abilityCooldown > 0 || !this.player.class) return

        const classData = this.classes[this.player.class]
        if (!classData.ability) return

        this.player.abilityCooldown = 10000 // 10 seconds
        this.player.abilityActive = true

        switch (classData.ability) {
            case 'attack_boost':
                this.player.attackBoost = 1.3
                this.player.abilityDuration = 10000
                break
            case 'invisibility':
                this.player.invisible = true
                this.player.abilityDuration = 5000
                break
            case 'tech_abilities':
                // Random tech ability
                const abilities = ['flamethrower', 'shield', 'mega_robot']
                const randomAbility = abilities[Math.floor(Math.random() * abilities.length)]
                this.activateTechAbility(randomAbility)
                break
        }
    }

    activateTechAbility(ability) {
        switch (ability) {
            case 'flamethrower':
                this.player.flamethrower = true
                this.player.abilityDuration = 10000
                break
            case 'shield':
                this.player.shield = true
                this.player.abilityDuration = 20000
                break
            case 'mega_robot':
                this.player.megaRobot = {
                    x: this.player.x + 50,
                    y: this.player.y,
                    health: 500,
                    maxHealth: 500,
                    size: 30
                }
                this.player.abilityDuration = 30000
                break
        }
    }

    updateAbilities(deltaTime) {
        if (this.player.abilityCooldown > 0) {
            this.player.abilityCooldown -= deltaTime * 1000
        }

        if (this.player.abilityDuration > 0) {
            this.player.abilityDuration -= deltaTime * 1000
            if (this.player.abilityDuration <= 0) {
                this.deactivateAbility()
            }
        }
    }

    deactivateAbility() {
        this.player.abilityActive = false
        this.player.attackBoost = 1
        this.player.invisible = false
        this.player.shield = false
        this.player.flamethrower = false
        if (this.player.megaRobot) {
            this.player.megaRobot = null
        }
    }

    openClassMenu() {
        // Simple class selection for now - auto-select noob class
        if (!this.player.class) {
            const className = 'noob'
            const classData = this.classes[className]
            this.player.class = className
            this.player.classLevel = 0
            Object.assign(this.player, classData.stats)
            this.updateUI()
            console.log(`Selected class: ${className}`)
        } else {
            console.log(`Current class: ${this.player.class}`)
        }
    }

    toggleShop() {
        this.shopOpen = !this.shopOpen
        const shopMenu = document.getElementById('shopMenu')
        if (shopMenu) {
            shopMenu.style.display = this.shopOpen ? 'block' : 'none'
            if (this.shopOpen) this.renderShop()
        }
    }

    renderShop() {
        const shopItems = document.getElementById('shopItems')
        if (!shopItems) return

        shopItems.innerHTML = ''

        const shopInventory = [
            { id: 'health_potion', name: 'Health Potion', cost: 50, description: 'Restore 50 HP' },
            { id: 'damage_boost', name: 'Damage Boost', cost: 100, description: '+5 permanent damage' },
            { id: 'speed_boost', name: 'Speed Boost', cost: 150, description: '+10 permanent speed' },
            { id: 'max_health', name: 'Max Health Up', cost: 200, description: '+20 max health' },
            { id: 'loot_magnet', name: 'Loot Magnet', cost: 75, description: 'Attract nearby items' }
        ]

        shopInventory.forEach(item => {
            const itemDiv = document.createElement('div')
            itemDiv.style.cssText = `
                background: rgba(0, 255, 136, 0.1);
                border: 1px solid #00ff88;
                padding: 10px;
                margin: 5px 0;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.2s;
            `
            itemDiv.innerHTML = `
                <strong style="color: #ffff00">${item.name}</strong><br>
                <small style="color: #ffffff">${item.description}</small><br>
                <span style="color: #f1c40f">Cost: ${item.cost} gold</span>
            `
            itemDiv.onclick = () => this.buyItem(item.id, item.cost)
            itemDiv.onmouseover = () => itemDiv.style.background = 'rgba(0, 255, 136, 0.2)'
            itemDiv.onmouseout = () => itemDiv.style.background = 'rgba(0, 255, 136, 0.1)'
            shopItems.appendChild(itemDiv)
        })
    }

    buyItem(itemId, cost) {
        if (this.player.gold < cost) {
            alert('Not enough gold!')
            return
        }

        this.player.gold -= cost

        switch (itemId) {
            case 'health_potion':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 50)
                break
            case 'damage_boost':
                this.player.damage += 5
                break
            case 'speed_boost':
                this.player.speed += 10
                break
            case 'max_health':
                this.player.maxHealth += 20
                this.player.health += 20
                break
            case 'loot_magnet':
                // Attract all items within range
                this.items.forEach(item => {
                    const dist = Math.sqrt((this.player.x - item.x) ** 2 + (this.player.y - item.y) ** 2)
                    if (dist < 200) {
                        item.x = this.player.x + (Math.random() - 0.5) * 20
                        item.y = this.player.y + (Math.random() - 0.5) * 20
                    }
                })
                break
        }

        this.updateUI()
        this.renderShop() // Refresh shop display
    }

    spawnMobs() {
        if (this.mobs.length < 50) {
            for (let i = 0; i < 3; i++) {
                const x = Math.random() * this.worldWidth
                const y = Math.random() * this.worldHeight

                const centerDist = Math.sqrt((x - this.worldWidth / 2) ** 2 + (y - this.worldHeight / 2) ** 2)
                const level = Math.max(1, Math.floor(centerDist / 200))

                this.mobs.push({
                    id: Date.now() + Math.random(),
                    x: x,
                    y: y,
                    size: 12 + level * 2,
                    health: 20 + level * 15,
                    maxHealth: 20 + level * 15,
                    speed: 37.5 + level * 7.5,
                    damage: 5 + level * 2,
                    exp: 10 + level * 10,
                    gold: 5 + level * 3,
                    color: ['#ff6b6b', '#ff8c42', '#a64dff'][Math.floor(Math.random() * 3)],
                    level: level
                })
            }
        }
    }

    updateMobs(deltaTime) {
        this.mobs.forEach((mob, index) => {
            // Move towards player
            const dx = this.player.x - mob.x
            const dy = this.player.y - mob.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist > 0) {
                mob.x += (dx / dist) * mob.speed * deltaTime
                mob.y += (dy / dist) * mob.speed * deltaTime
            }

            // Attack player if close
            if (dist < 30 && !this.player.invisible) {
                this.player.health -= mob.damage * deltaTime
                if (this.player.health <= 0) {
                    this.gameOver()
                }
            }
        })
    }

    updateBullets(deltaTime) {
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.dx * deltaTime
            bullet.y += bullet.dy * deltaTime

            // Check collision with mobs
            for (let i = this.mobs.length - 1; i >= 0; i--) {
                const mob = this.mobs[i]
                const dist = Math.sqrt((bullet.x - mob.x) ** 2 + (bullet.y - mob.y) ** 2)
                if (dist < mob.size / 2) {
                    mob.health -= bullet.damage
                    if (mob.health <= 0) {
                        this.killMob(mob)
                        this.mobs.splice(i, 1)
                    }
                    return false // Remove bullet
                }
            }

            // Check collision with bosses
            this.bosses.forEach(boss => {
                if (!boss.defeated) {
                    const dist = Math.sqrt((bullet.x - boss.x) ** 2 + (bullet.y - boss.y) ** 2)
                    if (dist < boss.size / 2) {
                        boss.health -= bullet.damage
                        if (boss.health <= 0) {
                            this.defeatBoss(boss)
                        }
                        return false // Remove bullet
                    }
                }
            })

            return bullet.x > 0 && bullet.x < this.worldWidth && bullet.y > 0 && bullet.y < this.worldHeight
        })
    }

    killMob(mob) {
        this.kills++
        this.player.exp += mob.exp
        this.player.gold += mob.gold

        // Drop loot
        if (Math.random() < 0.3) {
            const lootTypes = ['xp', 'gold', 'medkit', 'meat', 'gun']
            const lootType = lootTypes[Math.floor(Math.random() * lootTypes.length)]
            this.items.push({
                x: mob.x,
                y: mob.y,
                type: lootType,
                value: lootType === 'xp' ? mob.exp : lootType === 'gold' ? mob.gold : 1,
                size: 8
            })
        }

        // Level up
        while (this.player.exp >= this.player.expToNext) {
            this.player.exp -= this.player.expToNext
            this.player.level++
            this.player.expToNext = this.player.level * 100
            this.player.maxHealth += 10
            this.player.health = this.player.maxHealth
        }
    }

    defeatBoss(boss) {
        boss.defeated = true
        this.player.exp += 500
        this.player.gold += 1000

        // Check win condition
        if (this.bosses.every(b => b.defeated)) {
            this.winGame()
        }
    }

    updateItems(deltaTime) {
        this.items.forEach((item, index) => {
            const dist = Math.sqrt((this.player.x - item.x) ** 2 + (this.player.y - item.y) ** 2)
            if (dist < 30) {
                // Pickup item
                switch (item.type) {
                    case 'xp':
                        this.player.exp += item.value
                        break
                    case 'gold':
                        this.player.gold += item.value
                        break
                    case 'medkit':
                        this.player.health = Math.min(this.player.maxHealth, this.player.health + 50)
                        break
                    case 'meat':
                        this.player.health = Math.min(this.player.maxHealth, this.player.health + 25)
                        break
                    case 'gun':
                        this.player.damage += 5
                        break
                }
                this.items.splice(index, 1)
            }
        })
    }

    updateCamera() {
        this.camera.x = this.player.x - this.canvas.width / 2
        this.camera.y = this.player.y - this.canvas.height / 2

        // Keep camera in bounds
        this.camera.x = Math.max(0, Math.min(this.worldWidth - this.canvas.width, this.camera.x))
        this.camera.y = Math.max(0, Math.min(this.worldHeight - this.canvas.height, this.camera.y))
    }

    updateUI() {
        document.getElementById('healthValue').textContent = `${Math.ceil(this.player.health)}/${this.player.maxHealth}`
        document.getElementById('levelValue').textContent = this.player.level
        document.getElementById('expValue').textContent = `${this.player.exp}/${this.player.expToNext}`
        document.getElementById('goldValue').textContent = this.player.gold
        document.getElementById('mobCount').textContent = this.mobs.length
        document.getElementById('killCount').textContent = this.kills

        // Update ability display
        const abilityEl = document.getElementById('dashAbility')
        if (this.player.abilityCooldown > 0) {
            abilityEl.textContent = `ABILITY: ${Math.ceil(this.player.abilityCooldown / 1000)}s`
            abilityEl.className = 'ability cooldown'
        } else {
            abilityEl.textContent = 'ABILITY [Z]: Ready'
            abilityEl.className = 'ability ready'
        }
    }

    render() {
        this.renderer.clear()
        this.renderer.drawBiomeBackground(this.camera, this.worldWidth, this.worldHeight)

        // Draw bosses
        this.bosses.forEach(boss => {
            if (!boss.defeated) {
                this.renderer.drawBosses([boss], this.camera)
            }
        })

        // Draw mobs
        this.renderer.drawMobs(this.mobs, this.camera)

        // Draw items
        this.renderer.drawItems(this.items, this.camera)

        // Draw bullets
        this.renderer.drawBullets(this.bullets, this.camera)

        // Draw player
        this.renderer.drawPlayer(this.player, this.camera, true)

        // Draw mega robot
        if (this.player.megaRobot) {
            this.renderer.drawMegaRobot(this.player.megaRobot, this.camera)
        }
    }

    startGameLoop() {
        let lastTime = 0
        const gameLoop = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000
            lastTime = currentTime

            this.update(deltaTime)
            this.render()

            requestAnimationFrame(gameLoop)
        }
        requestAnimationFrame(gameLoop)
    }

    gameOver() {
        // Respawn player instead of ending game
        this.player.health = this.player.maxHealth
        this.player.x = 1000 // Reset to center-ish spawn point
        this.player.y = 1000
        this.player.invisible = true // Temporary invincibility
        
        // Clear any active abilities
        this.player.abilityActive = false
        this.player.abilityDuration = 0
        this.player.shieldActive = false
        this.player.shieldDuration = 0
        this.player.flamethrower = false
        this.player.flamethrowerDuration = 0
        this.player.megaRobot = null
        this.player.megaRobotDuration = 0
        this.player.attackBoost = 1
        
        // Remove invincibility after 3 seconds
        setTimeout(() => {
            this.player.invisible = false
        }, 3000)
    }

    winGame() {
        alert('Congratulations! You defeated all bosses and won the game!')
    }
}