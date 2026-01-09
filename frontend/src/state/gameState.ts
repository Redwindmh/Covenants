import { create } from 'zustand'
import { Territory, TERRITORIES, getElementFromPieceId } from '../constants/gameRules'

export interface BoardPosition {
  x: number
  y: number
  pieceId: string | null
  playerNumber: 1 | 2 | null
  element?: string // Resolved element for UNKNOWN tiles
}

export interface TerritoryControl {
  territoryId: number
  controlledBy: 1 | 2 | null // null = contested/unclaimed
  pieces: Array<{
    pieceId: string
    playerNumber: 1 | 2
    element: string // Resolved element
  }>
  controlCoin?: 'tree_coin' | 'eye_coin' // Coin placed when forfeited
}

export interface GameStatus {
  currentTerritoryIndex: number // 0-6, which territory we're currently placing on
  gameEnded: boolean
  winner: 1 | 2 | null
  playerOneScore: number
  playerTwoScore: number
  chaosRoundActive: boolean
  leftoverTiles: string[]
}

interface GameState {
  playerOneInventory: string[]
  playerTwoInventory: string[]
  boardState: Map<string, BoardPosition>
  territoryControl: Map<number, TerritoryControl> // Map of territory ID to control info
  currentPlayer: 1 | 2
  playerNumber: 1 | 2 | null // Which player this client is
  roomId: string | null
  gameStatus: GameStatus
  removeFromInventory: (player: 1 | 2, piece: string) => void
  placePiece: (pieceId: string, position: { x: number; y: number }, player: 1 | 2, resolvedElement?: string) => void
  forfeitTerritory: (territoryId: number, forfeitingPlayer: 1 | 2) => void
  initializeGame: (playerOnePieces: string[], playerTwoPieces: string[], leftoverTiles: string[]) => void
  syncGameState: (gameState: {
    playerOneInventory: string[]
    playerTwoInventory: string[]
    boardState: Record<string, BoardPosition>
    territoryControl: Record<number, TerritoryControl>
    currentPlayer: 1 | 2
    gameStatus: GameStatus
  }) => void
  setPlayerNumber: (playerNumber: 1 | 2) => void
  setRoomId: (roomId: string) => void
  setCurrentPlayer: (player: 1 | 2) => void
  setGameStatus: (status: Partial<GameStatus>) => void
  addTileToInventory: (player: 1 | 2, tileId: string) => void
  resetGame: () => void
  isInitialized: boolean
}

const initialGameStatus: GameStatus = {
  currentTerritoryIndex: 0,
  gameEnded: false,
  winner: null,
  playerOneScore: 0,
  playerTwoScore: 0,
  chaosRoundActive: false,
  leftoverTiles: [],
}

export const useGameState = create<GameState>((set) => ({
  playerOneInventory: [],
  playerTwoInventory: [],
  boardState: new Map(),
  territoryControl: new Map(),
  currentPlayer: 1,
  playerNumber: null,
  roomId: null,
  gameStatus: initialGameStatus,
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
    
  placePiece: (pieceId: string, position: { x: number; y: number }, player: 1 | 2, resolvedElement?: string) => {
    set((state) => {
      const newBoardState = new Map(state.boardState)
      const key = `${position.x},${position.y}`
      const existingPosition = newBoardState.get(key)
      
      // Update board position
      newBoardState.set(key, {
        x: position.x,
        y: position.y,
        pieceId,
        playerNumber: player,
        element: resolvedElement,
      })
      
      // Update territory control
      const territory = TERRITORIES.find(t => 
        t.cells.some(cell => cell.x === position.x && cell.y === position.y)
      )
      
      const newTerritoryControl = new Map(state.territoryControl)
      if (territory) {
        const currentControl = newTerritoryControl.get(territory.id) || {
          territoryId: territory.id,
          controlledBy: null,
          pieces: [],
        }
        
        // Use resolved element if provided, otherwise extract from pieceId
        const element = resolvedElement || getElementFromPieceId(pieceId)
        currentControl.pieces.push({
          pieceId,
          playerNumber: player,
          element: element,
        })
        
        // Determine control based on top piece
        currentControl.controlledBy = player
        
        newTerritoryControl.set(territory.id, currentControl)
      }
      
      return {
        boardState: newBoardState,
        territoryControl: newTerritoryControl,
        playerOneInventory: player === 1 
          ? state.playerOneInventory.filter((p: string) => p !== pieceId)
          : state.playerOneInventory,
        playerTwoInventory: player === 2
          ? state.playerTwoInventory.filter((p: string) => p !== pieceId)
          : state.playerTwoInventory,
        currentPlayer: player === 1 ? 2 : 1,
      }
    })
  },
  
  forfeitTerritory: (territoryId: number, forfeitingPlayer: 1 | 2) => {
    set((state) => {
      const newTerritoryControl = new Map(state.territoryControl)
      const control = newTerritoryControl.get(territoryId) || {
        territoryId,
        controlledBy: null,
        pieces: [],
      }
      
      // Opponent gets control
      const opponent = forfeitingPlayer === 1 ? 2 : 1
      control.controlledBy = opponent
      control.controlCoin = opponent === 1 ? 'tree_coin' : 'eye_coin'
      
      newTerritoryControl.set(territoryId, control)
      
      return {
        territoryControl: newTerritoryControl,
      }
    })
  },
  
  initializeGame: (playerOnePieces: string[], playerTwoPieces: string[], leftoverTiles: string[]) => {
    // Initialize territory control map
    const initialTerritoryControl = new Map<number, TerritoryControl>()
    TERRITORIES.forEach(territory => {
      initialTerritoryControl.set(territory.id, {
        territoryId: territory.id,
        controlledBy: null,
        pieces: [],
      })
    })
    
    set(() => ({
      playerOneInventory: playerOnePieces,
      playerTwoInventory: playerTwoPieces,
      boardState: new Map(),
      territoryControl: initialTerritoryControl,
      currentPlayer: 1,
      gameStatus: {
        ...initialGameStatus,
        leftoverTiles,
      },
      isInitialized: true,
    }))
  },
  
  syncGameState: (gameState) => {
    const boardStateMap = new Map<string, BoardPosition>()
    Object.entries(gameState.boardState).forEach(([key, value]) => {
      boardStateMap.set(key, value)
    })
    
    const territoryControlMap = new Map<number, TerritoryControl>()
    Object.entries(gameState.territoryControl).forEach(([key, value]) => {
      territoryControlMap.set(Number(key), value)
    })
    
    set(() => ({
      playerOneInventory: gameState.playerOneInventory,
      playerTwoInventory: gameState.playerTwoInventory,
      boardState: boardStateMap,
      territoryControl: territoryControlMap,
      currentPlayer: gameState.currentPlayer,
      gameStatus: gameState.gameStatus,
    }))
  },
  
  setPlayerNumber: (playerNumber: 1 | 2) => set(() => ({ playerNumber })),
  setRoomId: (roomId: string) => set(() => ({ roomId })),
  setCurrentPlayer: (player: 1 | 2) => set(() => ({ currentPlayer: player })),
  setGameStatus: (status: Partial<GameStatus>) => 
    set((state) => ({
      gameStatus: { ...state.gameStatus, ...status }
    })),
  
  addTileToInventory: (player: 1 | 2, tileId: string) =>
    set((state) => ({
      playerOneInventory: player === 1 
        ? [...state.playerOneInventory, tileId]
        : state.playerOneInventory,
      playerTwoInventory: player === 2
        ? [...state.playerTwoInventory, tileId]
        : state.playerTwoInventory,
    })),
  
  resetGame: () => set(() => ({
    playerOneInventory: [],
    playerTwoInventory: [],
    boardState: new Map(),
    territoryControl: new Map(),
    currentPlayer: 1,
    playerNumber: null,
    roomId: null,
    gameStatus: initialGameStatus,
    isInitialized: false,
  })),
}))
