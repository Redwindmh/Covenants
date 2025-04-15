import { useRef } from "react"
import { useGameState } from "../../state/gameState"

const ReadyPlayerTwo = () => {
  const dragItem = useRef<string>("")
  const { playerTwoInventory } = useGameState()

  const dragStart = (e: React.DragEvent<HTMLImageElement>) => {
    dragItem.current = e.currentTarget.id
    e.dataTransfer.setData("text/plain", e.currentTarget.id)
  }

  return (
    <div className="w-full mt-4 md:mt-0 md:h-screen">
      <h2 className="text-amber-100 text-center mb-2 font-serif text-2xl">Player Two</h2>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 justify-items-center items-center bg-amber-950/60 p-2 rounded-lg md:h-[calc(100vh-4rem)]">
        {playerTwoInventory.map((pieceId: string) => {
          const pieceSrc = pieceId.split('-')[0]
          return (
            <img 
              key={pieceId}
              className="h-16 w-auto md:h-20 lg:h-24 object-contain drop-shadow-md" 
              id={pieceId} 
              draggable 
              src={pieceSrc} 
              alt="pieces" 
              onDragStart={dragStart} 
            />
          )
        })}
      </div>
    </div>
  )
}

export default ReadyPlayerTwo
