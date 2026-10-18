import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

/* ─────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────── */
export interface AuthUser {
  uid: string
  displayName: string
  email?: string
  photoURL: string
}

export interface SnapPost {
  id: string
  userId: string
  userName: string
  userAvatar: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  pandalName: string
  lat: number
  lng: number
  viewsCount: number
  likesCount: number
  createdAt: any
  // Optional / helper aliases
  pandal?: string
  neighborhood?: string
  uploader?: string
  avatar?: string
  imageUrl?: string
  coordinates?: { lat: number; lng: number }
  timestamp?: Date
  likes?: number
  views?: number
  emoji?: string
}

declare global {
  interface Window {
    google: any
    initMap: () => void
    exifr?: any
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Constants & Master Pandals (For Search & Proximity Auto-Complete)
   ───────────────────────────────────────────────────────────────────────── */
const AGARTALA_CENTER = { lat: 23.8315, lng: 91.2868 }
const MAPS_API_KEY = 'AIzaSyAnnaozqfYaMR6oUS6ihqkbn1bwXJwcuR0'

export const AGARTALA_MASTER_PANDALS = [
  { name: 'Bharat Ratna Sangha', neighborhood: 'Usha Bazar', lat: 23.8820, lng: 91.2785, emoji: '🪔' },
  { name: 'Ujjayanta Palace Mandap', neighborhood: 'Palace Compound', lat: 23.8350, lng: 91.2880, emoji: '👑' },
  { name: 'Banamalipur Club & Youth Union', neighborhood: 'Banamalipur', lat: 23.8335, lng: 91.2915, emoji: '🎆' },
  { name: 'Battala Durga Puja', neighborhood: 'Battala', lat: 23.8361, lng: 91.2812, emoji: '🪔' },
  { name: 'Dhaleswar Netaji Play Center', neighborhood: 'Dhaleswar', lat: 23.8310, lng: 91.2965, emoji: '🌟' },
  { name: 'Ramnagar Road No. 2', neighborhood: 'Ramnagar', lat: 23.8430, lng: 91.2840, emoji: '✨' },
  { name: 'Shanti Para Youth Club', neighborhood: 'Shantipara', lat: 23.8375, lng: 91.2905, emoji: '🎊' },
  { name: 'Melarmath Sarbajanin Mandap', neighborhood: 'Melarmath', lat: 23.8305, lng: 91.2855, emoji: '🕊️' },
  { name: 'Kali Bari Puja Samiti', neighborhood: 'Kali Bari', lat: 23.8295, lng: 91.2940, emoji: '🌺' },
  { name: 'Polestar Club', neighborhood: 'Banamalipur', lat: 23.8368, lng: 91.2932, emoji: '⚡' },
  { name: 'Deshabandhu Chittaranjan Club', neighborhood: 'Dhaleswar', lat: 23.8285, lng: 91.2985, emoji: '🎺' },
  { name: 'Aikatan Sangha', neighborhood: 'Kunjaban', lat: 23.8480, lng: 91.2890, emoji: '🪕' },
  { name: 'Badharghat Sporting Club', neighborhood: 'Badharghat', lat: 23.8120, lng: 91.2740, emoji: '🥁' },
  { name: 'Pratapgarh Youth Federation', neighborhood: 'Pratapgarh', lat: 23.8210, lng: 91.2895, emoji: '🔥' }
]

function calcHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const rad = Math.PI / 180
  const φ1 = lat1 * rad
  const φ2 = lat2 * rad
  const Δφ = (lat2 - lat1) * rad
  const Δλ = (lon2 - lon1) * rad
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function fmtDistanceMeters(meters: number): string {
  return meters < 1000 ? `${meters}m away` : `${(meters / 1000).toFixed(1)}km away`
}

// Purged mock/sample data: initialized empty for real-time Firestore sync
const SEED_POSTS: SnapPost[] = []

/* ─────────────────────────────────────────────────────────────────────────
   Dark mode map styles (Snapchat-style night theme)
   ───────────────────────────────────────────────────────────────────────── */
const DARK_MAP_STYLE: any[] = [
  { elementType: 'geometry', stylers: [{ color: '#0d0d1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d0d1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b6b8a' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d4d4ff' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b8a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f1f18' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3a6b4e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212140' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8888aa' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e1e40' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2a2a55' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#aaaac0' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#12122a' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d4d4ff' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#060614' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d405b' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#060614' }] },
]

/* ─────────────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────────────── */
function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function uid(): string { return `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }

/* ── Haversine Distance Formula (km) ── */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = Math.PI / 180
  const dLat = (lat2 - lat1) * toRad
  const dLon = (lon2 - lon1) * toRad
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`
  return `${km.toFixed(1)} km away`
}

/* ─────────────────────────────────────────────────────────────────────────
   Toast notification
   ───────────────────────────────────────────────────────────────────────── */
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      style={{
        position: 'fixed', bottom: 140, left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
      }}
      className="glass px-5 py-3 rounded-2xl text-white text-sm font-medium whitespace-nowrap shadow-2xl"
    >
      {message}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Story Modal
   ───────────────────────────────────────────────────────────────────────── */
function StoryModal({ post, onClose }: { post: SnapPost | null; onClose: () => void }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!post) return
    setLiked(false)
    setLikes(post.likes)
    // Auto-progress bar
    setTimeout(() => {
      if (progressRef.current) progressRef.current.classList.add('playing')
    }, 100)
    const timer = setTimeout(onClose, 5200)
    return () => clearTimeout(timer)
  }, [post, onClose])

  const handleLike = () => {
    setLiked(l => !l)
    setLikes(n => liked ? n - 1 : n + 1)
  }

  return (
    <div
      id="story-modal"
      className={`fixed inset-0 z-[150] flex flex-col ${post ? 'visible' : 'hidden'}`}
      style={{ background: '#000' }}
    >
      {post && (
        <>
          {/* Full-screen image */}
          <img
            src={post.imageUrl}
            alt={post.pandal}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.7)' }}
          />

          {/* Gradient overlays */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.85) 100%)' }} />

          {/* Top controls */}
          <div className="relative z-10 px-4 pt-12 pb-3">
            {/* Progress bar */}
            <div className="flex gap-1 mb-4">
              <div className="story-progress-bar">
                <div ref={progressRef} className="story-progress-fill" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={post.avatar} alt={post.uploader} className="w-9 h-9 rounded-full border-2 border-saffron" style={{ borderColor: '#FF6B00' }} />
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">{post.uploader}</p>
                  <p className="text-white/60 text-xs">{timeAgo(post.timestamp)}</p>
                </div>
              </div>
              <button
                id="story-close-btn"
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-10 pt-6">
            <div className="mb-3">
              <span className="text-3xl">{post.emoji}</span>
              <h2 className="text-white font-bold text-2xl leading-tight mt-1">{post.pandal}</h2>
              <p className="text-white/70 text-sm mt-1">📍 {post.neighborhood}, Agartala</p>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" opacity="0.7"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                <span className="text-white text-sm font-medium">{post.views.toLocaleString()}</span>
              </div>

              <button
                id="story-like-btn"
                onClick={handleLike}
                className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
                style={{ background: liked ? 'rgba(255,107,0,0.35)' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#FF6B00' : 'white'} opacity={liked ? 1 : 0.7}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="text-white text-sm font-medium">{likes.toLocaleString()}</span>
              </button>

              <button
                id="story-share-btn"
                className="ml-auto w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" opacity="0.8">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Upload Modal
   ───────────────────────────────────────────────────────────────────────── */
interface UploadModalProps {
  visible: boolean
  currentUser: AuthUser | null
  onRequireAuth: () => void
  onClose: () => void
  onSubmit: (post: Omit<SnapPost, 'id' | 'likes' | 'views' | 'timestamp'>) => void
}
function UploadModal({ visible, currentUser, onRequireAuth, onClose, onSubmit }: UploadModalProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [pandalName, setPandalName] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(AGARTALA_CENTER)
  const [locationSource, setLocationSource] = useState<'exif' | 'live_gps' | 'city_center' | 'custom'>('live_gps')
  const [sourceBadge, setSourceBadge] = useState({ text: '📡 Live Device GPS', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' })
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [step, setStep] = useState<'capture' | 'details'>('capture')
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setPreview(null); setPandalName('')
    setCoords(AGARTALA_CENTER); setStep('capture'); setSubmitting(false)
    setShowDropdown(false); setSearchFilter('')
  }

  const handleClose = () => { reset(); onClose() }

  // Strategy 4 Waterfall: EXIF -> Live GPS -> City Center
  const processFileWaterfall = async (file: File) => {
    const isVid = file.type.startsWith('video')
    setMediaType(isVid ? 'video' : 'image')
    const url = URL.createObjectURL(file)
    setPreview(url)
    setStep('details')

    let detectedCoords: { lat: number; lng: number } | null = null
    let detectedSource: 'exif' | 'live_gps' | 'city_center' = 'live_gps'

    // Step 1: EXIF Metadata (for photos)
    if (!isVid && window.exifr) {
      try {
        const gps = await window.exifr.gps(file)
        if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number' && gps.latitude !== 0) {
          detectedCoords = { lat: gps.latitude, lng: gps.longitude }
          detectedSource = 'exif'
        }
      } catch (e) {
        console.warn('EXIF extraction skipped:', e)
      }
    }

    // Step 2: Live Device GPS Fallback
    if (!detectedCoords) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!('geolocation' in navigator)) return reject(new Error('No geolocation'))
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 6000 })
        })
        detectedCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        detectedSource = 'live_gps'
      } catch {
        // Step 3: City Center Fallback
        detectedCoords = {
          lat: AGARTALA_CENTER.lat + (Math.random() - 0.5) * 0.015,
          lng: AGARTALA_CENTER.lng + (Math.random() - 0.5) * 0.015,
        }
        detectedSource = 'city_center'
      }
    }

    setCoords(detectedCoords)
    setLocationSource(detectedSource)
    if (detectedSource === 'exif') {
      setSourceBadge({ text: '📸 Photo EXIF GPS', cls: 'bg-sky-500/20 text-sky-300 border-sky-500/40' })
    } else if (detectedSource === 'live_gps') {
      setSourceBadge({ text: '📡 Live Device GPS', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' })
    } else {
      setSourceBadge({ text: '📍 Agartala Center', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' })
    }

    // Auto-match nearest pandal silently
    const sorted = AGARTALA_MASTER_PANDALS.map(p => ({
      ...p,
      distance: calcHaversineMeters(detectedCoords!.lat, detectedCoords!.lng, p.lat, p.lng)
    })).sort((a, b) => a.distance - b.distance)

    if (sorted[0] && sorted[0].distance <= 500 && !pandalName.trim()) {
      setPandalName(sorted[0].name)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFileWaterfall(file)
  }

  // Calculate distances to all master pandals relative to current pin
  const pandalsWithProximity = useMemo(() => {
    return AGARTALA_MASTER_PANDALS.map(p => {
      const dist = calcHaversineMeters(coords.lat, coords.lng, p.lat, p.lng)
      return { ...p, distance: dist, distText: fmtDistanceMeters(dist) }
    }).sort((a, b) => a.distance - b.distance)
  }, [coords])

  const filteredPandals = useMemo(() => {
    const q = (pandalName || searchFilter).trim().toLowerCase()
    if (!q) return pandalsWithProximity
    return pandalsWithProximity.filter(p => p.name.toLowerCase().includes(q) || p.neighborhood.toLowerCase().includes(q))
  }, [pandalsWithProximity, pandalName, searchFilter])

  const handleSubmit = () => {
    if (!currentUser) {
      onRequireAuth()
      return
    }
    if (!preview || !pandalName.trim()) return
    setSubmitting(true)
    setTimeout(() => {
      onSubmit({
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userAvatar: currentUser.photoURL,
        mediaUrl: preview,
        mediaType: mediaType,
        pandalName: pandalName.trim(),
        pandal: pandalName.trim(),
        uploader: currentUser.displayName,
        avatar: currentUser.photoURL,
        imageUrl: preview,
        lat: coords.lat,
        lng: coords.lng,
        viewsCount: 0,
        likesCount: 0,
        createdAt: new Date(),
        emoji: '🪔',
      })
      reset()
      onClose()
    }, 600)
  }

  return (
    <div
      id="upload-modal"
      className={`fixed inset-0 z-[120] flex flex-col ${visible ? 'visible' : 'hidden'}`}
      style={{ background: 'rgba(0,0,0,0.95)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4 border-b border-white/10">
        <button id="upload-back-btn" onClick={handleClose} className="text-white/70 hover:text-white transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
        </button>
        <h2 className="text-white font-bold text-base sm:text-lg">
          {step === 'capture' ? 'Snap & Tag Pandal' : 'Strategy 4: Hybrid Tagging'}
        </h2>
        <div className="w-6" />
      </div>

      {step === 'capture' ? (
        /* Capture step */
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          <div className="w-32 h-32 rounded-3xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(192,57,43,0.2))', border: '2px dashed rgba(255,107,0,0.5)' }}>
            <span className="text-5xl">🪔</span>
          </div>
          <div className="text-center">
            <h3 className="text-white font-bold text-xl mb-1">Capture or Upload Snap</h3>
            <p className="text-white/50 text-xs leading-relaxed max-w-xs">
              EXIF GPS will be automatically extracted, with background GPS & pandal auto-matching.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <label
              htmlFor="snap-camera"
              id="camera-capture-label"
              className="w-full py-3.5 rounded-2xl text-center text-white font-bold text-sm cursor-pointer transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #C0392B)', boxShadow: '0 8px 32px rgba(255,107,0,0.4)' }}
            >
              📷 Open Camera
            </label>
            <input
              id="snap-camera"
              type="file"
              accept="image/*,video/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <label
              htmlFor="snap-gallery"
              id="gallery-pick-label"
              className="w-full py-3.5 rounded-2xl text-center font-bold text-sm cursor-pointer transition-all active:scale-95 glass-light text-white/80"
            >
              🖼️ Select from Gallery
            </label>
            <input
              id="snap-gallery"
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>
      ) : (
        /* Strategy 4 Confirmation Details */
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
          {/* Media Preview Box */}
          <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-white/15 bg-black/40">
            {mediaType === 'video' ? (
              <video src={preview!} className="w-full h-full object-cover" autoPlay loop muted playsInline />
            ) : (
              <img src={preview!} alt="preview" className="w-full h-full object-cover" />
            )}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white/90 border border-white/20">
              Media Selected
            </div>
          </div>

          {/* Location Status Card */}
          <div className="glass-card rounded-2xl p-3 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-white text-xs font-bold">{sourceBadge.text}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sourceBadge.cls}`}>
                Waterfall Stage
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/50">
              <span>Coordinates</span>
              <span className="font-mono text-amber-300 text-[10px]">{coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E</span>
            </div>
          </div>

          {/* Searchable Pandal Name & Dropdown */}
          <div className="relative">
            <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5 block">
              Pandal Name *
            </label>
            <div className="relative">
              <input
                id="pandal-name-input"
                type="text"
                value={pandalName}
                onFocus={() => setShowDropdown(true)}
                onChange={e => { setPandalName(e.target.value); setSearchFilter(e.target.value) }}
                placeholder="Type or select pandal..."
                className="w-full py-3 px-3.5 pr-10 rounded-xl text-white text-sm outline-none bg-white/5 border border-white/15 focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-white/10 text-white/60 flex items-center justify-center text-xs"
              >
                ▼
              </button>
            </div>

            {/* Proximity Dropdown */}
            {showDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[#16162a] border border-white/15 rounded-xl shadow-2xl max-h-48 overflow-y-auto no-scrollbar p-1.5 backdrop-blur-xl">
                {filteredPandals.map(p => (
                  <div
                    key={p.name}
                    onClick={() => {
                      setPandalName(p.name)
                      setCoords({ lat: p.lat, lng: p.lng })
                      setLocationSource('custom')
                      setSourceBadge({ text: '🏛️ Pandal Coordinates', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' })
                      setShowDropdown(false)
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{p.emoji}</span>
                      <div className="min-w-0">
                        <span className="text-white text-xs font-bold block truncate">{p.name}</span>
                        <span className="text-white/40 text-[10px] block truncate">{p.neighborhood}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                      {p.distText}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Mini-Map Preview Card (Confirmation) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-white/50 text-xs font-semibold uppercase tracking-widest block">
                Confirm Location Pin
              </label>
              <span className="text-[10px] text-amber-300">Tap to fine-tune coords</span>
            </div>
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const relX = (e.clientX - rect.left) / rect.width - 0.5
                const relY = (e.clientY - rect.top) / rect.height - 0.5
                const newCoords = {
                  lat: coords.lat - relY * 0.008,
                  lng: coords.lng + relX * 0.008
                }
                setCoords(newCoords)
                setLocationSource('custom')
                setSourceBadge({ text: '🎯 Custom Pinned', cls: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' })
              }}
              className="relative w-full h-36 rounded-2xl overflow-hidden border border-white/15 bg-[#0d0d1a] cursor-crosshair flex flex-col items-center justify-center text-center p-3"
            >
              <div className="w-9 h-9 rounded-full bg-saffron/20 border border-saffron flex items-center justify-center text-base mb-1 animate-bounce">
                📍
              </div>
              <span className="text-white text-xs font-bold">{pandalName || 'Selected Location'}</span>
              <span className="font-mono text-amber-300 text-[10px] mt-0.5">{coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E</span>
              <span className="text-white/40 text-[9px] mt-1">Tap box to micro-adjust pin position</span>
            </div>
          </div>

          {/* User ID card */}
          {currentUser && (
            <div className="glass-card rounded-xl p-2.5 flex items-center justify-between border border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-7 h-7 rounded-full border border-saffron object-cover" />
                <div className="min-w-0">
                  <span className="text-[9px] text-white/50 uppercase tracking-wider block">Posting as</span>
                  <span className="text-white text-xs font-bold block truncate">{currentUser.displayName}</span>
                </div>
              </div>
              <span className="text-[9px] font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Verified Devotee
              </span>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-2 pb-6">
            <button
              id="submit-snap-btn"
              onClick={handleSubmit}
              disabled={!pandalName.trim() || !preview || submitting}
              className="w-full py-3.5 rounded-2xl text-white font-extrabold text-sm transition-all active:scale-95 disabled:opacity-40"
              style={{
                background: (!pandalName.trim() || !preview || submitting) ? 'rgba(255,107,0,0.3)' : 'linear-gradient(135deg, #FF6B00, #C0392B)',
                boxShadow: (!pandalName.trim() || !preview || submitting) ? 'none' : '0 8px 32px rgba(255,107,0,0.4)',
              }}
            >
              {submitting ? 'Publishing...' : '🪔 Publish Snap to Live Map'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Feed Card
   ───────────────────────────────────────────────────────────────────────── */
function FeedCard({ post, onClick }: { post: SnapPost; onClick: () => void }) {
  const displayMedia = post.mediaUrl || post.imageUrl || '/logo.png'
  const displayAvatar = post.userAvatar || post.avatar || '/logo.png'
  const displayName = post.userName || post.uploader || 'Devotee'
  const pandalTitle = post.pandalName || post.pandal || 'Durga Pandal'
  const likes = post.likesCount ?? post.likes ?? 0
  const views = post.viewsCount ?? post.views ?? 0

  return (
    <button
      id={`feed-card-${post.id}`}
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl feed-card text-left"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-2xl overflow-hidden" style={{ border: '2px solid rgba(255,107,0,0.5)' }}>
          <img src={displayMedia} alt={pandalTitle} className="w-full h-full object-cover" />
        </div>
        <img src={displayAvatar} alt={displayName}
          className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full border-2"
          style={{ borderColor: '#0a0a0f' }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{post.emoji || '🪔'} {pandalTitle}</p>
        <p className="text-white/50 text-xs truncate">
          {post.neighborhood ? `${post.neighborhood} · ` : ''}{post.timestamp ? timeAgo(post.timestamp) : 'Just now'}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-white/40 text-xs">❤️ {likes}</span>
          <span className="text-white/40 text-xs">👁 {views.toLocaleString()}</span>
        </div>
      </div>

      {/* Arrow */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="rgba(255,255,255,0.3)" />
      </svg>
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Main App
   ───────────────────────────────────────────────────────────────────────── */
export default function App() {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())

  const [posts, setPosts] = useState<SnapPost[]>(SEED_POSTS)
  const [selectedPost, setSelectedPost] = useState<SnapPost | null>(null)
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'recent' | 'nearby'>('recent')
  const [currentUserCoords, setCurrentUserCoords] = useState<{ lat: number; lng: number }>(AGARTALA_CENTER)
  const [uploadVisible, setUploadVisible] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: '', visible: false })
  const [liveCount, setLiveCount] = useState(23)

  const [showSplash, setShowSplash] = useState(() => {
    return sessionStorage.getItem('visited') !== 'true'
  })
  const [splashExiting, setSplashExiting] = useState(false)

  const [user, setUser] = useState<AuthUser | null>(() => {
    const cached = localStorage.getItem('puja_parikrama_user')
    if (cached) {
      try { return JSON.parse(cached) } catch { return null }
    }
    return null
  })
  const [authModalVisible, setAuthModalVisible] = useState(false)

  const showToast = useCallback((msg: string) => {
    setToast({ msg, visible: true })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }, [])

  // ── Parikrama Splash Screen Controller ──
  useEffect(() => {
    if (!showSplash) return
    sessionStorage.setItem('visited', 'true')
    const timer1 = setTimeout(() => {
      setSplashExiting(true)
      if (googleMapRef.current) {
        googleMapRef.current.panTo(currentUserCoords || AGARTALA_CENTER)
        googleMapRef.current.setZoom(15)
      }
    }, 1800)
    const timer2 = setTimeout(() => {
      setShowSplash(false)
    }, 2500)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [showSplash, currentUserCoords])

  const handleGoogleSignIn = () => {
    const simulatedNames = ['Shatadru Sarkar', 'Ananya Roy', 'Priya Saha', 'Saptarshi Sen']
    const chosenName = simulatedNames[Math.floor(Math.random() * simulatedNames.length)]
    const newUser: AuthUser = {
      uid: 'google-uid-' + Math.random().toString(36).substring(2, 10),
      displayName: chosenName,
      email: `${chosenName.toLowerCase().replace(' ', '.')}@gmail.com`,
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(chosenName)}&backgroundColor=ffdfbf`
    }
    localStorage.setItem('puja_parikrama_user', JSON.stringify(newUser))
    setUser(newUser)
    setAuthModalVisible(false)
    showToast(`✅ Signed in as ${newUser.displayName}`)
  }

  const handleSignOut = () => {
    localStorage.removeItem('puja_parikrama_user')
    setUser(null)
    showToast('👋 Signed out from Google')
  }

  // ── increment live viewer count randomly ──
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveCount(c => c + Math.floor(Math.random() * 3))
    }, 7000)
    return () => clearInterval(iv)
  }, [])

  // ── Load Google Maps JS API ──
  useEffect(() => {
    if (window.google?.maps) { initMap(); return }
    window.initMap = initMap
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&callback=initMap&libraries=marker`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
      delete window.initMap
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function initMap() {
    if (!mapRef.current) return
    const map = new window.google.maps.Map(mapRef.current, {
      center: AGARTALA_CENTER,
      zoom: 14,
      styles: DARK_MAP_STYLE,
      disableDefaultUI: true,
      gestureHandling: 'greedy',
      backgroundColor: '#0a0a0f',
      mapTypeId: 'roadmap',
      clickableIcons: false,
      mapId: 'durga-puja-snap',
    })
    googleMapRef.current = map
    setMapReady(true)

    // Auto-detect location & zoom on startup
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setCurrentUserCoords(coords)
          map.setCenter(coords)
          map.setZoom(15)
          showToast('📍 Located you! Zoomed to your position')
        },
        () => {
          map.setCenter(AGARTALA_CENTER)
          map.setZoom(14)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }

  // ── Add / update map markers whenever posts or map changes ──
  useEffect(() => {
    const map = googleMapRef.current
    if (!map || !mapReady) return

    posts.forEach(post => {
      if (markersRef.current.has(post.id)) return

      // Build custom HTML marker element
      const el = document.createElement('div')
      el.className = 'snap-pin'
      el.setAttribute('data-post-id', post.id)
      el.innerHTML = `
        <div class="avatar-ring">
          <img src="${post.imageUrl}" alt="${post.pandal}" loading="lazy" />
        </div>
        <div class="pin-tail"></div>
      `

      let marker: any

      // Use AdvancedMarkerElement if available
      if (window.google.maps.marker?.AdvancedMarkerElement) {
        marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: post.lat, lng: post.lng },
          content: el,
          title: post.pandal,
        })
        marker.addListener('click', () => {
          setSelectedPost(post)
          setSheetExpanded(false)
          googleMapRef.current?.panTo({ lat: post.lat, lng: post.lng })
        })
      } else {
        // Fallback to legacy Marker with custom overlay
        marker = new window.google.maps.Marker({
          map,
          position: { lat: post.lat, lng: post.lng },
          title: post.pandal,
          icon: {
            url: post.imageUrl,
            scaledSize: new window.google.maps.Size(56, 56),
            anchor: new window.google.maps.Point(28, 56),
          },
        })
        marker.addListener('click', () => {
          setSelectedPost(post)
          setSheetExpanded(false)
          googleMapRef.current?.panTo({ lat: post.lat, lng: post.lng })
        })
      }

      markersRef.current.set(post.id, marker)
    })
  }, [posts, mapReady])

  // ── Handle new post submission ──
  const handleNewPost = useCallback((data: Omit<SnapPost, 'id' | 'likes' | 'views' | 'timestamp'>) => {
    const newPost: SnapPost = {
      ...data,
      id: uid(),
      pandalName: data.pandalName || data.pandal || 'Durga Pandal',
      pandal: data.pandalName || data.pandal || 'Durga Pandal',
      mediaUrl: data.mediaUrl || data.imageUrl || '/logo.png',
      imageUrl: data.mediaUrl || data.imageUrl || '/logo.png',
      userName: data.userName || data.uploader || 'Devotee',
      uploader: data.userName || data.uploader || 'Devotee',
      userAvatar: data.userAvatar || data.avatar || '/logo.png',
      avatar: data.userAvatar || data.avatar || '/logo.png',
      mediaType: data.mediaType || 'image',
      viewsCount: 0,
      likesCount: 0,
      createdAt: new Date(),
      likes: 0,
      views: 1,
      timestamp: new Date(),
    }
    setPosts(prev => [newPost, ...prev])
    showToast('🪔 Your Snap is live on the map!')
    setTimeout(() => {
      googleMapRef.current?.panTo({ lat: newPost.lat, lng: newPost.lng })
      googleMapRef.current?.setZoom(16)
    }, 500)
  }, [showToast])

  const handleLocateMe = () => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        googleMapRef.current?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        googleMapRef.current?.setZoom(16)
      },
      () => {
        googleMapRef.current?.panTo(AGARTALA_CENTER)
        googleMapRef.current?.setZoom(14)
        showToast('📍 Centered on Agartala')
      }
    )
  }

  // ── Swipe gesture for bottom sheet ──
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => { dragStart.current = e.touches[0].clientY }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStart.current === null) return
    const delta = e.changedTouches[0].clientY - dragStart.current
    if (delta < -40) setSheetExpanded(true)
    else if (delta > 40) setSheetExpanded(false)
    dragStart.current = null
  }

  return (
    <div className="relative w-full overflow-hidden font-inter" style={{ height: '100dvh', background: '#0a0a0f' }}>

      {/* ── MAP CANVAS ── */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* ── MAP LOADING SCREEN ── */}
      {!mapReady && (
        <div className="absolute inset-0 z-[90] flex flex-col items-center justify-center" style={{ background: '#0a0a0f' }}>
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(192,57,43,0.15))', border: '1.5px solid rgba(255,107,0,0.3)' }}>
              <span className="text-4xl">🪔</span>
            </div>
            <div className="absolute inset-0 rounded-full animate-ping"
              style={{ background: 'rgba(255,107,0,0.12)', animationDuration: '2s' }} />
          </div>
          <h1 className="text-white font-bold text-2xl mb-1">Puja Parikrama</h1>
          <p className="text-white/40 text-sm mb-8">Loading live festival map…</p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full" style={{
                background: '#FF6B00', animation: `livePulse 1.2s ease-in-out ${i * 0.2}s infinite`
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ── 0. INTRO SPLASH SCREEN ANIMATION ("PARIKRAMA") ── */}
      {showSplash && (
        <div
          id="splash-screen"
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between py-12 px-6 bg-[#0F172A] select-none pointer-events-auto overflow-hidden transition-all duration-700 ease-in-out ${
            splashExiting ? 'scale-[1.08] opacity-0 pointer-events-none' : 'scale-100 opacity-100'
          }`}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 45%, rgba(240, 180, 41, 0.16) 0%, rgba(255, 107, 0, 0.08) 35%, rgba(15, 23, 42, 0) 70%)' }} />
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

          {/* Festive Top Emblem / Year Tag */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-amber-400/20 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-semibold tracking-widest text-amber-200/90 uppercase">Durga Puja 2026</span>
            </div>
          </div>

          {/* Centered Brand Identity: Official Logo & "PARIKRAMA" Typography */}
          <div className="relative z-10 flex flex-col items-center text-center my-auto">
            <div className="relative mb-6">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-amber-500/35 via-orange-500/25 to-puja-crimson/35 blur-xl animate-pulse" />
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-b from-[#FCE588] via-[#F0B429] to-[#C0392B] shadow-[0_12px_40px_rgba(240,180,41,0.4)] flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Parikrama Official Logo" className="w-full h-full rounded-full object-cover" />
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-[0.25em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#FFF7D6] via-[#F0B429] to-[#FF8833] drop-shadow-[0_4px_18px_rgba(240,180,41,0.45)] pl-[0.25em]">
              PARIKRAMA
            </h1>
            <p className="text-xs sm:text-sm tracking-[0.35em] uppercase text-amber-200/80 font-semibold mt-3 pl-[0.35em]">
              Agartala Puja Parikrama
            </p>
          </div>

          {/* Bottom pulse loader */}
          <div className="relative z-10 flex flex-col items-center gap-2.5 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <span className="text-xs font-medium tracking-widest text-amber-100/75 uppercase">
              Initializing Map &amp; GPS...
            </span>
          </div>
        </div>
      )}

      {/* ── 2. NEW FLOATING BRANDING BAR ("PUJA PARIKRAMA") ── */}
      {mapReady && (
        <header className="fixed top-3 left-0 right-0 z-50 px-3 sm:px-4 pointer-events-none flex justify-center">
          <div className="backdrop-blur-md bg-slate-900/80 border border-white/10 rounded-full px-4 py-2 flex items-center justify-between w-full max-w-md pointer-events-auto shadow-2xl">
            {/* Left / Center Section: Official Logo & Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-orange-500 to-puja-crimson flex-shrink-0 shadow-sm flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Puja Parikrama Logo" className="w-full h-full rounded-full object-cover" />
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-white font-bold text-sm sm:text-base tracking-tight truncate">
                  Puja <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 font-extrabold">Parikrama</span>
                </span>
              </div>
            </div>

            {/* Right Section: Google Profile Avatar / Sign-In & Recenter Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Google Auth Controls */}
              {user ? (
                <div
                  onClick={() => showToast(`👤 Signed in as ${user.displayName}`)}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/20 pl-1 pr-2.5 py-1 rounded-full cursor-pointer transition active:scale-95 shadow-sm"
                >
                  <img src={user.photoURL} alt={user.displayName} className="w-6 h-6 rounded-full border border-amber-400 object-cover" />
                  <span className="text-xs font-semibold text-white max-w-[70px] truncate">{user.displayName.split(' ')[0]}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleSignOut() }} title="Sign Out" className="text-white/40 hover:text-red-400 text-xs ml-1 transition">✕</button>
                </div>
              ) : (
                <button
                  id="btn-google-signin"
                  onClick={handleGoogleSignIn}
                  title="Sign in with Google"
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400/40 px-2.5 py-1.5 rounded-full text-xs font-semibold text-white transition active:scale-95 shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span className="hidden xs:inline sm:inline">Sign In</span>
                </button>
              )}

              {/* Recenter / Locate Button (map.panTo(userLocation)) */}
              <button
                id="btn-recenter"
                onClick={handleLocateMe}
                title="Locate My Position"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/90 hover:text-amber-400 transition active:scale-90 shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                </svg>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ── FLOATING CAMERA BUTTON ── */}
      {mapReady && (
        <div className="absolute z-30 flex flex-col items-center gap-2"
          style={{ bottom: sheetExpanded ? 320 : 112, left: '50%', transform: 'translateX(-50%)', transition: 'bottom 0.4s cubic-bezier(.32,.72,0,1)' }}>
          <button
            id="camera-btn"
            onClick={() => {
              if (!user) {
                setAuthModalVisible(true)
                return
              }
              setUploadVisible(true)
            }}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #FF6B00, #C0392B)',
              boxShadow: '0 6px 40px rgba(255,107,0,0.55), 0 0 0 4px rgba(255,107,0,0.15)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
              <circle cx="12" cy="13" r="3" fill="white" />
            </svg>
          </button>
          <span className="text-white/60 text-xs font-medium">Snap Pandal</span>
        </div>
      )}

      {/* ── BOTTOM SHEET ── */}
      {mapReady && (
        <div
          id="bottom-sheet"
          ref={sheetRef}
          className={`absolute left-0 right-0 z-20 glass rounded-t-3xl ${sheetExpanded ? 'expanded' : 'collapsed'}`}
          style={{ bottom: 0, maxHeight: '70vh' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle */}
          <div
            className="flex justify-center pt-3 pb-2 cursor-pointer"
            onClick={() => setSheetExpanded(e => !e)}
          >
            <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }} />
          </div>

          {/* Sheet header */}
          <div className="flex items-center justify-between px-5 pb-2">
            <div>
              <h2 className="text-white font-bold text-base">
                {activeTab === 'recent' ? 'Recent Agartala Snaps' : 'Nearby Pandals'}
              </h2>
              <p className="text-white/40 text-xs">
                {activeTab === 'recent'
                  ? `${posts.length} pandals registered`
                  : 'Sorted by proximity to your live location'}
              </p>
            </div>
            <button
              id="sheet-toggle-btn"
              onClick={() => setSheetExpanded(e => !e)}
              className="px-3 py-1.5 rounded-full glass-light text-white/70 text-xs font-medium"
            >
              {sheetExpanded ? 'Collapse ↓' : 'See all ↑'}
            </button>
          </div>

          {/* Segmented Tab Navigation: Recent vs Nearby */}
          <div className="px-4 pt-1 pb-2 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'recent'
                  ? 'bg-saffron text-white shadow-lg shadow-saffron/25'
                  : 'glass-light text-white/70 hover:text-white'
              }`}
            >
              <span>🔥</span> Recent Snaps
            </button>
            <button
              onClick={() => setActiveTab('nearby')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'nearby'
                  ? 'bg-saffron text-white shadow-lg shadow-saffron/25'
                  : 'glass-light text-white/70 hover:text-white'
              }`}
            >
              <span>📍</span> Nearby Pandals
            </button>
          </div>

          {/* Feed list */}
          <div
            className="overflow-y-auto no-scrollbar px-4 pb-6"
            style={{ maxHeight: 'calc(70vh - 130px)' }}
          >
            {posts.length === 0 ? (
              <div className="p-8 text-center glass-card rounded-2xl flex flex-col items-center justify-center space-y-2 border border-white/10 my-4">
                <span className="text-3xl mb-1">🪔</span>
                <h4 className="text-white font-bold text-sm">No Puja Snaps Yet</h4>
                <p className="text-white/50 text-xs max-w-xs leading-relaxed">
                  Be the first devotee to capture a pandal moment and broadcast it live to the Agartala map!
                </p>
                <button
                  onClick={() => setUploadVisible(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-saffron to-puja-crimson text-white text-xs font-bold shadow-md shadow-saffron/20 active:scale-95 transition"
                >
                  📸 Snap First Pandal
                </button>
              </div>
            ) : activeTab === 'recent' ? (
              <div className="flex flex-col gap-2">
                {posts.map(post => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    onClick={() => {
                      setSelectedPost(post)
                      setSheetExpanded(false)
                      googleMapRef.current?.panTo({ lat: post.lat, lng: post.lng })
                      googleMapRef.current?.setZoom(16)
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {(() => {
                  const withDistance = posts.map(p => {
                    const distKm = calculateHaversineDistance(
                      currentUserCoords.lat,
                      currentUserCoords.lng,
                      p.lat,
                      p.lng
                    )
                    const popularityScore = (p.views || 1000) + ((p.likes || 100) * 4)
                    return { ...p, distKm, popularityScore }
                  })

                  // Filter/prioritize nearby candidates
                  let candidates = withDistance.filter(p => p.distKm <= 15.0)
                  if (candidates.length < 5) {
                    candidates = [...withDistance].sort((a, b) => a.distKm - b.distKm).slice(0, 15)
                  }

                  // Sort by popularity score descending
                  candidates.sort((a, b) => b.popularityScore - a.popularityScore)

                  // Limit to top 10
                  const top10 = candidates.slice(0, 10)

                  return top10.map((p, index) => {
                    const distStr = formatDistance(p.distKm)
                    const rank = index + 1

                    return (
                      <div
                        key={p.id}
                        className="glass-card rounded-2xl p-3 flex flex-col gap-2 text-left"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="relative w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer"
                            style={{ border: '2px solid rgba(240,180,41,0.6)' }}
                            onClick={() => {
                              setSelectedPost(p)
                              setSheetExpanded(false)
                              googleMapRef.current?.panTo({ lat: p.lat, lng: p.lng })
                              googleMapRef.current?.setZoom(16)
                            }}
                          >
                            <img src={p.imageUrl} alt={p.pandal} className="w-full h-full object-cover" />
                            <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/75 text-[10px] font-black text-amber-300 flex items-center justify-center border border-amber-400/30">
                              #{rank}
                            </span>
                            <span className="absolute bottom-1 right-1 text-xs drop-shadow">{p.emoji}</span>
                          </div>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              setSelectedPost(p)
                              setSheetExpanded(false)
                              googleMapRef.current?.panTo({ lat: p.lat, lng: p.lng })
                              googleMapRef.current?.setZoom(16)
                            }}
                          >
                            <h4 className="text-white font-bold text-sm truncate">{p.pandal}</h4>
                            <p className="text-white/60 text-xs truncate mb-1">{p.neighborhood}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {rank === 1 ? '🔥 #1 Trending' : rank === 2 ? '⭐ #2 Popular' : rank === 3 ? '✨ #3 Top Rated' : `👁️ ${p.views.toLocaleString()} views`}
                              </span>
                              <span className="text-white/40 text-[11px]">❤️ {p.likes}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span
                              className="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                              style={{
                                background: 'rgba(16,185,129,0.18)',
                                color: '#6ee7b7',
                                border: '1px solid rgba(16,185,129,0.35)',
                              }}
                            >
                              📍 {distStr}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                          <button
                            onClick={() => {
                              googleMapRef.current?.panTo({ lat: p.lat, lng: p.lng })
                              googleMapRef.current?.setZoom(17)
                              setSelectedPost(p)
                              setSheetExpanded(false)
                              showToast(`🎯 Centered on ${p.pandal} (${distStr})`)
                            }}
                            className="flex-1 py-1.5 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition"
                            style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.25), rgba(192,57,43,0.25))', border: '1px solid rgba(255,107,0,0.4)' }}
                          >
                            🎯 Pan & View Story
                          </button>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${currentUserCoords.lat},${currentUserCoords.lng}&destination=${p.lat},${p.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-3 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition"
                            style={{ background: 'rgba(255,255,255,0.08)' }}
                          >
                            🗺️ Directions
                          </a>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STORY MODAL ── */}
      <StoryModal post={selectedPost} onClose={() => setSelectedPost(null)} />

      {/* ── GOOGLE AUTH MODAL ── */}
      {authModalVisible && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 text-center relative border border-white/10 shadow-2xl" style={{ background: '#121224' }}>
            <button
              onClick={() => setAuthModalVisible(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
            >
              ✕
            </button>
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center mb-4 shadow-xl">
              <svg className="w-9 h-9" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <h3 className="text-white font-extrabold text-xl mb-1.5">Sign in with Google</h3>
            <p className="text-white/60 text-xs leading-relaxed mb-6">
              Sign in to Puja Parikrama to tag your pandal stories with your profile, anchor live GPS coordinates, and broadcast to the Agartala map.
            </p>
            <button
              id="google-modal-signin-btn"
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-sm flex items-center justify-center gap-3 shadow-lg transition active:scale-98"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            <p className="text-white/40 text-[11px] mt-4">
              🔒 Powered by Firebase Auth • Popup & Session Cache
            </p>
          </div>
        </div>
      )}

      {/* ── UPLOAD MODAL ── */}
      <UploadModal
        visible={uploadVisible}
        currentUser={user}
        onRequireAuth={() => setAuthModalVisible(true)}
        onClose={() => setUploadVisible(false)}
        onSubmit={handleNewPost}
      />

      {/* ── TOAST ── */}
      <Toast message={toast.msg} visible={toast.visible} />

      {/* ── Global animation keyframes injected via style tag ── */}
      <style>{`
        @keyframes livePulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }
        @keyframes spinLoader { to { transform: rotate(360deg); } }
        @keyframes pulseRing {
          0%  { box-shadow: 0 4px 20px rgba(255,107,0,.6), 0 0 0 0 rgba(255,107,0,.4); }
          70% { box-shadow: 0 4px 20px rgba(255,107,0,.6), 0 0 0 16px rgba(255,107,0,0); }
          100%{ box-shadow: 0 4px 20px rgba(255,107,0,.6), 0 0 0 0 rgba(255,107,0,0); }
        }
      `}</style>
    </div>
  )
}
