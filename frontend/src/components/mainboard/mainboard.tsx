import { useRef, useState, useEffect, useMemo } from "react";
import { useGameState } from "../../state/gameState";
import { socketService } from "../../services/socketService";
import { validatePlacement, canPlaceOnCurrentTerritory } from "../../utils/gameValidation";
import { getElementFromPieceId, Element, getTerritoryForCell, TERRITORIES } from "../../constants/gameRules";
import { checkGameEnd, calculateScores } from "../../utils/gameEndDetection";
import { getPieceSrc } from "../../utils/pieceUtils";
import UnknownSelectionModal from "../UnknownSelectionModal";
import GameEndModal from "../GameEndModal";
import ChaosRoundModal from "../ChaosRoundModal";

interface DragOverItem {
  current: string;
}

const MainBoard = () => {
  // 32x32 grid for fine-grained territory mapping
  const matrix: number[] = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 32; i++) { arr.push(i) }
    return arr;
  }, [])

  const dragOverItem = useRef<DragOverItem>({ current: "" })
  const { 
    playerOneInventory, 
    playerTwoInventory, 
    currentPlayer,
    playerNumber,
    boardState,
    territoryControl,
    gameStatus,
    placePiece,
    forfeitTerritory,
    setGameStatus,
    setCurrentPlayer,
    addTileToInventory,
    resetGame,
    isInitialized,
    roomId
  } = useGameState()
  
  const [showTurnNotice, setShowTurnNotice] = useState(true)
  const [isInvalidMove, setIsInvalidMove] = useState(false)
  const [noticeTimeout, setNoticeTimeout] = useState<number | null>(null)
  const [showUnknownModal, setShowUnknownModal] = useState(false)
  const [showChaosModal, setShowChaosModal] = useState(false)
  const [pendingPlacement, setPendingPlacement] = useState<{
    pieceId: string
    position: { x: number; y: number }
    requiredElement?: Element | null
  } | null>(null)

  // Get valid drop zone cells for the current territory
  const validDropZones = useMemo(() => {
    const currentTerritory = TERRITORIES[gameStatus.currentTerritoryIndex]
    if (!currentTerritory) return new Set<string>()
    return new Set(currentTerritory.cells.map(cell => `${cell.x},${cell.y}`))
  }, [gameStatus.currentTerritoryIndex])

  // Check if a cell is a valid drop zone
  const isValidDropZone = (x: number, y: number) => validDropZones.has(`${x},${y}`)

  const dragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()
    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"
    dragOverItem.current.current = e.currentTarget.id
  }

  const dragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0)"
    dragOverItem.current.current = e.currentTarget.id
  }

  const showNotice = (invalid: boolean = false, _message?: string) => {
    if (noticeTimeout) {
      clearTimeout(noticeTimeout)
    }

    setIsInvalidMove(invalid)
    setShowTurnNotice(true)

    const timer = setTimeout(() => {
      setShowTurnNotice(false)
      if (invalid) {
        setIsInvalidMove(false)
      }
    }, 2000)
    setNoticeTimeout(timer)
  }

  // Check if a piece belongs to a specific player
  const isPlayersPiece = (pieceId: string, checkPlayer: number): boolean => {
    const inventory = checkPlayer === 1 ? playerOneInventory : playerTwoInventory
    const found = inventory.includes(pieceId)
    console.log('[MainBoard] isPlayersPiece check:', {
      pieceId,
      checkPlayer,
      inventoryLength: inventory.length,
      found,
      inventorySample: inventory.slice(0, 3) // Show first 3 pieces for debugging
    })
    return found
  }

  const handlePlacement = (pieceId: string, position: { x: number; y: number }, resolvedElement?: string) => {
    console.log('[MainBoard] handlePlacement called:', {
      pieceId,
      pieceSrc: getPieceSrc(pieceId),
      position,
      resolvedElement,
      currentPlayer,
      roomId,
      isConnected: socketService.isConnected()
    })
    
    try {
      // If connected to a room, emit to server (multiplayer mode)
      if (roomId && socketService.isConnected()) {
        console.log('[MainBoard] Emitting piece placed to server')
        socketService.emitPiecePlaced(pieceId, position, currentPlayer, resolvedElement)
      } else {
        // Local mode - update state directly
        console.log('[MainBoard] Local mode - calling placePiece')
        placePiece(pieceId, position, currentPlayer, resolvedElement)
      }
      
      // Pieces are rendered declaratively in the JSX based on boardState
      // No DOM manipulation needed here - React will handle the re-render
      
      // Note: Territory advancement should be handled by game rules
      // A territory is "complete" when a piece is placed on it and control is determined
      // For now, we advance after each placement, but this might need adjustment
      // based on whether the territory is actually "claimed" or just has a piece on it
      
      // Check for game end after placement
      setTimeout(() => {
        const endResult = checkGameEnd(
          gameStatus,
          playerOneInventory,
          playerTwoInventory,
          boardState,
          territoryControl,
          currentPlayer === 1 ? 2 : 1 // Next player's turn
        )
        
        if (endResult.gameEnded) {
          setGameStatus({
            gameEnded: true,
            winner: endResult.winner || null,
            playerOneScore: endResult.playerOneScore,
            playerTwoScore: endResult.playerTwoScore,
          })
        }
        // Note: Live scores are calculated via useMemo, no need to update state
      }, 100)
      
      showNotice(false)
    } catch (error) {
      console.error('Error handling piece placement:', error)
    }
  }

  const drop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()

    const target = e.currentTarget
    target.style.backgroundColor = "rgba(0,0,0,0)"

    const draggedPieceId = e.dataTransfer.getData("text/plain")
    
    console.log('[MainBoard] Drop event:', {
      draggedPieceId,
      playerNumber,
      currentPlayer,
      isPlayersTurn: playerNumber === currentPlayer,
      roomId,
      p1Inventory: playerOneInventory.length,
      p2Inventory: playerTwoInventory.length
    })
    
    if (!draggedPieceId) {
      console.log('[MainBoard] No piece ID in drag data')
      return
    }

    // Check if playerNumber is set (multiplayer mode)
    if (roomId && playerNumber === null) {
      console.log('[MainBoard] Player number not set yet')
      showNotice(true, "Waiting for player assignment...")
      return
    }

    // Check if it's the current player's turn
    if (playerNumber !== null && playerNumber !== currentPlayer) {
      console.log('[MainBoard] Not your turn:', { playerNumber, currentPlayer })
      showNotice(true, `Not your turn - waiting for Player ${currentPlayer}`)
      return
    }

    // Check if it's the current player's piece
    const currentPlayerInventory = currentPlayer === 1 ? playerOneInventory : playerTwoInventory
    console.log('[MainBoard] Checking piece ownership:', {
      draggedPieceId,
      currentPlayer,
      inventorySize: currentPlayerInventory.length,
      isPlayersPiece: isPlayersPiece(draggedPieceId, currentPlayer)
    })
    
    if (!isPlayersPiece(draggedPieceId, currentPlayer)) {
      console.log('[MainBoard] Not your piece')
      showNotice(true, `Not your piece - you are Player ${playerNumber}`)
      return
    }

    // Parse position from target ID (format: "x,y")
    const [x, y] = target.id.split(',').map(Number)
    console.log('[MainBoard] Parsed drop position:', { targetId: target.id, x, y })
    
    if (isNaN(x) || isNaN(y)) {
      console.error('[MainBoard] Invalid position:', target.id)
      return
    }
    
    // Debug: Show which territory this cell belongs to
    const territoryForCell = getTerritoryForCell(x, y)
    console.log('[MainBoard] Territory for cell:', { 
      x, y, 
      territory: territoryForCell ? { id: territoryForCell.id, name: territoryForCell.name } : null,
      currentTerritoryIndex: gameStatus.currentTerritoryIndex
    })

    // Validate placement using game rules
    console.log('[MainBoard] Validating placement:', {
      pieceId: draggedPieceId,
      position: { x, y },
      currentPlayer,
      currentTerritoryIndex: gameStatus.currentTerritoryIndex
    })
    
    const validation = validatePlacement(
      draggedPieceId,
      { x, y },
      currentPlayer,
      gameStatus.currentTerritoryIndex,
      boardState,
      territoryControl,
      currentPlayerInventory
    )

    console.log('[MainBoard] Validation result:', validation)

    if (!validation.valid) {
      console.log('[MainBoard] Placement invalid:', validation.reason)
      showNotice(true, validation.reason || "Invalid placement")
      return
    }

    // If UNKNOWN tile, show selection modal
    const element = getElementFromPieceId(draggedPieceId)
    if (element === Element.UNKNOWN || validation.requiresUnknownSelection) {
      setPendingPlacement({
        pieceId: draggedPieceId,
        position: { x, y },
        requiredElement: validation.requiredElement || null
      })
      setShowUnknownModal(true)
      return
    }

    // Place the piece directly
    handlePlacement(draggedPieceId, { x, y })
  }

  const handleUnknownSelection = (selectedElement: Element) => {
    if (!pendingPlacement) return

    setShowUnknownModal(false)
    handlePlacement(pendingPlacement.pieceId, pendingPlacement.position, selectedElement)
    setPendingPlacement(null)
  }

  const handleForfeitTerritory = () => {
    const currentTerritory = gameStatus.currentTerritoryIndex + 1
    if (currentTerritory > 7) return

    if (roomId && socketService.isConnected()) {
      socketService.emitTerritoryForfeit(currentTerritory, currentPlayer)
    } else {
      forfeitTerritory(currentTerritory, currentPlayer)
      
      // Advance to next territory
      if (gameStatus.currentTerritoryIndex < 6) {
        setGameStatus({ currentTerritoryIndex: gameStatus.currentTerritoryIndex + 1 })
      }
      
      // Switch turns
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
    }
  }

  // Check if chaos round should be active
  const shouldShowChaosModal = useMemo(() => {
    const currentPlayerInventory = currentPlayer === 1 ? playerOneInventory : playerTwoInventory
    return currentPlayerInventory.length === 0 && 
           gameStatus.leftoverTiles.length > 0 && 
           !gameStatus.chaosRoundActive && 
           playerNumber === currentPlayer
  }, [currentPlayer, playerOneInventory, playerTwoInventory, gameStatus.leftoverTiles, gameStatus.chaosRoundActive, playerNumber])

  // Sync showChaosModal with derived game state
  // This is intentional: we need to show the modal when game conditions are met
  useEffect(() => {
    if (shouldShowChaosModal && !showChaosModal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowChaosModal(true)
    }
  }, [shouldShowChaosModal, showChaosModal])

  // Calculate live scores based on territory control (derived, no state updates)
  const liveScores = useMemo(() => {
    return calculateScores(territoryControl)
  }, [territoryControl])

  // Check if player can place on current territory
  const canPlace = useMemo(() => {
    const currentPlayerInventory = currentPlayer === 1 ? playerOneInventory : playerTwoInventory
    
    // If player has no tiles, check if chaos round should start
    if (currentPlayerInventory.length === 0 && gameStatus.leftoverTiles.length > 0 && !gameStatus.chaosRoundActive) {
      return false
    }
    
    return canPlaceOnCurrentTerritory(
      currentPlayer,
      gameStatus.currentTerritoryIndex,
      boardState,
      territoryControl,
      currentPlayerInventory
    )
  }, [currentPlayer, gameStatus.currentTerritoryIndex, gameStatus.leftoverTiles, gameStatus.chaosRoundActive, boardState, territoryControl, playerOneInventory, playerTwoInventory])

  // Check for game end on turn change
  useEffect(() => {
    console.log('[MainBoard] Game end check effect running:', {
      isInitialized,
      gameEnded: gameStatus.gameEnded,
      p1Inventory: playerOneInventory.length,
      p2Inventory: playerTwoInventory.length,
      currentPlayer
    })
    
    // Don't check for game end if game hasn't been initialized yet
    if (!isInitialized) {
      console.log('[MainBoard] Skipping - not initialized yet')
      return
    }
    if (gameStatus.gameEnded) {
      console.log('[MainBoard] Skipping - game already ended')
      return
    }

    const endResult = checkGameEnd(
      gameStatus,
      playerOneInventory,
      playerTwoInventory,
      boardState,
      territoryControl,
      currentPlayer
    )

    console.log('[MainBoard] checkGameEnd result:', endResult)

    if (endResult.gameEnded) {
      console.log('[MainBoard] Setting game as ended!')
      setGameStatus({
        gameEnded: true,
        winner: endResult.winner || null,
        playerOneScore: endResult.playerOneScore,
        playerTwoScore: endResult.playerTwoScore,
      })
    }
    // Note: Removed the else branch that was updating scores on every render
    // Scores are calculated in checkGameEnd and only set when game ends
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, currentPlayer, playerOneInventory, playerTwoInventory, boardState, territoryControl, gameStatus.gameEnded, gameStatus.currentTerritoryIndex])

  // Helper to get piece at a given cell position
  const getPieceAtCell = (col: number, row: number): string | null => {
    const key = `${col},${row}`
    const position = boardState.get(key)
    return position?.pieceId || null
  }

  useEffect(() => {
    return () => {
      if (noticeTimeout) {
        clearTimeout(noticeTimeout)
      }
    }
  }, [noticeTimeout])

  const currentTerritory = gameStatus.currentTerritoryIndex < 7 
    ? gameStatus.currentTerritoryIndex + 1 
    : null

  const handleChaosDraw = (tileId: string) => {
    if (roomId && socketService.isConnected()) {
      socketService.emitChaosDraw(tileId, currentPlayer)
    } else {
      // Local mode - update state directly
      const newLeftoverTiles = gameStatus.leftoverTiles.filter(t => t !== tileId)
      addTileToInventory(currentPlayer, tileId)
      setGameStatus({ 
        leftoverTiles: newLeftoverTiles,
        chaosRoundActive: true 
      })
    }
    setShowChaosModal(false)
  }

  const handleNewGame = () => {
    // Disconnect from current room and clear all state
    if (roomId && socketService.isConnected()) {
      socketService.disconnect()
    }
    
    // Clear all local state
    resetGame()
    
    // Reload to start fresh
    window.location.reload()
  }

  return (
    <div className="w-full relative">
      <UnknownSelectionModal
        isOpen={showUnknownModal}
        requiredElement={pendingPlacement?.requiredElement || null}
        onSelect={handleUnknownSelection}
        onCancel={() => {
          setShowUnknownModal(false)
          setPendingPlacement(null)
        }}
      />
      
      <ChaosRoundModal
        isOpen={showChaosModal}
        leftoverTiles={gameStatus.leftoverTiles}
        onDraw={handleChaosDraw}
        onCancel={() => setShowChaosModal(false)}
      />
      
      <GameEndModal
        isOpen={gameStatus.gameEnded}
        gameStatus={gameStatus}
        onClose={() => {
          // Close the modal but stay in ended state
          // User can still see the board
        }}
        onNewGame={handleNewGame}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-amber-950/20 pointer-events-none" />
      <div className="relative">
        <h1 className="text-amber-100 text-center mb-6 font-serif text-4xl tracking-wide drop-shadow-lg">
          Covenants
        </h1>
        
        <div className="flex justify-between items-center mb-4 px-4">
          <div className="text-amber-200 text-sm">
            {currentTerritory && (
              <>Territory: {currentTerritory} {currentTerritory === 1 ? '(Dawn)' : currentTerritory === 7 ? '(Dusk)' : ''}</>
            )}
          </div>
          <div className="flex gap-4 text-amber-200 text-sm">
            <span>P1: {liveScores.playerOneScore}pts</span>
            <span>P2: {liveScores.playerTwoScore}pts</span>
          </div>
        </div>
        
        {playerNumber === currentPlayer && !canPlace && (
          <div className="text-center mb-2">
            <button
              onClick={handleForfeitTerritory}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors"
            >
              Forfeit Territory & Move On
            </button>
          </div>
        )}
        
        <div className="w-full board-matrix rounded-xl overflow-visible relative z-20 shadow-[0_0_15px_5px_rgba(0,0,0,0.3)] aspect-square">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/5 to-amber-950/10 pointer-events-none" />
          <div 
            className="absolute inset-0 grid overflow-visible"
            style={{ gridTemplateColumns: 'repeat(32, 1fr)', gridTemplateRows: 'repeat(32, 1fr)' }}
          >
            {matrix.map((row) => (
              matrix.map((col) => {
                const isDropZone = isValidDropZone(col, row)
                const isMyTurn = playerNumber === currentPlayer || !roomId
                const pieceId = getPieceAtCell(col, row)
                const pieceSrc = pieceId ? getPieceSrc(pieceId) : null
                
                return (
                  <div 
                    key={`${col},${row}`}
                    className={`flex items-center justify-center transition-colors duration-100 border border-white/10 relative overflow-visible
                      ${isDropZone && isMyTurn 
                        ? 'bg-green-500/40 border-green-400 hover:bg-green-400/60 cursor-pointer' 
                        : isDropZone 
                          ? 'bg-yellow-500/30 border-yellow-400/50'
                          : 'hover:bg-white/30'
                      }`}
                    id={`${col},${row}`} 
                    onClick={() => console.log(`[GRID CLICK] Cell: (${col}, ${row})`)}
                    onDragOver={dragOver} 
                    onDragLeave={dragLeave} 
                    onDrop={drop}
                  >
                    {pieceSrc && (
                      <img 
                        src={pieceSrc}
                        alt="piece"
                        className="absolute z-30 pointer-events-none drop-shadow-lg"
                        style={{
                          width: '80px',
                          height: '100px',
                          maxWidth: 'none',
                          maxHeight: 'none',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          objectFit: 'contain'
                        }}
                      />
                    )}
                  </div>
                )
              })
            ))}
          </div>
        </div>
        {/* Turn notice - only show briefly for invalid moves */}
        {isInvalidMove && showTurnNotice && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white text-base py-2 px-6 rounded z-50">
            Invalid move - It's Player {currentPlayer}'s turn
          </div>
        )}
      </div>
    </div>
  );
}

export default MainBoard
