import { useEffect, useRef } from 'react'
import { socketService } from '../services/socketService'
import { useGameState } from '../state/gameState'

export const useSocket = () => {
  const { 
    syncGameState, 
    setPlayerNumber, 
    setRoomId, 
    playerNumber,
    roomId 
  } = useGameState()
  const initialized = useRef(false)

  useEffect(() => {
    // Only initialize once, even with React StrictMode
    if (initialized.current) return
    initialized.current = true

    // Connect to server
    socketService.connect()

    // Set up event listeners
    socketService.onGameStateUpdate((gameState) => {
      syncGameState(gameState)
    })

    socketService.onPlayerJoined(({ playerNumber: pNum }) => {
      if (!playerNumber && (pNum === 1 || pNum === 2)) {
        setPlayerNumber(pNum as 1 | 2)
      }
    })

    socketService.onPlayerLeft((playerId) => {
      console.log('Player left:', playerId)
      // Could show a notification here
    })

    // Cleanup on unmount
    return () => {
      // Only disconnect if this is a real unmount (not StrictMode double-mount)
      // We'll let the socket stay connected for hot reloading
      if (import.meta.env.PROD) {
        socketService.disconnect()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run once, intentionally ignoring deps

  const createRoom = (callback?: (roomId: string) => void) => {
    socketService.createRoom((newRoomId) => {
      setRoomId(newRoomId)
      setPlayerNumber(1)
      callback?.(newRoomId)
    })
  }

  const joinRoom = (roomIdToJoin: string, callback?: (success: boolean) => void) => {
    socketService.joinRoom(roomIdToJoin, (success, data) => {
      if (success && data && (data.playerNumber === 1 || data.playerNumber === 2)) {
        setRoomId(roomIdToJoin)
        setPlayerNumber(data.playerNumber as 1 | 2)
        callback?.(true)
      } else {
        callback?.(false)
      }
    })
  }

  return {
    createRoom,
    joinRoom,
    roomId,
    playerNumber,
    isConnected: socketService.isConnected(),
  }
}

