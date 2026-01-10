// Write a websocket server to serve the frontend to multiple users

import express from "express";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3001"], // Vite dev server and production
    methods: ["GET", "POST"],
  },
});

// Serve static files from the frontend build
const frontendDistPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDistPath));

// API routes should go here (if any)

// Catch-all route for React Router (SPA)
// This should be AFTER all API routes but BEFORE socket.io setup
// Note: Express 5.x requires named wildcard parameters
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
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
//     territoryControl: {},
//     currentPlayer: 1,
//     gameStatus: {
//       currentTerritoryIndex: 0,
//       gameEnded: false,
//       winner: null,
//       playerOneScore: 0,
//       playerTwoScore: 0,
//       chaosRoundActive: false,
//       leftoverTiles: [],
//     }
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
        territoryControl: {},
        currentPlayer: 1,
        gameStatus: {
          currentTerritoryIndex: 0,
          gameEnded: false,
          winner: null,
          playerOneScore: 0,
          playerTwoScore: 0,
          chaosRoundActive: false,
          leftoverTiles: [],
        },
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
  socket.on("game-initialized", ({ roomId, playerOnePieces, playerTwoPieces, leftoverTiles }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Initialize territory control (7 territories)
    const territoryControl = {};
    for (let i = 1; i <= 7; i++) {
      territoryControl[i] = {
        territoryId: i,
        controlledBy: null,
        pieces: [],
      };
    }

    room.gameState = {
      playerOneInventory: playerOnePieces,
      playerTwoInventory: playerTwoPieces,
      boardState: {},
      territoryControl,
      currentPlayer: 1,
      gameStatus: {
        currentTerritoryIndex: 0,
        gameEnded: false,
        winner: null,
        playerOneScore: 0,
        playerTwoScore: 0,
        chaosRoundActive: false,
        leftoverTiles: leftoverTiles || [],
      },
    };

    // Broadcast to all players in the room
    io.to(roomId).emit("game-state-update", room.gameState);
    console.log(`Game initialized in room ${roomId}`);
  });

  // Handle piece placement
  socket.on("piece-placed", ({ roomId, pieceId, position, playerNumber, resolvedElement }) => {
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
      element: resolvedElement,
    };

    // Update territory control (simplified - would need territory detection logic)
    // For now, we'll let the frontend handle territory control updates
    // and sync them back

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

  // Handle territory forfeit
  socket.on("territory-forfeit", ({ roomId, territoryId, forfeitingPlayer }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.gameState.currentPlayer !== forfeitingPlayer) {
      socket.emit("invalid-move", { reason: "Not your turn" });
      return;
    }

    // Update territory control
    if (!room.gameState.territoryControl[territoryId]) {
      room.gameState.territoryControl[territoryId] = {
        territoryId,
        controlledBy: null,
        pieces: [],
      };
    }

    const opponent = forfeitingPlayer === 1 ? 2 : 1;
    room.gameState.territoryControl[territoryId].controlledBy = opponent;
    room.gameState.territoryControl[territoryId].controlCoin = opponent === 1 ? 'tree_coin' : 'eye_coin';

    // Advance to next territory
    if (room.gameState.gameStatus.currentTerritoryIndex < 6) {
      room.gameState.gameStatus.currentTerritoryIndex += 1;
    }

    // Switch turns
    room.gameState.currentPlayer = opponent;

    // Broadcast updated game state
    io.to(roomId).emit("game-state-update", room.gameState);
    console.log(`Territory ${territoryId} forfeited by Player ${forfeitingPlayer} in room ${roomId}`);
  });

  // Handle chaos round draw
  socket.on("chaos-draw", ({ roomId, playerNumber, tileId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Remove tile from leftover tiles
    room.gameState.gameStatus.leftoverTiles = room.gameState.gameStatus.leftoverTiles.filter(
      (t) => t !== tileId
    );

    // Add to player inventory
    if (playerNumber === 1) {
      room.gameState.playerOneInventory.push(tileId);
    } else {
      room.gameState.playerTwoInventory.push(tileId);
    }

    room.gameState.gameStatus.chaosRoundActive = true;

    // Broadcast updated game state
    io.to(roomId).emit("game-state-update", room.gameState);
    console.log(`Player ${playerNumber} drew tile in chaos round, room ${roomId}`);
  });

  // Handle leaving a room
  socket.on("leave-room", (roomId) => {
    console.log(`Player ${socket.id} leaving room ${roomId}`);
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    const playerIndex = room.players.indexOf(socket.id);
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);
      delete room.playerNumbers[socket.id];
      
      // Leave the socket.io room
      socket.leave(roomId);
      
      // Notify other players
      socket.to(roomId).emit("player-left", { playerId: socket.id });
      
      // Clean up empty rooms
      if (room.players.length === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      }
    }
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
