import { useState } from 'react'
import { getPieceSrc } from '../utils/pieceUtils'

interface ChaosRoundModalProps {
  isOpen: boolean
  leftoverTiles: string[]
  onDraw: (tileId: string) => void
  onCancel: () => void
}

const ChaosRoundModal = ({ isOpen, leftoverTiles, onDraw, onCancel }: ChaosRoundModalProps) => {
  const [drawnTile, setDrawnTile] = useState<string | null>(null)

  if (!isOpen || leftoverTiles.length === 0) return null

  const handleDraw = () => {
    if (leftoverTiles.length === 0) return
    
    const randomIndex = Math.floor(Math.random() * leftoverTiles.length)
    const tile = leftoverTiles[randomIndex]
    setDrawnTile(tile)
  }

  const handleConfirm = () => {
    if (drawnTile) {
      onDraw(drawnTile)
      setDrawnTile(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-amber-950 rounded-lg p-8 max-w-md w-full mx-4 border-2 border-amber-700">
        <h2 className="text-amber-100 text-2xl font-serif mb-4 text-center">
          Chaos Round - Draw from Leftover Tiles
        </h2>
        
        <p className="text-amber-200 mb-6 text-center">
          You've run out of tiles. Draw one random tile from the {leftoverTiles.length} leftover tiles.
        </p>

        {!drawnTile ? (
          <div className="text-center">
            <button
              onClick={handleDraw}
              className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Draw Tile
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <img 
                src={getPieceSrc(drawnTile)} 
                alt="Drawn tile"
                className="w-24 h-24 mx-auto object-contain"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDrawnTile(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
              >
                Draw Again
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded transition-colors"
              >
                Use This Tile
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={onCancel}
            className="text-amber-300 hover:text-amber-200 text-sm underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChaosRoundModal

