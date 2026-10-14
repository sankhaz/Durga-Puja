import React from 'react'

interface GoogleControlsProps {
  onLocationClick: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onPegmanClick?: () => void
  onToggle3D?: () => void
  is3D?: boolean
  isLocating?: boolean
}

export const GoogleControls: React.FC<GoogleControlsProps> = ({
  onLocationClick,
  onZoomIn,
  onZoomOut,
  onPegmanClick,
  onToggle3D,
  is3D = true,
  isLocating = false,
}) => {
  return (
    <div className="google-floating-controls" aria-label="Map controls">
      {/* Show your location button */}
      <button
        className={`control-btn location-btn ${isLocating ? 'locating' : ''}`}
        onClick={onLocationClick}
        title="Show your location"
        aria-label="Show your location"
      >
        <svg viewBox="0 0 24 24" className="control-svg">
          <path
            fill="#5f6368"
            d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
          />
        </svg>
      </button>

      {/* Zoom In & Out Stack */}
      <div className="zoom-controls-stack">
        <button
          className="control-btn zoom-btn zoom-in-btn"
          onClick={onZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <svg viewBox="0 0 24 24" className="control-svg">
            <path fill="#5f6368" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
        <div className="zoom-divider" />
        <button
          className="control-btn zoom-btn zoom-out-btn"
          onClick={onZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <svg viewBox="0 0 24 24" className="control-svg">
            <path fill="#5f6368" d="M19 13H5v-2h14v2z" />
          </svg>
        </button>
      </div>

      {/* Street View Pegman (Yellow figure) */}
      <button
        className="control-btn pegman-btn"
        onClick={onPegmanClick}
        title="Browse Street View images"
        aria-label="Street View"
      >
        <svg viewBox="0 0 24 24" className="pegman-svg">
          {/* Yellow Google Pegman Icon */}
          <circle cx="12" cy="4" r="3" fill="#F4B400" />
          <path
            fill="#F4B400"
            d="M14.5 8h-5C8.7 8 8 8.7 8 9.5V15h2v6h4v-6h2V9.5c0-.8-.7-1.5-1.5-1.5z"
          />
        </svg>
      </button>

      {/* 3D / Globe Toggle button */}
      <button
        className="control-btn globe-3d-btn"
        onClick={onToggle3D}
        title={is3D ? 'Tilt camera to 3D' : 'View in 2D'}
        aria-label="Toggle 3D View"
      >
        <span className="globe-3d-text">{is3D ? '3D' : '2D'}</span>
      </button>
    </div>
  )
}
