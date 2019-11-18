import React from 'react';
import _ from 'lodash';

import logo from './logo.svg';
import './App.css';

const neighbours = [
  [-1,-1],[-1,0],[-1,1],
  [0,-1],        [0,1],
  [1,-1], [1,0], [1,1]
];

function getColor(cell) {
  switch(cell) {
    case -1:
      return "pink";
    case 1:
      return "#aaa";
    default:
      return undefined;
  }
}

function initGrid(size) {
  return _.times(size, r => _.times(size, _.constant(0)))
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
      generation: 0
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

  purgeCells = (grid) => {
    _.each(grid, (row, rowIdx) => {
      _.each(grid[rowIdx], (col, colIdx) => {
        if (grid[rowIdx][colIdx] === -1) {
          grid = this.setCell(grid, rowIdx, colIdx, 0, false);
        }
      })
    })
    return grid;
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
            newGrid = this.setCell(newGrid, rowIdx, colIdx, -1, false);
          }
        } else if (liveNeighbours === 3) {
          // a dead cell with 3 neighbours comes to life
          newGrid = this.setCell(newGrid, rowIdx, colIdx, 1, false);
        }
      });
    });

    // clear cells scheduled for deletion
    newGrid = this.purgeCells(newGrid);
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
    // console.log("toggling", y, x)
    const newGrid = [
      ..._.slice(grid, 0, y),
      [
        ..._.slice(grid[y], 0, x),
        value,
        ..._.slice(grid[y], x + 1)
      ],
      ..._.slice(grid, y + 1)
    ];
    // console.log(newGrid)
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

  renderButton = () => {
    const { running } = this.state;
    return (
      <button
        onClick={!running ? this.startSimulation : this.stopSimulation}
      >
        {running ? "Stop" : "Run"}
      </button>
    )
  }

  renderStep = () => {
    return (
      <button
        onClick={this.stepForward}
      >
        Step
      </button>
    )
  }

  render () {
    const { generation, running, grid } = this.state;

    // build the grid
    let timer;

    return (
      <div className="App">
        <div>
          {this.renderButton()}
          {this.renderStep()}
          <button
            onClick={this.reset}
          >
            Reset
          </button>
          <p>
            Generation {generation}
          </p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          width: `${size * 20}px`
        }}>
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
                  backgroundColor: getColor(grid[rowIdx][colIdx])
                }}
              >
                {grid[rowIdx][colIdx]}
              </div>
            )
            )))}
        </div>
      </div>
    );
  }
}

export default App;
