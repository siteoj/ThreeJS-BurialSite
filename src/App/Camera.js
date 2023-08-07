import * as THREE from 'three'
import App from './App'

/**
 * The camera class that contains the camera references. Also has the resize event to adjust the camera on window resize.
 * Need to figure out how to scale FOV to the size of the window vertically. Normally, it should be 40 FOV.
 * But if you scale the vertical window down, the camera will try and fit 40 FOV into the smaller area, resulting in stretching.
 */
export default class Camera {
    constructor() {
        this.app = new App()
        
        this.instance = new THREE.PerspectiveCamera(35, this.app.utils.width / this.app.utils.height, 0.1, 20)
        this.instance.position.set(0.2, 0.5, 7)
        this.instance.rotation.set(Math.PI / 30, -Math.PI / 100, -Math.PI / 80)
        this.app.scene.add(this.instance)

        this.screenInstance = new THREE.OrthographicCamera(-1.5, 1.5, 1.5, -1.5, 0.1, 5)
        this.screenInstance.updateProjectionMatrix()
        this.screenInstance.position.set(0, 0, 5)
        this.app.screenScene.add(this.screenInstance)
        

        this.screenRenderTarget = new THREE.WebGLRenderTarget(1024, 1024)
    }

    // Updates the camera size on resize
    resize() {
        this.instance.aspect = this.app.utils.width / this.app.utils.height
        this.instance.updateProjectionMatrix()
    }
}