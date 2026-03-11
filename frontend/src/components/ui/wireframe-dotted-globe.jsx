import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

export default function RotatingEarth({ className = "" }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // 1. Observe parent container for exactly square pixel dimensions
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // 2. Draw D3 logic using exact dimensions
  useEffect(() => {
    const { width: containerWidth, height: containerHeight } = dimensions
    if (!canvasRef.current || containerWidth === 0 || containerHeight === 0) return

    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    // Ensure perfect 1:1 ratio Math
    const size = Math.min(containerWidth, containerHeight)
    const radius = size / 2.2

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    context.scale(dpr, dpr)

    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([size / 2, size / 2])
      .clipAngle(90)

    const path = d3.geoPath().projection(projection).context(context)

    const pointInPolygon = (point, polygon) => {
      const [x, y] = point
      let inside = false

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]
        const [xj, yj] = polygon[j]

        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside
        }
      }

      return inside
    }

    const pointInFeature = (point, feature) => {
      const geometry = feature.geometry

      if (geometry.type === "Polygon") {
        const coordinates = geometry.coordinates
        if (!pointInPolygon(point, coordinates[0])) {
          return false
        }
        for (let i = 1; i < coordinates.length; i++) {
          if (pointInPolygon(point, coordinates[i])) {
            return false
          }
        }
        return true
      } else if (geometry.type === "MultiPolygon") {
        for (const polygon of geometry.coordinates) {
          if (pointInPolygon(point, polygon[0])) {
            let inHole = false
            for (let i = 1; i < polygon.length; i++) {
              if (pointInPolygon(point, polygon[i])) {
                inHole = true
                break
              }
            }
            if (!inHole) {
              return true
            }
          }
        }
        return false
      }

      return false
    }

    const generateDotsInPolygon = (feature, dotSpacing = 16) => {
      const dots = []
      const bounds = d3.geoBounds(feature)
      const [[minLng, minLat], [maxLng, maxLat]] = bounds

      const stepSize = dotSpacing * 0.08
      let pointsGenerated = 0

      for (let lng = minLng; lng <= maxLng; lng += stepSize) {
        for (let lat = minLat; lat <= maxLat; lat += stepSize) {
          const point = [lng, lat]
          if (pointInFeature(point, feature)) {
            dots.push(point)
            pointsGenerated++
          }
        }
      }

      return dots
    }

    const allDots = []
    let landFeatures

    const render = () => {
      context.clearRect(0, 0, size, size)

      const currentScale = projection.scale()
      const scaleFactor = currentScale / radius

      context.beginPath()
      context.arc(size / 2, size / 2, currentScale, 0, 2 * Math.PI)
      context.fillStyle = "transparent"
      context.fill()
      context.strokeStyle = "#8B1A1A"
      context.lineWidth = 1 * scaleFactor
      context.stroke()

      if (landFeatures) {
        const graticule = d3.geoGraticule()
        context.beginPath()
        path(graticule())
        context.strokeStyle = "#8B1A1A"
        context.lineWidth = 0.5 * scaleFactor
        context.globalAlpha = 0.15
        context.stroke()
        context.globalAlpha = 1

        context.beginPath()
        landFeatures.features.forEach((feature) => {
          path(feature)
        })
        context.strokeStyle = "#8B1A1A"
        context.lineWidth = 0.8 * scaleFactor
        context.stroke()

        allDots.forEach((dot) => {
          const projected = projection([dot.lng, dot.lat])
          // Bounds check with square dimensions
          if (
            projected &&
            projected[0] >= 0 &&
            projected[0] <= size &&
            projected[1] >= 0 &&
            projected[1] <= size
          ) {
            context.beginPath()
            context.arc(projected[0], projected[1], 1.2 * scaleFactor, 0, 2 * Math.PI)
            context.fillStyle = "#8B1A1A"
            context.fill()
          }
        })
      }
    }

    const loadWorldData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json",
        )
        if (!response.ok) throw new Error("Failed to load land data")

        landFeatures = await response.json()

        landFeatures.features.forEach((feature) => {
          const dots = generateDotsInPolygon(feature, 16)
          dots.forEach(([lng, lat]) => {
            allDots.push({ lng, lat, visible: true })
          })
        })

        render()
        setIsLoading(false)
      } catch (err) {
        setError("Failed to load land map data")
        setIsLoading(false)
      }
    }

    const rotation = [0, 0]
    let autoRotate = true
    const rotationSpeed = 0.2

    const rotate = () => {
      if (autoRotate) {
        rotation[0] += rotationSpeed
        projection.rotate(rotation)
        render()
      }
    }

    const rotationTimer = d3.timer(rotate)

    const handleMouseDown = (event) => {
      autoRotate = false
      const startX = event.clientX
      const startY = event.clientY
      const startRotation = [...rotation]

      const handleMouseMove = (moveEvent) => {
        const sensitivity = 0.5
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY

        rotation[0] = startRotation[0] + dx * sensitivity
        rotation[1] = startRotation[1] - dy * sensitivity
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]))

        projection.rotate(rotation)
        render()
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)

        setTimeout(() => {
          autoRotate = true
        }, 3000)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    const handleWheel = (event) => {
      event.preventDefault()
      const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1
      const newRadius = Math.max(radius * 0.5, Math.min(radius * 3, projection.scale() * scaleFactor))
      projection.scale(newRadius)
      render()
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("wheel", handleWheel, { passive: false })

    loadWorldData()

    return () => {
      rotationTimer.stop()
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("wheel", handleWheel)
    }
  }, [dimensions]) // Re-run D3 math when size changes

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-white rounded-2xl p-8 ${className}`}>
        <div className="text-center">
          <p className="text-burg font-semibold mb-2">Error loading Earth visualization</p>
          <p className="text-muted text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative flex items-center justify-center aspect-square ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-[12px] bg-transparent cursor-grab active:cursor-grabbing"
      />
    </div>
  )
}
