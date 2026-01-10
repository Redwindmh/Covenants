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
// Territory cells are mapped to the visual board positions (8x8 grid)
// TODO: Fill in cells after user clicks to map territories
export const TERRITORIES: Territory[] = [
  {
    id: 1,
    pointValue: 1,
    name: 'dawn',
    // Bottom "1" territory - mapped from user clicks
    cells: [
      // Row 22
      { x: 5, y: 22 }, { x: 6, y: 22 }, { x: 7, y: 22 },
      // Row 23
      { x: 4, y: 23 }, { x: 5, y: 23 }, { x: 6, y: 23 }, { x: 7, y: 23 }, { x: 8, y: 23 }, { x: 9, y: 23 },
      // Row 24
      { x: 4, y: 24 }, { x: 5, y: 24 }, { x: 6, y: 24 }, { x: 7, y: 24 }, { x: 8, y: 24 }, { x: 9, y: 24 }, { x: 10, y: 24 }, { x: 11, y: 24 },
      // Row 25
      { x: 5, y: 25 }, { x: 6, y: 25 }, { x: 7, y: 25 }, { x: 8, y: 25 }, { x: 9, y: 25 }, { x: 10, y: 25 }, { x: 11, y: 25 }, { x: 12, y: 25 }, { x: 13, y: 25 },
      // Row 26
      { x: 5, y: 26 }, { x: 6, y: 26 }, { x: 7, y: 26 }, { x: 8, y: 26 }, { x: 9, y: 26 }, { x: 10, y: 26 }, { x: 11, y: 26 }, { x: 12, y: 26 }, { x: 13, y: 26 }, { x: 14, y: 26 }, { x: 15, y: 26 },
      // Row 27
      { x: 6, y: 27 }, { x: 7, y: 27 }, { x: 8, y: 27 }, { x: 9, y: 27 }, { x: 10, y: 27 }, { x: 11, y: 27 }, { x: 12, y: 27 }, { x: 13, y: 27 }, { x: 14, y: 27 }, { x: 15, y: 27 },
      // Row 28
      { x: 7, y: 28 }, { x: 8, y: 28 }, { x: 9, y: 28 }, { x: 10, y: 28 }, { x: 11, y: 28 }, { x: 12, y: 28 }, { x: 13, y: 28 }, { x: 14, y: 28 }, { x: 15, y: 28 },
      // Row 29
      { x: 10, y: 29 }, { x: 11, y: 29 }, { x: 12, y: 29 }, { x: 13, y: 29 }, { x: 14, y: 29 }, { x: 15, y: 29 },
      // Row 30
      { x: 13, y: 30 }, { x: 14, y: 30 },
    ],
  },
  {
    id: 2,
    pointValue: 1,
    name: 'territory-2',
    // Left "1" territory - estimated based on board layout
    cells: [
      // Rows 12-18, roughly x: 2-8
      { x: 3, y: 12 }, { x: 4, y: 12 }, { x: 5, y: 12 },
      { x: 2, y: 13 }, { x: 3, y: 13 }, { x: 4, y: 13 }, { x: 5, y: 13 }, { x: 6, y: 13 },
      { x: 2, y: 14 }, { x: 3, y: 14 }, { x: 4, y: 14 }, { x: 5, y: 14 }, { x: 6, y: 14 }, { x: 7, y: 14 },
      { x: 2, y: 15 }, { x: 3, y: 15 }, { x: 4, y: 15 }, { x: 5, y: 15 }, { x: 6, y: 15 }, { x: 7, y: 15 },
      { x: 2, y: 16 }, { x: 3, y: 16 }, { x: 4, y: 16 }, { x: 5, y: 16 }, { x: 6, y: 16 }, { x: 7, y: 16 },
      { x: 2, y: 17 }, { x: 3, y: 17 }, { x: 4, y: 17 }, { x: 5, y: 17 }, { x: 6, y: 17 },
      { x: 3, y: 18 }, { x: 4, y: 18 }, { x: 5, y: 18 },
    ],
  },
  {
    id: 3,
    pointValue: 1,
    name: 'territory-3',
    // Upper-left "1" territory - estimated based on board layout
    cells: [
      { x: 7, y: 4 }, { x: 8, y: 4 }, { x: 9, y: 4 },
      { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }, { x: 10, y: 5 },
      { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 },
      { x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 },
      { x: 5, y: 8 }, { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }, { x: 9, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 },
      { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 }, { x: 10, y: 9 },
      { x: 7, y: 10 }, { x: 8, y: 10 }, { x: 9, y: 10 },
    ],
  },
  {
    id: 4,
    pointValue: 1,
    name: 'territory-4',
    // Upper-right "1" territory - estimated based on board layout
    cells: [
      { x: 22, y: 4 }, { x: 23, y: 4 }, { x: 24, y: 4 },
      { x: 21, y: 5 }, { x: 22, y: 5 }, { x: 23, y: 5 }, { x: 24, y: 5 }, { x: 25, y: 5 },
      { x: 20, y: 6 }, { x: 21, y: 6 }, { x: 22, y: 6 }, { x: 23, y: 6 }, { x: 24, y: 6 }, { x: 25, y: 6 }, { x: 26, y: 6 },
      { x: 20, y: 7 }, { x: 21, y: 7 }, { x: 22, y: 7 }, { x: 23, y: 7 }, { x: 24, y: 7 }, { x: 25, y: 7 }, { x: 26, y: 7 },
      { x: 20, y: 8 }, { x: 21, y: 8 }, { x: 22, y: 8 }, { x: 23, y: 8 }, { x: 24, y: 8 }, { x: 25, y: 8 }, { x: 26, y: 8 },
      { x: 21, y: 9 }, { x: 22, y: 9 }, { x: 23, y: 9 }, { x: 24, y: 9 }, { x: 25, y: 9 },
      { x: 22, y: 10 }, { x: 23, y: 10 }, { x: 24, y: 10 },
    ],
  },
  {
    id: 5,
    pointValue: 1,
    name: 'territory-5',
    // Right "1" territory - estimated based on board layout
    cells: [
      { x: 26, y: 12 }, { x: 27, y: 12 }, { x: 28, y: 12 },
      { x: 25, y: 13 }, { x: 26, y: 13 }, { x: 27, y: 13 }, { x: 28, y: 13 }, { x: 29, y: 13 },
      { x: 24, y: 14 }, { x: 25, y: 14 }, { x: 26, y: 14 }, { x: 27, y: 14 }, { x: 28, y: 14 }, { x: 29, y: 14 },
      { x: 24, y: 15 }, { x: 25, y: 15 }, { x: 26, y: 15 }, { x: 27, y: 15 }, { x: 28, y: 15 }, { x: 29, y: 15 },
      { x: 24, y: 16 }, { x: 25, y: 16 }, { x: 26, y: 16 }, { x: 27, y: 16 }, { x: 28, y: 16 }, { x: 29, y: 16 },
      { x: 25, y: 17 }, { x: 26, y: 17 }, { x: 27, y: 17 }, { x: 28, y: 17 }, { x: 29, y: 17 },
      { x: 26, y: 18 }, { x: 27, y: 18 }, { x: 28, y: 18 },
    ],
  },
  {
    id: 6,
    pointValue: 2,
    name: 'territory-6',
    // Right "2" territory - estimated based on board layout
    cells: [
      { x: 24, y: 20 }, { x: 25, y: 20 }, { x: 26, y: 20 },
      { x: 23, y: 21 }, { x: 24, y: 21 }, { x: 25, y: 21 }, { x: 26, y: 21 }, { x: 27, y: 21 },
      { x: 22, y: 22 }, { x: 23, y: 22 }, { x: 24, y: 22 }, { x: 25, y: 22 }, { x: 26, y: 22 }, { x: 27, y: 22 },
      { x: 22, y: 23 }, { x: 23, y: 23 }, { x: 24, y: 23 }, { x: 25, y: 23 }, { x: 26, y: 23 }, { x: 27, y: 23 },
      { x: 22, y: 24 }, { x: 23, y: 24 }, { x: 24, y: 24 }, { x: 25, y: 24 }, { x: 26, y: 24 }, { x: 27, y: 24 },
      { x: 23, y: 25 }, { x: 24, y: 25 }, { x: 25, y: 25 }, { x: 26, y: 25 },
      { x: 24, y: 26 }, { x: 25, y: 26 },
    ],
  },
  {
    id: 7,
    pointValue: 3,
    name: 'dusk',
    // Bottom "3" territory - estimated based on board layout
    cells: [
      { x: 17, y: 26 }, { x: 18, y: 26 }, { x: 19, y: 26 },
      { x: 16, y: 27 }, { x: 17, y: 27 }, { x: 18, y: 27 }, { x: 19, y: 27 }, { x: 20, y: 27 },
      { x: 15, y: 28 }, { x: 16, y: 28 }, { x: 17, y: 28 }, { x: 18, y: 28 }, { x: 19, y: 28 }, { x: 20, y: 28 }, { x: 21, y: 28 },
      { x: 15, y: 29 }, { x: 16, y: 29 }, { x: 17, y: 29 }, { x: 18, y: 29 }, { x: 19, y: 29 }, { x: 20, y: 29 }, { x: 21, y: 29 },
      { x: 16, y: 30 }, { x: 17, y: 30 }, { x: 18, y: 30 }, { x: 19, y: 30 }, { x: 20, y: 30 },
      { x: 17, y: 31 }, { x: 18, y: 31 }, { x: 19, y: 31 },
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





