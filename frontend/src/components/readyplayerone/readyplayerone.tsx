import { useRef, useEffect, useCallback } from "react"
import { gamePieces } from "../../constants/gamePieces"
import { useGameState } from "../../state/gameState"
import { socketService } from "../../services/socketService"
import { getPieceSrc } from "../../utils/pieceUtils"

interface Piece {
  id: string;
  src: string;
}

const ReadyPlayerOne = () => {
  const dragItem = useRef<string>("")
  const hasSyncedToServer = useRef(false)
  const { playerOneInventory, playerTwoInventory, initializeGame, resetGame, isInitialized, roomId, playerNumber, gameStatus } = useGameState()

  const generatePieces = useCallback(() => {
    // Base rules: 21 tiles total = 4 of each element + 1 UNKNOWN
    // Create the full bag
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

    // Initialize game with generated pieces
    const playerOnePieceIds = playerOnePieces.map(p => p.id)
    const playerTwoPieceIds = playerTwoPieces.map(p => p.id)
    
    initializeGame(playerOnePieceIds, playerTwoPieceIds, leftoverTiles)
    
    // If connected to a room, sync with server
    if (roomId && socketService.isConnected()) {
      socketService.emitGameInitialized(playerOnePieceIds, playerTwoPieceIds, leftoverTiles)
    }
  }, [roomId, initializeGame])

  useEffect(() => {
    console.log('[ReadyPlayerOne] useEffect running:', { isInitialized, playerNumber, roomId })
    
    // Only initialize if not already initialized
    if (isInitialized) {
      console.log('[ReadyPlayerOne] Already initialized, skipping piece generation')
      return
    }
    
    // If in a multiplayer room as Player 2, don't generate pieces - wait for server state
    if (roomId && playerNumber === 2) {
      console.log('[ReadyPlayerOne] Player 2 in room - waiting for server state, not generating pieces')
      return
    }
    
    // If roomId is set but playerNumber isn't assigned yet, we're in the middle of joining
    // Wait for the join to complete before deciding whether to generate pieces
    if (roomId && playerNumber === null) {
      console.log('[ReadyPlayerOne] Waiting for room join to complete (roomId set, playerNumber pending)')
      return
    }
    
    // Generate pieces if:
    // - Single player (no roomId)
    // - Or Player 1 in multiplayer room
    console.log('[ReadyPlayerOne] Generating pieces...')
    generatePieces()
    console.log('[ReadyPlayerOne] Pieces generated!')

    // Reset game when page is refreshed/closed
    const handleBeforeUnload = () => {
      console.log('[ReadyPlayerOne] beforeunload - resetting game')
      resetGame()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isInitialized, resetGame, generatePieces, playerNumber, roomId])

  // Separate effect: Sync game state to server when roomId becomes available
  // This handles the case where Player 1 generates pieces BEFORE creating a room
  useEffect(() => {
    console.log('[ReadyPlayerOne] Sync effect:', { 
      roomId, 
      playerNumber, 
      isInitialized, 
      hasSynced: hasSyncedToServer.current,
      p1Inv: playerOneInventory.length,
      p2Inv: playerTwoInventory.length
    })
    
    // Only sync if:
    // - We have a roomId
    // - We're Player 1 (the one who should sync game state)
    // - Game is initialized with pieces
    // - We haven't already synced
    // - Socket is connected
    if (
      roomId && 
      playerNumber === 1 && 
      isInitialized && 
      !hasSyncedToServer.current &&
      playerOneInventory.length > 0 &&
      playerTwoInventory.length > 0 &&
      socketService.isConnected()
    ) {
      console.log('[ReadyPlayerOne] Syncing game state to server!')
      socketService.emitGameInitialized(
        playerOneInventory, 
        playerTwoInventory, 
        gameStatus.leftoverTiles
      )
      hasSyncedToServer.current = true
    }
    
    // Reset sync flag when leaving room
    if (!roomId) {
      hasSyncedToServer.current = false
    }
  }, [roomId, playerNumber, isInitialized, playerOneInventory, playerTwoInventory, gameStatus.leftoverTiles])

  const dragStart = (e: React.DragEvent<HTMLImageElement>) => {
    dragItem.current = e.currentTarget.id
    e.dataTransfer.setData("text/plain", e.currentTarget.id)
  }

  // In multiplayer, only show pieces if this is your hand (Player 1)
  // In single player (no roomId), show all pieces
  const isMyHand = !roomId || playerNumber === 1
  const isOpponentHand = roomId && playerNumber === 2

  // If this is opponent's hand in multiplayer, show hidden card backs
  if (isOpponentHand) {
    return (
      <div className="w-full mb-4 md:mb-0 md:h-screen">
        <h2 className="text-amber-100 text-center mb-2 font-serif text-2xl">Opponent</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 justify-items-center items-center bg-amber-950/60 p-2 rounded-lg md:h-[calc(100vh-4rem)]">
          {playerOneInventory.map((_pieceId: string, index: number) => (
            <div
              key={`hidden-${index}`}
              className="h-16 w-12 md:h-20 md:w-14 lg:h-24 lg:w-16 bg-amber-900/80 rounded-lg border-2 border-amber-700 flex items-center justify-center"
            >
              <span className="text-amber-600 text-2xl">?</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mb-4 md:mb-0 md:h-screen">
      <h2 className="text-amber-100 text-center mb-2 font-serif text-2xl">
        {isMyHand && roomId ? 'Your Hand' : 'Player One'}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 justify-items-center items-center bg-amber-950/60 p-2 rounded-lg md:h-[calc(100vh-4rem)]">
        {playerOneInventory.map((pieceId: string) => (
          <img
            key={pieceId}
            className="h-16 w-auto md:h-20 lg:h-24 object-contain drop-shadow-md"
            id={pieceId}
            draggable={isMyHand}
            src={getPieceSrc(pieceId)}
            alt="pieces"
            onDragStart={isMyHand ? dragStart : undefined}
          />
        ))}
      </div>
    </div>
  )
}

export default ReadyPlayerOne
