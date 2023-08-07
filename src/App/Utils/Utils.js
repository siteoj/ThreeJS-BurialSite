import App from '../App'
import EventEmitter from './EventEmitter'
import * as THREE from 'three'

/**
 * Contains a bunch of misc utility functions like sizes and time.
 * Would need to add deltaTime for animations since they work off of time between frames.
 */
export default class Utils extends EventEmitter {
    constructor() {
        super()
        this.app = new App()

        // Creating sizes from window
        this.createSizes()
        this.createTime()
        this.createParallax()
        this.delta = 0
        this.previousTime = 0
    }

    createSizes() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.pixelRatio = Math.min(window.devicePixelRatio, 2)

        // Event listener for resizing the window
        window.addEventListener('resize', (e) => {
            this.width = window.innerWidth
            this.height = window.innerHeight
            this.pixelRatio = Math.min(window.devicePixelRatio, 2)

            //Trigger event so that camera and renderer know resize happened
            this.trigger('resize')
        })
    }
    createParallax() {
        this.cursor = new THREE.Vector2()
        this.cursor.x = 0
        this.cursor.y = 0

        window.addEventListener('mousemove', (e) => {
            this.cursor.x = e.clientX / this.width * 2 - 1
            this.cursor.y = -(e.clientY / this.height * 2 - 1)
        })
    }

    createTime() {
        this.clock = new THREE.Clock()
        window.requestAnimationFrame(() => {
            this.tick()
        })
    }

    
    // Emits the tick event and also calculates the elapsed time and delta time, triggers a sprite clear if tabbed out
    tick() {
        this.elapsedTime = this.clock.getElapsedTime()
        this.delta = this.elapsedTime - this.previousTime
        this.previousTime = this.elapsedTime
        this.trigger('tick')
        
        window.requestAnimationFrame(() => {
            this.tick()
        })
    }
}