import { useRef, useState, useLayoutEffect } from 'react'
import {
  render,
  createPortal,
  events,
  unmountComponentAtNode
} from '@react-three/fiber'
import { Application } from '@splinetool/runtime'
import { suspend } from 'suspend-react'

/**
 * Creates a R3F canvas that renders into a Spline scene.
 */
function Canvas(
  /** @type {import('@react-three/fiber').Props} */
  { style, className, onCreated, scene, children, ...props }
) {
  // Mounted Spline container ref
  const container = useRef()
  // A canvas that isn't added to the body
  const [dummy] = useState(() => document.createElement('canvas'))
  // Spline's runtime API
  const spline = suspend(
    async (scene) => {
      const canvas = document.createElement('canvas')
      const app = new Application(canvas, { autoRender: false })

      await app.load(scene)

      return app
    },
    [scene]
  )

  // Portal JSX into the Spline scene as a render-effect
  render(createPortal(children, spline._scene), dummy, {
    ...props,
    // For internal color-space conversion
    linear: true,
    // Calculate events based on Spline's drawing area
    raycaster: {
      computeOffsets: () => ({
        width: spline._viewportWidth,
        height: spline._viewportHeight
      })
    },
    onCreated(state) {
      // Connect R3F events with Spline canvas
      state.events.connect(spline._renderer.domElement)

      // eslint-disable-next-line no-unused-expressions
      onCreated?.(state.get())
    },
    // Use events' callback to write into R3F's internal store
    events(store) {
      // Hijack the render loop and write Spline app to context
      cancelAnimationFrame(spline._rafId)
      store.getState().set(() => ({
        gl: spline._renderer,
        camera: spline._camera,
        scene: spline._scene,
        controls: spline._controls
      }))

      // Let threejs handle transforms
      spline._scene.traverse((node) => {
        if (node.isObject3D) node.matrixAutoUpdate = true
      })

      return events(store)
    }
  })

  // Handle page layout, cleanup on unmount
  useLayoutEffect(() => {
    const containerRef = container.current
    containerRef.appendChild(spline._renderer.domElement)

    return () => {
      containerRef.removeChild(spline._renderer.domElement)
      spline.dispose()
      unmountComponentAtNode(dummy)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spline])

  return <div className={className} style={style} ref={container} />
}

export default Canvas
