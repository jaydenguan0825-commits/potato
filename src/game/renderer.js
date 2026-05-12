export class Renderer {
    constructor(canvas) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.width = canvas.width || 800
        this.height = canvas.height || 600
        this.time = 0
        this.particles = []
    }

    clear() {
        this.ctx.fillStyle = '#08101f'
        this.ctx.fillRect(0, 0, this.width, this.height)
        this.time++
    }

    drawInfiniteBackground(camera) {
        const ctx = this.ctx
        ctx.save()
        ctx.globalAlpha = 0.15
        ctx.fillStyle = '#151f38'
        ctx.fillRect(0, 0, this.width, this.height)

        const spacing = 80
        const offsetX = ((-camera.x * 0.2) % spacing + spacing) % spacing
        const offsetY = ((-camera.y * 0.2) % spacing + spacing) % spacing

        ctx.strokeStyle = '#2f4f8c'
        ctx.lineWidth = 1
        for (let x = offsetX; x < this.width + spacing; x += spacing) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, this.height)
            ctx.stroke()
        }
        for (let y = offsetY; y < this.height + spacing; y += spacing) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(this.width, y)
            ctx.stroke()
        }

        ctx.fillStyle = '#ffffff'
        for (let y = offsetY; y < this.height + spacing; y += spacing) {
            for (let x = offsetX; x < this.width + spacing; x += spacing) {
                ctx.beginPath()
                ctx.arc(x + 8, y + 10, 1.5, 0, Math.PI * 2)
                ctx.fill()
            }
        }
        ctx.restore()
    }

    drawBiomeBackground(camera, worldWidth, worldHeight) {
        const ctx = this.ctx
        const tileSize = 50 // Smaller grid for modern look

        for (let y = Math.floor((camera.y - this.height / 2) / tileSize) * tileSize; y < camera.y + this.height + tileSize; y += tileSize) {
            for (let x = Math.floor((camera.x - this.width / 2) / tileSize) * tileSize; x < camera.x + this.width + tileSize; x += tileSize) {
                const biome = this.getBiome(x, y, worldWidth, worldHeight)
                ctx.fillStyle = biome.color
                ctx.fillRect(x - camera.x, y - camera.y, tileSize, tileSize)

                ctx.strokeStyle = biome.gridColor || 'rgba(255,255,255,0.05)'
                ctx.lineWidth = 1
                ctx.globalAlpha = 0.4
                ctx.strokeRect(x - camera.x, y - camera.y, tileSize, tileSize)
                ctx.globalAlpha = 1
            }
        }
    }

    getBiome(x, y, worldWidth, worldHeight) {
        if (x < 0 || x > worldWidth || y < 0 || y > worldHeight) return { color: '#e0e0e0' }
        
        const cx = worldWidth / 2, cy = worldHeight / 2
        const dist = Math.sqrt((x-cx)**2 + (y-cy)**2)
        if (dist < 500) return { color: '#e8f5e9', gridColor: '#c8e6c9' } // Plains
        
        if (x < cx && y < cy) return { color: '#e3f2fd', gridColor: '#bbdefb' } // Snowy
        if (x > cx && y < cy) return { color: '#ffebee', gridColor: '#ffcdd2' } // Volcano
        if (x < cx && y > cy) return { color: '#f1f8e9', gridColor: '#dcedc8' } // Jungle
        return { color: '#fffde7', gridColor: '#fff9c4' } // Desert
    }

    drawPlayer(player, camera, isLocalPlayer) {
        const ctx = this.ctx
        const screenX = player.x - camera.x
        const screenY = player.y - camera.y

        ctx.save()
        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.2)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetY = 4

        // Berserk Aura
        if (player.berserkActive > 0) {
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.4 + Math.sin(this.time * 0.1) * 0.2})`
            ctx.lineWidth = 6
            ctx.beginPath()
            ctx.arc(screenX, screenY, player.size / 2 + 5, 0, Math.PI * 2)
            ctx.stroke()
        }

        // Main player body
        ctx.fillStyle = player.hitFlash > 0 ? '#ffffff' : '#00b2e1'
        ctx.strokeStyle = player.shieldActive > 0 ? '#00e6ff' : '#0085a8'
        ctx.lineWidth = 3
        
        if (player.shieldActive > 0) {
            ctx.shadowColor = '#00e6ff'
            ctx.shadowBlur = 15
        }

        // Invisibility effect
        if (player.invisible) {
            ctx.globalAlpha = 0.5
        }

        ctx.beginPath()
        ctx.arc(screenX, screenY, player.size / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.restore()

        // Direction indicator
        const dirX = Math.cos(player.direction)
        const dirY = Math.sin(player.direction)
        ctx.strokeStyle = '#555555'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(screenX, screenY)
        ctx.lineTo(screenX + dirX * (player.size / 2 + 10), screenY + dirY * (player.size / 2 + 10))
        ctx.stroke()
    }

    drawMobs(mobs, camera) {
        const ctx = this.ctx
        mobs.forEach(mob => {
            const screenX = mob.x - camera.x
            const screenY = mob.y - camera.y

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
                ctx.fillRect(screenX - barWidth / 2, screenY - mob.size / 2 - 10, barWidth, 3)
                
                ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : (healthPercent > 0.25 ? '#ffff00' : '#ff0000')
                ctx.fillRect(screenX - barWidth / 2, screenY - mob.size / 2 - 10, barWidth * healthPercent, 3)
            }
        })
    }

    drawBosses(bosses, camera) {
        const ctx = this.ctx
        bosses.forEach(boss => {
            const screenX = boss.x - camera.x
            const screenY = boss.y - camera.y

            if (screenX < -150 || screenX > this.width + 150 || screenY < -150 || screenY > this.height + 150) {
                return
            }

            // Animated glow ring
            const glowSize = boss.size / 2 + 12 + Math.sin(this.time * 0.05) * 4
            ctx.strokeStyle = `rgba(255, 255, 0, ${0.4 + Math.sin(this.time * 0.05) * 0.3})`
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
            ctx.fillRect(screenX - barWidth / 2, screenY - boss.size / 2 - 16, barWidth, 6)
            
            ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : (healthPercent > 0.25 ? '#ffff00' : '#ff0000')
            ctx.fillRect(screenX - barWidth / 2, screenY - boss.size / 2 - 16, barWidth * healthPercent, 6)
        })
    }

    drawBullets(bullets, camera) {
        const ctx = this.ctx
        bullets.forEach(bullet => {
            const screenX = bullet.x - camera.x
            const screenY = bullet.y - camera.y

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

    drawItems(items, camera) {
        const ctx = this.ctx
        items.forEach((item, idx) => {
            const screenX = item.x - camera.x
            const screenY = item.y - camera.y

            // Bobbing effect
            const bob = Math.sin((this.time + idx * 10) * 0.05) * 3

            // Item
            if (item.type === 'medkit') {
                ctx.fillStyle = '#e74c3c'
                ctx.fillRect(screenX - 8, screenY + bob - 8, 16, 16)
                ctx.fillStyle = 'white'
                ctx.fillRect(screenX - 2, screenY + bob - 6, 4, 12)
                ctx.fillRect(screenX - 6, screenY + bob - 2, 12, 4)
            } else {
                ctx.fillStyle = item.type === 'money' ? '#f1c40f' : '#2ecc71'
                ctx.beginPath()
                ctx.arc(screenX, screenY + bob, 8, 0, Math.PI * 2)
                ctx.fill()
            }

            // Outline
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 1
            ctx.stroke()
        })
    }

    drawMegaRobot(robot, camera) {
        const ctx = this.ctx
        const screenX = robot.x - camera.x
        const screenY = robot.y - camera.y

        // Robot body
        ctx.fillStyle = '#666666'
        ctx.fillRect(screenX - robot.size / 2, screenY - robot.size / 2, robot.size, robot.size)

        // Robot outline
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.strokeRect(screenX - robot.size / 2, screenY - robot.size / 2, robot.size, robot.size)

        // Health bar
        const barWidth = robot.size
        const healthPercent = robot.health / robot.maxHealth
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(screenX - barWidth / 2, screenY - robot.size / 2 - 10, barWidth, 3)
        
        ctx.fillStyle = '#00ff00'
        ctx.fillRect(screenX - barWidth / 2, screenY - robot.size / 2 - 10, barWidth * healthPercent, 3)
    }
}
