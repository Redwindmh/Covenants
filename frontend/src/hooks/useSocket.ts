import { useEffect, useState } from 'react'
import { socketService } from '../services/socketService'
import { useGameState } from '../state/gameState'

export const useSocket = () => {
  const { 
    syncGameState, 
    setPlayerNumber, 
    setRoomId, 
    resetGame,
    playerNumber,
    roomId 
  } = useGameState()
  const [isConnected, setIsConnected] = useState(() => {
    // Initialize with current socket state
    return socketService.isConnected()
  })

  useEffect(() => {
    console.log('[useSocket] Setting up socket connection and handlers...')
    
    // Connect to server (socketService handles preventing duplicate connections)
    const socket = socketService.connect()
    
    // Handler functions defined inside effect to capture latest state
    const handleConnect = () => {
      console.log('[useSocket] Socket connected!')
      setIsConnected(true)
    }
    
    const handleDisconnect = () => {
      console.log('[useSocket] Socket disconnected!')
      setIsConnected(false)
    }
    
    const handleGameStateUpdate = (gameState: Parameters<typeof syncGameState>[0]) => {
      console.log('[useSocket] Received game state update:', gameState)
      syncGameState(gameState)
    }
    
    const handlePlayerJoined = ({ playerNumber: pNum }: { playerId: string; playerNumber: number }) => {
      console.log('[useSocket] Player joined with number:', pNum)
      if (pNum === 1 || pNum === 2) {
        setPlayerNumber(pNum as 1 | 2)
      }
    }
    
    const handlePlayerLeft = (playerId: string) => {
      console.log('[useSocket] Player left:', playerId)
    }
    
    // Add all handlers
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('game-state-update', handleGameStateUpdate)
    socket.on('player-joined', handlePlayerJoined)
    socket.on('player-left', handlePlayerLeft)
    
    // Check if already connected (in case socket connected before this effect ran)
    if (socket.connected) {
      console.log('[useSocket] Socket was already connected')
      setIsConnected(true)
    }

    // Cleanup: remove all handlers
    return () => {
      console.log('[useSocket] Cleanup - removing all handlers')
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('game-state-update', handleGameStateUpdate)
      socket.off('player-joined', handlePlayerJoined)
      socket.off('player-left', handlePlayerLeft)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - socket setup only once, handlers use Zustand directly

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

  const leaveRoom = () => {
    console.log('[useSocket] Leaving room...')
    socketService.leaveRoom()
    resetGame()  // Reset all game state including roomId
  }

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    roomId,
    playerNumber,
    isConnected,
  }
}

