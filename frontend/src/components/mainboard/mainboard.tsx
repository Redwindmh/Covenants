import { useRef } from "react";
import { storm } from "../../assets/images/pieces/index.ts"

// ts-nocheck Create catch to prevent user from placing pieces outside of designated areas on board an maybe stacjing on same spot? Or, maybe add some special feature for when pieces are stacked?

const MainBoard = () => {
  const matrixSize: number[] = [16, 16];
  const matrix: number[] = [];
  for (let i = 0; i < matrixSize[0]; i++) { matrix.push(i) }

  const dragOverItem: any = useRef()

  const dragOver = (e: any & { currentTarget: HTMLDivElement }) => {
    e.stopPropagation()
    e.preventDefault()
    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)"
    console.log(`Dragging over ${e.currentTarget.id}`)
    dragOverItem.current = e.currentTarget.id
  }

  const dragLeave = (e: any & { currentTarget: HTMLDivElement }) => {
    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0)"
    console.log(`Dragging over ${e.currentTarget.id}`)
    dragOverItem.current = e.currentTarget.id
  }

  const drop = (e: any & { currentTarget: HTMLDivElement }) => {
    e.stopPropagation()
    e.preventDefault()
    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0)"
    console.log(storm)
    let droppedPiece: HTMLImageElement = document.createElement("img")
    droppedPiece.src = storm
    e.currentTarget.append(droppedPiece)
    console.log(`You have dropped ${matrix} on ${e.currentTarget.id}`)
  }

  return (
    <>
      <div className="w-3/7">
        <h1 className="text-red-500">Covenants</h1>
        <div className="h-fit w-[600px] board-matrix">
          {matrix.map((row) => {
            return (
              <div className="flex h-[38px] w-auto matrix-row">{
                matrix.map((matrixDiv) => {
                  return (<div className="w-full h-auto text-white block" id={`${matrixDiv},${row}`} onDragOver={(e) => dragOver(e)} onDragLeave={(e) => dragLeave(e)} onDrop={(e) => { drop(e) }}></div>)
                })
              }</div>
            )
          })}
        </div>
      </div>
      <div className="absolute bg-gray-200 top-[70%] left-[32%] game-message">Player 1 has added fire to the flame</div>
    </>
  );
}

export default MainBoard
