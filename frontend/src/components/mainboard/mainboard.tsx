import { useRef, useState, useEffect, useMemo } from "react";
import { useGameState } from "../../state/gameState";
import { socketService } from "../../services/socketService";
import { validatePlacement, canPlaceOnCurrentTerritory } from "../../utils/gameValidation";
import { getElementFromPieceId, Element, getTerritoryForCell } from "../../constants/gameRules";
import { checkGameEnd, calculateScores } from "../../utils/gameEndDetection";
import UnknownSelectionModal from "../UnknownSelectionModal";
import GameEndModal from "../GameEndModal";
import ChaosRoundModal from "../ChaosRoundModal";

interface DragOverItem {
  current: string;
}

const MainBoard = () => {
  const matrix: number[] = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 16; i++) { arr.push(i) }
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
    addTileToInventory,
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

  const showNotice = (invalid: boolean = false, message?: string) => {
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
  const isPlayersPiece = (pieceId: string, playerNumber: number): boolean => {
    if (playerNumber === 1) {
      return playerOneInventory.includes(pieceId);
    } else {
      return playerTwoInventory.includes(pieceId);
    }
  }

  const handlePlacement = (pieceId: string, position: { x: number; y: number }, resolvedElement?: string) => {
    const pieceSrc = pieceId.split('-')[0]
    
    try {
      // If connected to a room, emit to server (multiplayer mode)
      if (roomId && socketService.isConnected()) {
        socketService.emitPiecePlaced(pieceId, position, currentPlayer, resolvedElement)
      } else {
        // Local mode - update state directly
        placePiece(pieceId, position, currentPlayer, resolvedElement)
      }
      
      // Create the piece element
      const target = document.getElementById(`${position.x},${position.y}`)
      if (target && target.isConnected) {
        const droppedPiece = document.createElement("img")
        droppedPiece.src = pieceSrc
        droppedPiece.className = "h-[180%] w-auto object-contain drop-shadow-xl transform -translate-y-[20%]"
        target.innerHTML = ''
        target.appendChild(droppedPiece)
      }
      
      // Advance to next territory if this territory is complete
      const territory = getTerritoryForCell(position.x, position.y)
      if (territory && gameStatus.currentTerritoryIndex < 6) {
        setGameStatus({ currentTerritoryIndex: gameStatus.currentTerritoryIndex + 1 })
      }
      
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
        } else {
          // Update scores
          const scores = calculateScores(territoryControl)
          setGameStatus({
            playerOneScore: scores.playerOneScore,
            playerTwoScore: scores.playerTwoScore,
          })
        }
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
    if (!draggedPieceId) return

    // Check if it's the current player's turn
    if (playerNumber !== currentPlayer) {
      showNotice(true, "Not your turn")
      return
    }

    // Check if it's the current player's piece
    const currentPlayerInventory = currentPlayer === 1 ? playerOneInventory : playerTwoInventory
    if (!isPlayersPiece(draggedPieceId, currentPlayer)) {
      showNotice(true, "Not your piece")
      return
    }

    // Parse position from target ID (format: "x,y")
    const [x, y] = target.id.split(',').map(Number)
    if (isNaN(x) || isNaN(y)) {
      console.error('Invalid position:', target.id)
      return
    }

    // Validate placement using game rules
    const validation = validatePlacement(
      draggedPieceId,
      { x, y },
      currentPlayer,
      gameStatus.currentTerritoryIndex,
      boardState,
      territoryControl,
      currentPlayerInventory
    )

    if (!validation.valid) {
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
      setGameStatus({ currentPlayer: currentPlayer === 1 ? 2 : 1 })
    }
  }

  // Check if player can place on current territory
  const canPlace = useMemo(() => {
    const currentPlayerInventory = currentPlayer === 1 ? playerOneInventory : playerTwoInventory
    
    // If player has no tiles, check if chaos round should start
    if (currentPlayerInventory.length === 0 && gameStatus.leftoverTiles.length > 0 && !gameStatus.chaosRoundActive) {
      // Trigger chaos round
      if (playerNumber === currentPlayer) {
        setShowChaosModal(true)
      }
      return false
    }
    
    return canPlaceOnCurrentTerritory(
      currentPlayer,
      gameStatus.currentTerritoryIndex,
      boardState,
      territoryControl,
      currentPlayerInventory
    )
  }, [currentPlayer, gameStatus.currentTerritoryIndex, gameStatus.leftoverTiles, gameStatus.chaosRoundActive, boardState, territoryControl, playerOneInventory, playerTwoInventory, playerNumber])

  // Check for game end on turn change
  useEffect(() => {
    if (gameStatus.gameEnded) return

    const endResult = checkGameEnd(
      gameStatus,
      playerOneInventory,
      playerTwoInventory,
      boardState,
      territoryControl,
      currentPlayer
    )

    if (endResult.gameEnded) {
      setGameStatus({
        gameEnded: true,
        winner: endResult.winner || null,
        playerOneScore: endResult.playerOneScore,
        playerTwoScore: endResult.playerTwoScore,
      })
    } else {
      const scores = calculateScores(territoryControl)
      setGameStatus({
        playerOneScore: scores.playerOneScore,
        playerTwoScore: scores.playerTwoScore,
      })
    }
  }, [currentPlayer, playerOneInventory.length, playerTwoInventory.length, boardState, territoryControl, gameStatus])

  // Sync board state from server/local state
  useEffect(() => {
    // Clear all cells first
    matrix.forEach((row) => {
      matrix.forEach((col) => {
        const cell = document.getElementById(`${col},${row}`)
        if (cell) {
          cell.innerHTML = ''
        }
      })
    })

    // Render pieces from boardState
    boardState.forEach((position, key) => {
      const cell = document.getElementById(key)
      if (cell && position.pieceId) {
        const pieceSrc = position.pieceId.split('-')[0]
        const pieceImg = document.createElement("img")
        pieceImg.src = pieceSrc
        pieceImg.className = "h-[180%] w-auto object-contain drop-shadow-xl transform -translate-y-[20%]"
        cell.appendChild(pieceImg)
      }
    })

    // Render control coins
    territoryControl.forEach((control, territoryId) => {
      if (control.controlCoin) {
        const territory = getTerritoryForCell(control.pieces[0]?.pieceId ? 0 : 0, 0) // Get first cell of territory
        // For now, we'll render coins as part of territory control UI
        // This will be enhanced with visual indicators
      }
    })
  }, [boardState, territoryControl, matrix])

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
    window.location.reload() // Simple reset for now
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
        onClose={() => {}}
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
            <span>P1: {gameStatus.playerOneScore}pts</span>
            <span>P2: {gameStatus.playerTwoScore}pts</span>
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
        
        <div className="w-full board-matrix rounded-xl overflow-hidden relative z-20 shadow-[0_0_15px_5px_rgba(0,0,0,0.3)] transform rotate-[0.5deg]">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/5 to-amber-950/10 pointer-events-none" />
          {matrix.map((row) => (
            <div key={row} className="flex h-[25px] md:h-[35px] w-auto matrix-row">
              {matrix.map((matrixDiv) => (
                <div 
                  key={`${matrixDiv},${row}`}
                  className="w-full h-auto flex items-center justify-center hover:bg-white/10 transition-colors duration-200" 
                  style={{ minHeight: '25px' }}
                  id={`${matrixDiv},${row}`} 
                  onDragOver={dragOver} 
                  onDragLeave={dragLeave} 
                  onDrop={drop}
                />
              ))}
            </div>
          ))}
        </div>
        <div 
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center text-base py-2 px-6 rounded transition-all duration-500 z-50 
            ${showTurnNotice ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            ${isInvalidMove 
              ? 'bg-red-500/90 text-white' 
              : 'bg-gray-200/90'
            }`}
        >
          {isInvalidMove 
            ? `Invalid move - It's Player ${currentPlayer}'s turn` 
            : playerNumber 
              ? `Player ${currentPlayer}'s turn${playerNumber === currentPlayer ? ' (Your turn!)' : ''}`
              : `Player ${currentPlayer}'s turn`}
        </div>
      </div>
    </div>
  );
}

export default MainBoard
