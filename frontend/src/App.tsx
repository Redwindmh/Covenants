import ReadyPlayerOne from './components/readyplayerone/readyplayerone.tsx'
import MainBoard from './components/mainboard/mainboard.tsx'
import ReadyPlayerTwo from './components/readyplayertwo/readyplayertwo.tsx'
import './App.css'

function App() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen p-2 md:p-4 overflow-hidden">
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

