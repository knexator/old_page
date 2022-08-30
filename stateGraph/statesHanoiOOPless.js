State = {
  initialState: {
    places: [
      /*{
        type: 'hand',
        contents: []
      },
      {
        type: 'hand',
        contents: []
      },*/
      {
        type: 'pole',
        contents: [
          {
            type: 'disk',
            size: 5
          },
          {
            type: 'disk',
            size: 4
          },
          {
            type: 'disk',
            size: 3
          },
          {
            type: 'disk',
            size: 2
          },
          {
            type: 'disk',
            size: 1
          }
        ]
      },
      {
        type: 'pole',
        contents: []
      },
      {
        type: 'pole',
        contents: []
      }
    ]
  }
}

// // hands, poles, disks
// function canMoveTopItem (fromPlace, toPlace) {
//   // idk a good way to do this, lol

//   if (fromPlace.contents.length === 0) return false // nothing to move
//   if (fromPlace.type !== 'hand' && toPlace.type !== 'hand') return false
//   if (toPlace.contents.length === 0) return true

//   // if (toPlace.type === "hand") return toPlace.contents.length === 0

//   // if

//   // if (fromPlace.type === "hand") return true
//   // if (fromPlace.type !== 'pole' || toPlace.type !== 'pole') {
//   // throw new Error('unimplemented')
//   // }

//   return fromPlace.contents.at(-1).size < toPlace.contents.at(-1).size

//   /*switch (place.type) {
//     // case "hand":

//     case "pole":

//       break;

//     default:
//       break;
//   }

//   if (place.contents.length === 0) {
//     return
//   }
//   let topItem = place.contents.at(-1)
//   switch (item.type) {
//     case value:
//       break

//     default:
//       break
//   }*/
// }

function canItemStackOnPlace (item, place) {
  if (item.type !== 'disk') {
    throw new Error('unimplemented')
  }

  if (place.type === 'pole') return true
  if (place.type === 'even_pole') return item.size % 2 === 0
}

function canItemStackOnItem (itemHigh, itemLow) {
  if (itemHigh.type !== 'disk' || itemLow.type !== 'disk') {
    throw new Error('unimplemented')
  }
  // return itemHigh.size < itemLow.size

  // magicTable[j][i] == can item i sit on item j?
  const magicTable = [
    [0, 0, 1, 1, 0],
    [1, 0, 0, 1, 0],
    [0, 1, 0, 0, 1],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0]
  ]

  // standard
  // const magicTable = [
  //   [0, 0, 0, 0, 0],
  //   [1, 0, 0, 0, 0],
  //   [1, 1, 0, 0, 0],
  //   [1, 1, 1, 0, 0],
  //   [1, 1, 1, 1, 0]
  // ]

  return magicTable[itemLow.size - 1][itemHigh.size - 1] === 1
}

function itemName (item) {
  switch (item.type) {
    case 'disk':
      return `Disk-${item.size}`
      break
    default:
      return JSON.stringify(item)
      break
  }
}

State.nextStates = function (state) {
  let result = {}
  state.places.forEach((from, fromIndex) => {
    state.places.forEach((to, toIndex) => {
      if (to === from) return
      // simplest version
      if (from.contents.length === 0) return
      let valid = false
      if (to.contents.length === 0) {
        valid = canItemStackOnPlace(from.contents.at(-1), to)
      } else {
        valid = canItemStackOnItem(from.contents.at(-1), to.contents.at(-1))
      }
      if (valid) {
        let newState = State.copy(state)
        newState.places[toIndex].contents.push(
          newState.places[fromIndex].contents.pop()
        )
        result[`${fromIndex}->${toIndex}`] = newState
      }

      // middle version
      /*if (canMoveTopItem(from, to)) {
        let newState = State.copy(state)
        newState.places[toIndex].contents.push(
          newState.places[fromIndex].contents.pop()
        )
        result[`${fromIndex}->${toIndex}`] = newState
      }*/
    })
  })
  return result
}

State.id = function (state) {
  return state.places
    .map((places, placesIndex) => {
      return `${placesIndex}.${places.type}: [${places.contents
        .map(itemName)
        .join(', ')}]`
    })
    .join('\n')
}

// used when searching for the coolest state
State.fakeId = function (state) {
  return State.id(state)
  /*let hatsID = state.hats.map((hat, hatIndex, hatsArray) => {
    let hatName = hatsArray.length > 1 ? `${hatIndex}${hat.type}: ` : ''
    return `${hatName}[${hat.contents.slice().join(',')}]`
  })
  return hatsID*/
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
  return false
  // return state.hats.some(hat => JSON.stringify(hat.contents) == goalString)
}

State.copy = function (state) {
  return JSON.parse(JSON.stringify(state))
}
