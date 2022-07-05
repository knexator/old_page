//🐇,🕊️,🦇,🐸,🎩

/*
const initialResources = 'A,A,A,B,B,B'.split(',')
// Experiment 1: last thing controls the operation
// when last thing is the argument to the operation -> too much foresight
const rules = [
  // applied in order, top to bottom
  ['A,A', 'A,A,A'], // A: triplicate second argument
  ['A,B', 'B,B,B'],
  ['A,C', 'C,C,C'],
  ['A,D', 'D,D,D'],
  ['B,A', 'C'], // B: a<->c, b<->d
  ['B,B', 'D'],
  ['B,C', 'A'],
  ['B,D', 'B']
  // C: delete second (in code)
  // D: swap next two (in code)
].map(x => [x[0].split(','), x[1].split(',')])
// let targetGoal = 'D,C,B,A'.split(',')

// apply some rule over the top N elements of hatContents
// don't modify original array!
function waveWand (hatContents) {
  if (hatContents.length >= 3 && hatContents[0] == 'C') {
    let newHatContents = hatContents.slice(1)
    let e1 = newHatContents.shift()
    let e2 = newHatContents.shift()
    newHatContents.unshift(e1)
    return newHatContents
  }
  for (let k = 0; k < rules.length; k++) {
    const [condition, result] = rules[k]
    if (hatContents.length >= 3 && hatContents[0] == 'D') {
      let newHatContents = hatContents.slice(1)
      let e1 = newHatContents.shift()
      let e2 = newHatContents.shift()
      newHatContents.unshift(e1)
      newHatContents.unshift(e2)
      return newHatContents
    }
    if (checkCondition(hatContents, condition)) {
      let newHatContents = hatContents.slice(condition.length)
      newHatContents.unshift(...result)
      return newHatContents
    }
  }
  return false
}
*/

// experiment 2: only 3 types
const initialResources = 'A,A,A,B,B,B,C,C,C'.split(',')
const rules = [
  // applied in order, top to bottom
  ['A,A', 'A,A,A'], // A: triplicate second argument
  ['A,B', 'B,B,B'],
  ['A,C', 'C,C,C']
  // B: add missing piece (in code) - if 2 equal, delete both (or do something special?? triplicate?? idk)
  // C: swap next two (in code)
].map(x => [x[0].split(','), x[1].split(',')])
const targetGoal = 'A,B,C,D'.split(',')

// apply some rule over the top N elements of hatContents
// don't modify original array!
function waveWand (hatContents) {
  if (hatContents.length >= 3 && hatContents[0] == 'B') {
    let newHatContents = hatContents.slice(1)
    let e1 = newHatContents.shift()
    let e2 = newHatContents.shift()
    if (e1 == e2) return false
    ;['A', 'B', 'C'].forEach(letter => {
      if (e1 !== letter && e2 !== letter) {
        newHatContents.unshift(letter)
      }
    })
    return newHatContents
  }
  if (hatContents.length >= 3 && hatContents[0] == 'C') {
    let newHatContents = hatContents.slice(1)
    let e1 = newHatContents.shift()
    let e2 = newHatContents.shift()
    newHatContents.unshift(e1)
    newHatContents.unshift(e2)
    return newHatContents
  }
  for (let k = 0; k < rules.length; k++) {
    const [condition, result] = rules[k]
    if (checkCondition(hatContents, condition)) {
      let newHatContents = hatContents.slice(condition.length)
      newHatContents.unshift(...result)
      return newHatContents
    }
  }
  return false
}

function checkCondition (contents, condition) {
  if (contents.length < condition.length) return false
  for (let k = 0; k < condition.length; k++) {
    if (contents[k] !== condition[k]) {
      return false
    }
  }
  return true
}

State = {
  initialState: {
    resources: initialResources,
    hats: [
      {
        type: 'Hat',
        contents: []
      } // one empty hat
    ],
    shown: [] // stuff that has been taken out of the hat, can't no longer be used
  }
}

State.nextStates = function (state) {
  let result = {}

  state.hats.forEach((hat, hatIndex, hatsArray) => {
    let hatName = hatsArray.length > 1 ? ` (${hatIndex}${hat.type})` : ''

    switch (hat.type) {
      case 'Hat':
        if (hat.contents.length > 0) {
          // take last thing out
          let popState = State.copy(state)
          let removed = popState.hats[hatIndex].contents.shift()
          popState.shown.push(removed)
          popState.shown.sort()
          result[`+${removed}${hatName}`] = popState
        }
        // for each resource, put it into the hat
        new Set(state.resources).forEach(element => {
          let addState = State.copy(state)
          addState.resources.splice(addState.resources.indexOf(element), 1)
          addState.hats[hatIndex].contents.unshift(element)
          result[`-${element}${hatName}`] = addState
        })
        // apply a rule
        let newHatContents = waveWand(hat.contents)
        if (newHatContents !== false) {
          let wandState = State.copy(state)
          wandState.hats[hatIndex].contents = newHatContents
          result[`Wand${hatName}`] = wandState
        }
        break
      default:
        console.error('UNIMPLEMENTED HAT TYPE: ' + hat.type)
        break
    }
  })

  return result
}

State.id = function (state) {
  let resourcesID = state.resources.join(',')
  let hatsID = state.hats.map((hat, hatIndex, hatsArray) => {
    let hatName = hatsArray.length > 1 ? `${hatIndex}${hat.type}: ` : ''
    return `${hatName}[${hat.contents.slice().join(',')}]`
  })
  let shownID = state.shown.join(',')
  return [resourcesID, hatsID, shownID].join('\n')
}

State.textRepresentation = function (state) {
  return State.id(state)
  // let resourcesID = state.resources.join(',')
  // let shownID = state.shown.join(',')
  // return [resourcesID, shownID].join(';')
}

State.isWon = function (state) {
  return false
  // return state.hats.some(
  //   hat => JSON.stringify(hat.contents) == JSON.stringify(targetGoal)
  // )
}

State.fakeIsWon = function (state, goalString) {
  return state.hats.some(hat => JSON.stringify(hat.contents) == goalString)
}

State.copy = function (state) {
  return JSON.parse(JSON.stringify(state))
}
