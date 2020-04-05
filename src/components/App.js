import React from 'react';
import _ from 'lodash';

import './App.css';

const neighbours = [
  [-1,-1],[-1,0],[-1,1],
  [0,-1],        [0,1],
  [1,-1], [1,0], [1,1]
];

function getColor(cell, xRay = false) {
  switch(cell) {
    case -1:
      return "pink";
    case 1:
      return xRay ? "#aaa" : "#333";
    default:
      return undefined;
  }
}

function initGrid(size) {
  return _.times(size, r => _.times(size, _.constant(0)))
}

function getCellAtMousePos (ev) {
  if (!ev) return null;

  const id = ev.target.getAttribute("data-id");
  const coords = id.split("-").map(v => parseInt(v, 10));
  if (coords.length !== 2) return null;
  return { x: coords[1], y: coords[0] };
}

const size = 40;
const cols = size;
const rows = size;

class App extends React.Component {
  constructor (...args) {
    super(...args);

    this.state = {
      grid: initGrid(size),
      running: false,
      xRay: false,
      generation: 0,
      drawingAt: null
    }

    this.timer = null;
  }

  countNeighbours = (grid, y, x) => {
    return _.reduce(neighbours, (acc, neigh) => {
      const neighY = y + neigh[0];
      const neighX = x + neigh[1];
      if (neighY < 0 || neighX < 0 || neighX >= cols || neighY >= rows ) {
        // out of boundary. return
        return acc;
      }
      // console.log(y,x, neighY, neighX);
      return acc + (grid[neighY][neighX] ? 1 : 0);
    }, 0);
  }

  runSimulation = (single = false) => {
    const { grid, generation, running } = this.state;
    if (!single && running && !this.timer) return;  // we have been stopped

    let newGrid = _.cloneDeep(grid);
    // play a round
    _.each(newGrid, (row, rowIdx) => {
      _.each(newGrid[rowIdx], (col, colIdx) => {
        const liveNeighbours = this.countNeighbours(grid, rowIdx, colIdx);
        const cell = grid[rowIdx][colIdx];

        if (cell) {
          // a live cell with less than 2 neighbours or more than 3 dies
          if (liveNeighbours < 2 || liveNeighbours > 3) {
            newGrid = this.setCell(newGrid, rowIdx, colIdx, 0, false);
          }
        } else if (liveNeighbours === 3) {
          // a dead cell with 3 neighbours comes to life
          newGrid = this.setCell(newGrid, rowIdx, colIdx, 1, false);
        }
      });
    });

    this.setState({
      grid: newGrid,
      generation: generation + 1
    });
    if (!single) {
      this.timer = setTimeout(this.runSimulation, 100);
    }
  }

  startSimulation = () => {
    const { running } = this.state;

    if (running) return;
    this.setState({ running: true });
    this.runSimulation();
  }

  stopSimulation = () => {
    this.setState({ running: false });
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = null;
  }

  stepForward = () => {
    this.runSimulation(true);
  }

  reset = () => {
    this.stopSimulation();
    this.setState({
      grid: initGrid(size),
      generation: 0
    })
  }

  setCell = (grid, y, x, value, setState = true) => {
    const newGrid = [
      ..._.slice(grid, 0, y),
      [
        ..._.slice(grid[y], 0, x),
        value,
        ..._.slice(grid[y], x + 1)
      ],
      ..._.slice(grid, y + 1)
    ];
    if (setState) {
      this.setState({ grid: newGrid });
    }
    return newGrid;
  }

  toggleCell = (y, x, setState = true) => {
    const { grid } = this.state;
    const cell = grid[y][x];
    this.setCell(grid, y, x, cell ? 0 : 1)
  }

  toggleXRay = () => this.setState({ xRay: !this.state.xRay })

  startDrawing = (ev) => {
    ev.preventDefault();
    this.setState({ drawingAt: getCellAtMousePos(ev) });
  }

  stopDrawing = (ev) => {
    ev.preventDefault();
    this.setState({ drawingAt: null });
  }

  maybeDraw = (ev) => {
    ev.preventDefault();
    const { drawingAt } = this.state;

    const cell = getCellAtMousePos(ev);
    if (!drawingAt || !cell) return;

    // if we're still inside the same cell, ignore the event (to avoid toggle/untoggle while moving the mouse inside of a cell)
    if (drawingAt.x === cell.x && drawingAt.y === cell.y) return;

    // cell has changed: record the cell position and toggle the cell state
    this.setState({ drawingAt: cell });
    this.toggleCell(cell.y, cell.x);
  }

  render () {
    const { generation, running, xRay, grid } = this.state;
    return (
      <div className="App">
        <div className="App-actions">
          <button onClick={!running ? this.startSimulation : this.stopSimulation}>
            {running ? "Stop" : "Run"}
          </button>
          <button onClick={this.stepForward}>Step</button>
          <button onClick={this.reset}>Reset</button>
          <label>
            <input
              type="checkbox"
              value="xray"
              checked={xRay}
              onChange={this.toggleXRay}
            />X-Ray
          </label>
          <p>
            Generation {generation}
          </p>
        </div>
        <div
          style={{
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${size * 22}px`
          }}
          onMouseDown={this.startDrawing}
          onMouseMove={this.maybeDraw}
          onMouseUp={this.stopDrawing}
        >
          {grid.map((row, rowIdx) => (
            row.map((col, colIdx) => (
              <div
                onClick={() => this.toggleCell(rowIdx, colIdx) }
                key={`${rowIdx}-${colIdx}`}
                data-id={`${rowIdx}-${colIdx}`}
                style={{
                  width: 20,
                  height: 20,
                  border: "1px solid #333",
                  backgroundColor: getColor(grid[rowIdx][colIdx], xRay)
                }}
                >
                {xRay ? grid[rowIdx][colIdx] : ""}
              </div>
            )
            )))}
        </div>
      </div>
    );
  }
}

export default App;
