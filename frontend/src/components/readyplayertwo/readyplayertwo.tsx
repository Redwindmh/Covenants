import { storm, water, fire, ice, wind, unknown, tree_coin, eye_coin } from "../../assets/images/pieces/index.ts"

const ReadyPlayerTwo = () => {
  return (
    <div className="w-2/7">
      <h2 className="text-red-500">Player Two</h2>
      <div className="grid grid-cols-3 gap-3">
        <img src={storm} alt="pieces" />
        <img src={water} alt="pieces" />
        <img src={fire} alt="pieces" />
        <img src={ice} alt="pieces" />
        <img src={wind} alt="pieces" />
        <img src={unknown} alt="pieces" />
        <img src={ice} alt="pieces" />
      </div>
      <div className="grid gird-cols-4 gap-4">
        <img src={eye_coin} alt="eye_coin" />
      </div>
    </div>
  )
}

export default ReadyPlayerTwo

