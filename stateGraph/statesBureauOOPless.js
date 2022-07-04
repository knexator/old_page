// Example: Bureaucratic Maze (http://www.logicmazes.com/bureau/map4.html)

let State = {}

State.isWon = function (state) {
  return state.position == 'Goal'
}

State.nextStates = function (state) {
  if (state.position == 'Goal') return {}
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
  raw_data[state.position][state.state].forEach(next => {
    res[next] = { state: state.position, position: next }
  })
  return res
}

State.id = function (state) {
  return `${state.state}:${state.position}`
}

State.initialState = { state: 'Start', position: 'HR' }
