import { GameStatus } from '../state/gameState'

interface GameEndModalProps {
  isOpen: boolean
  gameStatus: GameStatus
  onClose: () => void
  onNewGame: () => void
}

const GameEndModal = ({ isOpen, gameStatus, onClose, onNewGame }: GameEndModalProps) => {
  if (!isOpen || !gameStatus.gameEnded) return null

  const getReasonText = () => {
    switch (gameStatus.winner) {
      case 1:
        return 'Player 1 Wins!'
      case 2:
        return 'Player 2 Wins!'
      default:
        return "It's a Draw!"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-amber-950 rounded-lg p-8 max-w-md w-full mx-4 border-2 border-amber-700">
        <h2 className="text-amber-100 text-3xl font-serif mb-6 text-center">
          Game Over!
        </h2>
        
        <div className="text-center mb-6">
          <p className="text-amber-200 text-2xl font-bold mb-4">
            {getReasonText()}
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-amber-900/50 p-3 rounded">
              <span className="text-amber-100 font-semibold">Player 1 Score:</span>
              <span className="text-amber-200 text-xl font-bold">{gameStatus.playerOneScore}</span>
            </div>
            <div className="flex justify-between items-center bg-amber-900/50 p-3 rounded">
              <span className="text-amber-100 font-semibold">Player 2 Score:</span>
              <span className="text-amber-200 text-xl font-bold">{gameStatus.playerTwoScore}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
          >
            Close
          </button>
          <button
            onClick={onNewGame}
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded transition-colors"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameEndModal

