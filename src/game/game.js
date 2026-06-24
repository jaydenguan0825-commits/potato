import { Renderer } from './renderer.js'

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas')
        this.renderer = new Renderer(this.canvas)
        this.resizeCanvas()
        window.addEventListener('resize', () => this.resizeCanvas())

        // Load persistent data
        const savedGold = localStorage.getItem('potatoGold')
        const activeGold = savedGold !== null ? parseInt(savedGold, 10) : 100

        const savedOwnedClasses = localStorage.getItem('potatoOwnedClasses')
        const ownedClasses = savedOwnedClasses ? JSON.parse(savedOwnedClasses) : ['noob']

        const savedClassLevels = localStorage.getItem('potatoClassLevels')
        const classLevels = savedClassLevels ? JSON.parse(savedClassLevels) : {'noob': 1}

        const savedXpBalance = localStorage.getItem('potatoXpBalance')
        const xpBalance = savedXpBalance !== null ? parseInt(savedXpBalance, 10) : 0

        const equippedClass = localStorage.getItem('potatoEquippedClass') || 'noob'

        // Player stats
        this.player = {
            x: 1000,
            y: 1000,
            size: 20,
            hearts: 3,
            heartPoints: 100,
            maxHeartPoints: 100,
            exp: 0,
            expGoal: 400,
            direction: 0,
            damage: 10,
            speed: 120,
            gold: activeGold,
            class: equippedClass,
            classLevels: classLevels,
            ownedClasses: ownedClasses,
            xpBalance: xpBalance,
            abilityCooldown: 0,
            abilityActive: false,
            abilityDuration: 0,
            dashActive: false,
            dashSpeedMultiplier: 1,
            attackBoost: 1,
            shield: false,
            shieldActive: 0,
            shieldDuration: 0,
            flamethrower: false,
            flamethrowerDuration: 0,
            megaRobot: null,
            megaRobotDuration: 0,
            movementMode: localStorage.getItem('potatoMovementMode') || 'keyboard'
        }

        // Game state
        this.mobs = []
        this.bosses = []
        this.items = []
        this.bullets = []
        this.bossBullets = []
        this.allies = []
        this.particles = []
        this.kills = 0
        this.lastMobCount = 0
        this.shopOpen = false
        this.homeShopOpen = false
        this.inventoryOpen = false
        this.isHome = true

        this.player.inventory = []
        this.player.loadout = {
            healing: null,
            combat: null,
            utility: null
        }
        this.player.runStartX = 1000
        this.player.runStartY = 1400

        this.homeShopInventory = [
            { id: 'health_potion', name: 'Health Potion', cost: 50, description: 'Loot consumable: restore one heart when used with Q.', type: 'loot', category: 'healing' },
            { id: 'regeneration', name: 'Regeneration', cost: 120, description: 'Healing slot: recover HP over time.', type: 'healing', category: 'healing' },
            { id: 'medkit', name: 'Medkit', cost: 80, description: 'Loot consumable: restore one heart when used with Q.', type: 'loot', category: 'healing' },
            { id: 'damage_boost', name: 'Damage Boost', cost: 100, description: 'Combat slot: increases base damage.', type: 'combat', category: 'combat' },
            { id: 'speed_boost', name: 'Speed Boost', cost: 150, description: 'Combat slot: increases movement speed.', type: 'combat', category: 'combat' },
            { id: 'boost_potion', name: 'Boost Potion', cost: 200, description: 'Combat slot: strong damage and speed bonus.', type: 'combat', category: 'combat' },
            { id: 'pistol', name: 'Pistol', cost: 80, description: 'Combat slot: basic gun (+8 damage).', type: 'combat', category: 'combat' },
            { id: 'rifle', name: 'Rifle', cost: 250, description: 'Combat slot: powerful gun (+15 damage).', type: 'combat', category: 'combat' },
            { id: 'shotgun', name: 'Shotgun', cost: 350, description: 'Combat slot: heavy gun (+25 damage).', type: 'combat', category: 'combat' },
            { id: 'loot_magnet', name: 'Loot Magnet', cost: 75, description: 'Utility slot: attracts nearby items.', type: 'utility', category: 'utility' },
            { id: 'loot_boost', name: 'Loot Boost', cost: 120, description: 'Utility slot: increases your loot drop chance.', type: 'utility', category: 'utility' },
            { id: 'armour_piece', name: 'Armour Piece', cost: 180, description: 'Utility slot: reduces incoming damage.', type: 'utility', category: 'utility' },
            { id: 'noob', name: 'Class: Noob', cost: 0, description: 'Common starter class with balanced stats.', type: 'class', category: 'class' },
            { id: 'speedster', name: 'Class: Speedster', cost: 200, description: 'Rare speed-focused class with low HP.', type: 'class', category: 'class' },
            { id: 'mechanic', name: 'Class: Mechanic', cost: 500, description: 'Epic class with high loot chance.', type: 'class', category: 'class' }
        ]

        // World
        this.worldWidth = 2000
        this.worldHeight = 2000
        this.camera = { x: 0, y: 0 }

        // Input
        this.keys = {}
        this.controls = {
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd',
            shoot: ' ',
            ability: 'z',
            useItem: 'q',
            inventory: 'e',
            shop: 'p',
            settings: 'o'
        }
        this.bindingAction = null
        this.mouse = { x: 0, y: 0 }
        this.mouseAim = { x: 1, y: 0, active: false }
        this.lastShootTime = 0
        this.shootCooldown = 200
        this.loadControlSettings()

        // Classes
        this.classes = {
            noob: {
                rarity: 'common',
                cost: 0,
                stats: { health: 100, speed: 120, damage: 10, lootRate: 0.5 },
                upgrades: ['pro'],
                ability: null
            },
            pro: {
                rarity: 'common',
                cost: 100,
                stats: { health: 120, speed: 112.5, damage: 12, lootRate: 0.7 },
                upgrades: ['epic'],
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
                stats: { health: 80, speed: 180, damage: 8, lootRate: 0.8 },
                upgrades: ['flash'],
                ability: null
            },
            flash: {
                rarity: 'rare',
                cost: 800,
                stats: { health: 90, speed: 210, damage: 10, lootRate: 1.0 },
                upgrades: ['speed_demon'],
                ability: null
            },
            speed_demon: {
                rarity: 'mythic',
                cost: 3000,
                stats: { health: 100, speed: 240, damage: 12, lootRate: 1.1 },
                upgrades: [],
                ability: 'invisibility'
            },
            mechanic: {
                rarity: 'epic',
                cost: 500,
                stats: { health: 90, speed: 100, damage: 12, lootRate: 1.3 },
                upgrades: ['genius'],
                ability: null
            },
            genius: {
                rarity: 'legendary',
                cost: 2000,
                stats: { health: 110, speed: 112.5, damage: 15, lootRate: 1.5 },
                upgrades: ['tech_savvy'],
                ability: 'genius_summon'
            },
            tech_savvy: {
                rarity: 'godly',
                cost: 5000,
                stats: { health: 130, speed: 125, damage: 18, lootRate: 1.8 },
                upgrades: [],
                ability: 'tech_abilities'
            },
            admin: {
                rarity: 'admin',
                cost: 99999,
                stats: { health: 9999, speed: 350, damage: 250, lootRate: 5.0 },
                upgrades: [],
                ability: 'admin_blast'
            }
        }

        // Initialize bosses
        this.initializeBosses()

        // Setup
        this.setupInputHandlers()
        this.startGameLoop()
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1

        // Set CSS size
        this.canvas.style.width = window.innerWidth + 'px'
        this.canvas.style.height = window.innerHeight + 'px'

        // Set backing store size for crisp rendering on high-DPI displays
        this.canvas.width = Math.floor(window.innerWidth * dpr)
        this.canvas.height = Math.floor(window.innerHeight * dpr)

        // Renderer logical size (in CSS pixels)
        this.renderer.width = window.innerWidth
        this.renderer.height = window.innerHeight

        // Scale drawing operations so coordinates are in CSS pixels
        if (this.renderer && this.renderer.ctx && this.renderer.ctx.setTransform) {
            this.renderer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            this.renderer.ctx.imageSmoothingEnabled = false
        }
    }

    initializeBosses() {
        this.bosses = [
            { id: 'boss_plain', x: 1000, y: 1000, health: 2500, maxHealth: 2500, size: 62, color: '#8b008b', biome: 'plain', defeated: false },
            { id: 'boss_snowy', x: 200, y: 200, health: 1900, maxHealth: 1900, size: 52, color: '#6495ed', biome: 'snowy', defeated: false },
            { id: 'boss_volcano', x: 1800, y: 200, health: 2300, maxHealth: 2300, size: 56, color: '#ff4500', biome: 'volcano', defeated: false },
            { id: 'boss_jungle', x: 200, y: 1800, health: 2100, maxHealth: 2100, size: 54, color: '#228b22', biome: 'jungle', defeated: false },
            { id: 'boss_desert', x: 1800, y: 1800, health: 2200, maxHealth: 2200, size: 55, color: '#daa520', biome: 'desert', defeated: false }
        ]
    }

    setupInputHandlers() {
        document.addEventListener('keydown', (e) => {
            const rawKey = e.key
            const key = rawKey.length === 1 ? rawKey.toLowerCase() : rawKey.toLowerCase()

            if (this.bindingAction) {
                const action = this.bindingAction
                this.controls[action] = key
                this.bindingAction = null
                this.saveControlSettings()
                this.renderSettings()
                const bindingHint = document.getElementById('bindingHint')
                if (bindingHint) {
                    bindingHint.textContent = `Bound ${this.getActionLabel(action)} to ${this.formatKeyLabel(key)}.`
                }
                e.preventDefault()
                return
            }

            this.keys[key] = true

            if (key === this.controls.shoot) {
                this.shoot()
                e.preventDefault()
            }
            if (key === this.controls.ability) {
                this.useAbility()
            }
            if (key === this.controls.useItem) {
                this.useItem()
            }
            if (key === this.controls.inventory) {
                this.openInventory()
            }
            if (key === this.controls.shop) {
                if (this.isHome) {
                    this.toggleHomeShop()
                } else {
                    this.confirmReturnHome()
                }
            }
            if (key === this.controls.settings) {
                this.openSettings()
            }
        })

        document.addEventListener('keyup', (e) => {
            const key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase()
            this.keys[key] = false
        })

        document.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            this.mouse.x = x
            this.mouse.y = y

            const centerX = this.canvas.width / 2
            const centerY = this.canvas.height / 2
            const dx = x - centerX
            const dy = y - centerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist > 8) {
                this.mouseAim.x = dx / dist
                this.mouseAim.y = dy / dist
                this.mouseAim.active = true
            }
        })

        document.addEventListener('click', () => {
            this.shoot()
        })
    }

    update(deltaTime) {
        if (this.isHome) {
            return
        }

        this.updatePlayer(deltaTime)
        this.applyLoadoutEffects(deltaTime)
        this.updateMobs(deltaTime)
        this.updateBosses(deltaTime)
        this.updateBullets(deltaTime)
        this.updateBossBullets(deltaTime)
        this.updateItems(deltaTime)
        this.updateAbilities(deltaTime)
        this.updateAllies(deltaTime)
        this.spawnMobs()
        this.updateCamera()
        this.updateUI()
    }

    updatePlayer(deltaTime) {
        // Movement
        let moveX = 0
        let moveY = 0
        const speedMultiplier = this.player.dashActive ? this.player.dashSpeedMultiplier : 1

        if (this.player.movementMode === 'mouse') {
            const screenX = this.player.x - this.camera.x
            const screenY = this.player.y - this.camera.y
            const dx = this.mouse.x - screenX
            const dy = this.mouse.y - screenY
            const dist = Math.hypot(dx, dy)

            // Face target (if mouse is active)
            if (this.mouseAim.active) {
                this.player.direction = Math.atan2(this.mouseAim.y, this.mouseAim.x)
            }

            if (dist > 12) {
                const angle = Math.atan2(dy, dx)
                // If not using mouse aim, player direction matches movement direction
                if (!this.mouseAim.active) {
                    this.player.direction = angle
                }
                this.player.x += Math.cos(angle) * this.player.speed * speedMultiplier * deltaTime
                this.player.y += Math.sin(angle) * this.player.speed * speedMultiplier * deltaTime
            }
        } else {
            if (this.keys[this.controls.up]) moveY -= 1
            if (this.keys[this.controls.down]) moveY += 1
            if (this.keys[this.controls.left]) moveX -= 1
            if (this.keys[this.controls.right]) moveX += 1

            if (this.mouseAim.active) {
                this.player.direction = Math.atan2(this.mouseAim.y, this.mouseAim.x)
            } else if (moveX !== 0 || moveY !== 0) {
                this.player.direction = Math.atan2(moveY, moveX)
            }

            // Normalize diagonal movement
            if (moveX !== 0 && moveY !== 0) {
                const length = Math.sqrt(moveX * moveX + moveY * moveY)
                moveX /= length
                moveY /= length
            }

            // Update position
            this.player.x += moveX * this.player.speed * speedMultiplier * deltaTime
            this.player.y += moveY * this.player.speed * speedMultiplier * deltaTime
        }

        // Keep in bounds
        this.player.x = Math.max(0, Math.min(this.worldWidth, this.player.x))
        this.player.y = Math.max(0, Math.min(this.worldHeight, this.player.y))
    }

    shoot() {
        if (this.isHome) return
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
        if (this.isHome) return
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
            case 'genius_summon':
                const geniusChoices = ['drone', 'mini_robot', 'armor_scrap']
                const choice = geniusChoices[Math.floor(Math.random() * geniusChoices.length)]
                if (choice === 'drone') {
                    this.allies.push({
                        type: 'drone',
                        x: this.player.x,
                        y: this.player.y,
                        size: 16,
                        health: 100,
                        maxHealth: 100,
                        duration: 10,
                        shootCooldown: 0,
                        angle: 0
                    })
                    alert('Spawned a friendly Helper Drone!')
                } else if (choice === 'mini_robot') {
                    this.allies.push({
                        type: 'mini_robot',
                        x: this.player.x + 40,
                        y: this.player.y,
                        size: 20,
                        health: 250,
                        maxHealth: 250,
                        duration: 10
                    })
                    alert('Spawned a friendly Mini Robot!')
                } else if (choice === 'armor_scrap') {
                    this.items.push({
                        x: this.player.x + (Math.random() - 0.5) * 40,
                        y: this.player.y + (Math.random() - 0.5) * 40,
                        type: 'armor_scrap',
                        value: 30,
                        size: 8
                    })
                    alert('Genius created an Armor Scrap piece nearby!')
                }
                this.player.abilityDuration = 1000
                break
            case 'tech_abilities':
                // Random tech ability
                const abilities = ['flamethrower', 'shield', 'mega_robot']
                const randomAbility = abilities[Math.floor(Math.random() * abilities.length)]
                this.activateTechAbility(randomAbility)
                break
            case 'admin_blast':
                // Dev orbital blast: 36 bullets outward
                for (let i = 0; i < 36; i++) {
                    const angle = (i * Math.PI * 2) / 36
                    this.bullets.push({
                        x: this.player.x,
                        y: this.player.y,
                        dx: Math.cos(angle) * 350,
                        dy: Math.sin(angle) * 350,
                        damage: this.player.damage * 2.5,
                        owner: 'player'
                    })
                }
                this.player.abilityDuration = 500
                break
        }
    }

    activateTechAbility(ability) {
        switch (ability) {
            case 'flamethrower':
                this.player.flamethrower = true
                this.player.flamethrowerDuration = 10000
                this.player.abilityDuration = 10000
                break
            case 'shield':
                this.player.shield = true
                this.player.shieldActive = 20000
                this.player.shieldDuration = 20000
                this.player.abilityDuration = 20000
                break
            case 'mega_robot':
                this.allies.push({
                    type: 'mega_robot',
                    x: this.player.x + 50,
                    y: this.player.y,
                    health: 500,
                    maxHealth: 500,
                    size: 30,
                    duration: 30
                })
                this.player.abilityDuration = 30000
                break
        }
    }

    updateAbilities(deltaTime) {
        if (this.player.abilityCooldown > 0) {
            this.player.abilityCooldown -= deltaTime * 1000
            if (this.player.abilityCooldown < 0) this.player.abilityCooldown = 0
        }

        if (this.player.shieldActive > 0) {
            this.player.shieldActive -= deltaTime * 1000
            if (this.player.shieldActive <= 0) {
                this.player.shieldActive = 0
                this.player.shield = false
            }
        }

        if (this.player.abilityDuration > 0) {
            this.player.abilityDuration -= deltaTime * 1000
            if (this.player.abilityDuration <= 0) {
                this.deactivateAbility()
            }
        }

        if (this.player.flamethrower) {
            this.applyFlamethrower(deltaTime)
        }
    }

    updateAllies(deltaTime) {
        if (!this.allies) return
        this.allies = this.allies.filter(ally => {
            ally.duration -= deltaTime
            if (ally.duration <= 0) return false

            if (ally.type === 'mega_robot' || ally.type === 'mini_robot') {
                // Chase nearest mob and attack
                const nearestMob = this.mobs.reduce((closest, mob) => {
                    const dist = Math.hypot(ally.x - mob.x, ally.y - mob.y)
                    if (!closest || dist < closest.dist) return { mob, dist }
                    return closest
                }, null)

                if (nearestMob && nearestMob.dist > 0) {
                    const dx = nearestMob.mob.x - ally.x
                    const dy = nearestMob.mob.y - ally.y
                    const dist = Math.hypot(dx, dy)
                    const speed = ally.type === 'mega_robot' ? 160 : 130
                    ally.x += (dx / dist) * speed * deltaTime
                    ally.y += (dy / dist) * speed * deltaTime

                    if (dist < ally.size / 2 + nearestMob.mob.size / 2) {
                        const damageRate = ally.type === 'mega_robot' ? 45 : 25
                        nearestMob.mob.health -= damageRate * deltaTime
                        if (nearestMob.mob.health <= 0) {
                            this.killMob(nearestMob.mob)
                            this.mobs = this.mobs.filter(m => m !== nearestMob.mob)
                        }
                    }
                } else {
                    // Return/follow player
                    const targetX = this.player.x + (ally.type === 'mega_robot' ? 50 : -50)
                    const targetY = this.player.y
                    ally.x += (targetX - ally.x) * 5 * deltaTime
                    ally.y += (targetY - ally.y) * 5 * deltaTime
                }
            } else if (ally.type === 'drone') {
                // Orbit player
                if (ally.angle === undefined) ally.angle = 0
                ally.angle += 3 * deltaTime // Orbit speed
                const orbitRadius = 45
                ally.x = this.player.x + Math.cos(ally.angle) * orbitRadius
                ally.y = this.player.y + Math.sin(ally.angle) * orbitRadius

                // Shoot at nearest mob
                if (ally.shootCooldown === undefined) ally.shootCooldown = 0
                ally.shootCooldown -= deltaTime
                if (ally.shootCooldown <= 0) {
                    const nearestMob = this.mobs.reduce((closest, mob) => {
                        const dist = Math.hypot(ally.x - mob.x, ally.y - mob.y)
                        if (!closest || dist < closest.dist) return { mob, dist }
                        return closest
                    }, null)

                    if (nearestMob && nearestMob.dist < 220) {
                        const dx = nearestMob.mob.x - ally.x
                        const dy = nearestMob.mob.y - ally.y
                        const angle = Math.atan2(dy, dx)
                        this.bullets.push({
                            x: ally.x,
                            y: ally.y,
                            dx: Math.cos(angle) * 320,
                            dy: Math.sin(angle) * 320,
                            damage: this.player.damage * 0.5,
                            owner: 'player'
                        })
                        ally.shootCooldown = 0.8 // Shoot every 0.8 seconds
                    }
                }
            }
            return true
        })
    }

    deactivateAbility() {
        this.player.abilityActive = false
        this.player.attackBoost = 1
        this.player.dashActive = false
        this.player.dashSpeedMultiplier = 1
        this.player.shield = false
        this.player.shieldActive = 0
        this.player.flamethrower = false
        this.player.flamethrowerDuration = 0
        this.player.invisible = false
    }

    openClassMenu() {
        // Simple class selection for now - auto-select noob class
        if (!this.player.class) {
            const className = 'noob'
            const classData = this.classes[className]
            this.player.class = className
            this.player.classLevel = 0
            const { health, ...stats } = classData.stats
            Object.assign(this.player, stats)
            this.player.hearts = 3
            this.player.heartPoints = this.player.maxHeartPoints
            this.addInventoryItem({ id: className, name: 'Class: ' + className, type: 'class' })
            this.updateUI()
            console.log(`Selected class: ${className}`)
        } else {
            console.log(`Current class: ${this.player.class}`)
        }
    }

    toggleHomeShop() {
        this.homeShopOpen = !this.homeShopOpen
        const shopMenu = document.getElementById('homeShopMenu')
        if (shopMenu) {
            shopMenu.style.display = this.homeShopOpen ? 'block' : 'none'
            if (this.homeShopOpen) this.renderHomeShop()
        }
    }

    renderHomeShop() {
        const shopItems = document.getElementById('homeShopItems')
        if (!shopItems) return

        shopItems.innerHTML = ''

        const grouped = {
            healing: [],
            combat: [],
            utility: [],
            class: []
        }

        this.homeShopInventory.forEach(item => {
            grouped[item.category] = grouped[item.category] || []
            grouped[item.category].push(item)
        })

        const categories = [
            { key: 'healing', label: 'Healing Loadout' },
            { key: 'combat', label: 'Combat Loadout' },
            { key: 'utility', label: 'Utility Loadout' },
            { key: 'class', label: 'Classes' }
        ]

        categories.forEach(cat => {
            const heading = document.createElement('div')
            heading.style.cssText = 'margin: 18px 0 8px; font-weight: bold; color: #7cffb2; letter-spacing: 0.05em;'
            heading.textContent = cat.label
            shopItems.appendChild(heading)

            grouped[cat.key].forEach(item => {
                const itemDiv = document.createElement('div')
                itemDiv.style.cssText = `
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    padding: 14px;
                    border-radius: 12px;
                    cursor: pointer;
                    display: grid;
                    gap: 6px;
                    transition: background 0.2s ease;
                `
                itemDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: #f1c40f">${item.name}</strong>
                        <span style="color: #ffcc00; font-weight: bold;">${item.cost}g</span>
                    </div>
                    <div style="color: #d4f7d7;">${item.description}</div>
                    <div style="color: #79d2ff; font-size: 13px;">Category: ${item.category}</div>
                `
                itemDiv.onclick = () => this.buyItem(item.id, item.cost, item)
                itemDiv.onmouseover = () => itemDiv.style.background = 'rgba(255, 255, 255, 0.12)'
                itemDiv.onmouseout = () => itemDiv.style.background = 'rgba(255, 255, 255, 0.05)'
                shopItems.appendChild(itemDiv)
            })
        })
    }

    buyItem(itemId, cost, itemData = null) {
        if (this.player.gold < cost) {
            alert('Not enough gold!')
            return
        }

        this.player.gold -= cost
        localStorage.setItem('potatoGold', this.player.gold)
        const itemType = itemData ? itemData.type : 'shop'
        const inventoryItem = { id: itemId, name: itemData ? itemData.name : itemId, type: itemType, category: itemData ? itemData.category : null }

        if (itemType === 'class') {
            if (!this.player.ownedClasses.includes(itemId)) {
                this.player.ownedClasses.push(itemId)
                this.player.classLevels[itemId] = 1
                localStorage.setItem('potatoOwnedClasses', JSON.stringify(this.player.ownedClasses))
                localStorage.setItem('potatoClassLevels', JSON.stringify(this.player.classLevels))
            }
            this.applyClass(itemId)
        } else {
            this.addInventoryItem(inventoryItem)
        }

        this.updateUI()
        if (this.homeShopOpen) this.renderHomeShop()
    }

    applyClass(classId) {
        const classData = this.classes[classId]
        if (!classData) return

        this.player.class = classId
        localStorage.setItem('potatoEquippedClass', classId)

        const level = this.player.classLevels[classId] || 1
        const statMultiplier = 1 + (level - 1) * 0.05

        const baseHealth = classData.stats.health || 100
        this.player.maxHeartPoints = baseHealth * statMultiplier
        this.player.hearts = 3
        this.player.heartPoints = this.player.maxHeartPoints
    }

    equipLoadout(category, itemId) {
        if (!['healing', 'combat', 'utility'].includes(category)) return
        const item = this.player.inventory.find(entry => entry.category === category && entry.id === itemId)
        if (!item) return
        this.player.loadout[category] = itemId
        this.updateUI()
        if (this.inventoryOpen) this.renderInventory()
    }

    applyLoadoutEffects(deltaTime) {
        const loadout = this.player.loadout
        const activeClass = this.player.class || 'noob'
        const classInfo = this.classes[activeClass]
        const classLevel = this.player.classLevels[activeClass] || 1
        const statMultiplier = 1 + (classLevel - 1) * 0.05

        // Reset dynamic modifiers before applying
        this.player.loadoutDamageBonus = 0
        this.player.loadoutSpeedBonus = 0
        this.player.loadoutDamageReduction = 0
        this.player.loadoutLootBonus = 0

        if (loadout.healing === 'regeneration') {
            this.healPlayer(4 * deltaTime)
        }
        if (loadout.healing === 'medkit') {
            this.healPlayer(2 * deltaTime)
        }
        if (loadout.healing === 'medkit_loot' || loadout.healing === 'medkit') {
            this.healPlayer(2.5 * deltaTime)
        }
        if (loadout.healing === 'meat_loot' || loadout.healing === 'meat') {
            this.healPlayer(1.5 * deltaTime)
        }
        if (loadout.combat === 'damage_boost') {
            this.player.loadoutDamageBonus += 5
        }
        if (loadout.combat === 'speed_boost') {
            this.player.loadoutSpeedBonus += 10
        }
        if (loadout.combat === 'boost_potion') {
            this.player.loadoutDamageBonus += 5
            this.player.loadoutSpeedBonus += 15
        }
        if (loadout.combat === 'pistol') {
            this.player.loadoutDamageBonus += 8
        }
        if (loadout.combat === 'rifle') {
            this.player.loadoutDamageBonus += 15
        }
        if (loadout.combat === 'shotgun') {
            this.player.loadoutDamageBonus += 25
        }
        if (loadout.combat === 'gun_drop' || loadout.combat === 'gun') {
            this.player.loadoutDamageBonus += 3 // Small bonus from dropped guns
        }
        if (loadout.utility === 'loot_boost') {
            this.player.loadoutLootBonus += 0.2
        }
        if (loadout.utility === 'armour_piece') {
            this.player.loadoutDamageReduction += 0.15
        }

        const baseDamage = (classInfo?.stats.damage || 10) * statMultiplier
        const baseSpeed = (classInfo?.stats.speed || 120) * statMultiplier
        const baseLootRate = (classInfo?.stats.lootRate || 0.5) * statMultiplier

        this.player.damage = baseDamage + this.player.loadoutDamageBonus
        this.player.speed = baseSpeed + this.player.loadoutSpeedBonus
        this.player.lootRate = baseLootRate + this.player.loadoutLootBonus

        const baseHealth = classInfo?.stats.health || 100
        this.player.maxHeartPoints = baseHealth * statMultiplier
    }
    startBattle() {
        // Ensure a class is selected
        if (!this.player.class) {
            this.applyClass('noob')
        } else {
            this.applyClass(this.player.class)
        }
        this.isHome = false
        this.hideAllOverlays()
        this.resetBattlefield()
        this.updateUI()
        this.showHomeButton()
    }

    showHomeScreen() {
        const homeScreen = document.getElementById('homeScreen')
        if (homeScreen) homeScreen.style.display = 'flex'
        this.isHome = true
        this.hideHomeButton()
        // Update class display
        const currentClassName = document.getElementById('currentClassName')
        if (currentClassName) {
            const className = this.player.class || 'None (Select in Shop)'
            currentClassName.textContent = className.replace(/_/g, ' ')
        }
        // Update gold display
        const homeGoldValue = document.getElementById('homeGoldValue')
        if (homeGoldValue) {
            homeGoldValue.textContent = this.player.gold
        }
    }

    hideAllOverlays() {
        const homeScreen = document.getElementById('homeScreen')
        const homeShopMenu = document.getElementById('homeShopMenu')
        const inventoryMenu = document.getElementById('inventoryMenu')
        const settingsMenu = document.getElementById('settingsMenu')
        if (homeScreen) homeScreen.style.display = 'none'
        if (homeShopMenu) homeShopMenu.style.display = 'none'
        if (inventoryMenu) inventoryMenu.style.display = 'none'
        if (settingsMenu) settingsMenu.style.display = 'none'
        this.homeShopOpen = false
        this.inventoryOpen = false
        this.bindingAction = null
    }

    openInventory() {
        const inventoryMenu = document.getElementById('inventoryMenu')
        if (!inventoryMenu) return
        this.inventoryOpen = !this.inventoryOpen
        inventoryMenu.style.display = this.inventoryOpen ? 'block' : 'none'
        if (this.inventoryOpen) this.renderInventory()
    }

    openSettings() {
        const settingsMenu = document.getElementById('settingsMenu')
        if (!settingsMenu) return
        this.renderSettings()
        settingsMenu.style.display = 'block'
        this.inventoryOpen = false
        const inventoryMenu = document.getElementById('inventoryMenu')
        if (inventoryMenu) inventoryMenu.style.display = 'none'
        const shopMenu = document.getElementById('homeShopMenu')
        if (shopMenu) shopMenu.style.display = 'none'
        this.homeShopOpen = false
        this.updateSettingsUI()
    }

    toggleMovementMode() {
        this.player.movementMode = this.player.movementMode === 'keyboard' ? 'mouse' : 'keyboard'
        localStorage.setItem('potatoMovementMode', this.player.movementMode)
        this.updateSettingsUI()
    }

    updateSettingsUI() {
        const toggleBtn = document.getElementById('movementModeToggle')
        if (toggleBtn) {
            toggleBtn.textContent = this.player.movementMode === 'keyboard' ? 'Keyboard (WASD)' : 'Mouse Pointer'
        }
    }

    closeSettings() {
        const settingsMenu = document.getElementById('settingsMenu')
        if (settingsMenu) settingsMenu.style.display = 'none'
        this.bindingAction = null
        const bindingHint = document.getElementById('bindingHint')
        if (bindingHint) bindingHint.textContent = 'Click a control button to rebind it.'
    }

    renderSettings() {
        const controlsSettings = document.getElementById('controlsSettings')
        if (!controlsSettings) return
        const bindings = [
            { action: 'up', label: 'Move Up' },
            { action: 'down', label: 'Move Down' },
            { action: 'left', label: 'Move Left' },
            { action: 'right', label: 'Move Right' },
            { action: 'shoot', label: 'Shoot' },
            { action: 'ability', label: 'Ability' },
            { action: 'useItem', label: 'Use Item' },
            { action: 'inventory', label: 'Inventory' },
            { action: 'shop', label: 'Shop / Home' },
            { action: 'settings', label: 'Open Settings' }
        ]
        controlsSettings.innerHTML = bindings.map(binding => `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px; background: rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15); border-radius:10px;">
                <span>${binding.label}</span>
                <button id="control-${binding.action}" style="padding: 10px 14px; border:none; border-radius:10px; background:#00ff88; color:#061c10; cursor:pointer; font-weight:bold;">${this.formatKeyLabel(this.controls[binding.action])}</button>
            </div>
        `).join('')

        bindings.forEach(binding => {
            const button = document.getElementById(`control-${binding.action}`)
            if (button) {
                button.onclick = () => this.beginKeyBinding(binding.action)
            }
        })
    }

    beginKeyBinding(action) {
        this.bindingAction = action
        const bindingHint = document.getElementById('bindingHint')
        if (bindingHint) {
            bindingHint.textContent = `Press a key to bind "${this.getActionLabel(action)}".`
        }
    }

    saveControlSettings() {
        localStorage.setItem('potatoGameControls', JSON.stringify(this.controls))
        const bindingHint = document.getElementById('bindingHint')
        if (bindingHint) {
            bindingHint.textContent = 'Controls saved.'
        }
    }

    loadControlSettings() {
        const saved = localStorage.getItem('potatoGameControls')
        if (!saved) return
        try {
            const loaded = JSON.parse(saved)
            this.controls = Object.assign(this.controls, loaded)
        } catch (err) {
            console.warn('Failed to load saved controls', err)
        }
    }

    getActionLabel(action) {
        const labels = {
            up: 'Move Up',
            down: 'Move Down',
            left: 'Move Left',
            right: 'Move Right',
            shoot: 'Shoot',
            ability: 'Ability',
            useItem: 'Use Item',
            inventory: 'Inventory',
            shop: 'Shop / Home',
            settings: 'Open Settings'
        }
        return labels[action] || action
    }

    formatKeyLabel(key) {
        if (!key) return 'Unbound'
        if (key === ' ') return 'Space'
        if (key.startsWith('arrow')) return key.slice(0, 5).toUpperCase() + key.slice(5)
        return key.length === 1 ? key.toUpperCase() : key[0].toUpperCase() + key.slice(1)
    }

    getAbilityLabel(ability) {
        const labels = {
            attack_boost: 'Attack Boost',
            dash: 'Dash',
            tech_abilities: 'Tech Ability'
        }
        return labels[ability] || ability.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    applyFlamethrower(deltaTime) {
        const range = 90
        const damageRate = 35

        for (let i = this.mobs.length - 1; i >= 0; i--) {
            const mob = this.mobs[i]
            const dist = Math.hypot(this.player.x - mob.x, this.player.y - mob.y)
            if (dist < range) {
                mob.health -= damageRate * deltaTime
                if (mob.health <= 0) {
                    this.killMob(mob)
                    this.mobs.splice(i, 1)
                }
            }
        }

        this.bosses.forEach(boss => {
            if (boss.defeated) return
            const dist = Math.hypot(this.player.x - boss.x, this.player.y - boss.y)
            if (dist < range) {
                boss.health -= 20 * deltaTime
                if (boss.health <= 0) {
                    this.defeatBoss(boss)
                }
            }
        })
    }

    updateMegaRobot(deltaTime) {
        const robot = this.player.megaRobot
        if (!robot) return

        const nearestMob = this.mobs.reduce((closest, mob) => {
            const dist = Math.hypot(robot.x - mob.x, robot.y - mob.y)
            if (!closest || dist < closest.dist) return { mob, dist }
            return closest
        }, null)

        if (nearestMob && nearestMob.dist > 0) {
            const dx = nearestMob.mob.x - robot.x
            const dy = nearestMob.mob.y - robot.y
            const dist = Math.hypot(dx, dy)
            const speed = 160
            robot.x += (dx / dist) * speed * deltaTime
            robot.y += (dy / dist) * speed * deltaTime

            if (dist < robot.size / 2 + nearestMob.mob.size / 2) {
                nearestMob.mob.health -= 28 * deltaTime
                if (nearestMob.mob.health <= 0) {
                    this.killMob(nearestMob.mob)
                    this.mobs = this.mobs.filter(m => m !== nearestMob.mob)
                }
            }
        } else {
            const targetX = this.player.x + 50
            const targetY = this.player.y
            robot.x += (targetX - robot.x) * 5 * deltaTime
            robot.y += (targetY - robot.y) * 5 * deltaTime
        }
    }

    renderInventory() {
        const inventoryContents = document.getElementById('inventoryContents')
        if (!inventoryContents) return

        inventoryContents.innerHTML = ''
        const inventoryList = [...this.player.inventory]

        const categories = [
            { key: 'healing', label: 'Healing' },
            { key: 'combat', label: 'Combat' },
            { key: 'utility', label: 'Utility' }
        ]

        const loadoutPanel = document.createElement('div')
        loadoutPanel.style.cssText = `
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 14px;
            border-radius: 12px;
            margin-bottom: 16px;
            color: #e2f9ff;
        `
        loadoutPanel.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #7cffb2;">Current Loadout</div>
            ${categories.map(cat => {
                const equipped = this.player.loadout[cat.key] ? this.player.loadout[cat.key].replace(/_/g, ' ') : 'None'
                return `<div style="margin: 6px 0;">${cat.label}: <strong style="color: #ffcc00">${equipped}</strong></div>`
            }).join('')}
            <div style="margin-top: 10px; color: #cbd5e1; font-size: 13px;">Click any compatible item below to equip it into its loadout slot.</div>
        `
        inventoryContents.appendChild(loadoutPanel)

        const classesPanel = document.createElement('div')
        classesPanel.style.cssText = `
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 14px;
            border-radius: 12px;
            margin-bottom: 16px;
            color: #e2f9ff;
        `
        let classesHtml = `<div style="font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #7cffb2;">Classes & Upgrade Trees</div>`
        classesHtml += `<div style="margin-bottom: 10px; color: #ffda75; font-size: 14px; font-weight: bold;">Persistent XP Balance: ${this.player.xpBalance} XP</div>`
        classesHtml += `<div style="display: grid; gap: 12px;">`

        this.player.ownedClasses.forEach(classId => {
            const classConfig = this.classes[classId]
            if (!classConfig) return
            const currentLevel = this.player.classLevels[classId] || 1
            const statMultiplier = 1 + (currentLevel - 1) * 0.05
            
            const isEquipped = this.player.class === classId
            const levelUpCost = currentLevel * 200
            const nextClassId = classConfig.upgrades && classConfig.upgrades[0]
            const nextClassConfig = nextClassId ? this.classes[nextClassId] : null

            classesHtml += `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span><strong style="color: #79d2ff; text-transform: uppercase;">${classId.replace(/_/g, ' ')}</strong> (Level ${currentLevel})</span>
                        ${isEquipped ? `<span style="background: #00ff88; color: #061c10; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">Active</span>` : ''}
                    </div>
                    <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px;">
                        <div>HP: ${Math.round(classConfig.stats.health * statMultiplier)}</div>
                        <div>Speed: ${Math.round(classConfig.stats.speed * statMultiplier)}</div>
                        <div>Damage: ${Math.round(classConfig.stats.damage * statMultiplier)}</div>
                        <div>Loot Rate: ${(classConfig.stats.lootRate * statMultiplier).toFixed(2)}x</div>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            `

            if (!isEquipped) {
                classesHtml += `<button onclick="window.game.equipClass('${classId}')" style="padding: 6px 12px; border: none; border-radius: 6px; background: #00bfff; color: #061c10; font-weight: bold; cursor: pointer; font-size: 12px;">Equip</button>`
            }

            classesHtml += `<button onclick="window.game.levelUpClass('${classId}')" ${this.player.xpBalance < levelUpCost ? 'disabled' : ''} style="padding: 6px 12px; border: none; border-radius: 6px; background: ${this.player.xpBalance < levelUpCost ? '#4b5563' : '#ffda75'}; color: ${this.player.xpBalance < levelUpCost ? '#9ca3af' : '#1d1700'}; font-weight: bold; cursor: pointer; font-size: 12px;">Level Up (${levelUpCost} XP)</button>`

            if (nextClassConfig) {
                const canUpgrade = this.player.gold >= nextClassConfig.cost
                classesHtml += `<button onclick="window.game.upgradeClass('${classId}')" ${!canUpgrade ? 'disabled' : ''} style="padding: 6px 12px; border: none; border-radius: 6px; background: ${!canUpgrade ? '#4b5563' : '#ffcc00'}; color: ${!canUpgrade ? '#9ca3af' : '#1d1700'}; font-weight: bold; cursor: pointer; font-size: 12px;">Upgrade to ${nextClassId.replace(/_/g, ' ')} (${nextClassConfig.cost}g)</button>`
            }

            classesHtml += `
                    </div>
                </div>
            `
        })

        classesHtml += `</div>`
        classesPanel.innerHTML = classesHtml
        inventoryContents.appendChild(classesPanel)

        if (inventoryList.length === 0) {
            const emptyMessage = document.createElement('div')
            emptyMessage.style.color = '#cbd5e1'
            emptyMessage.textContent = 'Inventory is empty. Collect loot and buy upgrades from the home shop.'
            inventoryContents.appendChild(emptyMessage)
            return
        }

        inventoryList.forEach(item => {
            const itemDiv = document.createElement('div')
            itemDiv.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.12);
                padding: 12px;
                border-radius: 10px;
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 10px;
                color: #e2f9ff;
                align-items: center;
            `
            itemDiv.innerHTML = `
                <div>
                    <strong>${item.name}</strong><br>
                    <span style="font-size: 13px; color: #a7f3d0">${item.category || item.type}</span><br>
                    <span style="color: #f8f9fa; font-size: 13px;">${item.id}</span>
                </div>
            `
            if (item.type === 'loot') {
                const button = document.createElement('button')
                button.textContent = 'Use'
                button.style.cssText = `
                    padding: 8px 12px;
                    cursor: pointer;
                    border-radius: 8px;
                    border: none;
                    background: #00bfff;
                    color: #061c10;
                    font-weight: bold;
                `
                button.onclick = () => this.useInventoryItem(this.player.inventory.indexOf(item))
                itemDiv.appendChild(button)
            } else if (['healing', 'combat', 'utility'].includes(item.category)) {
                const button = document.createElement('button')
                button.textContent = this.player.loadout[item.category] === item.id ? 'Equipped' : 'Equip'
                button.disabled = this.player.loadout[item.category] === item.id
                button.style.cssText = `
                    padding: 8px 12px;
                    cursor: pointer;
                    border-radius: 8px;
                    border: none;
                    background: ${button.disabled ? '#4b5563' : '#00ff88'};
                    color: ${button.disabled ? '#d1d5db' : '#061c10'};
                    font-weight: bold;
                `
                button.onclick = () => this.equipLoadout(item.category, item.id)
                itemDiv.appendChild(button)
            }
            inventoryContents.appendChild(itemDiv)
        })
    }

    equipClass(classId) {
        this.applyClass(classId)
        this.updateUI()
        if (this.inventoryOpen) this.renderInventory()
    }

    levelUpClass(classId) {
        const currentLevel = this.player.classLevels[classId] || 1
        const cost = currentLevel * 200
        if (this.player.xpBalance < cost) {
            alert('Not enough XP Balance!')
            return
        }

        this.player.xpBalance -= cost
        localStorage.setItem('potatoXpBalance', this.player.xpBalance)

        this.player.classLevels[classId] = currentLevel + 1
        localStorage.setItem('potatoClassLevels', JSON.stringify(this.player.classLevels))

        if (this.player.class === classId) {
            this.applyClass(classId)
        }

        this.updateUI()
        if (this.inventoryOpen) this.renderInventory()
    }

    upgradeClass(classId) {
        const classConfig = this.classes[classId]
        if (!classConfig || !classConfig.upgrades || classConfig.upgrades.length === 0) return

        const nextClassId = classConfig.upgrades[0]
        const nextClassConfig = this.classes[nextClassId]
        if (!nextClassConfig) return

        const cost = nextClassConfig.cost
        if (this.player.gold < cost) {
            alert('Not enough gold!')
            return
        }

        this.player.gold -= cost
        localStorage.setItem('potatoGold', this.player.gold)

        // Replace old class with new class in ownedClasses
        const index = this.player.ownedClasses.indexOf(classId)
        if (index !== -1) {
            this.player.ownedClasses[index] = nextClassId
        } else {
            this.player.ownedClasses.push(nextClassId)
        }
        localStorage.setItem('potatoOwnedClasses', JSON.stringify(this.player.ownedClasses))

        // Inherit class level
        this.player.classLevels[nextClassId] = this.player.classLevels[classId] || 1
        delete this.player.classLevels[classId]
        localStorage.setItem('potatoClassLevels', JSON.stringify(this.player.classLevels))

        // If old class was equipped, equip the upgraded one
        if (this.player.class === classId) {
            this.applyClass(nextClassId)
        }

        this.updateUI()
        if (this.inventoryOpen) this.renderInventory()
    }

    addInventoryItem(item) {
        if (item.type === 'loot') {
            this.player.inventory.push(item)
            return
        }
        if (!this.player.inventory.some(entry => entry.id === item.id && entry.type === item.type)) {
            this.player.inventory.push(item)
        }
    }

    useItem() {
        const index = this.player.inventory.findIndex(item => item.type === 'loot')
        if (index === -1) return
        this.useInventoryItem(index)
    }

    useInventoryItem(index) {
        const item = this.player.inventory[index]
        if (!item || item.type !== 'loot') return

        if (!this.applyLootEffect(item)) {
            return
        }

        this.player.inventory.splice(index, 1)
        this.updateUI()
        if (this.inventoryOpen) this.renderInventory()
    }

    applyLootEffect(item) {
        switch (item.id) {
            case 'health_potion':
            case 'medkit':
                this.healPlayer(100)
                alert(`Used ${item.name}`)
                return true
            case 'meat':
                this.healPlayer(50)
                alert(`Used ${item.name}`)
                return true
            case 'gun_drop':
                this.player.damage += 2
                alert(`Used ${item.name}. Damage increased.`)
                return true
            default:
                alert(`Can't use ${item.name} right now.`)
                return false
        }
    }

    confirmReturnHome() {
        if (!confirm('Return to home and reset battlefield progress?')) {
            return
        }
        this.returnToHome()
    }

    returnToHome() {
        this.resetBattlefield()
        this.showHomeScreen()
        this.updateUI()
    }

    resetBattlefield() {
        this.mobs = []
        this.bullets = []
        this.bossBullets = []
        this.items = []
        this.allies = []
        this.kills = 0
        this.initializeBosses()
        // Ensure player doesn't spawn near a boss
        let validSpawn = false
        let attempts = 0
        while (!validSpawn && attempts < 50) {
            this.player.x = this.player.runStartX + (Math.random() - 0.5) * 200
            this.player.y = this.player.runStartY + (Math.random() - 0.5) * 200
            validSpawn = true
            for (const boss of this.bosses) {
                const dist = Math.sqrt((this.player.x - boss.x) ** 2 + (this.player.y - boss.y) ** 2)
                if (dist < 300) {
                    validSpawn = false
                    break
                }
            }
            attempts++
        }
        if (!validSpawn) {
            this.player.x = this.player.runStartX
            this.player.y = this.player.runStartY
        }
        this.player.hearts = 3
        this.player.heartPoints = this.player.maxHeartPoints
        this.player.exp = 0
        this.player.expGoal = 400
        this.player.dashActive = false
        this.player.dashSpeedMultiplier = 1
        this.player.abilityActive = false
        this.player.abilityDuration = 0
        this.player.abilityCooldown = 0
        this.player.shield = false
        this.player.flamethrower = false
        this.player.megaRobot = null
        this.player.shieldHp = 0
        this.player.runDamageBonus = 0
    }

    showHomeButton() {
        const homeButton = document.getElementById('homeButton')
        if (homeButton) homeButton.style.display = 'block'
    }

    hideHomeButton() {
        const homeButton = document.getElementById('homeButton')
        if (homeButton) homeButton.style.display = 'none'
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
                    speed: 30 + level * 4,
                    damage: 5 + level * 2,
                    exp: 10 + level * 10,
                    gold: 5 + level * 3,
                    color: ['#ff6b6b', '#ff8c42', '#a64dff'][Math.floor(Math.random() * 3)],
                    level: level,
                    wander: { dx: 0, dy: 0 }
                })
            }
        }
    }

    updateMobs(deltaTime) {
        this.mobs.forEach((mob, index) => {
            const dx = this.player.x - mob.x
            const dy = this.player.y - mob.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const chaseRadius = 150
            const forgetRadius = 250

            if (dist < chaseRadius && !this.player.invisible) {
                // Player is nearby: chase toward the player
                mob.wander = { dx: 0, dy: 0 }
                if (dist > 0) {
                    mob.x += (dx / dist) * mob.speed * deltaTime
                    mob.y += (dy / dist) * mob.speed * deltaTime
                }
            } else if (dist > forgetRadius || this.player.invisible) {
                // Player is far away or invisible: wander slowly
                if (!mob.wander || Math.random() < 0.005) {
                    const angle = Math.random() * Math.PI * 2
                    mob.wander = { dx: Math.cos(angle), dy: Math.sin(angle) }
                }
                mob.x += mob.wander.dx * mob.speed * deltaTime * 0.2
                mob.y += mob.wander.dy * mob.speed * deltaTime * 0.2
            } else {
                // Player is in middle range: wander randomly but don't chase
                if (!mob.wander || Math.random() < 0.01) {
                    const angle = Math.random() * Math.PI * 2
                    mob.wander = { dx: Math.cos(angle), dy: Math.sin(angle) }
                }
                mob.x += mob.wander.dx * mob.speed * deltaTime * 0.3
                mob.y += mob.wander.dy * mob.speed * deltaTime * 0.3
            }

            // Keep mobs in bounds
            mob.x = Math.max(0, Math.min(this.worldWidth, mob.x))
            mob.y = Math.max(0, Math.min(this.worldHeight, mob.y))

            // Attack player if close and visible
            if (dist < 30 && !this.player.invisible) {
                let damage = mob.damage
                if (this.player.shieldActive > 0) {
                    damage *= 0.5
                }
                        this.applyDamage(damage * deltaTime)
            }
        })
    }

    updateBosses(deltaTime) {
        this.bosses.forEach(boss => {
            if (boss.defeated) return

            // Initialize boss cooldown if not present
            if (!boss.shootCooldown) boss.shootCooldown = 0

            const dx = this.player.x - boss.x
            const dy = this.player.y - boss.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            // Boss shoots periodically at player
            boss.shootCooldown -= deltaTime
            if (boss.shootCooldown <= 0 && dist < 800) {
                const bossProps = {
                    boss_plain: { damage: 22, speed: 220, minCd: 0.7, maxCd: 1.1 },
                    boss_snowy: { damage: 20, speed: 240, minCd: 0.6, maxCd: 1.0 },
                    boss_volcano: { damage: 24, speed: 260, minCd: 0.5, maxCd: 0.9 },
                    boss_jungle: { damage: 21, speed: 230, minCd: 0.6, maxCd: 1.0 },
                    boss_desert: { damage: 23, speed: 240, minCd: 0.6, maxCd: 1.0 }
                }
                const props = bossProps[boss.id] || { damage: 20, speed: 220, minCd: 0.7, maxCd: 1.1 }
                const angle = Math.atan2(dy, dx)
                this.bossBullets.push({
                    x: boss.x,
                    y: boss.y,
                    dx: Math.cos(angle) * props.speed,
                    dy: Math.sin(angle) * props.speed,
                    damage: props.damage,
                    size: 8
                })
                boss.shootCooldown = props.minCd + Math.random() * (props.maxCd - props.minCd)
            }

            // Boss takes damage from bullets
            if (boss.hitFlash === undefined) boss.hitFlash = 0
            if (boss.hitFlash > 0) boss.hitFlash -= deltaTime
        })
    }

    updateBossBullets(deltaTime) {
        this.bossBullets = this.bossBullets.filter(bullet => {
            bullet.x += bullet.dx * deltaTime
            bullet.y += bullet.dy * deltaTime

            // Check collision with player
            const dx = this.player.x - bullet.x
            const dy = this.player.y - bullet.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < this.player.size / 2 + bullet.size) {
                let damage = bullet.damage
                if (this.player.loadout.utility === 'armour_piece') {
                    damage *= 0.85 // 15% damage reduction
                }
                if (this.player.shieldActive > 0) {
                    damage *= 0.5
                }
                this.applyDamage(damage)
                return false // Remove bullet
            }

            return bullet.x > 0 && bullet.x < this.worldWidth && bullet.y > 0 && bullet.y < this.worldHeight
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

    gainGold(amount) {
        this.player.gold += amount
        localStorage.setItem('potatoGold', this.player.gold)
    }

    gainXp(amount) {
        this.player.exp += amount
        this.player.xpBalance += amount
        localStorage.setItem('potatoXpBalance', this.player.xpBalance)

        while (this.player.exp >= this.player.expGoal) {
            this.player.exp -= this.player.expGoal
            this.player.expGoal = Math.round(this.player.expGoal * 1.25)
            if (this.player.expGoal < 400) this.player.expGoal = 400
        }
    }

    killMob(mob) {
        this.kills++
        this.gainGold(mob.gold)
        this.gainXp(mob.exp)

        // Drop loot
        const baseDropChance = 0.2 + (mob.level || 1) * 0.06
        const dropChance = baseDropChance * (1 + (this.player.loadoutLootBonus || 0))
        if (Math.random() < dropChance) {
            let lootType = 'xp'
            const level = mob.level || 1
            const r = Math.random()
            
            if (level <= 2) {
                lootType = r < 0.4 ? 'xp' : (r < 0.8 ? 'gold' : 'meat')
            } else if (level <= 4) {
                lootType = r < 0.3 ? 'xp' : (r < 0.6 ? 'gold' : (r < 0.8 ? 'meat' : 'medkit'))
            } else {
                lootType = r < 0.25 ? 'xp' : (r < 0.5 ? 'gold' : (r < 0.65 ? 'meat' : (r < 0.8 ? 'medkit' : (r < 0.92 ? 'gun' : 'armor_scrap'))))
            }

            this.items.push({
                x: mob.x,
                y: mob.y,
                type: lootType,
                value: lootType === 'xp' ? mob.exp : lootType === 'gold' ? mob.gold : 1,
                size: 8
            })
        }
    }

    defeatBoss(boss) {
        boss.defeated = true
        this.gainXp(500)
        this.gainGold(1000)

        // Check win condition
        if (this.bosses.every(b => b.defeated)) {
            this.winGame()
        }
    }

    updateItems(deltaTime) {
        this.items.forEach((item, index) => {
            const dist = Math.sqrt((this.player.x - item.x) ** 2 + (this.player.y - item.y) ** 2)

            if (this.player.loadout.utility === 'loot_magnet' && dist < 160) {
                const attractX = (this.player.x - item.x) * 0.03
                const attractY = (this.player.y - item.y) * 0.03
                item.x += attractX
                item.y += attractY
            }

            if (dist < 30) {
                // Pickup item
                switch (item.type) {
                    case 'xp':
                        this.gainXp(item.value)
                        break
                    case 'gold':
                        this.gainGold(item.value)
                        break
                    case 'medkit':
                        this.healPlayer(100)
                        this.addInventoryItem({ id: 'medkit', name: 'Medkit Loot', type: 'loot', category: 'healing' })
                        break
                    case 'meat':
                        this.healPlayer(50)
                        this.addInventoryItem({ id: 'meat', name: 'Meat Loot', type: 'loot', category: 'healing' })
                        break
                    case 'gun':
                        this.player.runDamageBonus = (this.player.runDamageBonus || 0) + 2
                        this.addInventoryItem({ id: 'gun_drop', name: 'Dropped Gun', type: 'loot', category: 'combat' })
                        break
                    case 'armor_scrap':
                        this.player.shieldHp = (this.player.shieldHp || 0) + 30
                        this.addInventoryItem({ id: 'armour_piece', name: 'Armor Scrap', type: 'loot', category: 'utility' })
                        break
                }
                this.items.splice(index, 1)
            }
        })
    }

    updateCamera() {
        // Compute camera in CSS pixel space (canvas logical size is scaled)
        this.camera.x = this.player.x - this.renderer.width / 2
        this.camera.y = this.player.y - this.renderer.height / 2

        // Round camera to integer pixels to avoid sub-pixel jitter
        this.camera.x = Math.floor(this.camera.x)
        this.camera.y = Math.floor(this.camera.y)

        // Keep camera in bounds
        this.camera.x = Math.max(0, Math.min(this.worldWidth - this.renderer.width, this.camera.x))
        this.camera.y = Math.max(0, Math.min(this.worldHeight - this.renderer.height, this.camera.y))
    }

    updateUI() {
        const healthEl = document.getElementById('healthValue')
        const healthBarFill = document.getElementById('healthBarFill')
        const healthPercent = Math.max(0, Math.min(100, Math.round((this.player.heartPoints / this.player.maxHeartPoints) * 100)))
        if (healthEl) {
            const fullHearts = Math.max(0, Math.min(3, this.player.hearts))
            const hearts = '♥'.repeat(fullHearts) + '♡'.repeat(3 - fullHearts)
            healthEl.textContent = hearts
        }
        if (healthBarFill) {
            healthBarFill.style.width = `${healthPercent}%`
        }
        document.getElementById('expValue').textContent = `${this.player.exp}/${this.player.expGoal}`
        document.getElementById('goldValue').textContent = this.player.gold
        document.getElementById('mobCount').textContent = this.mobs.length
        document.getElementById('killCount').textContent = this.kills

        const homeGoldEl = document.getElementById('homeGoldValue')
        if (homeGoldEl) homeGoldEl.textContent = this.player.gold

        const abilityDisplay = document.getElementById('abilityDisplay')
        const abilityEl = document.getElementById('dashAbility')
        const classData = this.player.class ? this.classes[this.player.class] : null
        const hasAbility = classData && classData.ability

        if (!abilityDisplay || !abilityEl) return

        if (!hasAbility) {
            abilityDisplay.style.display = 'none'
            return
        }

        abilityDisplay.style.display = 'block'
        const abilityLabel = this.getAbilityLabel(classData.ability)

        if (this.player.abilityActive && this.player.abilityDuration > 0) {
            abilityEl.textContent = `${abilityLabel} [${this.formatKeyLabel(this.controls.ability)}]: Active ${Math.ceil(this.player.abilityDuration / 1000)}s`
            abilityEl.className = 'ability ready'
        } else if (this.player.abilityCooldown > 0) {
            abilityEl.textContent = `${abilityLabel} [${this.formatKeyLabel(this.controls.ability)}]: ${Math.ceil(this.player.abilityCooldown / 1000)}s`
            abilityEl.className = 'ability cooldown'
        } else {
            abilityEl.textContent = `${abilityLabel} [${this.formatKeyLabel(this.controls.ability)}]: Ready`
            abilityEl.className = 'ability ready'
        }
    }

    applyDamage(amount) {
        if (this.player.hearts <= 0) return
        let remaining = amount

        if (this.player.shieldHp > 0) {
            if (remaining <= this.player.shieldHp) {
                this.player.shieldHp -= remaining
                remaining = 0
            } else {
                remaining -= this.player.shieldHp
                this.player.shieldHp = 0
            }
        }

        while (remaining > 0 && this.player.hearts > 0) {
            this.player.heartPoints -= remaining
            if (this.player.heartPoints > 0) {
                remaining = 0
                break
            }

            remaining = Math.abs(this.player.heartPoints)
            this.player.hearts -= 1

            if (this.player.hearts <= 0) {
                this.player.heartPoints = 0
                this.gameOver()
                return
            }

            this.player.heartPoints = this.player.maxHeartPoints
        }

        this.player.heartPoints = Math.max(0, this.player.heartPoints)
    }

    healPlayer(amount) {
        if (this.player.hearts <= 0) return
        let remaining = amount

        while (remaining > 0 && this.player.hearts < 3) {
            const amountToFill = this.player.maxHeartPoints - this.player.heartPoints
            if (remaining <= amountToFill) {
                this.player.heartPoints += remaining
                remaining = 0
                break
            }
            this.player.heartPoints = this.player.maxHeartPoints
            remaining -= amountToFill
            this.player.hearts += 1
        }

        if (remaining > 0) {
            this.player.heartPoints = Math.min(this.player.maxHeartPoints, this.player.heartPoints + remaining)
        }
    }

    render() {
        this.renderer.clear()
        this.renderer.drawInfiniteBackground(this.camera)
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

        // Draw boss bullets
        this.renderer.drawBossBullets(this.bossBullets, this.camera)

        // Draw player
        this.renderer.drawPlayer(this.player, this.camera, true)

        // Draw allies
        if (this.allies) {
            this.renderer.drawAllies(this.allies, this.camera)
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
        alert('You failed and lost all hearts. Returning to home.')
        this.player.hearts = 3
        this.player.heartPoints = this.player.maxHeartPoints
        this.player.x = 1000 // Reset to center-ish spawn point
        this.player.y = 1000
        
        // Clear any active abilities
        this.player.abilityActive = false
        this.player.abilityDuration = 0
        this.player.dashActive = false
        this.player.dashSpeedMultiplier = 1
        this.player.shieldActive = false
        this.player.shieldDuration = 0
        this.player.flamethrower = false
        this.player.flamethrowerDuration = 0
        this.player.megaRobot = null
        this.player.megaRobotDuration = 0
        this.player.attackBoost = 1

        this.hideAllOverlays()
        this.showHomeScreen()
    }

    winGame() {
        alert('Congratulations! You defeated all bosses and won the game!')
    }
}