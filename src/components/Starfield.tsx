import React, { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  radius: number
  baseAlpha: number
  alpha: number
  twinkleSpeed: number
  twinklePhase: number
  color: string
}

export const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let stars: Star[] = []

    const starColors = [
      'rgba(255, 255, 255, ',
      'rgba(220, 235, 255, ',
      'rgba(255, 245, 230, ',
      'rgba(200, 225, 255, ',
    ]

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = window.innerWidth
      const height = window.innerHeight

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Calculate star count based on screen area (clean & scattered, not overly dense)
      const starCount = Math.floor((width * height) / 4800)
      stars = []

      for (let i = 0; i < starCount; i++) {
        const radius = Math.random() < 0.85 
          ? Math.random() * 0.7 + 0.4 // majority are faint pinpricks
          : Math.random() * 0.9 + 0.8  // occasional slightly brighter stars

        const baseAlpha = Math.random() * 0.55 + 0.25
        const color = starColors[Math.floor(Math.random() * starColors.length)]

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius,
          baseAlpha,
          alpha: baseAlpha,
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
          color,
        })
      }
    }

    resize()
    window.addEventListener('resize', resize)

    let lastTime = performance.now()

    const render = (time: number) => {
      const delta = (time - lastTime) / 1000
      lastTime = time

      const width = window.innerWidth
      const height = window.innerHeight

      ctx.clearRect(0, 0, width, height)

      // Render all stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        star.twinklePhase += star.twinkleSpeed * 60 * delta
        const twinkle = Math.sin(star.twinklePhase) * 0.25
        const currentAlpha = Math.max(0.1, Math.min(1.0, star.baseAlpha + twinkle))

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `${star.color}${currentAlpha})`
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="starfield-canvas" aria-hidden="true" />
}
