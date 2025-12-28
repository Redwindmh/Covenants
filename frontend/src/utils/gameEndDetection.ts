import { GameStatus, BoardPosition, TerritoryControl } from '../state/gameState'
import { TERRITORIES, TOTAL_TERRITORIES } from '../constants/gameRules'
import { canPlaceOnCurrentTerritory } from './gameValidation'

export interface GameEndResult {
  gameEnded: boolean
  reason?: 'all_territories_claimed' | 'no_moves' | 'tiles_exhausted' | 'both_out_of_tiles'
  winner?: 1 | 2 | null
  playerOneScore: number
  playerTwoScore: number
}

/**
 * Calculate scores based on controlled territories
 */
export function calculateScores(territoryControl: Map<number, TerritoryControl>): {
  playerOneScore: number
  playerTwoScore: number
} {
  let playerOneScore = 0
  let playerTwoScore = 0

  territoryControl.forEach((control, territoryId) => {
    const territory = TERRITORIES.find(t => t.id === territoryId)
    if (!territory) return

    if (control.controlledBy === 1) {
      playerOneScore += territory.pointValue
    } else if (control.controlledBy === 2) {
      playerTwoScore += territory.pointValue
    }
  })

  return { playerOneScore, playerTwoScore }
}

/**
 * Check if all territories are claimed
 */
export function allTerritoriesClaimed(territoryControl: Map<number, TerritoryControl>): boolean {
  for (let i = 1; i <= TOTAL_TERRITORIES; i++) {
    const control = territoryControl.get(i)
    if (!control || control.controlledBy === null) {
      return false
    }
  }
  return true
}

/**
 * Check if game should end and determine winner
 */
export function checkGameEnd(
  gameStatus: GameStatus,
  playerOneInventory: string[],
  playerTwoInventory: string[],
  boardState: Map<string, BoardPosition>,
  territoryControl: Map<number, TerritoryControl>,
  currentPlayer: 1 | 2
): GameEndResult {
  const { playerOneScore, playerTwoScore } = calculateScores(territoryControl)
  
  // Check if all territories are claimed
  if (allTerritoriesClaimed(territoryControl)) {
    const winner = playerOneScore > playerTwoScore ? 1 : playerTwoScore > playerOneScore ? 2 : null
    return {
      gameEnded: true,
      reason: 'all_territories_claimed',
      winner,
      playerOneScore,
      playerTwoScore,
    }
  }

  // Check if both players are out of tiles
  const bothOutOfTiles = playerOneInventory.length === 0 && playerTwoInventory.length === 0
  if (bothOutOfTiles) {
    const winner = playerOneScore > playerTwoScore ? 1 : playerTwoScore > playerOneScore ? 2 : null
    return {
      gameEnded: true,
      reason: 'both_out_of_tiles',
      winner,
      playerOneScore,
      playerTwoScore,
    }
  }

  // Check if current player has no possible moves
  const currentPlayerInventory = currentPlayer === 1 ? playerOneInventory : playerTwoInventory
  const canPlace = canPlaceOnCurrentTerritory(
    currentPlayer,
    gameStatus.currentTerritoryIndex,
    boardState,
    territoryControl,
    currentPlayerInventory
  )

  // If player has tiles but can't place, check if leftover tiles available
  if (!canPlace && currentPlayerInventory.length === 0 && gameStatus.leftoverTiles.length > 0) {
    // Chaos round - player can draw from leftovers
    return {
      gameEnded: false,
      playerOneScore,
      playerTwoScore,
    }
  }

  // If player has no tiles and no leftover tiles, or can't place
  if (!canPlace && currentPlayerInventory.length === 0 && gameStatus.leftoverTiles.length === 0) {
    // Current player loses, opponent wins
    const winner = currentPlayer === 1 ? 2 : 1
    return {
      gameEnded: true,
      reason: 'no_moves',
      winner,
      playerOneScore,
      playerTwoScore,
    }
  }

  return {
    gameEnded: false,
    playerOneScore,
    playerTwoScore,
  }
}

