import ReadyPlayerOne from './components/readyplayerone/readyplayerone.tsx'
import MainBoard from './components/mainboard/mainboard.tsx'
import ReadyPlayerTwo from './components/readyplayertwo/readyplayertwo.tsx'
import './App.css'

function App() {
  return (
    <>
      <div className='flex' >
        <ReadyPlayerOne />
        <MainBoard />
        <ReadyPlayerTwo />
      </div>
    </>
  )
}

export default App

