import { useRef, useState, useEffect } from "react";
import { useGameState } from "../../state/gameState";

// ts-nocheck Create catch to prevent user from placing pieces outside of designated areas on board an maybe stacjing on same spot? Or, maybe add some special feature for when pieces are stacked?

interface DragOverItem {
  current: string;
}

const MainBoard = () => {
  const matrixSize: number[] = [16, 16];
  const matrix: number[] = [];
  for (let i = 0; i < matrixSize[0]; i++) { matrix.push(i) }

  const dragOverItem = useRef<DragOverItem>({ current: "" })
  const { removeFromInventory, playerOneInventory, playerTwoInventory } = useGameState()
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1)
  const [showTurnNotice, setShowTurnNotice] = useState(true)
  const [isInvalidMove, setIsInvalidMove] = useState(false)
  const [noticeTimeout, setNoticeTimeout] = useState<number | null>(null)

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

  const showNotice = (invalid: boolean = false) => {
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

  const drop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()

    const target = e.currentTarget
    target.style.backgroundColor = "rgba(0,0,0,0)"
    
    const draggedPieceId = e.dataTransfer.getData("text/plain")
    if (!draggedPieceId) return

    // Check if it's the current player's piece
    if (!isPlayersPiece(draggedPieceId, currentPlayer)) {
      showNotice(true)
      return
    }

    const pieceSrc = draggedPieceId.split('-')[0]
    
    try {
      // Create the piece element
      const droppedPiece = document.createElement("img")
      droppedPiece.src = pieceSrc
      droppedPiece.className = "h-[180%] w-auto object-contain drop-shadow-xl transform -translate-y-[20%]"
      
      // Clear the target space and add the piece
      if (target && target.isConnected) {
        target.innerHTML = ''
        target.appendChild(droppedPiece)
        
        // Remove from inventory
        await removeFromInventory(currentPlayer, draggedPieceId)
        
        // Switch to the other player's turn
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
        showNotice(false)
      }
    } catch (error) {
      console.error('Error handling piece drop:', error)
      if (target && target.isConnected) {
        target.innerHTML = ''
      }
    }
  }

  useEffect(() => {
    return () => {
      if (noticeTimeout) {
        clearTimeout(noticeTimeout)
      }
    }
  }, [])

  return (
    <div className="w-full relative">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-amber-950/20 pointer-events-none" />
      <div className="relative">
        <h1 className="text-amber-100 text-center mb-6 font-serif text-4xl tracking-wide drop-shadow-lg">
          Covenants
        </h1>
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
            : `Player ${currentPlayer}'s turn`}
        </div>
      </div>
    </div>
  );
}

export default MainBoard
