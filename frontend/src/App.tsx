import ReadyPlayerOne from './components/readyplayerone/readyplayerone.tsx'
import MainBoard from './components/mainboard/mainboard.tsx'
import ReadyPlayerTwo from './components/readyplayertwo/readyplayertwo.tsx'
import RoomManager from './components/room/RoomManager.tsx'
import GameModeSelector from './components/GameModeSelector.tsx'
import { useGameState } from './state/gameState'
import './App.css'

function App() {
  const { gameMode } = useGameState()

  // Show mode selector until a mode is chosen
  if (gameMode === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GameModeSelector />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen p-2 md:p-4 overflow-hidden">
      {/* Room manager - only shows in network mode */}
      <RoomManager />
      <div className="w-full max-w-[600px] md:max-w-none h-full">
        {/* Mobile Layout */}
        <div className="md:hidden w-full flex flex-col gap-2">
          <ReadyPlayerOne />
          <MainBoard />
          <ReadyPlayerTwo />
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden md:flex md:gap-4 h-full">
          <div className="w-1/4">
            <ReadyPlayerOne />
          </div>
          <div className="w-2/4">
            <MainBoard />
          </div>
          <div className="w-1/4">
            <ReadyPlayerTwo />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

