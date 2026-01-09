// Import game pieces

import storm from "@/assets/images/pieces/storm.png"
import water from "@/assets/images/pieces/water.png"
import fire from "@/assets/images/pieces/fire.png"
import ice from "@/assets/images/pieces/ice.png"
import wind from "@/assets/images/pieces/wind.png"
import unknown from "@/assets/images/pieces/unknown.png"
import tree_coin from "@/assets/images/pieces/tree_coin.png"
import eye_coin from "@/assets/images/pieces/eye_coin.png"

// Export game pieces as an object for semantic access
export const gamePieces = {
  storm,
  water,
  fire,
  ice,
  wind,
  unknown,
  tree_coin,
  eye_coin
} as const

// Also export as array for backward compatibility if needed
export const gamePiecesArray = [storm, water, fire, ice, wind, unknown, tree_coin, eye_coin] as const

// Type exports
export type GamePiece = keyof typeof gamePieces
