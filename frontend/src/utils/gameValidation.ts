import { Element, elementBeats, getElementFromPieceId, getBeatingElement, getTerritoryForCell, TERRITORIES } from '../constants/gameRules'
import { BoardPosition, TerritoryControl } from '../state/gameState'

export interface PlacementValidationResult {
  valid: boolean
  reason?: string
  requiresUnknownSelection?: boolean
  requiredElement?: Element
}

/**
 * Validate if a piece can be placed at the given position
 */
export function validatePlacement(
  pieceId: string,
  position: { x: number; y: number },
  player: 1 | 2,
  currentTerritoryIndex: number,
  boardState: Map<string, BoardPosition>,
  _territoryControl: Map<number, TerritoryControl>,
  playerInventory: string[]
): PlacementValidationResult {
  // Check if piece is in player's inventory
  if (!playerInventory.includes(pieceId)) {
    return { valid: false, reason: 'Piece not in your inventory' }
  }

  // Check if cell is in a territory
  const territory = getTerritoryForCell(position.x, position.y)
  if (!territory) {
    return { valid: false, reason: 'Can only place pieces on territories' }
  }

  // Check if placing on the correct territory (fixed order)
  const expectedTerritory = TERRITORIES[currentTerritoryIndex]
  if (territory.id !== expectedTerritory.id) {
    return { valid: false, reason: `Must place on territory ${expectedTerritory.id} (${expectedTerritory.name})` }
  }

  // Check if territory already has pieces
  const key = `${position.x},${position.y}`
  const existingPosition = boardState.get(key)

  // If placing on empty territory
  if (!existingPosition || !existingPosition.pieceId) {
    // Can place any element on empty territory
    const element = getElementFromPieceId(pieceId)
    if (element === Element.UNKNOWN) {
      return { valid: true, requiresUnknownSelection: true }
    }
    return { valid: true }
  }

  // If placing on occupied cell, must beat the piece on that specific cell
  // Check if placing on own piece (not allowed - must be opponent's piece)
  if (existingPosition.playerNumber === player) {
    return { valid: false, reason: 'Cannot place on your own piece' }
  }

  // Use resolved element if available (for UNKNOWN tiles), otherwise extract from pieceId
  const existingElement = existingPosition.element 
    ? (existingPosition.element as Element)
    : getElementFromPieceId(existingPosition.pieceId || '')
  const placingElement = getElementFromPieceId(pieceId)

  // If placing UNKNOWN on opponent piece, must be the element that beats it
  if (placingElement === Element.UNKNOWN) {
    const requiredElement = getBeatingElement(existingElement)
    if (!requiredElement) {
      return { valid: false, reason: 'Cannot determine required element' }
    }
    return { valid: true, requiresUnknownSelection: true, requiredElement }
  }

  // Check if placing element beats the existing element
  if (elementBeats(placingElement, existingElement)) {
    return { valid: true }
  }

  return { valid: false, reason: `${placingElement} cannot beat ${existingElement}` }
}

/**
 * Check if player can place any piece on the current territory
 */
export function canPlaceOnCurrentTerritory(
  player: 1 | 2,
  currentTerritoryIndex: number,
  boardState: Map<string, BoardPosition>,
  _territoryControl: Map<number, TerritoryControl>,
  playerInventory: string[]
): boolean {
  const territory = TERRITORIES[currentTerritoryIndex]
  if (!territory) return false

  // Check each cell in the territory
  for (const cell of territory.cells) {
    const key = `${cell.x},${cell.y}`
    const existingPosition = boardState.get(key)

    // If empty, can place any piece
    if (!existingPosition || !existingPosition.pieceId) {
      return true
    }

    // If occupied, check if it's opponent's piece and if player has a piece that can beat it
    if (existingPosition.playerNumber && existingPosition.playerNumber !== player) {
      // Use resolved element if available (for UNKNOWN tiles)
      const existingElement = existingPosition.element 
        ? (existingPosition.element as Element)
        : getElementFromPieceId(existingPosition.pieceId || '')
      
      // Check if player has any piece that can beat it
      for (const pieceId of playerInventory) {
        const element = getElementFromPieceId(pieceId)
        if (element === Element.UNKNOWN || elementBeats(element, existingElement)) {
          return true
        }
      }
    } else if (existingPosition.playerNumber === player) {
      // Can't place on own piece, but might be able to place on empty cell in same territory
      // Continue checking other cells
      continue
    }
  }

  return false
}

/**
 * Get all valid placement positions for the current territory
 */
export function getValidPlacementPositions(
  currentTerritoryIndex: number,
  _boardState: Map<string, BoardPosition>
): Array<{ x: number; y: number }> {
  const territory = TERRITORIES[currentTerritoryIndex]
  if (!territory) return []

  return territory.cells.filter(_cell => {
    // Valid if empty or if we can place on top (will be validated separately)
    return true
  })
}

