import { Game } from './game/game.js'

const initializeGame = () => {
    if (!window.game) {
        window.game = new Game()
    }
}

if (document.readyState !== 'loading') {
    initializeGame()
} else {
    window.addEventListener('DOMContentLoaded', initializeGame)
}
