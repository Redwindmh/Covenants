import { useRef, useEffect } from "react"
import { storm, water, fire, ice, wind, unknown, tree_coin, eye_coin } from "../../assets/images/pieces/index.ts"
import { useGameState } from "../../state/gameState"

interface Piece {
  id: string;
  src: string;
}

const ReadyPlayerOne = () => {
  const stones: string[] = [storm, water, fire, ice, wind, unknown]
  const coins: string[] = [tree_coin, eye_coin]
  const playerCoin: string = coins[0]
  const dragItem = useRef<string>("")
  const { playerOneInventory, initializeGame, resetGame, isInitialized } = useGameState()

  const generatePieces = () => {
    const playerOnePieces: Piece[] = []
    const playerTwoPieces: Piece[] = []
    
    // Generate pieces for Player One
    for (let i = 0; i < 7; i++) {
      const stone = stones[Math.floor(Math.random() * stones.length)]
      playerOnePieces.push({
        id: `${stone}-${i}`,
        src: stone
      })
    }
    playerOnePieces.push({
      id: `${playerCoin}-coin`,
      src: playerCoin
    })

    // Generate pieces for Player Two
    for (let i = 0; i < 7; i++) {
      const stone = stones[Math.floor(Math.random() * stones.length)]
      playerTwoPieces.push({
        id: `${stone}-${i + 7}`, // Use offset IDs to avoid conflicts
        src: stone
      })
    }
    playerTwoPieces.push({
      id: `${coins[1]}-coin`,
      src: coins[1]
    })

    // Initialize game with generated pieces
    initializeGame(
      playerOnePieces.map(p => p.id),
      playerTwoPieces.map(p => p.id)
    )
  }

  useEffect(() => {
    // Only initialize if not already initialized
    if (!isInitialized) {
      generatePieces()
    }

    // Reset game when page is refreshed/closed
    const handleBeforeUnload = () => {
      resetGame()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isInitialized, resetGame])

  const dragStart = (e: React.DragEvent<HTMLImageElement>) => {
    dragItem.current = e.currentTarget.id
    e.dataTransfer.setData("text/plain", e.currentTarget.id)
  }

  return (
    <div className="w-full mb-4 md:mb-0 md:h-screen">
      <h2 className="text-amber-100 text-center mb-2 font-serif text-2xl">Player One</h2>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 justify-items-center items-center bg-amber-950/60 p-2 rounded-lg md:h-[calc(100vh-4rem)]">
        {playerOneInventory.map((pieceId: string) => {
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

export default ReadyPlayerOne
