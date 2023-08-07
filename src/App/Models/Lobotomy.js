import App from "../App"
import * as THREE from 'three'
import { Text } from 'troika-three-text'
import { gsap } from 'gsap'

export default class Lobotomy {
    constructor() {
        this.app = new App()
        this.gltf = this.app.resources.items.Lobotomy
        this.baked = this.app.resources.items.Baked
        this.baked.colorSpace = THREE.SRGBColorSpace
        this.blinkTime = 4
        this.onTime = 5

        const lobotomyMaterial = new THREE.MeshStandardMaterial({
            map: this.baked,
            metalnessMap: this.app.resources.items.Metallic,
            normalMap: this.app.resources.items.Normal,
            roughnessMap: this.app.resources.items.Roughness,
            alphaMap: this.app.resources.items.Alpha
        })
        lobotomyMaterial.metalness = 0
        lobotomyMaterial.roughness = 1
        lobotomyMaterial.shadowSide = THREE.DoubleSide
        lobotomyMaterial.transparent = true
        lobotomyMaterial.envMapIntensity = 0.5

        const lobotomyMesh = this.gltf.scene.children.find((child) => {
            return child.name === 'Combined'
        })
        lobotomyMesh.geometry.computeVertexNormals()
        lobotomyMesh.material = lobotomyMaterial
        lobotomyMesh.receiveShadow = true
        lobotomyMesh.castShadow = true
        this.mixer = new THREE.AnimationMixer(this.gltf.scene)
        const action = this.mixer.clipAction(this.gltf.animations[0])
        action.play()

        const screenMesh = this.gltf.scene.children.find((child) => {
            return child.name === 'ScreenMesh'
        })
        const screenMaterial = new THREE.MeshStandardMaterial({
            map: this.app.camera.screenRenderTarget.texture
        })
        screenMesh.material = screenMaterial
        screenMesh.flipY = true

        this.model = this.gltf.scene
        this.model.position.set(0, 0, 0)
        this.model.scale.set(0.5, 0.5, 0.5)
        this.app.scene.add(this.model)

        this.spotLight = new THREE.SpotLight(new THREE.Color('#CA1713').convertLinearToSRGB(), 0.1, 5, Math.PI/5, 0.4, -50)
        this.spotLight.position.set(-2.5, 1.927, 2.65)
        this.spotLight.target.position.set(0, 1, 2.4)
        this.spotLight.shadow.camera.near = 0.2
        this.spotLight.shadow.camera.far = 2

        this.spotLight.castShadow = true
        this.spotLight.shadow.bias = -0.01

        this.app.scene.add(this.spotLight)
        this.app.scene.add(this.spotLight.target)

        if (!this.app.network.urlParams)
            this.generateText()
        this.generateSecondScene()
        
        if (this.app.debug.active) {
            this.app.debug.ui.add(this.spotLight.position, 'x', -5, 5, 0.001)
            this.app.debug.ui.add(this.spotLight.position, 'y', -5, 5, 0.001)
            this.app.debug.ui.add(this.spotLight.position, 'z', -5, 5, 0.001)
            this.app.debug.ui.add(this.spotLight, 'angle', 0, Math.PI/4, 0.001)

            this.app.debug.ui.add(this.spotLight.target.position, 'x', -5, 5, 0.001)
            this.app.debug.ui.add(this.spotLight.target.position, 'y', -5, 5, 0.001)
            this.app.debug.ui.add(this.spotLight.target.position, 'z', -5, 5, 0.001)

            this.app.debug.ui.addColor(this.spotLight, 'color')
            
        }
    }

    generateText() {
        const titleText = new Text()
        titleText.text = 'BUrial Protocol'
        titleText.font = this.app.resources.items.Font.parameters.font
        titleText.fontSize = 0.1
        titleText.position.set(0.43, 0.79, 4.55)
        titleText.rotation.set(-0.27, -0.611, -0.159)
        titleText.color = '#d9d9d9'
        titleText.sync()
        this.app.scene.add(titleText)

        const branchText = new Text()
        branchText.text = 'Branch O-251'
        branchText.font = this.app.resources.items.Font.parameters.font
        branchText.fontSize = 0.075
        branchText.position.set(0.42, 0.7, 4.566)
        branchText.color = '#d9d9d9'
        branchText.rotation.set(-0.27, -0.611, -0.159)
        branchText.sync()
        this.app.scene.add(branchText)

        const locationText = new Text()
        locationText.text = 'Disciplinary Department'
        locationText.font = this.app.resources.items.Font.parameters.font
        locationText.fontSize = 0.075
        locationText.position.set(0.41, 0.628, 4.58)
        locationText.rotation.set(-0.27, -0.611, -0.159)
        locationText.color = '#d9d9d9'
        locationText.sync()
        this.app.scene.add(locationText)

        const timeline = gsap.timeline()
        timeline.from(titleText.position, { duration: 3.0, ease: 'power4', x: 0.41, y: 0.6, z: 4.6 }, "+=2")
            .from(titleText.material, { duration: 3.0, ease: 'power2', opacity: 0}, "-=100%" )
            .from(branchText.position, { duration: 3.0, ease: 'power4', x: 0.41, y: 0.5, z: 4.6 }, "-=33%")
            .from(branchText.material, { duration: 3.0, ease: 'power2', opacity: 0}, "-=100%" )
            .from(locationText.position, { duration: 3.0, ease: 'power4', x: 0.41, y: 0.5, z: 4.6 }, "-=75%")
            .from(locationText.material, { duration: 3.0, ease: 'power2', opacity: 0}, "-=100%" )
            .to(titleText.material, { duration: 1.5, ease: 'power4', opacity: 0 }, "+=0.5")
            .to(branchText.material, { duration: 1.5, ease: 'power4', opacity: 0 }, "-=100%")
            .to(locationText.material, { duration: 1.5, ease: 'power4', opacity: 0, onComplete: () => {
              this.app.scene.remove(locationText, branchText, titleText)
              locationText.dispose()
              branchText.dispose()
              titleText.dispose()
            } }, "-=100%")
        
        const burialText = new Text()
        burialText.text = 'Site burial complete\nIf you have any complaints or inquiries, \nplease refer to the Lobotomy Corp. employment contract.\nWe thank you for your hard and earnest work.'
        burialText.font = this.app.resources.items.Font.parameters.font
        burialText.fontSize = 0.05
        burialText.lineHeight = 1.3
        burialText.position.set(0.42, 0.7, 4.566)
        burialText.color = '#d9d9d9'
        burialText.rotation.set(-0.27, -0.611, -0.159)
        burialText.sync()
        this.app.scene.add(burialText)

        const streamText = new Text()
        streamText.text = `(P.S. If you're looking for the stream function, type ?channel=name here after the URL)\n(P.P.S. You can control the brightness by typing &brightness=number here after the channel)`
        streamText.font = this.app.resources.items.Font.parameters.font
        streamText.fontSize = 0.025
        streamText.lineHeight = 1.3
        streamText.position.set(0.44, 0.4, 4.7)
        streamText.color = '#d9d9d9'
        streamText.rotation.set(-0.27, -0.611, -0.159)
        streamText.sync()
        this.app.scene.add(streamText)

        timeline.from(burialText.position, { duration: 3.0, ease: 'power4', x: 0.45, y: 0.7, z: 4.7 })
            .from(burialText.material, { duration: 3.0, ease: 'power2.inOut', opacity: 0}, "-=100%")
            .from(streamText.position, { duration: 3.0, ease: 'power4', x: 0.47, y: 0.4, z: 4.7 }, "+=3")
            .from(streamText.material, { duration: 3.0, ease: 'power2.inOut', opacity: 0}, "-=100%")
    

        if (this.app.debug.ui) {
            
            this.app.debug.ui.add(titleText.position, 'x', -5, 5, 0.001)
            this.app.debug.ui.add(titleText.position, 'y', -5, 5, 0.001)
            this.app.debug.ui.add(titleText.position, 'z', -5, 5, 0.001)

            this.app.debug.ui.add(locationText.position, 'x', -5, 5, 0.001)
            this.app.debug.ui.add(locationText.position, 'y', -5, 5, 0.001)
            this.app.debug.ui.add(locationText.position, 'z', -5, 5, 0.001)
        }
    }

    generateSecondScene() {
        const logo = this.app.resources.items.Logo
        logo.flipY = true
        logo.colorSpace = THREE.SRGBColorSpace
        const logoMaterial = new THREE.MeshBasicMaterial({
            map: logo,
            transparent: false,
            alphaTest: 0.05,
            opacity: 0.1,
            color: '#606060',
            depthWrite: false
        })
        const backgroundImage = new THREE.Mesh(new THREE.PlaneGeometry(), logoMaterial)
        backgroundImage.position.set(0, 0.75, 2)
        this.app.screenScene.add(backgroundImage)
    }

    tick() {
        this.mixer.update(this.app.utils.delta)
        if (this.app.utils.elapsedTime > this.blinkTime) {
            this.blinkTime = this.app.utils.elapsedTime + (Math.random() * 5) + 2
            this.spotLight.intensity = 0
        }
        else if (this.app.utils.elapsedTime > this.onTime) {
            this.onTime = this.blinkTime + Math.random() + 0.2
            this.spotLight.intensity = 0.1
        }
    }
}