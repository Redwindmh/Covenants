// Write a websocket server to serve the frontend to multiple users

import express from "express";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default dev server
    methods: ["GET", "POST"],
  },
});

// Store game rooms and their state
const rooms = new Map();

// Room structure:
// {
//   players: [socketId1, socketId2],
//   playerNumbers: { socketId1: 1, socketId2: 2 },
//   gameState: {
//     playerOneInventory: [],
//     playerTwoInventory: [],
//     boardState: {},
//     currentPlayer: 1,
//   }
// }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Create a new room
  socket.on("create-room", (callback) => {
    const roomId = uuidv4();
    rooms.set(roomId, {
      players: [socket.id],
      playerNumbers: { [socket.id]: 1 },
      gameState: {
        playerOneInventory: [],
        playerTwoInventory: [],
        boardState: {},
        currentPlayer: 1,
      },
    });
    socket.join(roomId);
    console.log(`Room created: ${roomId} by ${socket.id}`);
    callback({ roomId });
  });

  // Join an existing room
  socket.on("join-room", (roomId, callback) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      callback({ success: false, error: "Room not found" });
      return;
    }

    if (room.players.length >= 2) {
      callback({ success: false, error: "Room is full" });
      return;
    }

    room.players.push(socket.id);
    room.playerNumbers[socket.id] = 2;
    socket.join(roomId);
    
    console.log(`Player ${socket.id} joined room ${roomId} as Player 2`);
    
    // Notify both players
    io.to(roomId).emit("player-joined", {
      playerId: socket.id,
      playerNumber: 2,
    });

    // Send current game state to the new player
    socket.emit("game-state-update", room.gameState);
    
    callback({ success: true, data: { playerNumber: 2, gameState: room.gameState } });
  });

  // Handle game initialization
  socket.on("game-initialized", ({ roomId, playerOnePieces, playerTwoPieces }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.gameState = {
      playerOneInventory: playerOnePieces,
      playerTwoInventory: playerTwoPieces,
      boardState: {},
      currentPlayer: 1,
    };

    // Broadcast to all players in the room
    io.to(roomId).emit("game-state-update", room.gameState);
    console.log(`Game initialized in room ${roomId}`);
  });

  // Handle piece placement
  socket.on("piece-placed", ({ roomId, pieceId, position, playerNumber }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Validate it's the current player's turn
    if (room.gameState.currentPlayer !== playerNumber) {
      socket.emit("invalid-move", { reason: "Not your turn" });
      return;
    }

    // Update board state
    const key = `${position.x},${position.y}`;
    room.gameState.boardState[key] = {
      x: position.x,
      y: position.y,
      pieceId,
      playerNumber,
    };

    // Remove piece from inventory
    if (playerNumber === 1) {
      room.gameState.playerOneInventory = room.gameState.playerOneInventory.filter(
        (p) => p !== pieceId
      );
    } else {
      room.gameState.playerTwoInventory = room.gameState.playerTwoInventory.filter(
        (p) => p !== pieceId
      );
    }

    // Switch turns
    room.gameState.currentPlayer = playerNumber === 1 ? 2 : 1;

    // Broadcast updated game state to all players in the room
    io.to(roomId).emit("game-state-update", room.gameState);
    console.log(`Piece placed in room ${roomId} by Player ${playerNumber}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    // Remove player from rooms
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.indexOf(socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        delete room.playerNumbers[socket.id];
        
        // Notify other players
        socket.to(roomId).emit("player-left", { playerId: socket.id });
        
        // Clean up empty rooms
        if (room.players.length === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }
    }
  });
});

server.listen(3001, () => {
  console.log("listening on *:3001");
});
