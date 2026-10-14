import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import type { Coordinates } from '../types/map'


export interface EarthGlobeRef {
  flyToLocation: (coords: Coordinates, altitude?: number, pitch?: number) => void
  zoomIn: () => void
  zoomOut: () => void
  toggle3D: () => void
  setLayer: (layer: 'satellite' | 'street') => void
  getViewer: () => Cesium.Viewer | null
}

interface EarthGlobeProps {
  onViewerReady?: (viewer: Cesium.Viewer) => void
  userLocation: Coordinates | null
  onLocationDetected?: (coords: Coordinates) => void
}

export const EarthGlobe = forwardRef<EarthGlobeRef, EarthGlobeProps>(
  ({ onViewerReady, userLocation, onLocationDetected }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const creditRef = useRef<HTMLDivElement>(null)
    const viewerRef = useRef<Cesium.Viewer | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [isTilted, setIsTilted] = useState(false)
    const currentLayerRef = useRef<'satellite' | 'street'>('satellite')

    // Expose control methods to parent
    useImperativeHandle(ref, () => ({
      flyToLocation: (coords: Coordinates, altitude = 32000, pitch = -65) => {
        const viewer = viewerRef.current
        if (!viewer || viewer.isDestroyed()) return

        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            coords.longitude,
            coords.latitude,
            coords.altitude || altitude
          ),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(pitch),
            roll: 0.0,
          },
          duration: 3.2,
          easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
        })
      },

      zoomIn: () => {
        const viewer = viewerRef.current
        if (!viewer || viewer.isDestroyed()) return
        const camera = viewer.camera
        const currentAltitude = camera.positionCartographic.height
        const targetAltitude = Math.max(currentAltitude * 0.45, 800)

        camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            Cesium.Math.toDegrees(camera.positionCartographic.longitude),
            Cesium.Math.toDegrees(camera.positionCartographic.latitude),
            targetAltitude
          ),
          duration: 1.0,
          easingFunction: Cesium.EasingFunction.QUADRATIC_OUT,
        })
      },

      zoomOut: () => {
        const viewer = viewerRef.current
        if (!viewer || viewer.isDestroyed()) return
        const camera = viewer.camera
        const currentAltitude = camera.positionCartographic.height
        const targetAltitude = Math.min(currentAltitude * 2.2, 28000000)

        camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            Cesium.Math.toDegrees(camera.positionCartographic.longitude),
            Cesium.Math.toDegrees(camera.positionCartographic.latitude),
            targetAltitude
          ),
          duration: 1.0,
          easingFunction: Cesium.EasingFunction.QUADRATIC_OUT,
        })
      },

      toggle3D: () => {
        const viewer = viewerRef.current
        if (!viewer || viewer.isDestroyed()) return
        const camera = viewer.camera
        const newTilt = !isTilted
        setIsTilted(newTilt)

        const targetPitch = newTilt ? -45 : -88
        camera.flyTo({
          destination: camera.position,
          orientation: {
            heading: camera.heading,
            pitch: Cesium.Math.toRadians(targetPitch),
            roll: 0.0,
          },
          duration: 1.2,
          easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
        })
      },

      setLayer: (layerType: 'satellite' | 'street') => {
        currentLayerRef.current = layerType
        applyImagery(layerType)
      },

      getViewer: () => viewerRef.current,
    }))

    // Function to apply satellite or street imagery
    const applyImagery = async (layerType: 'satellite' | 'street') => {
      const viewer = viewerRef.current
      if (!viewer || viewer.isDestroyed()) return

      const layers = viewer.imageryLayers
      layers.removeAll()

      if (layerType === 'satellite') {
        try {
          // ArcGIS World Imagery (Satellite)
          const satelliteProvider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
            'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
            { enablePickFeatures: false }
          )
          const satLayer = layers.addImageryProvider(satelliteProvider)
          satLayer.brightness = 1.05
          satLayer.contrast = 1.12
          satLayer.saturation = 1.18

          // ArcGIS Boundaries and Places overlay (Country borders, state lines & labels)
          const refProvider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
            'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer',
            { enablePickFeatures: false }
          )
          const refLayer = layers.addImageryProvider(refProvider)
          refLayer.alpha = 0.95
        } catch (err) {
          console.warn('ArcGIS satellite load error, using fallback:', err)
          try {
            const fallback = await Cesium.TileMapServiceImageryProvider.fromUrl(
              Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
            )
            layers.addImageryProvider(fallback)
          } catch (e) {
            console.error('Fallback imagery error:', e)
          }
        }
      } else {
        // Street / Standard Map view using CartoDB Voyager
        try {
          const streetProvider = new Cesium.UrlTemplateImageryProvider({
            url: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
            maximumLevel: 19,
          })
          layers.addImageryProvider(streetProvider)
        } catch (err) {
          console.error('Street map provider error:', err)
        }
      }
    }

    useEffect(() => {
      if (!containerRef.current || !creditRef.current) return

      // Disable Ion default ping
      Cesium.Ion.defaultAccessToken = ''

      // Initialize Cesium Viewer
      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        scene3DOnly: true,
        skyBox: false,
        creditContainer: creditRef.current,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        baseLayer: false,
        contextOptions: {
          webgl: {
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance',
          },
        },
      })

      viewerRef.current = viewer
      onViewerReady?.(viewer)

      const scene = viewer.scene
      const globe = scene.globe
      const camera = viewer.camera

      // Dark space background and globe styling
      scene.backgroundColor = Cesium.Color.fromRgba(0x00000000)
      globe.baseColor = Cesium.Color.fromCssColorString('#0a1626')
      globe.showGroundAtmosphere = true
      globe.enableLighting = false
      globe.maximumScreenSpaceError = 1.8

      if (scene.skyAtmosphere) {
        scene.skyAtmosphere.show = true
        scene.skyAtmosphere.brightnessShift = 0.18
        scene.skyAtmosphere.saturationShift = 0.25
      }

      // Camera Controls
      const controller = scene.screenSpaceCameraController
      controller.enableRotate = true
      controller.enableZoom = true
      controller.enableTilt = true
      controller.enableLook = false
      controller.enableTranslate = true
      controller.inertiaSpin = 0.88
      controller.inertiaZoom = 0.82
      controller.minimumZoomDistance = 600
      controller.maximumZoomDistance = 28000000

      // Remove default double click tracker
      viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      )

      // Initial Camera Position: MATCHING THE USER'S GOOGLE MAPS SCREENSHOT
      // Centered on India/Arabian Sea, showing Europe, Africa, Asia, Australia
      camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(74.0, 18.0, 18500000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-88), // Overhead globe perspective as in screenshot
          roll: 0.0,
        },
      })

      // Load initial satellite imagery
      applyImagery('satellite')

      // Auto-rotation when zoomed out at global scale (> 10M meters)
      let isInteracting = false
      let lastInteractionTime = 0

      const eventHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
      const onStart = () => {
        isInteracting = true
        lastInteractionTime = performance.now()
      }
      const onEnd = () => {
        isInteracting = false
        lastInteractionTime = performance.now()
      }

      eventHandler.setInputAction(onStart, Cesium.ScreenSpaceEventType.LEFT_DOWN)
      eventHandler.setInputAction(onStart, Cesium.ScreenSpaceEventType.RIGHT_DOWN)
      eventHandler.setInputAction(onStart, Cesium.ScreenSpaceEventType.MIDDLE_DOWN)
      eventHandler.setInputAction(onStart, Cesium.ScreenSpaceEventType.PINCH_START)
      eventHandler.setInputAction(onEnd, Cesium.ScreenSpaceEventType.LEFT_UP)
      eventHandler.setInputAction(onEnd, Cesium.ScreenSpaceEventType.RIGHT_UP)
      eventHandler.setInputAction(onEnd, Cesium.ScreenSpaceEventType.MIDDLE_UP)
      eventHandler.setInputAction(onEnd, Cesium.ScreenSpaceEventType.PINCH_END)
      eventHandler.setInputAction(() => {
        lastInteractionTime = performance.now()
      }, Cesium.ScreenSpaceEventType.WHEEL)

      let lastTick = performance.now()
      const onPreRender = () => {
        const now = performance.now()
        const dt = Math.min((now - lastTick) / 1000, 0.1)
        lastTick = now

        // Only rotate when zoomed out far and user is not actively interacting
        const currentAltitude = camera.positionCartographic.height
        if (currentAltitude > 9000000 && !isInteracting && now - lastInteractionTime > 3000) {
          camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.0004 * dt)
        }
      }

      scene.preRender.addEventListener(onPreRender)

      // Geolocation Zoom-In Workflow (Like Google Maps)
      const initiateLocationZoom = async () => {
        let detectedCoords: Coordinates | null = userLocation

        if (!detectedCoords) {
          // Try high-accuracy browser geolocation first
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              if (!navigator.geolocation) return reject(new Error('No geolocation'))
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 4000,
                maximumAge: 60000,
              })
            })

            detectedCoords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
          } catch {
            // Fallback to IP geolocation if GPS permission is denied or delayed
            try {
              const res = await fetch('https://get.geojs.io/v1/ip/geo.json')
              const data = await res.json()
              detectedCoords = {
                latitude: parseFloat(data.latitude),
                longitude: parseFloat(data.longitude),
              }
            } catch {
              // Default to India (Kolkata/Agartala region from screenshot)
              detectedCoords = { latitude: 23.8315, longitude: 91.2868 }
            }
          }
        }

        if (detectedCoords) {
          onLocationDetected?.(detectedCoords)

          // Pause at initial global view for 1.4s matching screenshot, then smooth fly-in
          setTimeout(() => {
            if (viewer.isDestroyed()) return
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(
                detectedCoords!.longitude,
                detectedCoords!.latitude,
                32000 // 32km altitude reveals city, roads, and landscape clearly
              ),
              orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-65),
                roll: 0.0,
              },
              duration: 3.6,
              easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
            })
          }, 1400)
        }
      }

      initiateLocationZoom()

      const readyTimer = setTimeout(() => {
        setIsLoaded(true)
      }, 350)

      return () => {
        clearTimeout(readyTimer)
        scene.preRender.removeEventListener(onPreRender)
        eventHandler.destroy()
        viewer.destroy()
        viewerRef.current = null
      }
    }, [])

    return (
      <div className="earth-viewport-container">
        {/* Loading Curtain */}
        <div className={`loading-curtain ${isLoaded ? 'hidden' : ''}`}>
          <div className="google-spinner" />
        </div>

        {/* Cesium Canvas Container */}
        <div ref={containerRef} className="cesium-wrapper" />

        {/* Unobtrusive Credit attribution */}
        <div ref={creditRef} className="google-credits-container" />
      </div>
    )
  }
)
