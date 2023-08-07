import App from "../App";
import * as THREE from 'three';
import Lobotomy from "./Lobotomy";
import { Text } from 'troika-three-text'
import { gsap } from 'gsap'

/**
 * Compiles all the models into a world and positions them accordingly.
 */
export default class World {
    constructor() {
        this.app = new App()
        this.app.scene.background = new THREE.Color('#000000')
        this.app.screenScene.background = new THREE.Color('#121111')

        this.app.resources.on('ready', () => {
            this.lobotomy = new Lobotomy()
            this.app.scene.environment = this.app.resources.items.CubeTexture
        })

        this.brightness = new URLSearchParams(window.location.search).get('brightness')
        if (!this.brightness)
            this.brightness = 4
        this.brightness = Math.min(this.brightness, 20)
        this.brightness = Math.max(this.brightness, 0.5)
        const globalLight = new THREE.AmbientLight(0xffffff, this.brightness)
        this.app.scene.add(globalLight)
    }
}