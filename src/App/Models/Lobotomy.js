import App from "../App" // 导入 App 类，可能是应用程序的核心或基础类
import * as THREE from 'three' // 导入 Three.js 库，用于 3D 图形渲染
import { Text } from 'troika-three-text' // 导入 troika-three-text 库，用于在 Three.js 场景中渲染高质量文本
import { gsap } from 'gsap' // 导入 GSAP (GreenSock Animation Platform) 库，用于创建动画

export default class Lobotomy { // 定义并导出 Lobotomy 类
    constructor() { // 构造函数，在创建 Lobotomy 类的实例时调用
        this.app = new App() // 创建 App 类的实例，并赋值给 this.app
        this.gltf = this.app.resources.items.Lobotomy // 从 app 的资源中获取名为 Lobotomy 的 GLTF 模型数据
        this.baked = this.app.resources.items.Baked // 获取名为 Baked 的纹理资源 (可能是预烘焙的光照贴图)
        this.baked.colorSpace = THREE.SRGBColorSpace // 设置 Baked 纹理的颜色空间为 SRGB，用于颜色校正
        this.blinkTime = 4 // 初始化 blinkTime (闪烁时间) 变量
        this.onTime = 5    // 初始化 onTime (灯亮时间) 变量

        // 创建主模型的标准网格材质 (MeshStandardMaterial)
        const lobotomyMaterial = new THREE.MeshStandardMaterial({
            map: this.baked, // 基础颜色贴图 (漫反射贴图)
            metalnessMap: this.app.resources.items.Metallic, // 金属度贴图
            normalMap: this.app.resources.items.Normal,     // 法线贴图
            roughnessMap: this.app.resources.items.Roughness, // 粗糙度贴图
            alphaMap: this.app.resources.items.Alpha       // Alpha 透明度贴图
        })
        lobotomyMaterial.metalness = 0 // 设置基础金属度为 0
        lobotomyMaterial.roughness = 1 // 设置基础粗糙度为 1
        lobotomyMaterial.shadowSide = THREE.DoubleSide // 设置阴影渲染到双面 (通常用于平面或非封闭几何体)
        lobotomyMaterial.transparent = true // 允许材质透明 (基于 alphaMap)
        lobotomyMaterial.envMapIntensity = 0.5 // 设置环境贴图强度

        // 从 GLTF 场景中查找名为 'Combined' 的子对象 (网格模型)
        const lobotomyMesh = this.gltf.scene.children.find((child) => {
            return child.name === 'Combined'
        })
        lobotomyMesh.geometry.computeVertexNormals() // 计算顶点法线，用于正确的光照
        lobotomyMesh.material = lobotomyMaterial // 将上面创建的材质赋给该网格
        lobotomyMesh.receiveShadow = true // 该网格接收阴影
        lobotomyMesh.castShadow = true    // 该网格投射阴影

        // 初始化动画混合器 (AnimationMixer)，用于播放 GLTF 模型中的动画
        this.mixer = new THREE.AnimationMixer(this.gltf.scene)
        const action = this.mixer.clipAction(this.gltf.animations[0]) // 获取模型中的第一个动画剪辑
        action.play() // 播放该动画

        // 从 GLTF 场景中查找名为 'ScreenMesh' 的子对象 (可能是模型上的一个屏幕)
        const screenMesh = this.gltf.scene.children.find((child) => {
            return child.name === 'ScreenMesh'
        })
        // 为屏幕网格创建一个新的标准材质
        const screenMaterial = new THREE.MeshStandardMaterial({
            map: this.app.camera.screenRenderTarget.texture // 将应用相机的渲染目标纹理作为屏幕的贴图
        })
        screenMesh.material = screenMaterial // 应用材质
        screenMesh.flipY = true // Y 轴翻转 (通常因为渲染目标纹理的坐标系问题)

        this.model = this.gltf.scene // 将 GLTF 场景的根对象赋值给 this.model
        this.model.position.set(0, 0, 0) // 设置模型在场景中的位置
        this.model.scale.set(0.5, 0.5, 0.5) // 设置模型的缩放比例
        this.app.scene.add(this.model) // 将模型添加到主场景中

        // 创建一个聚光灯 (SpotLight)
        this.spotLight = new THREE.SpotLight(
            new THREE.Color('#CA1713').convertLinearToSRGB(), // 灯光颜色 (转换为 SRGB)
            0.1,  // 灯光强度
            5,    // 最大照射距离
            Math.PI / 5, // 光锥角度
            0.4,  // 半影衰减 (penumbra)
            -50   // 衰减率 (decay)
        )
        this.spotLight.position.set(-2.5, 1.927, 2.65) // 设置聚光灯的位置
        this.spotLight.target.position.set(0, 1, 2.4) // 设置聚光灯的目标位置 (照射方向)
        this.spotLight.shadow.camera.near = 0.2 // 阴影相机的近裁剪面
        this.spotLight.shadow.camera.far = 2    // 阴影相机的远裁剪面

        this.spotLight.castShadow = true // 聚光灯产生阴影
        this.spotLight.shadow.bias = -0.01 // 阴影偏移，防止自阴影失真

        this.app.scene.add(this.spotLight) // 将聚光灯添加到场景
        this.app.scene.add(this.spotLight.target) // 将聚光灯的目标对象也添加到场景 (目标对象本身不可见，但用于定义方向)

        // 如果 URL 参数不存在 (this.app.network.urlParams 为假值)
        if (!this.app.network.urlParams)
            this.generateText() // 则调用 generateText 方法生成文本
        this.generateSecondScene() // 调用 generateSecondScene 方法生成第二个场景的元素

        // 如果应用开启了调试模式
        if (this.app.debug.active) {
            // 使用调试 UI (可能是 lil-gui 或 dat.GUI) 添加控件来调整聚光灯的位置、角度和颜色
            this.app.debug.ui.add(this.spotLight.position, 'x', -5, 5, 0.001)
            this.app.debug.ui.add(this.spotLight.position, 'y', -5, 5, 0.001)
            this.app.debug.ui.add(this.spotLight.position, 'z', -5, 5, 0.001)
            this.app.debug.ui.add(this.spotLight, 'angle', 0, Math.PI / 4, 0.001)

            this.app.debug.ui.add(this.spotLight.target.position, 'x', -5, 5, 0.001)
            this.app.debug.ui.add(this.spotLight.target.position, 'y', -5, 5, 0.001)
            this.app.debug.ui.add(this.spotLight.target.position, 'z', -5, 5, 0.001)

            this.app.debug.ui.addColor(this.spotLight, 'color')
        }
    }

    generateText() { // 生成文本的方法
        // 创建标题文本对象
        const titleText = new Text()
        titleText.text = '埋葬协议' // 文本内容
        titleText.font = this.app.resources.items.Font.parameters.font // 字体文件路径
        titleText.fontSize = 0.1 // 字体大小
        titleText.position.set(0.43, 0.79, 4.55) // 文本位置
        titleText.rotation.set(-0.27, -0.611, -0.159) // 文本旋转
        titleText.color = '#d9d9d9' // 文本颜色
        titleText.sync() // 同步文本对象以应用更改 (troika-three-text 的要求)
        this.app.scene.add(titleText) // 将标题文本添加到场景

        // 创建支部文本对象
        const branchText = new Text()
        branchText.text = '支部 O-251'
        branchText.font = this.app.resources.items.Font.parameters.font
        branchText.fontSize = 0.075
        branchText.position.set(0.42, 0.7, 4.566)
        branchText.color = '#d9d9d9'
        branchText.rotation.set(-0.27, -0.611, -0.159)
        branchText.sync()
        this.app.scene.add(branchText)

        // 创建位置文本对象
        const locationText = new Text()
        locationText.text = '惩戒部'
        locationText.font = this.app.resources.items.Font.parameters.font
        locationText.fontSize = 0.075
        locationText.position.set(0.41, 0.628, 4.58)
        locationText.rotation.set(-0.27, -0.611, -0.159)
        locationText.color = '#d9d9d9'
        locationText.sync()
        this.app.scene.add(locationText)

        // 创建 GSAP 时间轴，用于编排文本动画
        const timeline = gsap.timeline()
        // 标题文本入场动画：从指定位置移动到当前位置，延迟2秒开始
        timeline.from(titleText.position, { duration: 3.0, ease: 'power4', x: 0.41, y: 0.6, z: 4.6 }, "+=2")
            // 标题文本材质淡入动画：从透明到不透明，与上一个动画在时间上重叠 100% (即同时开始，但可能有内部延迟)
            .from(titleText.material, { duration: 3.0, ease: 'power2', opacity: 0 }, "-=100%")
            // 支部文本入场动画
            .from(branchText.position, { duration: 3.0, ease: 'power4', x: 0.41, y: 0.5, z: 4.6 }, "-=33%") // 相对上一个动画结束点提前 33% 开始
            .from(branchText.material, { duration: 3.0, ease: 'power2', opacity: 0 }, "-=100%")
            // 位置文本入场动画
            .from(locationText.position, { duration: 3.0, ease: 'power4', x: 0.41, y: 0.5, z: 4.6 }, "-=75%")
            .from(locationText.material, { duration: 3.0, ease: 'power2', opacity: 0 }, "-=100%")
            // 标题文本淡出动画：延迟 0.5 秒后开始
            .to(titleText.material, { duration: 1.5, ease: 'power4', opacity: 0 }, "+=0.5")
            // 支部文本淡出动画
            .to(branchText.material, { duration: 1.5, ease: 'power4', opacity: 0 }, "-=100%")
            // 位置文本淡出动画，并在动画完成时执行回调函数
            .to(locationText.material, {
                duration: 1.5, ease: 'power4', opacity: 0, onComplete: () => {
                    this.app.scene.remove(locationText, branchText, titleText) // 从场景中移除文本对象
                    locationText.dispose() // 释放 troika-three-text 对象占用的资源
                    branchText.dispose()
                    titleText.dispose()
                }
            }, "-=100%")

        // 创建埋葬通知文本对象
        const burialText = new Text()
        burialText.text = '此处设施已完成掩埋。\n如有任何投诉或疑问\n请参阅您与Lobotomy Corporation签订的雇佣合同。\n我们感谢您的辛勤与真挚付出。' // 多行文本
        burialText.font = this.app.resources.items.Font.parameters.font
        burialText.fontSize = 0.05
        burialText.lineHeight = 1.3 // 设置行高
        burialText.position.set(0.42, 0.7, 4.566)
        burialText.color = '#d9d9d9'
        burialText.rotation.set(-0.27, -0.611, -0.159)
        burialText.sync()
        this.app.scene.add(burialText)

        // 这部分 streamText (流信息文本) 的代码被注释掉了，所以不会执行
        // const streamText = new Text()
        // streamText.text = `(P.S. If you're looking for the stream function, type ?channel=name here after the URL)\n(P.P.S. You can control the brightness by typing &brightness=number here after the channel)`
        // ... (省略其他设置)
        // this.app.scene.add(streamText)

        // 继续使用之前的时间轴，为 burialText 创建入场动画
        timeline.from(burialText.position, { duration: 3.0, ease: 'power4', x: 0.45, y: 0.7, z: 4.7 })
            .from(burialText.material, { duration: 3.0, ease: 'power2.inOut', opacity: 0 }, "-=100%")
            // 这两行是为被注释掉的 streamText 准备的动画，因为 streamText 未创建，所以这两行可能不会产生预期效果或报错
            .from(streamText.position, { duration: 3.0, ease: 'power4', x: 0.47, y: 0.4, z: 4.7 }, "+=3") // 注意: streamText 在此作用域内未定义
            .from(streamText.material, { duration: 3.0, ease: 'power2.inOut', opacity: 0 }, "-=100%") // 注意: streamText 在此作用域内未定义

        // 如果应用开启了调试模式
        if (this.app.debug.ui) {
            // 为标题文本和位置文本的位置添加调试 UI 控件
            this.app.debug.ui.add(titleText.position, 'x', -5, 5, 0.001)
            this.app.debug.ui.add(titleText.position, 'y', -5, 5, 0.001)
            this.app.debug.ui.add(titleText.position, 'z', -5, 5, 0.001)

            this.app.debug.ui.add(locationText.position, 'x', -5, 5, 0.001)
            this.app.debug.ui.add(locationText.position, 'y', -5, 5, 0.001)
            this.app.debug.ui.add(locationText.position, 'z', -5, 5, 0.001)
        }
    }

    generateSecondScene() { // 生成第二个场景元素的方法 (可能是叠加在主场景之上的UI层)
        const logo = this.app.resources.items.Logo // 获取 Logo 纹理资源
        logo.flipY = true // Y 轴翻转纹理 (通常因为纹理坐标系与 UV 坐标系不一致)
        logo.colorSpace = THREE.SRGBColorSpace // 设置 Logo 纹理的颜色空间

        // 为 Logo 创建一个基础网格材质 (MeshBasicMaterial)，不受光照影响
        const logoMaterial = new THREE.MeshBasicMaterial({
            map: logo, // 使用 Logo 纹理
            transparent: false, // 默认不透明，但下面的 alphaTest 会处理透明区域
            alphaTest: 0.05,    // Alpha 测试阈值，像素的 alpha 值低于此值则不渲染
            opacity: 0.1,       // 整体不透明度
            color: '#606060',   // 材质颜色 (会与纹理颜色混合)
            depthWrite: false   // 不写入深度缓冲区 (通常用于 UI 元素，避免遮挡问题)
        })
        // 创建一个平面几何体 (PlaneGeometry) 作为背景图像的载体
        const backgroundImage = new THREE.Mesh(new THREE.PlaneGeometry(), logoMaterial)
        backgroundImage.position.set(0, 0.75, 2) // 设置背景图像的位置
        this.app.screenScene.add(backgroundImage) // 将背景图像添加到 screenScene (可能是专门用于屏幕空间元素的场景)
    }

    tick() { // 每帧调用的更新方法
        this.mixer.update(this.app.utils.delta) // 更新动画混合器，传入时间增量 (delta time)

        // 聚光灯闪烁逻辑
        if (this.app.utils.elapsedTime > this.blinkTime) { // 如果总运行时间超过了 blinkTime
            // 重新计算下一次 blinkTime：当前时间 + 2到7秒之间的随机数
            this.blinkTime = this.app.utils.elapsedTime + (Math.random() * 5) + 2
            this.spotLight.intensity = 0 // 关闭聚光灯 (强度设为0)
        }
        else if (this.app.utils.elapsedTime > this.onTime) { // 否则，如果总运行时间超过了 onTime
            // 重新计算下一次 onTime：当前的 blinkTime + 0.2到1.2秒之间的随机数
            this.onTime = this.blinkTime + Math.random() + 0.2
            this.spotLight.intensity = 0.1 // 打开聚光灯 (强度设为0.1)
        }
    }
}
