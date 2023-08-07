import * as lil from 'lil-gui'
import Stats from 'stats.js'
/**
 * Debug UI
 */
export default class Debug {
    constructor() {
        this.active = window.location.hash === '#debug'

        if (this.active) {
            this.ui = new lil.GUI()
        }
    }
}