import * as THREE from 'three'
import App from './App'

/**
 * The renderer class that contains references to the renderer. Update is called every frame to render again.
 * HTML canvas - a reference to the canvas in the index.html
 */
export default class Renderer {
    constructor(canvas) {
        this.app = new App()
        this.instance = new THREE.WebGLRenderer({
            canvas,
            powerPreference: "high-performance",
            antialias: true,
            stencil: false
        })
        this.instance.outputColorSpace = THREE.SRGBColorSpace
        this.instance.shadowMap.enabled = true
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap
        this.instance.physicallyCorrectLights = true
        this.instance.setSize(this.app.utils.width, this.app.utils.height)
        this.instance.setPixelRatio(this.app.utils.pixelRatio)
    }
    // Updates the renderer size
    resize() { 
        this.instance.setSize(this.app.utils.width, this.app.utils.height)
        this.instance.setPixelRatio(Math.min(this.app.utils.pixelRatio, 2))
    }

    // Tick function to render the scene again
    tick() {
        this.instance.setRenderTarget(this.app.camera.screenRenderTarget)
        this.instance.clear()
        this.instance.render(this.app.screenScene, this.app.camera.screenInstance)
        this.instance.setRenderTarget(null)
        this.instance.clear()
        this.instance.render(this.app.scene, this.app.camera.instance)
    }
}