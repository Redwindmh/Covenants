import { useRef } from "react"
import { storm, water, fire, ice, wind, unknown, tree_coin, eye_coin } from "../../assets/images/pieces/index.ts"

const ReadyPlayerOne = () => {
  const stones: string[] = [storm, water, fire, ice, wind, unknown]
  const coins: string[] = [tree_coin, eye_coin]
  const playerStones: string[] = []
  const playerCoin: string = coins[0]
  const dragItem: any = useRef()
  for (let i = 0; i < 7; i++) {
    playerStones.push(stones[Math.floor(Math.random() * 6)])
  }

  const dragStart = (e: any & { target: HTMLImageElement }) => {
    console.log(`We be dragging ${e.target.id}`)
    dragItem.current = e.target.id
  }

  const dragEnd = (e: any & { target: HTMLImageElement }) => {
    e.stopPropagation()
    e.preventDefault()
    console.log(`Dropping ${e.target.id}`)
    dragItem.current = e.target.id
  }


  return (
    <div className="w-2/7">
      <h2 className="text-red-500">Player One</h2>
      <div className="grid grid-cols-3 gap-3 justify-items-center items-center">
        {playerStones.map((stone) => {
          return (<img className="h-3/4 w-auto" id={stone} draggable src={stone} alt="pieces" onDragStart={(e) => dragStart(e)} />)
        })}
      </div>
      <div className="grid gird-cols-4 gap-4">
        <img draggable className="h-1/2 w-auto" id={playerCoin} src={playerCoin} alt={playerCoin} onDragStart={(e) => dragStart(e)} onDragEnd={(e) => dragEnd(e)} />
      </div>
    </div>
  )
}

export default ReadyPlayerOne
