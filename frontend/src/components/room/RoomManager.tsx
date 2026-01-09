import { useState } from 'react'
import { useSocket } from '../../hooks/useSocket'
import { useGameState } from '../../state/gameState'

const RoomManager = () => {
  const { createRoom, joinRoom, leaveRoom, roomId, playerNumber, isConnected } = useSocket()
  const { resetGame } = useGameState()
  const [joinRoomId, setJoinRoomId] = useState('')
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('[RoomManager] Render:', { roomId, playerNumber, isConnected })

  const handleCreateRoom = () => {
    setError(null)
    resetGame()
    createRoom((newRoomId) => {
      console.log('Room created:', newRoomId)
    })
  }

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      setError('Please enter a room ID')
      return
    }
    setError(null)
    resetGame()
    joinRoom(joinRoomId.trim(), (success) => {
      if (!success) {
        setError('Failed to join room. Room may not exist or be full.')
      } else {
        setShowJoinForm(false)
        setJoinRoomId('')
      }
    })
  }

  const handleLeaveRoom = () => {
    console.log('[RoomManager] Leaving room...')
    leaveRoom()
  }

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId)
      console.log('Room ID copied to clipboard')
    }
  }

  if (roomId) {
    return (
      <div className="fixed top-4 right-4 bg-amber-950/90 text-amber-100 p-3 rounded-lg shadow-lg z-50 min-w-[280px]">
        <div className="text-sm mb-2">
          <div className="font-semibold mb-1">Room ID:</div>
          <div 
            className="bg-amber-900/50 p-2 rounded text-xs font-mono break-all cursor-pointer hover:bg-amber-900/70 transition-colors"
            onClick={copyRoomId}
            title="Click to copy"
          >
            {roomId}
          </div>
          <div className="text-xs text-amber-300 mt-1">Click to copy</div>
          <div className="mt-2">You are Player {playerNumber}</div>
          {!isConnected && (
            <div className="text-red-400 text-xs mt-1">Disconnected</div>
          )}
        </div>
        <button
          onClick={handleLeaveRoom}
          className="w-full bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm transition-colors"
        >
          Leave Room
        </button>
      </div>
    )
  }

  return (
    <div className="fixed top-4 right-4 bg-amber-950/90 text-amber-100 p-4 rounded-lg shadow-lg z-50 min-w-[250px]">
      <div className="text-sm mb-3">
        <div className="font-semibold mb-2">Multiplayer</div>
        {!isConnected && (
          <div className="text-red-400 text-xs mb-2">Connecting to server...</div>
        )}
      </div>
      
      {!showJoinForm ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleCreateRoom}
            disabled={!isConnected}
            className="bg-amber-700 hover:bg-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
          >
            Create Room
          </button>
          <button
            onClick={() => setShowJoinForm(true)}
            disabled={!isConnected}
            className="bg-amber-800 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
          >
            Join Room
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            placeholder="Enter Room ID"
            className="bg-amber-900 text-amber-100 px-3 py-2 rounded border border-amber-700 focus:outline-none focus:border-amber-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleJoinRoom()
              }
            }}
          />
          {error && (
            <div className="text-red-400 text-xs">{error}</div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleJoinRoom}
              disabled={!isConnected}
              className="bg-amber-700 hover:bg-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex-1 transition-colors"
            >
              Join
            </button>
            <button
              onClick={() => {
                setShowJoinForm(false)
                setJoinRoomId('')
                setError(null)
              }}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoomManager

