/**
 * Utility functions for working with game pieces
 */

/**
 * Extract the image source from a pieceId
 * 
 * Piece IDs have the format: {imagePath}-p{1|2}-{index} or {imagePath}-leftover-{index}
 * e.g., "/assets/fire-abc123.png-p1-0" -> "/assets/fire-abc123.png"
 * 
 * This is necessary because Vite hashes asset paths during build, so we can't
 * just split on the first '-' character.
 */
export const getPieceSrc = (pieceId: string): string => {
  // Find the marker that separates the image path from the piece identifier
  const p1Match = pieceId.lastIndexOf('-p1-')
  const p2Match = pieceId.lastIndexOf('-p2-')
  const leftoverMatch = pieceId.lastIndexOf('-leftover-')
  
  if (p1Match !== -1) return pieceId.substring(0, p1Match)
  if (p2Match !== -1) return pieceId.substring(0, p2Match)
  if (leftoverMatch !== -1) return pieceId.substring(0, leftoverMatch)
  
  // Fallback: return the original (shouldn't happen with proper pieceIds)
  return pieceId
}

/**
 * Get the player number from a pieceId
 * Returns 1, 2, or null for leftover tiles
 */
export const getPlayerFromPieceId = (pieceId: string): 1 | 2 | null => {
  if (pieceId.includes('-p1-')) return 1
  if (pieceId.includes('-p2-')) return 2
  return null // Leftover tile
}

/**
 * Check if a pieceId belongs to a specific player
 */
export const isPieceOwnedBy = (pieceId: string, playerNumber: 1 | 2): boolean => {
  return getPlayerFromPieceId(pieceId) === playerNumber
}
