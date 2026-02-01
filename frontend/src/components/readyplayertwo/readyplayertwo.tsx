import { useRef } from "react"
import { useGameState } from "../../state/gameState"
import { getPieceSrc } from "../../utils/pieceUtils"

const ReadyPlayerTwo = () => {
  const dragItem = useRef<string>("")
  const { playerTwoInventory, roomId, playerNumber, gameMode, currentPlayer } = useGameState()

  const dragStart = (e: React.DragEvent<HTMLImageElement>) => {
    dragItem.current = e.currentTarget.id
    e.dataTransfer.setData("text/plain", e.currentTarget.id)
  }

  // Determine if dragging is allowed based on game mode
  const isLocalMode = gameMode === 'local'
  const isNetworkMode = gameMode === 'network'
  
  // In local mode: can drag if it's Player 2's turn
  // In network mode: can drag if this is your hand (Player 2)
  // Default (no mode): show pieces but no drag
  const isMyTurn = isLocalMode && currentPlayer === 2
  const isMyHand = isNetworkMode ? playerNumber === 2 : !roomId
  const canDrag = isLocalMode ? isMyTurn : isMyHand
  
  // In network multiplayer, opponent (Player 1) sees hidden cards
  const isOpponentHand = isNetworkMode && playerNumber === 1

  // If this is opponent's hand in network multiplayer, show hidden card backs
  if (isOpponentHand) {
    return (
      <div className="w-full mt-4 md:mt-0 md:h-screen">
        <h2 className="text-amber-100 text-center mb-2 font-serif text-2xl">Opponent</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 justify-items-center items-center bg-amber-950/60 p-2 rounded-lg md:h-[calc(100vh-4rem)]">
          {playerTwoInventory.map((_pieceId: string, index: number) => (
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

  // Determine title based on mode
  const getTitle = () => {
    if (isLocalMode) return 'Player Two'
    if (isNetworkMode && playerNumber === 2) return 'Your Hand'
    return 'Player Two'
  }

  // Visual indication for active turn in local mode
  const isActiveTurn = isLocalMode && currentPlayer === 2

  return (
    <div className="w-full mt-4 md:mt-0 md:h-screen">
      <h2 className={`text-center mb-2 font-serif text-2xl ${isActiveTurn ? 'text-green-400' : 'text-amber-100'}`}>
        {getTitle()}
        {isActiveTurn && <span className="ml-2 text-sm">(Your Turn)</span>}
      </h2>
      <div className={`grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 justify-items-center items-center p-2 rounded-lg md:h-[calc(100vh-4rem)] transition-colors ${
        isActiveTurn ? 'bg-green-900/40 ring-2 ring-green-500/50' : 'bg-amber-950/60'
      }`}>
        {playerTwoInventory.map((pieceId: string) => (
          <img 
            key={pieceId}
            className={`h-16 w-auto md:h-20 lg:h-24 object-contain drop-shadow-md transition-opacity ${
              canDrag ? 'cursor-grab hover:scale-105' : 'opacity-60 cursor-not-allowed'
            }`}
            id={pieceId} 
            draggable={canDrag}
            src={getPieceSrc(pieceId)} 
            alt="pieces" 
            onDragStart={canDrag ? dragStart : undefined}
          />
        ))}
      </div>
    </div>
  )
}

export default ReadyPlayerTwo
