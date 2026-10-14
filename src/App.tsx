import { useEffect, useRef, useState, useCallback } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

/* ─────────────────────────────────────────────────────────────
   Starfield Canvas — twinkling pinprick stars in outer space
   ───────────────────────────────────────────────────────────── */
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    type Star = { x: number; y: number; r: number; alpha: number; base: number; speed: number; phase: number }
    let stars: Star[] = []
    let raf: number

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.floor((w * h) / 5000)
      stars = Array.from({ length: count }, () => {
        const base = Math.random() * 0.6 + 0.2
        return { x: Math.random() * w, y: Math.random() * h, r: Math.random() * 0.9 + 0.35, alpha: base, base, speed: Math.random() * 0.012 + 0.004, phase: Math.random() * Math.PI * 2 }
      })
    }

    init()
    window.addEventListener('resize', init)

    let last = performance.now()
    const draw = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (const s of stars) {
        s.phase += s.speed * 60 * dt
        const a = Math.max(0.05, Math.min(1, s.base + Math.sin(s.phase) * 0.22))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(220,235,255,${a})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { window.removeEventListener('resize', init); cancelAnimationFrame(raf) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />
}

/* ─────────────────────────────────────────────────────────────
   Pulsing blue dot — Google Maps style user location marker
   ───────────────────────────────────────────────────────────── */
function UserDot({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{ position: 'absolute', top: 0, left: 0, transform: `translate(${x}px,${y}px)`, pointerEvents: 'none', zIndex: 35 }}
    >
      {/* Outer pulse halo */}
      <div style={{
        position: 'absolute', top: -24, left: -24, width: 48, height: 48, borderRadius: '50%',
        background: 'rgba(66,133,244,0.28)', animation: 'pulseHalo 2.2s cubic-bezier(.2,.6,.4,1) infinite'
      }} />
      {/* Blue GPS core dot */}
      <div style={{
        position: 'absolute', top: -9, left: -9, width: 18, height: 18, borderRadius: '50%',
        background: '#1a73e8', border: '2.5px solid #fff', boxShadow: '0 1px 5px rgba(0,0,0,.5)'
      }} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Zoom Controls — + / – / locate
   ───────────────────────────────────────────────────────────── */
function Controls({
  onZoomIn, onZoomOut, onLocate, locating
}: { onZoomIn: () => void; onZoomOut: () => void; onLocate: () => void; locating: boolean }) {
  const btn: React.CSSProperties = {
    width: 44, height: 44, borderRadius: 8, background: '#fff', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 5px rgba(0,0,0,.32)',
    fontSize: 20, fontWeight: 400, color: '#5f6368', transition: 'background .15s'
  }

  return (
    <div style={{ position: 'absolute', bottom: 32, right: 20, zIndex: 60, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Location target */}
      <button
        id="btn-locate"
        style={{ ...btn, animation: locating ? 'spinBtn 1.1s linear infinite' : 'none' }}
        onClick={onLocate}
        title="Go to my location"
      >
        <svg width="22" height="22" viewBox="0 0 24 24"><path fill="#5f6368" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
      </button>

      {/* Zoom stack */}
      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 5px rgba(0,0,0,.32)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <button id="btn-zoomin" style={{ ...btn, boxShadow: 'none', borderRadius: 0, borderBottom: '1px solid #dadce0' }} onClick={onZoomIn} title="Zoom in">
          <svg width="22" height="22" viewBox="0 0 24 24"><path fill="#5f6368" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
        <button id="btn-zoomout" style={{ ...btn, boxShadow: 'none', borderRadius: 0 }} onClick={onZoomOut} title="Zoom out">
          <svg width="22" height="22" viewBox="0 0 24 24"><path fill="#5f6368" d="M19 13H5v-2h14v2z"/></svg>
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main App
   ───────────────────────────────────────────────────────────── */
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const userCoordsRef = useRef<{ lon: number; lat: number } | null>(null)
  const [dotPos, setDotPos] = useState<{ x: number; y: number } | null>(null)
  const [ready, setReady] = useState(false)
  const [locating, setLocating] = useState(false)

  /* ── fly camera to a position ── */
  const flyTo = useCallback((lon: number, lat: number, altKm: number, pitch: number, duration: number) => {
    const v = viewerRef.current
    if (!v || v.isDestroyed()) return
    v.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, altKm * 1000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(pitch),
        roll: 0,
      },
      duration,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    })
  }, [])

  /* ── zoom relative to current altitude ── */
  const relZoom = useCallback((factor: number) => {
    const v = viewerRef.current
    if (!v || v.isDestroyed()) return
    const cam = v.camera
    const pos = cam.positionCartographic
    const newAlt = Math.max(0.6, Math.min(28000, pos.height / 1000 * factor))
    v.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        Cesium.Math.toDegrees(pos.longitude),
        Cesium.Math.toDegrees(pos.latitude),
        newAlt * 1000
      ),
      orientation: { heading: cam.heading, pitch: cam.pitch, roll: 0 },
      duration: 0.9,
      easingFunction: Cesium.EasingFunction.QUADRATIC_OUT,
    })
  }, [])

  /* ── fly back to user location ── */
  const goToMyLocation = useCallback(() => {
    const coords = userCoordsRef.current
    if (coords) {
      setLocating(true)
      flyTo(coords.lon, coords.lat, 32, -70, 2.5)
      setTimeout(() => setLocating(false), 2600)
    }
  }, [flyTo])

  /* ── Cesium init ── */
  useEffect(() => {
    if (!containerRef.current) return
    Cesium.Ion.defaultAccessToken = ''

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
      creditContainer: document.createElement('div'), // discard credits element
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      baseLayer: false,
      contextOptions: {
        webgl: { alpha: true, antialias: true, powerPreference: 'high-performance' },
      },
    })
    viewerRef.current = viewer

    const scene = viewer.scene
    const globe = scene.globe
    const camera = viewer.camera

    // Visual config
    scene.backgroundColor = Cesium.Color.fromRgba(0x00000000)
    globe.baseColor = Cesium.Color.fromCssColorString('#0a1626')
    globe.showGroundAtmosphere = true
    globe.enableLighting = false
    globe.maximumScreenSpaceError = 1.8

    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true
      scene.skyAtmosphere.brightnessShift = 0.2
      scene.skyAtmosphere.saturationShift = 0.28
    }

    // Camera controls
    const ctrl = scene.screenSpaceCameraController
    ctrl.enableRotate = true
    ctrl.enableZoom = true
    ctrl.enableTilt = true
    ctrl.enableLook = false
    ctrl.enableTranslate = true
    ctrl.inertiaSpin = 0.9
    ctrl.inertiaZoom = 0.85
    ctrl.minimumZoomDistance = 600
    ctrl.maximumZoomDistance = 28_000_000

    // Remove double-click jump
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

    // ── Load imagery ──
    const loadImagery = async () => {
      const layers = viewer.imageryLayers
      layers.removeAll()
      try {
        const sat = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
          { enablePickFeatures: false }
        )
        const satL = layers.addImageryProvider(sat)
        satL.brightness = 1.05
        satL.contrast = 1.1
        satL.saturation = 1.2

        const ref = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
          'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer',
          { enablePickFeatures: false }
        )
        layers.addImageryProvider(ref).alpha = 0.92
      } catch {
        try {
          const nb = await Cesium.TileMapServiceImageryProvider.fromUrl(Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII'))
          layers.addImageryProvider(nb)
        } catch { /* silent */ }
      }
    }
    loadImagery()

    // ── Step 1: Start showing the full Earth ──
    // Bird's-eye view of Earth centred on Asia/India (matches the Google Maps screenshot)
    camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(74.0, 18.0, 20_000_000),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-88), roll: 0 },
    })

    // ── Auto-rotation (only when zoomed out > 10 000 km) ──
    let interacting = false
    let lastInteract = 0
    const evtH = new Cesium.ScreenSpaceEventHandler(scene.canvas)
    const onDown = () => { interacting = true; lastInteract = performance.now() }
    const onUp = () => { interacting = false; lastInteract = performance.now() }
    evtH.setInputAction(onDown, Cesium.ScreenSpaceEventType.LEFT_DOWN)
    evtH.setInputAction(onDown, Cesium.ScreenSpaceEventType.RIGHT_DOWN)
    evtH.setInputAction(onDown, Cesium.ScreenSpaceEventType.MIDDLE_DOWN)
    evtH.setInputAction(onDown, Cesium.ScreenSpaceEventType.PINCH_START)
    evtH.setInputAction(onUp, Cesium.ScreenSpaceEventType.LEFT_UP)
    evtH.setInputAction(onUp, Cesium.ScreenSpaceEventType.RIGHT_UP)
    evtH.setInputAction(onUp, Cesium.ScreenSpaceEventType.MIDDLE_UP)
    evtH.setInputAction(onUp, Cesium.ScreenSpaceEventType.PINCH_END)
    evtH.setInputAction(() => { lastInteract = performance.now() }, Cesium.ScreenSpaceEventType.WHEEL)

    window.addEventListener('pointerup', onUp)
    window.addEventListener('touchend', onUp)

    let lastTick = performance.now()
    const preRender = () => {
      const now = performance.now()
      const dt = Math.min((now - lastTick) / 1000, 0.08)
      lastTick = now
      const alt = camera.positionCartographic.height
      if (alt > 10_000_000 && !interacting && now - lastInteract > 2800) {
        camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.00038 * dt)
      }
    }
    scene.preRender.addEventListener(preRender)

    // ── Step 2: Detect location then fly in ──
    const zoomToLocation = async () => {
      let lon = 72.88, lat = 19.07 // fallback: Mumbai

      // Browser GPS first (fast timeout)
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => {
          if (!navigator.geolocation) return rej(new Error('no geo'))
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: false, timeout: 3500, maximumAge: 120_000 })
        })
        lon = pos.coords.longitude
        lat = pos.coords.latitude
      } catch {
        // IP fallback
        try {
          const r = await fetch('https://get.geojs.io/v1/ip/geo.json')
          const d = await r.json()
          lon = parseFloat(d.longitude)
          lat = parseFloat(d.latitude)
        } catch { /* use Mumbai fallback */ }
      }

      userCoordsRef.current = { lon, lat }

      // Pause briefly on globe view, then smoothly zoom in
      setTimeout(() => {
        if (viewer.isDestroyed()) return
        // Two-stage: first swoop to continent level, then city level
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, 1_200_000),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-80), roll: 0 },
          duration: 2.4,
          easingFunction: Cesium.EasingFunction.QUADRATIC_IN,
          complete: () => {
            if (viewer.isDestroyed()) return
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(lon, lat, 32_000),
              orientation: { heading: 0, pitch: Cesium.Math.toRadians(-68), roll: 0 },
              duration: 2.2,
              easingFunction: Cesium.EasingFunction.QUADRATIC_OUT,
            })
          }
        })
      }, 1600) // let the user see the full Earth for 1.6s
    }
    zoomToLocation()

    // ── Track user dot position ──
    const ellipsoid = Cesium.Ellipsoid.WGS84
    const updateDot = () => {
      if (!userCoordsRef.current || viewer.isDestroyed()) return
      const { lon, lat } = userCoordsRef.current
      const cart = Cesium.Cartesian3.fromDegrees(lon, lat, 0)
      const occ = new Cesium.EllipsoidalOccluder(ellipsoid, camera.positionWC)
      if (!occ.isPointVisible(cart)) { setDotPos(null); return }
      const wp = Cesium.SceneTransforms.worldToWindowCoordinates(scene, cart)
      if (wp) setDotPos({ x: wp.x, y: wp.y })
      else setDotPos(null)
    }
    scene.postRender.addEventListener(updateDot)

    setTimeout(() => setReady(true), 400)

    return () => {
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('touchend', onUp)
      scene.preRender.removeEventListener(preRender)
      scene.postRender.removeEventListener(updateDot)
      evtH.destroy()
      viewer.destroy()
      viewerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      {/* Loading curtain */}
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(255,255,255,.12)', borderTopColor: '#1a73e8', animation: 'spinBtn 0.9s linear infinite' }} />
        </div>
      )}

      {/* Stars */}
      <Starfield />

      {/* Deep space horizon glow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(25,95,210,.13) 0%, rgba(10,40,120,.06) 38%, transparent 68%)'
      }} />

      {/* Cesium canvas */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 3, cursor: 'grab', touchAction: 'none' }} />

      {/* User location blue dot */}
      {dotPos && <UserDot x={dotPos.x} y={dotPos.y} />}

      {/* Zoom + Locate controls */}
      <Controls
        onZoomIn={() => relZoom(0.42)}
        onZoomOut={() => relZoom(2.4)}
        onLocate={goToMyLocation}
        locating={locating}
      />

      {/* Google Maps watermark */}
      <div style={{
        position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
        pointerEvents: 'none', zIndex: 50, display: 'flex', gap: 3,
        fontFamily: '"Google Sans", Roboto, sans-serif',
        textShadow: '0 1px 4px rgba(0,0,0,.8)',
        color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: -0.1
      }}>
        <span>Google</span>
        <span style={{ fontWeight: 400 }}>Maps</span>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; height: 100%; overflow: hidden; background: #000; }
        body { user-select: none; -webkit-user-select: none; }

        @keyframes pulseHalo {
          0%   { transform: scale(.35); opacity: .95; }
          70%  { transform: scale(1.65); opacity: .12; }
          100% { transform: scale(2.3); opacity: 0; }
        }
        @keyframes spinBtn {
          to { transform: rotate(360deg); }
        }

        /* Hide all Cesium chrome */
        .cesium-viewer-toolbar, .cesium-viewer-animationContainer,
        .cesium-viewer-timelineContainer, .cesium-viewer-bottom,
        .cesium-viewer-fullscreenContainer, .cesium-navigationHelpButton,
        .cesium-sceneModePicker-wrapper, .cesium-infoBox, .cesium-selection-wrapper {
          display: none !important;
        }
        .cesium-viewer .cesium-viewer-cesiumWidgetContainer canvas,
        .cesium-viewer canvas {
          width: 100% !important; height: 100% !important; outline: none;
        }
      `}</style>
    </div>
  )
}
