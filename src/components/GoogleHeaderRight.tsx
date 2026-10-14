import React, { useState } from 'react'

export const GoogleHeaderRight: React.FC = () => {
  const [showApps, setShowApps] = useState(false)

  return (
    <header className="google-header-right" aria-label="Google Account and Apps">
      {/* Google Apps 9-dot Icon */}
      <button
        className="google-apps-btn"
        title="Google apps"
        onClick={() => setShowApps(!showApps)}
        aria-label="Google apps"
      >
        <svg viewBox="0 0 24 24" className="apps-grid-svg">
          <path
            fill="currentColor"
            d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
          />
        </svg>
      </button>

      {/* Profile Avatar (Blue Circle with 'S') */}
      <div className="google-profile-avatar" title="Google Account: Shatadru">
        <span className="avatar-initial">S</span>
      </div>

      {/* Google Apps Popup if toggled */}
      {showApps && (
        <div className="google-apps-dropdown">
          <div className="app-item">
            <span className="app-icon">🗺️</span>
            <span className="app-name">Maps</span>
          </div>
          <div className="app-item">
            <span className="app-icon">🔍</span>
            <span className="app-name">Search</span>
          </div>
          <div className="app-item">
            <span className="app-icon">✉️</span>
            <span className="app-name">Gmail</span>
          </div>
          <div className="app-item">
            <span className="app-icon">📁</span>
            <span className="app-name">Drive</span>
          </div>
        </div>
      )}
    </header>
  )
}
