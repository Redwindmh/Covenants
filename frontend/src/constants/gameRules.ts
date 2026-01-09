// Covenants Game Rules - Base Version

export enum Element {
  FIRE = 'fire',
  ICE = 'ice',
  WIND = 'wind',
  STORM = 'storm',
  WATER = 'water',
  UNKNOWN = 'unknown',
}

// Elemental cycle: FIRE > ICE > WIND > STORM > WATER > FIRE
export const ELEMENTAL_CYCLE: Element[] = [
  Element.FIRE,
  Element.ICE,
  Element.WIND,
  Element.STORM,
  Element.WATER,
]

/**
 * Check if element1 beats element2
 * FIRE beats ICE, ICE beats WIND, WIND beats STORM, STORM beats WATER, WATER beats FIRE
 */
export function elementBeats(element1: Element, element2: Element): boolean {
  if (element1 === Element.UNKNOWN || element2 === Element.UNKNOWN) {
    return false // UNKNOWN needs to be resolved first
  }
  
  const index1 = ELEMENTAL_CYCLE.indexOf(element1)
  const index2 = ELEMENTAL_CYCLE.indexOf(element2)
  
  if (index1 === -1 || index2 === -1) return false
  
  // Element beats the next one in cycle (wrapping around)
  return (index1 + 1) % ELEMENTAL_CYCLE.length === index2
}

/**
 * Get the element that would beat the given element
 */
export function getBeatingElement(element: Element): Element | null {
  if (element === Element.UNKNOWN) return null
  
  const index = ELEMENTAL_CYCLE.indexOf(element)
  if (index === -1) return null
  
  // The previous element in cycle beats this one
  const beatingIndex = (index - 1 + ELEMENTAL_CYCLE.length) % ELEMENTAL_CYCLE.length
  return ELEMENTAL_CYCLE[beatingIndex]
}

/**
 * Extract element from piece ID
 * Piece IDs are in format: "element-{index}" or "{imagePath}-{index}"
 */
export function getElementFromPieceId(pieceId: string): Element {
  const elementStr = pieceId.split('-')[0].split('/').pop()?.replace('.png', '') || ''
  
  // Map image paths to elements
  if (elementStr.includes('fire')) return Element.FIRE
  if (elementStr.includes('ice')) return Element.ICE
  if (elementStr.includes('wind')) return Element.WIND
  if (elementStr.includes('storm')) return Element.STORM
  if (elementStr.includes('water')) return Element.WATER
  if (elementStr.includes('unknown')) return Element.UNKNOWN
  if (elementStr.includes('tree_coin') || elementStr.includes('eye_coin')) {
    // Coins are not elements
    throw new Error('Cannot get element from coin piece')
  }
  
  return Element.UNKNOWN // Default fallback
}

/**
 * Territory definitions
 * Each territory has: id, pointValue, and cell coordinates (x, y) that belong to it
 * 
 * Note: These coordinates need to be adjusted based on the actual board image.
 * For now, using approximate positions in a 16x16 grid.
 */
export interface Territory {
  id: number // 1-7, representing order from "dawn" to "dusk"
  pointValue: number // Points this territory is worth
  name: string // "dawn", "dusk", or territory number
  cells: Array<{ x: number; y: number }> // Grid cells that belong to this territory
}

// Base rules: First 5 territories = 1 point each, 6th = 2 points, 7th = 3 points
export const TERRITORIES: Territory[] = [
  {
    id: 1,
    pointValue: 1,
    name: 'dawn',
    // Approximate spiral positions - will need adjustment based on actual board
    cells: [
      { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 },
      { x: 1, y: 2 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 2 },
    ],
  },
  {
    id: 2,
    pointValue: 1,
    name: 'territory-2',
    cells: [
      { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 5, y: 3 }, { x: 6, y: 3 },
      { x: 4, y: 3 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 2 },
    ],
  },
  {
    id: 3,
    pointValue: 1,
    name: 'territory-3',
    cells: [
      { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 8, y: 3 }, { x: 9, y: 3 },
      { x: 7, y: 3 }, { x: 8, y: 1 }, { x: 9, y: 1 }, { x: 10, y: 2 },
    ],
  },
  {
    id: 4,
    pointValue: 1,
    name: 'territory-4',
    cells: [
      { x: 11, y: 2 }, { x: 12, y: 2 }, { x: 11, y: 3 }, { x: 12, y: 3 },
      { x: 10, y: 3 }, { x: 11, y: 1 }, { x: 12, y: 1 }, { x: 13, y: 2 },
    ],
  },
  {
    id: 5,
    pointValue: 1,
    name: 'territory-5',
    cells: [
      { x: 13, y: 3 }, { x: 13, y: 4 }, { x: 13, y: 5 }, { x: 12, y: 4 },
      { x: 12, y: 5 }, { x: 11, y: 4 }, { x: 11, y: 5 }, { x: 10, y: 4 },
    ],
  },
  {
    id: 6,
    pointValue: 2,
    name: 'territory-6',
    cells: [
      { x: 9, y: 4 }, { x: 9, y: 5 }, { x: 8, y: 4 }, { x: 8, y: 5 },
      { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 6, y: 4 }, { x: 6, y: 5 },
    ],
  },
  {
    id: 7,
    pointValue: 3,
    name: 'dusk',
    cells: [
      { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 4, y: 4 }, { x: 4, y: 5 },
      { x: 3, y: 4 }, { x: 3, y: 5 }, { x: 2, y: 4 }, { x: 2, y: 5 },
    ],
  },
]

/**
 * Get territory that contains the given cell coordinates
 */
export function getTerritoryForCell(x: number, y: number): Territory | null {
  return TERRITORIES.find(territory => 
    territory.cells.some(cell => cell.x === x && cell.y === y)
  ) || null
}

/**
 * Get territory by ID
 */
export function getTerritoryById(id: number): Territory | null {
  return TERRITORIES.find(t => t.id === id) || null
}

/**
 * Check if a cell coordinate is within any territory
 */
export function isCellInTerritory(x: number, y: number): boolean {
  return getTerritoryForCell(x, y) !== null
}

// Game constants
export const TOTAL_TILES = 21 // 4 of each element + 1 UNKNOWN
export const TILES_PER_PLAYER = 7
export const LEFTOVER_TILES = 7
export const TOTAL_TERRITORIES = 7





