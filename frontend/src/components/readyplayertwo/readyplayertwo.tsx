import { storm, water, fire, ice, wind, unknown, tree_coin, eye_coin } from "../../assets/images/pieces/index.ts"

const ReadyPlayerTwo = () => {
  const stones: string[] = [storm, water, fire, ice, wind, unknown]
  const coins: string[] = [tree_coin, eye_coin]
  const playerStones: string[] = []
  const playerCoin: string = coins[1]

  for (let i = 0; i < 7; i++) {
    playerStones.push(stones[Math.floor(Math.random() * 6)])
  }

  return (
    <div className="w-2/7">
      <h2 className="text-red-500">Player Two</h2>
      <div className="grid grid-cols-3 gap-3 justify-items-center items-center">
        {playerStones.map((stone) => {
          return (<img className="h-3/4 w-auto" draggable src={stone} alt="pieces" />)
        })}
      </div>
      <div className="grid gird-cols-4 gap-4">
        <img draggable className="h-1/2 w-auto" src={playerCoin} alt={playerCoin} />
      </div>
    </div>
  )
}

export default ReadyPlayerTwo
