import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import EventEmitter from "./EventEmitter";
import App from "../App";
import * as THREE from 'three'
import { CubeTextureLoader } from "three";
import { Text, preloadFont } from "troika-three-text";
import { gsap } from "gsap";

/**
 * Resources class to load all external textures, fonts, models, etc... Also acts as a loading manager for the project
 * this.items is an object containing all the loaded files with the name of the file as the key
 * 
 * JS sources - A JS file in JSON format which contains multiple files to load.
 */
export default class Resources extends EventEmitter {
    constructor(sources) {
        super()

        this.app = new App()
        this.sources = sources

        // loaded items, num of items left to load, num of items loaded
        this.items = {}
        this.toLoad = this.sources.length
        this.loaded = 0

        // Create loaders
        this.fontLoader = new FontLoader()
        this.textureLoader = new THREE.TextureLoader()
        this.gltfLoader = new GLTFLoader()
        this.cubeTextureLoader = new CubeTextureLoader()
        this.dracoLoader = new DRACOLoader()
        this.dracoLoader.setDecoderPath('draco/')
        this.gltfLoader.setDRACOLoader(this.dracoLoader)
        this.loadingScreen()
        this.startLoading()
    }

    startLoading() {
        for (const source of this.sources) {
            if (source.type === 'gltf') {
                this.gltfLoader.load(source.path, (file) => {
                    this.sourceLoaded(source, file)
                })
            }
            else if (source.type === 'draco') {
                this.gltfLoader.load(source.path, (file) => {
                    this.sourceLoaded(source, file)
                })
            }
            else if (source.type === 'texture') {
                this.textureLoader.load(source.path, (file) => {
                    file.flipY = false
                    this.sourceLoaded(source, file)
                })
            }
            else if (source.type === 'cubeTexture') {
                this.cubeTextureLoader.load(source.path, (file) => {
                    this.sourceLoaded(source, file)
                })
            }
            else if (source.type === 'font') {
                preloadFont({
                    font: source.path,
                    characters: 'b u r i a l s i t e burialsite'
                }, (file) => {
                    this.sourceLoaded(source, file)
                })
            }
        }
    }
    // Callback function after the file loads
    sourceLoaded(source, file) {
        this.items[source.name] = file
        this.loaded++
        if (this.loaded === this.toLoad) {
            this.trigger('ready')
        }
    }

    loadingScreen() {
        const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
        const overlayMaterial = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: {
                uAlpha: { value: 1 }
            },
            vertexShader: `
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uAlpha;

                void main() {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
                }
            `
        })
        const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
        this.app.scene.add(overlay)

        this.on('ready', () => {
            gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 1, value: 0 })
            window.setTimeout(() => { this.app.scene.remove(overlay) }, 2000)
        })
    }
}