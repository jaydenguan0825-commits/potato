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
            speed: 120,
            gold: 100,
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
        this.bossBullets = []
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
            { id: 'health_potion', name: 'Health Potion', cost: 50, description: 'Healing slot: restore 50 HP instantly.', type: 'healing', category: 'healing' },
            { id: 'regeneration', name: 'Regeneration', cost: 120, description: 'Healing slot: recover HP over time.', type: 'healing', category: 'healing' },
            { id: 'medkit', name: 'Medkit', cost: 80, description: 'Healing slot: slow regen plus first-aid heal.', type: 'healing', category: 'healing' },
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
            { id: 'pro', name: 'Class: Pro', cost: 100, description: 'Common upgrade with better loot rate.', type: 'class', category: 'class' },
            { id: 'epic', name: 'Class: Epic', cost: 500, description: 'Epic class with higher loot rate and health.', type: 'class', category: 'class' },
            { id: 'bloodthirsty_killer', name: 'Class: Bloodthirsty Killer', cost: 2000, description: 'Legendary class with attack boost ability.', type: 'class', category: 'class' },
            { id: 'speedster', name: 'Class: Speedster', cost: 200, description: 'Rare speed-focused class with low HP.', type: 'class', category: 'class' },
            { id: 'flash', name: 'Class: Flash', cost: 800, description: 'Rare class with even higher speed.', type: 'class', category: 'class' },
            { id: 'speed_demon', name: 'Class: Speed Demon', cost: 3000, description: 'Mythic class with invisibility ability.', type: 'class', category: 'class' },
            { id: 'mechanic', name: 'Class: Mechanic', cost: 500, description: 'Epic class with high loot chance.', type: 'class', category: 'class' },
            { id: 'genius', name: 'Class: Genius', cost: 2000, description: 'Legendary class with robot support.', type: 'class', category: 'class' },
            { id: 'tech_savvy', name: 'Class: Tech Savvy', cost: 5000, description: 'Godly class with powerful tech abilities.', type: 'class', category: 'class' }
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
                stats: { health: 80, speed: 180, damage: 8, lootRate: 0.8 },
                upgrades: ['flash', 'speed_demon'],
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
            { id: 'boss_plain', x: 1000, y: 1000, health: 2000, maxHealth: 2000, size: 60, color: '#8b008b', biome: 'plain', defeated: false },
            { id: 'boss_snowy', x: 200, y: 200, health: 1500, maxHealth: 1500, size: 50, color: '#6495ed', biome: 'snowy', defeated: false },
            { id: 'boss_volcano', x: 1800, y: 200, health: 1800, maxHealth: 1800, size: 55, color: '#ff4500', biome: 'volcano', defeated: false },
            { id: 'boss_jungle', x: 200, y: 1800, health: 1600, maxHealth: 1600, size: 52, color: '#228b22', biome: 'jungle', defeated: false },
            { id: 'boss_desert', x: 1800, y: 1800, health: 1700, maxHealth: 1700, size: 53, color: '#daa520', biome: 'desert', defeated: false }
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
        this.spawnMobs()
        this.updateCamera()
        this.updateUI()
    }

    updatePlayer(deltaTime) {
        // Movement
        let moveX = 0
        let moveY = 0

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
        this.player.x += moveX * this.player.speed * deltaTime
        this.player.y += moveY * this.player.speed * deltaTime

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
        const itemType = itemData ? itemData.type : 'shop'
        const inventoryItem = { id: itemId, name: itemData ? itemData.name : itemId, type: itemType, category: itemData ? itemData.category : null }

        if (itemType === 'class') {
            this.applyClass(itemId)
            this.addInventoryItem(inventoryItem)
        } else {
            this.addInventoryItem(inventoryItem)
            switch (itemId) {
                case 'health_potion':
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + 50)
                    break
                case 'pistol':
                case 'rifle':
                case 'shotgun':
                case 'loot_magnet':
                case 'boost_potion':
                case 'speed_boost':
                case 'damage_boost':
                case 'regeneration':
                case 'medkit':
                case 'loot_boost':
                case 'armour_piece':
                    // these are not immediate: equip them from inventory
                    break
            }
        }

        this.updateUI()
        if (this.homeShopOpen) this.renderHomeShop()
    }

    applyClass(classId) {
        const classData = this.classes[classId]
        if (!classData) return

        this.player.class = classId
        this.player.classLevel = 0
        Object.assign(this.player, classData.stats)
        this.player.maxHealth = classData.stats.health
        this.player.health = Math.min(this.player.health, this.player.maxHealth)
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

        // Reset dynamic modifiers before applying
        this.player.loadoutDamageBonus = 0
        this.player.loadoutSpeedBonus = 0
        this.player.loadoutDamageReduction = 0
        this.player.loadoutLootBonus = 0

        if (loadout.healing === 'regeneration') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 4 * deltaTime)
        }
        if (loadout.healing === 'medkit') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 2 * deltaTime)
        }
        if (loadout.healing === 'medkit_loot' || loadout.healing === 'medkit') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 2.5 * deltaTime)
        }
        if (loadout.healing === 'meat_loot' || loadout.healing === 'meat') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 1.5 * deltaTime)
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

        this.player.damage = (this.classes[this.player.class]?.stats.damage || 10) + this.player.loadoutDamageBonus
        this.player.speed = (this.classes[this.player.class]?.stats.speed || 120) + this.player.loadoutSpeedBonus
    }
    startBattle() {
        // Ensure a class is selected
        if (!this.player.class) {
            const classData = this.classes['noob']
            this.player.class = 'noob'
            this.player.classLevel = 0
            Object.assign(this.player, classData.stats)
            this.player.maxHealth = classData.stats.health
            this.player.health = this.player.maxHealth
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
            if (['healing', 'combat', 'utility'].includes(item.category)) {
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

    addInventoryItem(item) {
        if (!this.player.inventory.some(entry => entry.id === item.id && entry.type === item.type)) {
            this.player.inventory.push(item)
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
        this.player.health = this.player.maxHealth
        this.player.exp = 0
        this.player.level = 1
        this.player.expToNext = 100
        this.player.invisible = false
        this.player.abilityActive = false
        this.player.abilityDuration = 0
        this.player.abilityCooldown = 0
        this.player.shield = false
        this.player.flamethrower = false
        this.player.megaRobot = null
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

            if (dist < chaseRadius) {
                // Player is nearby: chase toward the player
                mob.wander = { dx: 0, dy: 0 }
                if (dist > 0) {
                    mob.x += (dx / dist) * mob.speed * deltaTime
                    mob.y += (dy / dist) * mob.speed * deltaTime
                }
            } else if (dist > forgetRadius) {
                // Player is far away: wander slowly
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

            // Attack player if close
            if (dist < 30 && !this.player.invisible) {
                this.player.health -= mob.damage * deltaTime
                if (this.player.health <= 0) {
                    this.gameOver()
                }
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
                // Shoot at player
                const angle = Math.atan2(dy, dx)
                const speed = 200
                this.bossBullets.push({
                    x: boss.x,
                    y: boss.y,
                    dx: Math.cos(angle) * speed,
                    dy: Math.sin(angle) * speed,
                    damage: 15,
                    size: 8
                })
                boss.shootCooldown = 0.8 + Math.random() * 0.4 // Shoot every 0.8-1.2 seconds
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

            if (dist < this.player.size / 2 + bullet.size && !this.player.invisible) {
                // Damage reduction from armour piece
                let damage = bullet.damage
                if (this.player.loadout.utility === 'armour_piece') {
                    damage *= 0.85 // 15% damage reduction
                }
                this.player.health -= damage
                if (this.player.health <= 0) {
                    this.gameOver()
                }
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

    killMob(mob) {
        this.kills++
        this.player.exp += mob.exp
        this.player.gold += mob.gold

        // Drop loot
        const dropChance = 0.3 + (this.player.loadoutLootBonus || 0)
        if (Math.random() < dropChance) {
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
                        this.player.exp += item.value
                        break
                    case 'gold':
                        this.player.gold += item.value
                        break
                    case 'medkit':
                        this.player.health = Math.min(this.player.maxHealth, this.player.health + 50)
                        this.addInventoryItem({ id: 'medkit', name: 'Medkit Loot', type: 'loot', category: 'healing' })
                        break
                    case 'meat':
                        this.player.health = Math.min(this.player.maxHealth, this.player.health + 25)
                        this.addInventoryItem({ id: 'meat', name: 'Meat Loot', type: 'loot', category: 'healing' })
                        break
                    case 'gun':
                        this.player.damage += 2
                        this.addInventoryItem({ id: 'gun_drop', name: 'Dropped Gun', type: 'loot', category: 'combat' })
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
        document.getElementById('healthValue').textContent = `${Math.ceil(this.player.health)}/${this.player.maxHealth}`
        document.getElementById('levelValue').textContent = this.player.level
        document.getElementById('expValue').textContent = `${this.player.exp}/${this.player.expToNext}`
        document.getElementById('goldValue').textContent = this.player.gold
        document.getElementById('mobCount').textContent = this.mobs.length
        document.getElementById('killCount').textContent = this.kills

        // Update home gold display
        const homeGoldEl = document.getElementById('homeGoldValue')
        if (homeGoldEl) homeGoldEl.textContent = this.player.gold

        // Update ability display
        const abilityEl = document.getElementById('dashAbility')
        if (this.player.abilityCooldown > 0) {
            abilityEl.textContent = `ABILITY: ${Math.ceil(this.player.abilityCooldown / 1000)}s`
            abilityEl.className = 'ability cooldown'
        } else {
            abilityEl.textContent = `ABILITY [${this.formatKeyLabel(this.controls.ability)}]: Ready`
            abilityEl.className = 'ability ready'
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