// Example: Bureaucratic Maze (http://www.logicmazes.com/bureau/map4.html)

class State {
  constructor (state, position) {
    this.state = state
    this.position = position
  }

  isWon () {
    return this.position == 'Goal'
  }

  nextStates () {
    if (this.position == 'Goal') return {}
    let raw_data = {
      HR: {
        // position
        Start: ['M', 'CC'], // state
        M: ['IM', 'CC'],
        IM: ['Goal'],
        CC: ['IM', 'M']
      },
      M: {
        HR: ['IM'],
        IM: ['HR'],
        CC: ['CC', 'HR', 'IM']
      },
      CC: {
        HR: ['M'],
        IM: ['HR', 'M'],
        M: ['HR', 'IM']
      },
      IM: {
        HR: ['M', 'CC'],
        M: ['M', 'CC'],
        CC: ['HR', 'M']
      }
    }

    let res = {}
    raw_data[this.position][this.state].forEach(next => {
      res[next] = new State(this.position, next)
    })
    return res
  }

  id () {
    return `${this.state}:${this.position}`
  }
}

var initialState = new State('Start', 'HR')
