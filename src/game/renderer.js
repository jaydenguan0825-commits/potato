export class Renderer {
    constructor(canvas) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.ctx.imageSmoothingEnabled = false
        this.width = canvas.width || 800
        this.height = canvas.height || 600
        this.time = 0
        this.particles = []
    }

    clear() {
        this.ctx.fillStyle = '#08101f'
        this.ctx.fillRect(0, 0, this.width, this.height)
        // keep time stable (no global animation counter)
    }

    drawInfiniteBackground(camera) {
        const ctx = this.ctx
        ctx.save()
        ctx.globalAlpha = 0.12
        ctx.fillStyle = '#111827'
        ctx.fillRect(0, 0, this.renderer?.width || this.width, this.renderer?.height || this.height)

        // Static decorative dots/grid anchored to world coords (deterministic, no animation)
        const spacing = 80
        const camX = Math.floor(camera.x)
        const camY = Math.floor(camera.y)
        const startX = Math.floor(camX / spacing) * spacing
        const startY = Math.floor(camY / spacing) * spacing

        for (let y = startY; y < camY + (this.renderer?.height || this.height) + spacing; y += spacing) {
            for (let x = startX; x < camX + (this.renderer?.width || this.width) + spacing; x += spacing) {
                const sx = x - camX
                const sy = y - camY
                const noise = this.getTileNoise(x, y, 0)
                const alpha = 0.03 + noise * 0.07
                ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
                ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1)
            }
        }

        ctx.restore()
    }

    drawBiomeBackground(camera, worldWidth, worldHeight) {
        const ctx = this.ctx
        const tileSize = 60

        // Round camera to integer pixels to avoid sub-pixel jitter
        const camX = Math.floor(camera.x)
        const camY = Math.floor(camera.y)

        ctx.save()
        ctx.translate(-camX, -camY)

        const startY = Math.floor(camY / tileSize) * tileSize
        const endY = camY + this.height + tileSize
        const startX = Math.floor(camX / tileSize) * tileSize
        const endX = camX + this.width + tileSize

        for (let y = startY; y < endY; y += tileSize) {
            for (let x = startX; x < endX; x += tileSize) {
                const biome = this.getBiome(x, y, worldWidth, worldHeight)
                ctx.fillStyle = biome.color
                ctx.fillRect(x, y, tileSize, tileSize)

                // Draw static biome details (no time-based animation)
                if (biome.texture) {
                    biome.texture(ctx, x, y, tileSize)
                }
            }
        }

        ctx.restore()
    }

    getTileNoise(x, y, seed = 0) {
        const value = Math.sin((x + seed * 13.13) * 12.9898 + (y + seed * 78.233) * 78.233) * 43758.5453
        return value - Math.floor(value)
    }

    drawGrassTexture(ctx, x, y, size, time) {
        const grassColor1 = '#5a7c3a'
        const grassColor2 = '#6b8e42'
        const variation = this.getTileNoise(x, y, 1) > 0.45

        ctx.fillStyle = variation ? grassColor1 : grassColor2
        ctx.fillRect(x, y, size, size)

        for (let i = 0; i < 8; i++) {
            const seed = this.getTileNoise(x, y, i + 2)
            const bladeX = x + Math.floor(seed * (size - 10)) + 2
            const bladeY = y + (i % 4) * 14 + 4
            ctx.fillStyle = this.getTileNoise(x, y, i + 5) > 0.5 ? '#6b8e42' : '#4f6d2d'
            ctx.fillRect(bladeX, bladeY, 4, 12)
        }
    }

    drawSnowTexture(ctx, x, y, size) {
        ctx.fillStyle = '#eaf6f6'
        ctx.fillRect(x, y, size, size)

        const variation = this.getTileNoise(x, y, 2)
        if (variation > 0.5) {
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.moveTo(x, y + size)
            ctx.lineTo(x + size / 2, y + size / 3)
            ctx.lineTo(x + size, y + size)
            ctx.closePath()
            ctx.fill()

            ctx.strokeStyle = '#d0e8e8'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(x + size / 2, y + size / 3)
            ctx.lineTo(x + size / 2, y + size)
            ctx.stroke()
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        for (let i = 0; i < 3; i++) {
            const seed = this.getTileNoise(x, y, i + 10)
            const px = x + seed * (size - 10) + 5
            const py = y + this.getTileNoise(x, y, i + 15) * (size - 10) + 5
            ctx.fillRect(Math.round(px), Math.round(py), 2, 2)
        }
    }

    drawVolcanoTexture(ctx, x, y, size, time) {
        ctx.fillStyle = '#5e2d1f'
        ctx.fillRect(x, y, size, size)
        ctx.fillStyle = '#7a4128'

        for (let i = 0; i < 5; i++) {
            const seed = this.getTileNoise(x, y, i + 3)
            const px = x + seed * (size - 12)
            const py = y + this.getTileNoise(x, y, i + 7) * (size - 12)
            const rockSize = 6 + Math.floor(this.getTileNoise(x, y, i + 11) * 4)
            ctx.fillRect(px, py, rockSize, rockSize)
        }
    }

    drawJungleTexture(ctx, x, y, size, time) {
        ctx.fillStyle = '#2f6b2c'
        ctx.fillRect(x, y, size, size)

        const colors = ['#1a4d2e', '#2d7a3d', '#3d9751']
        for (let i = 0; i < 8; i++) {
            const seed = this.getTileNoise(x, y, i + 4)
            const px = x + seed * (size - 8)
            const py = y + this.getTileNoise(x, y, i + 9) * (size - 8)
            const radius = 2 + this.getTileNoise(x, y, i + 13) * 3
            ctx.fillStyle = colors[Math.floor(this.getTileNoise(x, y, i + 17) * colors.length)]
            ctx.beginPath()
            ctx.arc(px, py, radius, 0, Math.PI * 2)
            ctx.fill()
        }
    }

    drawDesertTexture(ctx, x, y, size) {
        ctx.fillStyle = '#e6d48f'
        ctx.fillRect(x, y, size, size)

        ctx.strokeStyle = 'rgba(221, 196, 104, 0.35)'
        ctx.lineWidth = 1
        for (let i = 0; i < 3; i++) {
            const base = this.getTileNoise(x, y, i + 5) * 4
            const yOffset = y + 10 + i * 14 + base
            ctx.beginPath()
            ctx.moveTo(x, yOffset)
            for (let j = 0; j <= size; j += 8) {
                const noise = (this.getTileNoise(x + j, y, i + j) - 0.5) * 3
                ctx.lineTo(x + j, yOffset + noise)
            }
            ctx.stroke()
        }
    }

    getBiome(x, y, worldWidth, worldHeight) {
        if (x < 0 || x > worldWidth || y < 0 || y > worldHeight) return { color: '#1a1f2b' }
        
        const cx = worldWidth / 2, cy = worldHeight / 2
        const dist = Math.sqrt((x-cx)**2 + (y-cy)**2)
        
        if (dist < 500) {
            return { color: '#7cb342', texture: this.drawGrassTexture.bind(this) }
        }
        
        if (x < cx && y < cy) {
            return { color: '#eaf6f6', texture: this.drawSnowTexture.bind(this) }
        }
        if (x > cx && y < cy) {
            return { color: '#a9441f', texture: this.drawVolcanoTexture.bind(this) }
        }
        if (x < cx && y > cy) {
            return { color: '#388e3c', texture: this.drawJungleTexture.bind(this) }
        }
        return { color: '#e6d48f', texture: this.drawDesertTexture.bind(this) }
    }

    drawPlayer(player, camera, isLocalPlayer) {
        const ctx = this.ctx
        const screenX = Math.round(player.x - camera.x)
        const screenY = Math.round(player.y - camera.y)

        // Draw flamethrower cone
        if (player.flamethrower) {
            ctx.save()
            ctx.translate(screenX, screenY)
            ctx.rotate(player.direction)
            const grad = ctx.createRadialGradient(0, 0, 10, 80, 0, 90)
            grad.addColorStop(0, 'rgba(255, 69, 0, 0.85)')
            grad.addColorStop(0.5, 'rgba(255, 140, 0, 0.55)')
            grad.addColorStop(1, 'rgba(255, 255, 0, 0)')
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.arc(0, 0, 95, -0.45, 0.45)
            ctx.closePath()
            ctx.fill()
            ctx.restore()
        }

        ctx.save()
        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.2)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetY = 4

        // Berserk Aura
        if (player.berserkActive > 0) {
            ctx.strokeStyle = `rgba(255, 0, 0, 0.5)`
            ctx.lineWidth = 6
            ctx.beginPath()
            ctx.arc(screenX, screenY, player.size / 2 + 5, 0, Math.PI * 2)
            ctx.stroke()
        }

        // Main player body
        // Main player body - potato stylized to match reference image
        const potatoColor = player.hitFlash > 0 ? '#fff' : '#f2d48a'
        const potatoShade = '#c99c61'
        ctx.lineWidth = 2

        if (player.shieldActive > 0) {
            ctx.shadowColor = '#00e6ff'
            ctx.shadowBlur = 15
        }

        // Invisibility effect
        if (player.invisible) {
            ctx.globalAlpha = 0.5
        }

        // Draw slightly narrower oval body to match pasted potato silhouette
        ctx.save()
        ctx.translate(screenX, screenY)
        ctx.scale(1.12, 1)
        ctx.beginPath()
        ctx.arc(0, 0, player.size / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.fillStyle = potatoColor
        ctx.fill()

        // Top-left highlight (white soft oval)
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.beginPath()
        ctx.ellipse(-player.size * 0.18, -player.size * 0.25, player.size * 0.18, player.size * 0.12, -0.5, 0, Math.PI * 2)
        ctx.fill()

        // Small freckles/spots
        ctx.fillStyle = 'rgba(139,90,43,0.9)'
        for (let i = 0; i < 4; i++) {
            const sx = (Math.random() - 0.5) * player.size * 0.9
            const sy = (Math.random() - 0.2) * player.size * 0.6
            ctx.beginPath(); ctx.ellipse(sx, sy, 2, 2, 0, 0, Math.PI * 2); ctx.fill()
        }

        // Subtle bottom shading
        ctx.fillStyle = potatoShade
        ctx.beginPath()
        ctx.ellipse(0, player.size * 0.14, player.size * 0.42, player.size * 0.16, 0, 0, Math.PI * 2)
        ctx.fill()

        // Outline
        ctx.strokeStyle = player.shieldActive > 0 ? '#00e6ff' : '#b57a46'
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.restore()

        // Face features - cartoon eyes, rosy cheeks, small smile
        const faceScale = player.size / 20
        const eyeSize = Math.max(2, Math.round(3 * faceScale))
        const eyeSpacing = Math.round(8 * faceScale)
        const eyeY = Math.round(screenY - Math.round(player.size * 0.08))
        const leftEyeX = Math.round(screenX - eyeSpacing)
        const rightEyeX = Math.round(screenX + eyeSpacing)

        // Cartoon eyes (solid dark ovals)
        ctx.fillStyle = '#2b1b0f'
        ctx.beginPath(); ctx.ellipse(leftEyeX, eyeY, eyeSize, Math.round(eyeSize * 1.2), 0, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.ellipse(rightEyeX, eyeY, eyeSize, Math.round(eyeSize * 1.2), 0, 0, Math.PI * 2); ctx.fill()

        // Small happy mouth - tighter arc to avoid vertical line/nose illusion
        ctx.strokeStyle = '#5a2f1a'
        ctx.lineWidth = 2
        const mouthX = screenX
        const mouthY = screenY + Math.round(player.size * 0.12)
        const mouthRadius = Math.round(4 * faceScale)
        ctx.beginPath()
        ctx.arc(mouthX, mouthY, mouthRadius, 0.25 * Math.PI, 0.75 * Math.PI)
        ctx.stroke()

        // Small decorative freckles (deterministic positions so they don't flicker)
        ctx.fillStyle = 'rgba(139,90,43,0.9)'
        for (let s = 1; s <= 3; s++) {
            const nx = Math.floor((screenX + s * 13) % 100)
            const ny = Math.floor((screenY + s * 7) % 100)
            const fx = Math.round(screenX + (this.getTileNoise(nx, ny, s) - 0.5) * player.size * 0.6 - player.size * 0.25)
            const fy = Math.round(screenY + (this.getTileNoise(nx * 2, ny * 3, s + 5) - 0.5) * player.size * 0.4 - player.size * 0.1)
            ctx.beginPath(); ctx.ellipse(fx, fy, 1.5, 1.5, 0, 0, Math.PI * 2); ctx.fill()
        }
        ctx.restore()

        // Direction indicator
        const dirX = Math.cos(player.direction)
        const dirY = Math.sin(player.direction)
        ctx.strokeStyle = '#555555'
        ctx.lineWidth = 4
        ctx.beginPath()
        // Start slightly below the face so it doesn't look like it's coming from the nose
        const muzzleY = Math.round(screenY + player.size * 0.18)
        const endX = Math.round(screenX + dirX * (player.size / 2 + 10))
        const endY = Math.round(muzzleY + dirY * (player.size / 2 + 10))
        ctx.moveTo(screenX, muzzleY)
        ctx.lineTo(endX, endY)
        ctx.stroke()

        // Shield Bubble Visual
        if (player.shieldActive > 0 || (player.shieldHp && player.shieldHp > 0)) {
            ctx.save()
            ctx.strokeStyle = '#00e6ff'
            ctx.lineWidth = 3
            ctx.shadowColor = '#00e6ff'
            ctx.shadowBlur = 12
            ctx.fillStyle = 'rgba(0, 230, 255, 0.07)'
            ctx.beginPath()
            ctx.arc(screenX, screenY, player.size * 0.9, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
            ctx.restore()
        }
    }

    drawMobs(mobs, camera) {
        const ctx = this.ctx
        mobs.forEach(mob => {
            const screenX = Math.round(mob.x - camera.x)
            const screenY = Math.round(mob.y - camera.y)

            if (screenX < -100 || screenX > this.width + 100 || screenY < -100 || screenY > this.height + 100) {
                return
            }

            // Glow effect
            ctx.fillStyle = mob.color + '40'
            ctx.beginPath()
            ctx.arc(screenX, screenY, mob.size / 2 + 4, 0, Math.PI * 2)
            ctx.fill()

            // Main body
            ctx.fillStyle = mob.hitFlash > 0 ? '#ffffff' : mob.color
                ctx.beginPath()
                ctx.arc(screenX, screenY, mob.size / 2, 0, Math.PI * 2)
                ctx.fill()

            // Outline
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
            ctx.lineWidth = 1.5
            ctx.stroke()

            // Health bar
            if (mob.maxHealth && mob.health < mob.maxHealth) {
                const barWidth = mob.size
                const healthPercent = Math.max(0, mob.health / mob.maxHealth)
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.fillRect(Math.round(screenX - barWidth / 2), Math.round(screenY - mob.size / 2 - 10), barWidth, 3)
                
                ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : (healthPercent > 0.25 ? '#ffff00' : '#ff0000')
                ctx.fillRect(screenX - barWidth / 2, screenY - mob.size / 2 - 10, barWidth * healthPercent, 3)
            }
        })
    }

    drawBosses(bosses, camera) {
        const ctx = this.ctx
        bosses.forEach(boss => {
            const screenX = Math.round(boss.x - camera.x)
            const screenY = Math.round(boss.y - camera.y)

            if (screenX < -150 || screenX > this.width + 150 || screenY < -150 || screenY > this.height + 150) {
                return
            }

            // Animated glow ring
            const glowSize = boss.size / 2 + 12
            ctx.strokeStyle = `rgba(255, 255, 0, 0.6)`
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2)
            ctx.stroke()

            // Boss body
            ctx.fillStyle = boss.hitFlash > 0 ? '#ffffff' : boss.color
            ctx.beginPath()
            ctx.arc(screenX, screenY, boss.size / 2, 0, Math.PI * 2)
            ctx.fill()

            // Strong outline
            ctx.strokeStyle = '#ffff00'
            ctx.lineWidth = 4
            ctx.stroke()

            // Health bar (larger)
            const barWidth = boss.size * 1.2
            const healthPercent = boss.health / boss.maxHealth
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(Math.round(screenX - barWidth / 2), Math.round(screenY - boss.size / 2 - 16), barWidth, 6)
            
            ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : (healthPercent > 0.25 ? '#ffff00' : '#ff0000')
            ctx.fillRect(screenX - barWidth / 2, screenY - boss.size / 2 - 16, barWidth * healthPercent, 6)
        })
    }

    drawBullets(bullets, camera) {
        const ctx = this.ctx
        bullets.forEach(bullet => {
            const screenX = Math.round(bullet.x - camera.x)
            const screenY = Math.round(bullet.y - camera.y)

            // Glow
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'
            ctx.beginPath()
            ctx.arc(screenX, screenY, 6, 0, Math.PI * 2)
            ctx.fill()
            let bSize = 4;
            let bColor = '#ffff00';
            
            if (bullet.type === 'sniper') { bSize = 6; bColor = '#ff3333'; }
            if (bullet.type === 'bomber') { bSize = 10; bColor = '#444444'; }
            if (bullet.type === 'archer') { bSize = 3; bColor = '#ffffff'; }

            // Bullet Body
            ctx.fillStyle = bColor
            ctx.beginPath()
            ctx.arc(screenX, screenY, bSize, 0, Math.PI * 2)
            ctx.fill()

            // Outline
            ctx.strokeStyle = '#ff8800'
            ctx.lineWidth = 2
            ctx.stroke()
        })
    }

    drawBossBullets(bullets, camera) {
        const ctx = this.ctx
        bullets.forEach(bullet => {
            const screenX = Math.round(bullet.x - camera.x)
            const screenY = Math.round(bullet.y - camera.y)

            // Glow (red for boss bullets)
            ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'
            ctx.beginPath()
            ctx.arc(screenX, screenY, 8, 0, Math.PI * 2)
            ctx.fill()

            // Bullet Body
            ctx.fillStyle = '#ff3333'
            ctx.beginPath()
            ctx.arc(screenX, screenY, bullet.size, 0, Math.PI * 2)
            ctx.fill()

            // Outline
            ctx.strokeStyle = '#ff0000'
            ctx.lineWidth = 2
            ctx.stroke()
        })
    }

    drawItems(items, camera) {
        const ctx = this.ctx
        items.forEach((item, idx) => {
            const screenX = Math.round(item.x - camera.x)
            const screenY = Math.round(item.y - camera.y)

            ctx.save()
            // Shadow
            ctx.shadowColor = 'rgba(0,0,0,0.15)'
            ctx.shadowBlur = 4
            ctx.shadowOffsetY = 2

            if (item.type === 'xp') {
                // Cyan glowing diamond gem
                ctx.fillStyle = '#00ffff'
                ctx.beginPath()
                ctx.moveTo(screenX, screenY - 8)
                ctx.lineTo(screenX + 6, screenY)
                ctx.lineTo(screenX, screenY + 8)
                ctx.lineTo(screenX - 6, screenY)
                ctx.closePath()
                ctx.fill()
                
                // Highlight
                ctx.fillStyle = 'rgba(255,255,255,0.6)'
                ctx.beginPath()
                ctx.moveTo(screenX, screenY - 8)
                ctx.lineTo(screenX + 3, screenY - 2)
                ctx.lineTo(screenX, screenY)
                ctx.lineTo(screenX - 3, screenY - 2)
                ctx.closePath()
                ctx.fill()

                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 1
                ctx.stroke()
            } else if (item.type === 'gold') {
                // Gold coin
                ctx.fillStyle = '#ffcc00'
                ctx.beginPath()
                ctx.arc(screenX, screenY, 8, 0, Math.PI * 2)
                ctx.fill()

                ctx.strokeStyle = '#d4a373'
                ctx.lineWidth = 1.5
                ctx.stroke()

                // Inner ring
                ctx.strokeStyle = '#ffd166'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.arc(screenX, screenY, 5, 0, Math.PI * 2)
                ctx.stroke()
            } else if (item.type === 'medkit') {
                // Red box with white cross
                ctx.fillStyle = '#e74c3c'
                ctx.fillRect(screenX - 8, screenY - 8, 16, 16)
                
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(screenX - 2, screenY - 6, 4, 12)
                ctx.fillRect(screenX - 6, screenY - 2, 12, 4)

                ctx.strokeStyle = '#c0392b'
                ctx.lineWidth = 1.5
                ctx.strokeRect(screenX - 8, screenY - 8, 16, 16)
            } else if (item.type === 'meat') {
                // Cartoon meat drumstick
                ctx.fillStyle = '#ffffff' // Bone
                ctx.fillRect(screenX - 8, screenY - 2, 8, 4)
                ctx.beginPath()
                ctx.arc(screenX - 8, screenY - 2, 2.5, 0, Math.PI * 2)
                ctx.arc(screenX - 8, screenY + 2, 2.5, 0, Math.PI * 2)
                ctx.fill()

                ctx.fillStyle = '#b5651d' // Meat oval
                ctx.beginPath()
                ctx.ellipse(screenX + 1, screenY, 8, 6, 0, 0, Math.PI * 2)
                ctx.fill()
                
                ctx.strokeStyle = '#8b4513'
                ctx.lineWidth = 1.5
                ctx.stroke()
            } else if (item.type === 'gun') {
                // Dark grey pistol shape
                ctx.fillStyle = '#555555'
                ctx.fillRect(screenX - 6, screenY - 4, 12, 5) // Barrel
                ctx.fillRect(screenX - 4, screenY - 1, 4, 8)  // Grip
                ctx.fillStyle = '#ffcc00'
                ctx.fillRect(screenX + 5, screenY - 3, 2, 2)  // Muzzle spark/tip
                
                ctx.strokeStyle = '#222222'
                ctx.lineWidth = 1
                ctx.strokeRect(screenX - 6, screenY - 4, 12, 5)
            } else if (item.type === 'armor_scrap') {
                // Shiny metallic blue shield shard
                ctx.fillStyle = '#00bfff'
                ctx.beginPath()
                ctx.moveTo(screenX - 6, screenY - 8)
                ctx.lineTo(screenX + 6, screenY - 8)
                ctx.lineTo(screenX + 4, screenY + 2)
                ctx.lineTo(screenX, screenY + 8)
                ctx.lineTo(screenX - 4, screenY + 2)
                ctx.closePath()
                ctx.fill()

                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 1
                ctx.stroke()
            } else {
                // Fallback circle
                ctx.fillStyle = '#2ecc71'
                ctx.beginPath()
                ctx.arc(screenX, screenY, 8, 0, Math.PI * 2)
                ctx.fill()
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 1
                ctx.stroke()
            }
            ctx.restore()
        })
    }

    drawAllies(allies, camera) {
        if (!allies) return
        const ctx = this.ctx
        allies.forEach(ally => {
            const screenX = Math.round(ally.x - camera.x)
            const screenY = Math.round(ally.y - camera.y)

            if (ally.type === 'mega_robot' || ally.type === 'mini_robot') {
                const isMega = ally.type === 'mega_robot'
                // Body
                ctx.fillStyle = isMega ? '#4e5a6b' : '#6b7a8c'
                ctx.fillRect(screenX - ally.size / 2, screenY - ally.size / 2, ally.size, ally.size)
                
                // Visor/Eye
                ctx.fillStyle = isMega ? '#ff3b30' : '#ffd60a'
                if (isMega) {
                    ctx.fillRect(screenX - ally.size * 0.35, screenY - ally.size * 0.25, ally.size * 0.7, 5)
                } else {
                    ctx.beginPath()
                    ctx.arc(screenX, screenY - 2, 4, 0, Math.PI * 2)
                    ctx.fill()
                }

                // Metallic shine
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
                ctx.fillRect(screenX - ally.size / 2, screenY - ally.size / 2, ally.size, ally.size / 4)

                // Outline
                ctx.strokeStyle = isMega ? '#ff3b30' : '#ffd60a'
                ctx.lineWidth = isMega ? 3 : 2
                ctx.strokeRect(screenX - ally.size / 2, screenY - ally.size / 2, ally.size, ally.size)

                // Health bar
                const barWidth = ally.size
                const healthPercent = Math.max(0, ally.health / ally.maxHealth)
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.fillRect(screenX - barWidth / 2, screenY - ally.size / 2 - 10, barWidth, 3)
                ctx.fillStyle = '#00ff88'
                ctx.fillRect(screenX - barWidth / 2, screenY - ally.size / 2 - 10, barWidth * healthPercent, 3)
            } else if (ally.type === 'drone') {
                // Outer glow ring
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'
                ctx.lineWidth = 4
                ctx.beginPath()
                ctx.arc(screenX, screenY, ally.size / 2 + 3, 0, Math.PI * 2)
                ctx.stroke()

                // Core orb
                ctx.fillStyle = '#00ffff'
                ctx.beginPath()
                ctx.arc(screenX, screenY, ally.size / 2, 0, Math.PI * 2)
                ctx.fill()

                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 1.5
                ctx.stroke()

                // Center glowing dot
                ctx.fillStyle = '#ffffff'
                ctx.beginPath()
                ctx.arc(screenX, screenY, 2, 0, Math.PI * 2)
                ctx.fill()
            }
        })
    }
}
