import { useState } from 'react'
import { Element, ELEMENTAL_CYCLE } from '../constants/gameRules'
import { gamePieces } from '../constants/gamePieces'

interface UnknownSelectionModalProps {
  isOpen: boolean
  requiredElement?: Element | null // If placing on opponent piece, this is required
  onSelect: (element: Element) => void
  onCancel: () => void
}

const UnknownSelectionModal = ({ isOpen, requiredElement, onSelect, onCancel }: UnknownSelectionModalProps) => {
  const [selectedElement, setSelectedElement] = useState<Element | null>(null)

  if (!isOpen) return null

  const availableElements = requiredElement 
    ? [requiredElement] // Must use required element
    : ELEMENTAL_CYCLE // Can choose any element

  const elementImages: Record<Element, string> = {
    [Element.FIRE]: gamePieces.fire,
    [Element.ICE]: gamePieces.ice,
    [Element.WIND]: gamePieces.wind,
    [Element.STORM]: gamePieces.storm,
    [Element.WATER]: gamePieces.water,
    [Element.UNKNOWN]: gamePieces.unknown,
  }

  const elementNames: Record<Element, string> = {
    [Element.FIRE]: 'Fire',
    [Element.ICE]: 'Ice',
    [Element.WIND]: 'Wind',
    [Element.STORM]: 'Storm',
    [Element.WATER]: 'Water',
    [Element.UNKNOWN]: 'Unknown',
  }

  const handleConfirm = () => {
    if (selectedElement || requiredElement) {
      onSelect(selectedElement || requiredElement!)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-amber-950 rounded-lg p-6 max-w-md w-full mx-4 border-2 border-amber-700">
        <h2 className="text-amber-100 text-2xl font-serif mb-4 text-center">
          Select Element for UNKNOWN Tile
        </h2>
        
        {requiredElement ? (
          <p className="text-amber-200 mb-4 text-center">
            You must play this as <strong>{elementNames[requiredElement]}</strong> to beat the opponent's piece.
          </p>
        ) : (
          <p className="text-amber-200 mb-4 text-center">
            Choose which element this UNKNOWN tile will represent:
          </p>
        )}

        <div className="grid grid-cols-3 gap-4 mb-6">
          {availableElements.map((element) => {
            const isSelected = selectedElement === element || (requiredElement && element === requiredElement)
            return (
              <button
                key={element}
                onClick={() => !requiredElement && setSelectedElement(element)}
                disabled={!!requiredElement}
                className={`
                  p-3 rounded-lg border-2 transition-all
                  ${isSelected 
                    ? 'border-amber-400 bg-amber-800 scale-105' 
                    : 'border-amber-700 bg-amber-900 hover:border-amber-500'
                  }
                  ${requiredElement ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                <img 
                  src={elementImages[element]} 
                  alt={elementNames[element]}
                  className="w-16 h-16 mx-auto mb-2 object-contain"
                />
                <p className="text-amber-100 text-sm font-semibold">
                  {elementNames[element]}
                </p>
              </button>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedElement && !requiredElement}
            className={`
              flex-1 px-4 py-2 rounded transition-colors
              ${selectedElement || requiredElement
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default UnknownSelectionModal

