import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private roomId: string | null = null
  private playerId: string | null = null

  connect(serverUrl: string = 'http://localhost:3001'): Socket {
    // Return existing socket if already connected or connecting
    if (this.socket) {
      if (this.socket.connected) {
        return this.socket
      }
      // If socket exists but not connected, disconnect it first to avoid duplicates
      this.socket.disconnect()
    }

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
    })

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket?.id)
      this.playerId = this.socket?.id || null
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })

    return this.socket
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.roomId = null
      this.playerId = null
    }
  }

  joinRoom(roomId: string, callback?: (success: boolean, data?: { playerNumber: number; gameState?: unknown }) => void): void {
    if (!this.socket) {
      console.error('Socket not connected')
      callback?.(false)
      return
    }

    this.roomId = roomId
    this.socket.emit('join-room', roomId, (response: { success: boolean; data?: { playerNumber: number; gameState?: unknown } }) => {
      if (response.success) {
        callback?.(true, response.data)
      } else {
        callback?.(false)
      }
    })
  }

  createRoom(callback?: (roomId: string) => void): void {
    if (!this.socket) {
      console.error('Socket not connected')
      return
    }

    this.socket.emit('create-room', (response: { roomId: string }) => {
      this.roomId = response.roomId
      callback?.(response.roomId)
    })
  }

  onGameStateUpdate(callback: (gameState: {
    playerOneInventory: string[]
    playerTwoInventory: string[]
    boardState: Record<string, { x: number; y: number; pieceId: string; playerNumber: number }>
    currentPlayer: 1 | 2
  }) => void): void {
    if (!this.socket) return

    this.socket.on('game-state-update', callback)
  }

  onPlayerJoined(callback: (playerInfo: { playerId: string; playerNumber: number }) => void): void {
    if (!this.socket) return

    this.socket.on('player-joined', callback)
  }

  onPlayerLeft(callback: (playerId: string) => void): void {
    if (!this.socket) return

    this.socket.on('player-left', callback)
  }

  emitPiecePlaced(pieceId: string, position: { x: number; y: number }, playerNumber: number, resolvedElement?: string): void {
    if (!this.socket || !this.roomId) {
      console.error('Socket not connected or no room joined')
      return
    }

    this.socket.emit('piece-placed', {
      roomId: this.roomId,
      pieceId,
      position,
      playerNumber,
      resolvedElement,
    })
  }

  emitGameInitialized(playerOnePieces: string[], playerTwoPieces: string[], leftoverTiles: string[]): void {
    if (!this.socket || !this.roomId) {
      console.error('Socket not connected or no room joined')
      return
    }

    this.socket.emit('game-initialized', {
      roomId: this.roomId,
      playerOnePieces,
      playerTwoPieces,
      leftoverTiles,
    })
  }

  emitTerritoryForfeit(territoryId: number, forfeitingPlayer: number): void {
    if (!this.socket || !this.roomId) {
      console.error('Socket not connected or no room joined')
      return
    }

    this.socket.emit('territory-forfeit', {
      roomId: this.roomId,
      territoryId,
      forfeitingPlayer,
    })
  }

  emitChaosDraw(tileId: string, playerNumber: number): void {
    if (!this.socket || !this.roomId) {
      console.error('Socket not connected or no room joined')
      return
    }

    this.socket.emit('chaos-draw', {
      roomId: this.roomId,
      playerNumber,
      tileId,
    })
  }

  getSocket(): Socket | null {
    return this.socket
  }

  getRoomId(): string | null {
    return this.roomId
  }

  getPlayerId(): string | null {
    return this.playerId
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const socketService = new SocketService()

