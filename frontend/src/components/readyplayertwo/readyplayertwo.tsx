import { useRef } from "react"
import { useGameState } from "../../state/gameState"
import { getPieceSrc } from "../../utils/pieceUtils"

const ReadyPlayerTwo = () => {
  const dragItem = useRef<string>("")
  const { playerTwoInventory, roomId, playerNumber } = useGameState()

  const dragStart = (e: React.DragEvent<HTMLImageElement>) => {
    dragItem.current = e.currentTarget.id
    e.dataTransfer.setData("text/plain", e.currentTarget.id)
  }

  // In multiplayer, only show pieces if this is your hand (Player 2)
  // In single player (no roomId), show all pieces
  const isMyHand = !roomId || playerNumber === 2
  const isOpponentHand = roomId && playerNumber === 1

  // If this is opponent's hand in multiplayer, show hidden card backs
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

  return (
    <div className="w-full mt-4 md:mt-0 md:h-screen">
      <h2 className="text-amber-100 text-center mb-2 font-serif text-2xl">
        {isMyHand && roomId ? 'Your Hand' : 'Player Two'}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 justify-items-center items-center bg-amber-950/60 p-2 rounded-lg md:h-[calc(100vh-4rem)]">
        {playerTwoInventory.map((pieceId: string) => (
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

export default ReadyPlayerTwo
