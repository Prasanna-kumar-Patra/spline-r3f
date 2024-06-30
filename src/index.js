import { useRef, useState, useMemo, Suspense } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { render } from 'react-dom'
import Canvas from './Canvas'

function Egg({ segments = 32, ...props }) {
  const mesh = useRef()
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)
  const points = useMemo(
    () =>
      Array.from({ length: segments }, (_, i) => {
        const rad = (Math.PI * i * 6) / 180
        return new THREE.Vector2(
          (0.72 + 0.08 * Math.cos(rad)) * Math.sin(rad),
          -Math.cos(rad)
        )
      }),
    [segments]
  )

  useFrame(() => (mesh.current.rotation.x += 0.01))

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? 1.5 : 1}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <latheGeometry args={[points, segments]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'pink'} />
    </mesh>
  )
}

render(
  <Suspense fallback={null}>
    <Canvas scene="https://prod.spline.design/5sJvNckzm1BhEgEw/scene.spline">
      <group position={[60, 40, 180]} scale={30}>
        <Egg position={[-1.2, 0, 0]} />
        <Egg position={[1.2, 0, 0]} />
      </group>
    </Canvas>
  </Suspense>,
  window.root
)
