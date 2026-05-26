import { useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import * as THREE from 'three'
import { MeshLine, MeshLineMaterial } from 'three.meshline'

const LINE_COUNT = 6
const POINTS_PER_LINE = 30

function initLine(line: MeshLine, _material: MeshLineMaterial) {
  const points: THREE.Vector3[] = []
  const startX = (Math.random() - 0.5) * 10
  const startY = (Math.random() - 0.5) * 6
  for (let i = 0; i < POINTS_PER_LINE; i++) {
    points.push(
      new THREE.Vector3(
        startX + i * 0.3,
        startY + Math.sin(i * 0.4 + Math.random() * 3) * 0.8,
        0
      )
    )
  }
  line.setPoints(
    points,
    (p: number) => 0.8 * Math.pow(4.0 * p * (1.0 - p), 0.5) + 0.2
  )
  return points
}

function updateLine(
  linePoints: THREE.Vector3[],
  cursor: THREE.Vector3 | null,
  dt: number
) {
  const speed = 2.0
  const time = performance.now() * 0.001
  linePoints.pop()
  const head = linePoints[0].clone()
  const move = new THREE.Vector3(0, 0, 0)
  move.x = Math.sin(time * 1.2 + head.y * 2.0) * 0.01
  move.y = Math.cos(time * 1.0 + head.x * 2.0) * 0.01
  if (cursor) {
    const toCursor = cursor.clone().sub(head)
    toCursor.multiplyScalar(0.02)
    move.add(toCursor)
  }
  move.multiplyScalar(speed * dt)
  head.add(move)
  head.x = ((head.x + 6) % 12) - 6
  head.y = ((head.y + 4) % 8) - 4
  linePoints.unshift(head)
}

function updateMeshLine(line: MeshLine, points: THREE.Vector3[]) {
  line.setPoints(
    points,
    (p: number) => 0.8 * Math.pow(4.0 * p * (1.0 - p), 0.5) + 0.2
  )
}

export default function InteractiveLightGrid() {
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 })
  const initRef = useRef(false)

  useEffect(() => {
    if (!canvasContainerRef.current || initRef.current) return

    const container = canvasContainerRef.current
    const width = container.offsetWidth
    const height = container.offsetHeight
    if (width === 0 || height === 0) return

    initRef.current = true

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#06182e')

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000)
    camera.position.set(0, 0, 10)
    camera.lookAt(0, 0, 0)

    // Grid Background Shader
    const bgVertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `
    const bgFragmentShader = `
      precision mediump float;
      uniform float time;
      uniform vec2 resolution;
      varying vec2 vUv;
      void main() {
        float gridSize = 20.0;
        float aspectRatio = resolution.x / resolution.y;
        vec2 uv = vUv * vec2(aspectRatio, 1.0) * gridSize;
        vec2 grid = abs(fract(uv - 0.5) - 0.5) / fwidth(uv);
        float line = min(grid.x, grid.y);
        vec3 color1 = vec3(0.024, 0.094, 0.180);
        vec3 color2 = vec3(0.039, 0.137, 0.220);
        vec3 finalColor = mix(color1, color2, 1.0 - min(line, 1.0));
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `

    const bgMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(width, height) },
      },
      vertexShader: bgVertexShader,
      fragmentShader: bgFragmentShader,
      depthWrite: false,
    })

    const bgGeometry = new THREE.PlaneGeometry(2, 2)
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial)
    bgMesh.renderOrder = -1
    scene.add(bgMesh)

    // Lines
    const lineData: {
      line: MeshLine
      material: MeshLineMaterial
      points: THREE.Vector3[]
    }[] = []

    const colors = ['#2a75d1', '#2a75d1', '#4a9eff', '#d4a017', '#2a75d1', '#4a9eff']

    for (let i = 0; i < LINE_COUNT; i++) {
      const line = new MeshLine()
      const material = new MeshLineMaterial({
        color: new THREE.Color(colors[i % colors.length]),
        opacity: 0.7,
        transparent: true,
        depthWrite: false,
        lineWidth: 0.12,
      })
      const mesh = new THREE.Mesh(line, material)
      scene.add(mesh)
      const points = initLine(line, material)
      lineData.push({ line, material, points })
    }

    // Interaction
    const mouse = new THREE.Vector2(0, 0)
    const raymouse = new THREE.Vector2(0, 0)
    const mouse3D = new THREE.Vector3(0, 0, 0)
    const raycaster = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      const rect = container.getBoundingClientRect()
      raymouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      raymouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(raymouse, camera)
      raycaster.ray.intersectPlane(plane, mouse3D)
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Animation
    let lastTime = performance.now() * 0.001
    let animId = 0
    let isVisible = true

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
      },
      { threshold: 0.1 }
    )
    observer.observe(container)

    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (!isVisible) return

      const now = performance.now() * 0.001
      const dt = Math.min(now - lastTime, 0.05)
      lastTime = now

      bgMaterial.uniforms.time.value = now

      for (const data of lineData) {
        updateLine(data.points, mouse3D, dt)
        updateMeshLine(data.line, data.points)
      }

      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const handleResize = () => {
      const w = container.offsetWidth
      const h = container.offsetHeight
      if (w === 0 || h === 0) return
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      bgMaterial.uniforms.resolution.value.set(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
      renderer.dispose()
      bgGeometry.dispose()
      bgMaterial.dispose()
      for (const data of lineData) {
        data.line.dispose()
        data.material.dispose()
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[80vh] md:min-h-[80vh] overflow-hidden"
    >
      {/* Three.js Canvas Container */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 z-0"
        role="img"
        aria-label="Abstract visualization of campus network connections"
      />

      {/* Content Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        className="relative z-10 flex flex-col justify-end min-h-[80vh] px-6 pb-16 md:pb-20 pt-32"
        style={{ paddingLeft: 'clamp(1.5rem, 5vw, 3rem)' }}
      >
        <div className="max-w-[480px]">
          <h2
            className="text-white font-bold tracking-[-0.02em]"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
          >
            Connected Campus, Seamless Living.
          </h2>
          <p className="mt-4 text-slate-200 text-base leading-relaxed">
            Behind every room assignment is a network of real-time data streams
            — occupancy sensors, payment gateways, and student records — all
            synchronized to give you instant, accurate results.
          </p>
          <a
            href="#system"
            className="inline-flex items-center gap-2 mt-6 text-amber-500 hover:underline text-sm font-medium transition-colors"
          >
            Learn About Our System
            <ArrowRight size={16} />
          </a>
        </div>
      </motion.div>
    </section>
  )
}
