import React, { useState, useRef, useEffect } from 'react'
import { Coordinates } from '../types/map'

interface GoogleSearchBarProps {
  onSelectLocation: (coords: Coordinates, label: string) => void
  onDirectionsClick?: () => void
}

const PRESET_PLACES = [
  { name: 'Agartala, Tripura, India', coords: { longitude: 91.2868, latitude: 23.8315 } },
  { name: 'Mumbai, Maharashtra, India', coords: { longitude: 72.8777, latitude: 19.0760 } },
  { name: 'Kolkata, West Bengal, India', coords: { longitude: 88.3639, latitude: 22.5726 } },
  { name: 'New Delhi, Delhi, India', coords: { longitude: 77.1025, latitude: 28.7041 } },
  { name: 'Bengaluru, Karnataka, India', coords: { longitude: 77.5946, latitude: 12.9716 } },
  { name: 'Tokyo, Japan', coords: { longitude: 139.6917, latitude: 35.6895 } },
  { name: 'London, United Kingdom', coords: { longitude: -0.1278, latitude: 51.5074 } },
  { name: 'Paris, France', coords: { longitude: 2.3522, latitude: 48.8566 } },
  { name: 'New York, USA', coords: { longitude: -74.0060, latitude: 40.7128 } },
]

export const GoogleSearchBar: React.FC<GoogleSearchBarProps> = ({
  onSelectLocation,
  onDirectionsClick,
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<{ name: string; coords: Coordinates }[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-filter presets and handle geocoding
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)

    if (val.trim().length > 0) {
      const filtered = PRESET_PLACES.filter((p) =>
        p.name.toLowerCase().includes(val.toLowerCase())
      )
      setResults(filtered)
      setIsOpen(true)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    // Check presets first
    const match = PRESET_PLACES.find((p) =>
      p.name.toLowerCase().includes(query.trim().toLowerCase())
    )
    if (match) {
      onSelectLocation(match.coords, match.name)
      setIsOpen(false)
      return
    }

    // Fallback to OpenStreetMap Nominatim geocoding
    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query.trim()
        )}&limit=1`
      )
      const data = await res.json()
      if (data && data.length > 0) {
        const item = data[0]
        const coords: Coordinates = {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        }
        onSelectLocation(coords, item.display_name)
        setIsOpen(false)
      } else {
        alert(`Location "${query}" not found. Try searching a major city or country.`)
      }
    } catch (err) {
      console.error('Geocoding error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectResult = (item: { name: string; coords: Coordinates }) => {
    setQuery(item.name)
    setIsOpen(false)
    onSelectLocation(item.coords, item.name)
  }

  return (
    <div className="google-search-wrapper" ref={containerRef}>
      <form className="google-search-box" onSubmit={handleSearchSubmit}>
        {/* Search icon */}
        <button type="submit" className="search-box-btn search-glass-btn" title="Search">
          {isSearching ? (
            <div className="search-spinner" />
          ) : (
            <svg viewBox="0 0 24 24" className="search-icon-svg">
              <path
                fill="currentColor"
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              />
            </svg>
          )}
        </button>

        {/* Input Field */}
        <input
          type="text"
          className="search-input"
          placeholder="Search Google Maps"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true)
          }}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Clear query button */}
        {query && (
          <button
            type="button"
            className="search-box-btn clear-btn"
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
            title="Clear search"
          >
            <svg viewBox="0 0 24 24" className="clear-icon-svg">
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        )}

        {/* Vertical Divider */}
        <div className="search-divider" />

        {/* Directions Icon Button */}
        <button
          type="button"
          className="search-box-btn directions-btn"
          onClick={onDirectionsClick}
          title="Directions"
        >
          <div className="directions-icon-circle">
            <svg viewBox="0 0 24 24" className="directions-svg">
              <path
                fill="#ffffff"
                d="M21.71 11.29l-9-9a.996.996 0 0 0-1.41 0l-9 9a.996.996 0 0 0 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9a.996.996 0 0 0 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"
              />
            </svg>
          </div>
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <ul className="search-results-dropdown">
          {results.map((item, idx) => (
            <li
              key={idx}
              className="search-result-item"
              onClick={() => handleSelectResult(item)}
            >
              <svg viewBox="0 0 24 24" className="result-pin-svg">
                <path
                  fill="#70757a"
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"
                />
              </svg>
              <div className="result-text">
                <span className="result-name">{item.name.split(',')[0]}</span>
                <span className="result-subtext">
                  {item.name.split(',').slice(1).join(',').trim()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
