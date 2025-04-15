import { create } from 'zustand'

interface GameState {
  playerOneInventory: string[]
  playerTwoInventory: string[]
  removeFromInventory: (player: 1 | 2, piece: string) => void
  initializeGame: (playerOnePieces: string[], playerTwoPieces: string[]) => void
  resetGame: () => void
  isInitialized: boolean
}

export const useGameState = create<GameState>((set) => ({
  playerOneInventory: [],
  playerTwoInventory: [],
  isInitialized: false,
  removeFromInventory: (player: 1 | 2, piece: string) => 
    set((state) => ({
      playerOneInventory: player === 1 
        ? state.playerOneInventory.filter((p: string) => p !== piece)
        : state.playerOneInventory,
      playerTwoInventory: player === 2
        ? state.playerTwoInventory.filter((p: string) => p !== piece)
        : state.playerTwoInventory,
    })),
  initializeGame: (playerOnePieces: string[], playerTwoPieces: string[]) =>
    set(() => ({
      playerOneInventory: playerOnePieces,
      playerTwoInventory: playerTwoPieces,
      isInitialized: true,
    })),
  resetGame: () => set(() => ({
    playerOneInventory: [],
    playerTwoInventory: [],
    isInitialized: false,
  })),
})) 