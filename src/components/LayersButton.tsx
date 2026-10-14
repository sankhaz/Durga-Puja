import React from 'react'

interface LayersButtonProps {
  currentLayer: 'satellite' | 'street'
  onToggleLayer: () => void
}

export const LayersButton: React.FC<LayersButtonProps> = ({
  currentLayer,
  onToggleLayer,
}) => {
  return (
    <div className="google-layers-wrapper">
      <button
        className="layers-card-btn"
        onClick={onToggleLayer}
        title={currentLayer === 'satellite' ? 'Switch to Map view' : 'Switch to Satellite view'}
        aria-label="Map Layers"
      >
        <div className={`layers-thumb-preview ${currentLayer}`}>
          <div className="layers-badge">
            <svg viewBox="0 0 24 24" className="layers-icon-svg">
              <path
                fill="currentColor"
                d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9.07l-9-7-9 7 1.63 1.27L12 16z"
              />
            </svg>
            <span className="layers-text">Layers</span>
          </div>
        </div>
      </button>
    </div>
  )
}
