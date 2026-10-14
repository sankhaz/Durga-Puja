import React, { useEffect, useState } from 'react'
import * as Cesium from 'cesium'
import type { Coordinates, SavedPlace } from '../types/map'

interface MapMarkersProps {
  viewer: Cesium.Viewer | null
  userLocation: Coordinates | null
  savedPlaces: SavedPlace[]
  onSelectPlace: (place: SavedPlace) => void
}

interface ProjectedMarker {
  id: string
  x: number
  y: number
  visible: boolean
  type: 'user' | 'saved'
  title: string
  place?: SavedPlace
}

export const MapMarkers: React.FC<MapMarkersProps> = ({
  viewer,
  userLocation,
  savedPlaces,
  onSelectPlace,
}) => {
  const [markers, setMarkers] = useState<ProjectedMarker[]>([])

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return
    const scene = viewer.scene
    const camera = scene.camera
    const ellipsoid = Cesium.Ellipsoid.WGS84

    const updatePositions = () => {
      if (viewer.isDestroyed()) return

      const occluder = new Cesium.EllipsoidalOccluder(ellipsoid, camera.positionWC)
      const newMarkers: ProjectedMarker[] = []

      // 1. User Location Marker
      if (userLocation) {
        const cartesian = Cesium.Cartesian3.fromDegrees(
          userLocation.longitude,
          userLocation.latitude,
          0
        )
        const isVisible = occluder.isPointVisible(cartesian)

        if (isVisible) {
          const windowPos = Cesium.SceneTransforms.worldToWindowCoordinates(scene, cartesian)
          if (windowPos) {
            newMarkers.push({
              id: 'user-location',
              x: windowPos.x,
              y: windowPos.y,
              visible: true,
              type: 'user',
              title: 'Your Location',
            })
          }
        }
      }

      // 2. Saved Places Markers (Mumbai, Agartala)
      for (const place of savedPlaces) {
        const cartesian = Cesium.Cartesian3.fromDegrees(
          place.coordinates.longitude,
          place.coordinates.latitude,
          0
        )
        const isVisible = occluder.isPointVisible(cartesian)

        if (isVisible) {
          const windowPos = Cesium.SceneTransforms.worldToWindowCoordinates(scene, cartesian)
          if (windowPos) {
            newMarkers.push({
              id: place.id,
              x: windowPos.x,
              y: windowPos.y,
              visible: true,
              type: 'saved',
              title: place.name,
              place,
            })
          }
        }
      }

      setMarkers(newMarkers)
    }

    // Update positions on every postRender
    const removeListener = scene.postRender.addEventListener(updatePositions)

    return () => {
      removeListener()
    }
  }, [viewer, userLocation, savedPlaces])

  return (
    <div className="map-markers-overlay" aria-hidden="true">
      {markers.map((marker) => {
        if (!marker.visible) return null

        if (marker.type === 'user') {
          return (
            <div
              key={marker.id}
              className="user-location-marker"
              style={{
                transform: `translate(${marker.x}px, ${marker.y}px)`,
              }}
              title="Your Location"
            >
              {/* Pulsing Animated Halo */}
              <div className="user-pulse-halo" />
              {/* Solid Blue Google GPS Dot */}
              <div className="user-dot-core" />
            </div>
          )
        }

        return (
          <div
            key={marker.id}
            className="saved-place-pin"
            style={{
              transform: `translate(${marker.x}px, ${marker.y}px)`,
            }}
            onClick={() => marker.place && onSelectPlace(marker.place)}
            title={marker.title}
          >
            <div className="saved-pin-badge">
              <svg viewBox="0 0 24 24" className="pin-bookmark-svg">
                <path
                  fill="#ffffff"
                  d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"
                />
              </svg>
            </div>
            <div className="saved-pin-label">{marker.title}</div>
          </div>
        )
      })}
    </div>
  )
}
