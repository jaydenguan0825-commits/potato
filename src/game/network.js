import io from 'socket.io-client'

export class Network {
    constructor() {
        this.socket = null
        this.connected = false
        this.handlers = {}
    }

    connect(serverUrl = 'http://localhost:3000') {
        return new Promise((resolve, reject) => {
            this.socket = io(serverUrl, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5
            })

            this.socket.on('connect', () => {
                this.connected = true
                console.log('Connected to server')
                resolve()
            })

            this.socket.on('disconnect', () => {
                this.connected = false
                console.log('Disconnected from server')
            })

            this.socket.on('error', (error) => {
                console.error('Socket error:', error)
                reject(error)
            })

            // Forward all other events to handlers
            this.socket.on('gameState', (data) => this.emit('gameState', data))
            this.socket.on('playerJoined', (data) => this.emit('playerJoined', data))
            this.socket.on('playerLeft', (data) => this.emit('playerLeft', data))
        })
    }

    on(event, callback) {
        if (!this.handlers[event]) {
            this.handlers[event] = []
        }
        this.handlers[event].push(callback)
    }

    emit(event, data) {
        if (this.handlers[event]) {
            this.handlers[event].forEach(callback => callback(data))
        }
    }

    send(event, data) {
        if (this.socket && this.connected) {
            this.socket.emit(event, data)
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect()
        }
    }
}
