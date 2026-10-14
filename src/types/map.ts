export interface Coordinates {
  latitude: number
  longitude: number
  altitude?: number
}

export interface SavedPlace {
  id: string
  name: string
  badgeCount: number
  coordinates: Coordinates
  thumbnailUrl: string
  description?: string
}

export interface SearchResult {
  displayName: string
  coordinates: Coordinates
  type?: string
}
