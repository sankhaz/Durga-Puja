import React from 'react'
import type { SavedPlace } from '../types/map'

interface GoogleSidebarProps {
  savedPlaces: SavedPlace[]
  onSelectPlace: (place: SavedPlace) => void
  activeSection?: string
  onSectionClick?: (section: string) => void
}

export const GoogleSidebar: React.FC<GoogleSidebarProps> = ({
  savedPlaces,
  onSelectPlace,
  activeSection,
  onSectionClick,
}) => {
  return (
    <aside className="google-sidebar" aria-label="Google Maps Main Navigation">
      {/* Top Menu Icon */}
      <button
        className="sidebar-btn menu-btn"
        aria-label="Side panel menu"
        onClick={() => onSectionClick?.('menu')}
      >
        <svg viewBox="0 0 24 24" className="sidebar-svg">
          <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      </button>

      {/* Navigation Items */}
      <div className="sidebar-top-group">
        {/* Ask Maps (AI Sparkle) */}
        <button
          className={`sidebar-nav-item ${activeSection === 'ask' ? 'active' : ''}`}
          onClick={() => onSectionClick?.('ask')}
          title="Ask Maps"
        >
          <div className="ask-maps-icon">
            <svg viewBox="0 0 24 24" className="sparkle-svg">
              <path
                fill="url(#sparkleGradient)"
                d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"
              />
              <defs>
                <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4285F4" />
                  <stop offset="50%" stopColor="#9B51E0" />
                  <stop offset="100%" stopColor="#EA4335" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="sidebar-label">Ask Maps</span>
        </button>

        {/* Saved Places */}
        <button
          className={`sidebar-nav-item ${activeSection === 'saved' ? 'active' : ''}`}
          onClick={() => onSectionClick?.('saved')}
          title="Saved"
        >
          <svg viewBox="0 0 24 24" className="sidebar-svg">
            <path
              fill="currentColor"
              d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"
            />
          </svg>
          <span className="sidebar-label">Saved</span>
        </button>

        {/* Recents */}
        <button
          className={`sidebar-nav-item ${activeSection === 'recents' ? 'active' : ''}`}
          onClick={() => onSectionClick?.('recents')}
          title="Recents"
        >
          <svg viewBox="0 0 24 24" className="sidebar-svg">
            <path
              fill="currentColor"
              d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
            />
          </svg>
          <span className="sidebar-label">Recents</span>
        </button>

        {/* Saved Place Cards (Mumbai & Agartala from screenshot) */}
        <div className="saved-places-group">
          {savedPlaces.map((place) => (
            <button
              key={place.id}
              className="saved-thumb-btn"
              onClick={() => onSelectPlace(place)}
              title={`Fly to ${place.name}`}
            >
              <div className="thumb-wrapper">
                <img src={place.thumbnailUrl} alt={place.name} className="place-thumb-img" />
                <span className="place-badge">{place.badgeCount}</span>
              </div>
              <span className="sidebar-label thumb-label">{place.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Item: Get app */}
      <div className="sidebar-bottom-group">
        <button
          className="sidebar-nav-item"
          onClick={() => onSectionClick?.('app')}
          title="Get the Google Maps App"
        >
          <svg viewBox="0 0 24 24" className="sidebar-svg">
            <path
              fill="currentColor"
              d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"
            />
          </svg>
          <span className="sidebar-label">Get app</span>
        </button>
      </div>
    </aside>
  )
}
