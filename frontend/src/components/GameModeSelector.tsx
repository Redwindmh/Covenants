import { useGameState } from '../state/gameState'
import { gamePieces } from '../constants/gamePieces'

interface Piece {
  id: string
  src: string
}

const GameModeSelector = () => {
  const { gameMode, setGameMode, initializeGame } = useGameState()

  const generatePieces = () => {
    // Base rules: 21 tiles total = 4 of each element + 1 UNKNOWN
    const fullBag: string[] = []
    
    // Add 4 of each element
    const elements = [gamePieces.fire, gamePieces.ice, gamePieces.wind, gamePieces.storm, gamePieces.water]
    elements.forEach(element => {
      for (let i = 0; i < 4; i++) {
        fullBag.push(element)
      }
    })
    
    // Add 1 UNKNOWN
    fullBag.push(gamePieces.unknown)
    
    // Shuffle the bag
    const shuffledBag = [...fullBag].sort(() => Math.random() - 0.5)
    
    // Each player draws 7 tiles
    const playerOnePieces: Piece[] = []
    const playerTwoPieces: Piece[] = []
    const leftoverTiles: string[] = []
    
    // Draw for Player One (7 tiles)
    for (let i = 0; i < 7; i++) {
      const tile = shuffledBag[i]
      playerOnePieces.push({
        id: `${tile}-p1-${i}`,
        src: tile
      })
    }
    
    // Draw for Player Two (7 tiles)
    for (let i = 7; i < 14; i++) {
      const tile = shuffledBag[i]
      playerTwoPieces.push({
        id: `${tile}-p2-${i - 7}`,
        src: tile
      })
    }
    
    // Remaining 7 tiles are leftover (for chaos rounds)
    for (let i = 14; i < 21; i++) {
      leftoverTiles.push(`${shuffledBag[i]}-leftover-${i - 14}`)
    }

    const playerOnePieceIds = playerOnePieces.map(p => p.id)
    const playerTwoPieceIds = playerTwoPieces.map(p => p.id)
    
    return { playerOnePieceIds, playerTwoPieceIds, leftoverTiles }
  }

  const handleLocalPlay = () => {
    console.log('[GameModeSelector] Starting local play mode')
    setGameMode('local')
    
    // Generate and initialize pieces for local play
    const { playerOnePieceIds, playerTwoPieceIds, leftoverTiles } = generatePieces()
    initializeGame(playerOnePieceIds, playerTwoPieceIds, leftoverTiles)
  }

  const handleNetworkPlay = () => {
    console.log('[GameModeSelector] Switching to network play mode')
    setGameMode('network')
    // RoomManager will handle the rest
  }

  // Don't render if a mode is already selected (App.tsx handles this, but keep as safety)
  if (gameMode !== null) {
    return null
  }

  return (
    <div className="bg-amber-950/95 text-amber-100 p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
      <h2 className="text-3xl font-serif text-center mb-2">Covenants</h2>
      <p className="text-amber-300 text-center mb-8 text-sm">Choose your game mode</p>
      
      <div className="flex flex-col gap-4">
        <button
          onClick={handleLocalPlay}
          className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-4 rounded-lg transition-colors text-lg font-semibold"
        >
          Local Play
          <span className="block text-sm font-normal text-amber-200 mt-1">
            Two players on the same screen
          </span>
        </button>
        
        <button
          onClick={handleNetworkPlay}
          className="bg-amber-800 hover:bg-amber-700 text-white px-6 py-4 rounded-lg transition-colors text-lg font-semibold"
        >
          Network Play
          <span className="block text-sm font-normal text-amber-200 mt-1">
            Play with someone online
          </span>
        </button>
      </div>
    </div>
  )
}

export default GameModeSelector
