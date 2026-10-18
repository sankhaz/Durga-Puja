import { useEffect, useRef, useState, useCallback } from 'react'

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
  userId?: string
  userName?: string
  userAvatar?: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  pandal: string
  neighborhood: string
  uploader: string
  avatar: string
  imageUrl: string
  lat: number
  lng: number
  coordinates?: { lat: number; lng: number }
  timestamp: Date
  likes: number
  views: number
  emoji: string
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Constants — demo seed data (Agartala pandals)
   ───────────────────────────────────────────────────────────────────────── */
const AGARTALA_CENTER = { lat: 23.8315, lng: 91.2868 }
const MAPS_API_KEY = 'AIzaSyAnnaozqfYaMR6oUS6ihqkbn1bwXJwcuR0'

const AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=priya&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=riya&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=ananya&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=soham&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=debu&backgroundColor=b6e3f4',
]

const SEED_POSTS: SnapPost[] = [
  {
    id: 'post-1', pandal: 'Ujjayanta Palace Mandap', neighborhood: 'Palace Compound', uploader: 'Ananya Roy',
    avatar: AVATARS[2], imageUrl: '/pandal1.jpg',
    lat: 23.8350, lng: 91.2880, timestamp: new Date(Date.now() - 18 * 60000),
    likes: 940, views: 5910, emoji: '👑',
  },
  {
    id: 'post-2', pandal: 'Banamalipur Club & Youth Union', neighborhood: 'Banamalipur', uploader: 'Saptarshi Sen',
    avatar: AVATARS[1], imageUrl: '/images/agartala.jpg',
    lat: 23.8335, lng: 91.2915, timestamp: new Date(Date.now() - 24 * 60000),
    likes: 860, views: 5200, emoji: '🎆',
  },
  {
    id: 'post-3', pandal: 'Battala Durga Puja', neighborhood: 'Battala', uploader: 'Priya Saha',
    avatar: AVATARS[0], imageUrl: '/pandal1.jpg',
    lat: 23.8361, lng: 91.2812, timestamp: new Date(Date.now() - 35 * 60000),
    likes: 780, views: 4820, emoji: '🪔',
  },
  {
    id: 'post-4', pandal: 'Dhaleswar Netaji Play Center', neighborhood: 'Dhaleswar', uploader: 'Subhamita Das',
    avatar: AVATARS[3], imageUrl: '/images/agartala.jpg',
    lat: 23.8310, lng: 91.2965, timestamp: new Date(Date.now() - 42 * 60000),
    likes: 670, views: 4300, emoji: '🌟',
  },
  {
    id: 'post-5', pandal: 'Ramnagar Road No. 2', neighborhood: 'Ramnagar', uploader: 'Arindam Ghosh',
    avatar: AVATARS[4], imageUrl: '/pandal1.jpg',
    lat: 23.8430, lng: 91.2840, timestamp: new Date(Date.now() - 60 * 60000),
    likes: 710, views: 4120, emoji: '✨',
  },
  {
    id: 'post-6', pandal: 'Shanti Para Youth Club', neighborhood: 'Shantipara', uploader: 'Tanmoy Banik',
    avatar: AVATARS[3], imageUrl: '/images/agartala.jpg',
    lat: 23.8375, lng: 91.2905, timestamp: new Date(Date.now() - 75 * 60000),
    likes: 590, views: 3890, emoji: '🎊',
  },
  {
    id: 'post-7', pandal: 'Melarmath Sarbajanin Mandap', neighborhood: 'Melarmath', uploader: 'Sneha Majumder',
    avatar: AVATARS[0], imageUrl: '/pandal1.jpg',
    lat: 23.8305, lng: 91.2855, timestamp: new Date(Date.now() - 2 * 3600000),
    likes: 530, views: 3740, emoji: '🕊️',
  },
  {
    id: 'post-8', pandal: 'Kali Bari Puja Samiti', neighborhood: 'Kali Bari', uploader: 'Riya Das',
    avatar: AVATARS[1], imageUrl: '/images/agartala.jpg',
    lat: 23.8295, lng: 91.2940, timestamp: new Date(Date.now() - 2.5 * 3600000),
    likes: 620, views: 3450, emoji: '🌺',
  },
  {
    id: 'post-9', pandal: 'Abhoynagar Sarbojanin', neighborhood: 'Abhoynagar', uploader: 'Debu Paul',
    avatar: AVATARS[4], imageUrl: '/pandal1.jpg',
    lat: 23.8400, lng: 91.2950, timestamp: new Date(Date.now() - 3 * 3600000),
    likes: 480, views: 3150, emoji: '🙏',
  },
  {
    id: 'post-10', pandal: 'Badharghat Kalitola Club', neighborhood: 'Badharghat', uploader: 'Mousumi Sarkar',
    avatar: AVATARS[2], imageUrl: '/images/agartala.jpg',
    lat: 23.8160, lng: 91.2780, timestamp: new Date(Date.now() - 4 * 3600000),
    likes: 410, views: 2980, emoji: '🏮',
  },
  {
    id: 'post-11', pandal: 'Bordowali Milan Sangha', neighborhood: 'Bordowali', uploader: 'Kaushik Bhowmik',
    avatar: AVATARS[3], imageUrl: '/pandal1.jpg',
    lat: 23.8190, lng: 91.2850, timestamp: new Date(Date.now() - 5 * 3600000),
    likes: 370, views: 2850, emoji: '🔱',
  },
  {
    id: 'post-12', pandal: 'Motor Stand Puja Committee', neighborhood: 'Krishnanagar', uploader: 'Soham Dey',
    avatar: AVATARS[3], imageUrl: '/images/agartala.jpg',
    lat: 23.8270, lng: 91.2820, timestamp: new Date(Date.now() - 6 * 3600000),
    likes: 390, views: 2640, emoji: '🥁',
  },
]

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
  onClose: () => void
  onSubmit: (post: Omit<SnapPost, 'id' | 'likes' | 'views' | 'timestamp'>) => void
}
function UploadModal({ visible, onClose, onSubmit }: UploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [pandalName, setPandalName] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [locating, setLocating] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [uploaderName, setUploaderName] = useState('')
  const [step, setStep] = useState<'capture' | 'details'>('capture')
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setPreview(null); setPandalName(''); setNeighborhood('')
    setCoords(null); setUploaderName(''); setStep('capture'); setSubmitting(false)
  }

  const handleClose = () => { reset(); onClose() }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    setStep('details')
    // Auto-get GPS
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        // fallback: random point near Agartala
        setCoords({
          lat: AGARTALA_CENTER.lat + (Math.random() - 0.5) * 0.025,
          lng: AGARTALA_CENTER.lng + (Math.random() - 0.5) * 0.025,
        })
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleSubmit = () => {
    if (!preview || !pandalName.trim() || !coords) return
    setSubmitting(true)
    setTimeout(() => {
      onSubmit({
        pandal: pandalName.trim(),
        neighborhood: neighborhood.trim() || 'Agartala',
        uploader: uploaderName.trim() || 'Anonymous',
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(uploaderName || 'user')}&backgroundColor=ffdfbf`,
        imageUrl: preview,
        lat: coords.lat, lng: coords.lng,
        emoji: ['🪔', '🌺', '✨', '🎊', '🙏'][Math.floor(Math.random() * 5)],
      })
      reset()
      onClose()
    }, 800)
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
        <h2 className="text-white font-bold text-lg">
          {step === 'capture' ? 'New Puja Snap' : 'Add Details'}
        </h2>
        <div className="w-6" />
      </div>

      {step === 'capture' ? (
        /* Camera capture step */
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          <div className="w-32 h-32 rounded-3xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(192,57,43,0.2))', border: '2px dashed rgba(255,107,0,0.5)' }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"
                fill="url(#camGrad)" />
              <circle cx="12" cy="13" r="3" fill="url(#camGrad)" />
              <defs>
                <linearGradient id="camGrad" x1="2" y1="3" x2="22" y2="21">
                  <stop stopColor="#FF6B00" /><stop offset="1" stopColor="#F0B429" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-white font-bold text-xl mb-2">Capture Your Moment</h3>
            <p className="text-white/50 text-sm leading-relaxed">Take a photo of the Durga Puja pandal or idol and share it on the live map!</p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <label
              htmlFor="snap-camera"
              id="camera-capture-label"
              className="w-full py-4 rounded-2xl text-center text-white font-bold text-base cursor-pointer transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #C0392B)', boxShadow: '0 8px 32px rgba(255,107,0,0.4)' }}
            >
              📷 Open Camera
            </label>
            <input
              id="snap-camera"
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
            <label
              htmlFor="snap-gallery"
              id="gallery-pick-label"
              className="w-full py-4 rounded-2xl text-center font-bold text-base cursor-pointer transition-all active:scale-95 glass-light text-white/80"
            >
              🖼️ Choose from Gallery
            </label>
            <input
              id="snap-gallery"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
          </div>
        </div>
      ) : (
        /* Details step */
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Preview */}
          {preview && (
            <div className="relative mx-5 mt-5 rounded-3xl overflow-hidden" style={{ height: 260 }}>
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.6) 100%)' }} />
              {/* GPS badge */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)' }}>
                {locating ? (
                  <div className="w-3 h-3 rounded-full border-2 border-saffron border-t-transparent animate-spin" style={{ borderColor: '#FF6B00', borderTopColor: 'transparent', animation: 'spinLoader 0.8s linear infinite' }} />
                ) : (
                  <div className="w-2 h-2 rounded-full" style={{ background: '#4ade80' }} />
                )}
                <span className="text-white text-xs font-medium">
                  {locating ? 'Acquiring GPS…' : coords ? 'Location Tagged • Agartala' : 'Agartala Center'}
                </span>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="px-5 py-5 flex flex-col gap-4">
            <div>
              <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">Pandal Name *</label>
              <input
                id="pandal-name-input"
                type="text"
                value={pandalName}
                onChange={e => setPandalName(e.target.value)}
                placeholder="e.g. Battala Durga Puja"
                maxLength={60}
                className="w-full py-3.5 px-4 rounded-xl text-white text-sm outline-none focus:ring-2 placeholder-white/30"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)', focusRingColor: '#FF6B00' }}
                onFocus={e => { e.target.style.borderColor = '#FF6B00' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">Neighborhood</label>
              <input
                id="neighborhood-input"
                type="text"
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                placeholder="e.g. Battala, Krishnanagar"
                maxLength={40}
                className="w-full py-3.5 px-4 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                onFocus={e => { e.target.style.borderColor = '#FF6B00' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">Your Name</label>
              <input
                id="uploader-name-input"
                type="text"
                value={uploaderName}
                onChange={e => setUploaderName(e.target.value)}
                placeholder="Anonymous"
                maxLength={30}
                className="w-full py-3.5 px-4 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                onFocus={e => { e.target.style.borderColor = '#FF6B00' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
        </div>
      )}

      {step === 'details' && (
        <div className="px-5 pb-10 pt-3">
          <button
            id="submit-snap-btn"
            onClick={handleSubmit}
            disabled={!pandalName.trim() || !preview || submitting}
            className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: (!pandalName.trim() || !preview || submitting) ? 'rgba(255,107,0,0.3)' : 'linear-gradient(135deg, #FF6B00, #C0392B)',
              boxShadow: (!pandalName.trim() || !preview || submitting) ? 'none' : '0 8px 32px rgba(255,107,0,0.4)',
            }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent" style={{ animation: 'spinLoader 0.8s linear infinite' }} />
                Posting…
              </span>
            ) : '🪔 Share to Map'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Feed Card
   ───────────────────────────────────────────────────────────────────────── */
function FeedCard({ post, onClick }: { post: SnapPost; onClick: () => void }) {
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
          <img src={post.imageUrl} alt={post.pandal} className="w-full h-full object-cover" />
        </div>
        <img src={post.avatar} alt={post.uploader}
          className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full border-2"
          style={{ borderColor: '#0a0a0f' }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{post.emoji} {post.pandal}</p>
        <p className="text-white/50 text-xs truncate">{post.neighborhood} · {timeAgo(post.timestamp)}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-white/40 text-xs">❤️ {post.likes}</span>
          <span className="text-white/40 text-xs">👁 {post.views.toLocaleString()}</span>
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

  const showToast = useCallback((msg: string) => {
    setToast({ msg, visible: true })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }, [])

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
          <h1 className="text-white font-bold text-2xl mb-1">Agartala Puja Snap</h1>
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

      {/* ── TOP BAR ── */}
      {mapReady && (
        <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-12 pb-3">
          <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #C0392B)' }}>
                <span className="text-lg">🪔</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-base leading-tight">Agartala Puja Snap</h1>
                <p className="text-white/40 text-xs">Durga Puja 2026 · Live</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Live badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,107,0,0.2)', border: '1px solid rgba(255,107,0,0.4)' }}>
                <div className="live-dot" />
                <span className="text-white text-xs font-semibold">{liveCount} live</span>
              </div>
              {/* Locate me button */}
              <button
                id="locate-me-btn"
                onClick={handleLocateMe}
                className="w-9 h-9 rounded-xl flex items-center justify-center glass-light transition-all active:scale-90"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING CAMERA BUTTON ── */}
      {mapReady && (
        <div className="absolute z-30 flex flex-col items-center gap-2"
          style={{ bottom: sheetExpanded ? 320 : 112, left: '50%', transform: 'translateX(-50%)', transition: 'bottom 0.4s cubic-bezier(.32,.72,0,1)' }}>
          <button
            id="camera-btn"
            onClick={() => setUploadVisible(true)}
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
            {activeTab === 'recent' ? (
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

      {/* ── UPLOAD MODAL ── */}
      <UploadModal
        visible={uploadVisible}
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
