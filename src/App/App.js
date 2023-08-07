import Camera from "./Camera"
import Renderer from "./Renderer"
import Utils from "./Utils/Utils"
import sources from "./Sources"
import * as THREE from 'three'
import Resources from "./Utils/Resources"
import Debug from "./Utils/Debug"
import World from "./Models/World"
import Network from "./Utils/Network"
import Stats from "stats.js"

/**
 * Here is the driver class where all of the component classes are initialized and the scene is initialized. 
 * Event emits should be listened to here and then call the appropriate component functions.
 */
let instance = null

export default class App {
    constructor(canvas) {
        if (instance)
            return instance
        instance = this

        this.debug = new Debug()
        this.scene = new THREE.Scene()
        this.screenScene = new THREE.Scene()
        this.canvas = canvas

        this.utils = new Utils()
        this.utils.on('resize', () => {
            this.resize()
        })
        this.camera = new Camera()

        this.resources = new Resources(sources)
        this.resources.on('ready', () => {
            this.utils.on('tick', () => {
                this.tick()
            })
        })
        
        this.world = new World()
        this.renderer = new Renderer(this.canvas)
        this.network = new Network()

        this.stats = new Stats()
        this.stats.showPanel(0)
        document.body.appendChild(this.stats.dom)
    }

    // Handles the resize event by resizing renderer and camera
    resize() {
        this.renderer.resize()
        this.camera.resize()
    }

    // Handles the tick function by updating camera/controls/renderer
    tick() {
        this.stats.begin()
        this.renderer.tick()
        this.network.tick()
        if (this.world.lobotomy)
            this.world.lobotomy.tick()
        this.stats.end()
    }
}