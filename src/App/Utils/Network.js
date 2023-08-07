import axios, { AxiosError } from "axios"
import App from "../App"
import { Client } from "tmi.js"
import * as THREE from 'three'
import { gsap } from "gsap"

export default class Network {
    constructor() {
        THREE.ColorManagement.enabled = true
        this.app = new App()
        this.textureMap = {}
        this.emoteList = {}
        this.poolSprites
        this.renderArray = []
        this.textureArray = []

        this.urlParams = new URLSearchParams(window.location.search).get('channel')
        this.app.resources.on('ready', () => {
            this.init()
        })
        this.focused = true
        document.addEventListener('visibilitychange', ( event ) => {
            this.focused = !document.hidden;
        }, false);

        if (this.urlParams) {
            this.fetchChannel(this.urlParams).then((res) => {
                this.emoteList = res.data
                // TMI Client
                this.client = new Client({
                    channels: [this.urlParams]
                })
                this.client.connect()

                this.client.on('message', (channel, tags, message, self) => {
                    if (tags.emotes && this.focused) {
                        for (let emote in tags.emotes) {
                            for (let i = 0; i < Math.min(tags.emotes[emote].length, 3); i++)
                                this.createSprite({ id: emote, provider: 'Twitch' })
                        }
                    }
                    if (this.focused)
                        this.parseChat(message)
                })
            }).catch((err) => {
                console.log(`Looks like something went wrong while trying to get the emote list from this channel`)
            })
        }
    }

    /**
     * Fetch emote info from backend, load textures from database, and store them in the textureMap object.
     * @param {Object} emote Emote information to get
     */
    async fetchEmote(emote) {
        return axios.get(`https://emotes.anakyu.io/${emote.id}/info.json`).then((res) => {
            const textureArray = []
            for (let i = 0; i < res.data.frames; i++) {
                const texture = this.app.resources.textureLoader.load(`https://emotes.anakyu.io/${emote.id}/${i}.webp`)
                texture.colorSpace = THREE.SRGBColorSpace
                texture.minFilter = THREE.NearestFilter
                texture.magFilter = THREE.NearestFilter
                textureArray.push(texture)
            }
            this.textureMap[emote.id]['texture'] = textureArray
            this.textureMap[emote.id]['maxCount'] = res.data.frames
            if (res.data.frameDelay) {
                this.textureMap[emote.id]['delay'] = res.data.frameDelay
                this.textureArray.push(emote.id)
            }
            return { width: res.data.width, height: res.data.height }
        }).catch(async (err) => {
            if (err.response && err.response.status === 404) {
                try {
                    const res = await axios.get(`https://ecorp.anakyu.io/emote/${emote.id}/${emote.provider}`)
                    if (res.status === 201)
                        return this.fetchEmote(emote)

                } catch (err) {
                    console.log(`Could not downloaod this emote: (${emote.id}/${emote.provider}) Check if it exists or message the dev!`)
                }
            }
            else
                console.log(`Something went wrong while retrieving this emote (${emote.id}/${emote.provider}) Message the dev if this continues!`)
        })

    }

    /**
     * Parses a string chat message, checks each word, calls createSprite to make the sprite objects
     * @param {String} chat 
     * @returns 
     */
    async parseChat(chat) {
        const wordArray = chat.split(' ')
        let count = 0
        wordArray.forEach(async (word) => {
            if (count > 3)
                return
            if (this.emoteList.hasOwnProperty(word)) {
                const id = this.emoteList[word]['id']
                count++
                this.createSprite(this.emoteList[word])
            }
        })
    }

    /**
     * Parses a string chat message, checks each word, then need to render the emote. Use a placeholder for now until the emote is ready to render.
     * There's a bug with orthographic camera where it doesn't render sprites if the camera bounds is incorrect.
     * @param {String} chat 
     * @returns 
     */
    async createSprite(emote) {
        if (this.poolSprites.length === 0)
            return
        
        const sprite = this.poolSprites.shift()
        if (!this.textureMap[emote.id]) {
            this.textureMap[emote.id] = {
                texture: this.app.resources.items['spritePlaceholder'],
                maxCount: 1,
                delay: [50],
                currentFrame: 0,
                lastUpdateTime: 0,
                width: 128,
                height: 128
            }
            this.textureMap[emote.id]['promise'] = this.fetchEmote(emote)
        }
        this.textureMap[emote.id]['promise'].then((res) => {
            sprite.material.map = this.textureMap[emote.id]['texture'][0]
            sprite.material.color = new THREE.Color('#cccccc')
            sprite.scale.x = (1 / res.height) * res.width * 0.15
            sprite.scale.y = 0.15
            sprite.material.lastUpdateTime = 0
            sprite.material.textureID = emote.id
            sprite.vector = new THREE.Vector2(Math.random() < 0.5 ? -1 : 1, Math.random() < 0.5 ? -1 : 1)
            sprite.position.set((Math.random() - 0.5) * 2, (Math.random() * 1.25) + 0.1, 0)
            this.renderArray.push(sprite)
            setTimeout(() => {
                gsap.to(sprite.scale, { duration: 2.0, x: 0, y: 0, onComplete: () => { 
                    sprite.position.x = -5
                    this.poolSprites.push(this.renderArray.shift())
                 } })
            }, 10000)
        }).catch((e) => {
        })
        
    }

    async fetchChannel(channel) {
        try {
            return await axios.get(`https://ecorp.anakyu.io/${channel}`)
        } catch (err) {
            console.log('Either this channel does not exist or something went wrong!')
        }
    }

    init() {
        const size = 100
        this.poolSprites = new Array(size)
        for (let i = 0; i < size; i++) {
            this.poolSprites[i] = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.app.resources.items['spritePlaceholder'], depthWrite: false }))
        }
        this.poolSprites.forEach((sprite) => {
            sprite.position.set(-10, 0.5, 0)
            this.app.screenScene.add(sprite)
            sprite.scale.set(1, 0.15, 1)
        })
    }

    tick() {
        this.renderArray.forEach((sprite) => {
            sprite.position.x += sprite.vector.x * this.app.utils.delta / 4
            sprite.position.y += sprite.vector.y * this.app.utils.delta / 4
            if (sprite.position.x >= 1.4) {
                sprite.vector.x *= -1
                sprite.position.x = 1.39999
            }
            else if (sprite.position.x <= -1.4) {
                sprite.vector.x *= -1
                sprite.position.x = -1.39999
            }
            if (sprite.position.y >= 1.4) {
                sprite.vector.y *= -1
                sprite.position.y = 1.39999
            }  
            else if (sprite.position.y <= 0.05) {
                sprite.vector.y *= -1
                sprite.position.y = 0.05001
            }

            const textureData = this.textureMap[sprite.material.textureID]
            const maxFrame = textureData['maxCount']
            if (this.app.utils.clock.oldTime - textureData['lastUpdateTime'] > textureData['delay'][textureData['currentFrame'] % maxFrame]) {
                sprite.material.map = this.textureMap[sprite.material.textureID]['texture'][textureData['currentFrame'] % maxFrame]
            }
        })
        this.textureArray.forEach((id) => {
            const textureData = this.textureMap[id]
            const maxFrame = textureData['maxCount']
            if (this.app.utils.clock.oldTime - textureData['lastUpdateTime'] > textureData['delay'][textureData['currentFrame'] % maxFrame]) {
                textureData['currentFrame']++
                textureData['lastUpdateTime'] = this.app.utils.clock.oldTime
            }
        })
    }
}