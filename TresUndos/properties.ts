export type Inmunity = number;
export type UndoHistory = Array<number>;



/*
we assume that undo is added to undoHistory, & then the frame is processed

Value - undo - Value - undo - Value
                ^lastValue     ^nextValue
*/
interface IProperty<Type> {
  //getCurVal : () => Type
  undoHistory?: UndoHistory // implicitly tracks how many times has the property changed
  inmunity?: IProperty<Inmunity> // what level of inmunity to undo does this property have?
  readonly prevValue: Type       // what was the property's value last frame?
  nextValue: Type | undefined    // what will be the property's value next frame, accounting for undos?
}

export class StaticProperty<Type> implements IProperty<Type> {
  value: Type

  constructor(initialValue: Type) {
    this.value = initialValue
  }

  get prevValue() {
    return this.value;
  }

  get nextValue() {
    return this.value;
  }

  set nextValue(_value) {
    throw new Error("Trying to update a StaticProperty")
  }
}

export class DenseProperty<Type> implements IProperty<Type> {
  valueHistory: Array<Type>
  inmunity: IProperty<Inmunity>
  undoHistory: UndoHistory;

  constructor(initialValue: Type, inmunity: IProperty<Inmunity>, undoHistory: UndoHistory) {
    this.valueHistory = [initialValue]
    this.inmunity = inmunity
    this.undoHistory = undoHistory
  }

  // TODO: error checking could be useful
  get prevValue() {
    let val = this.valueHistory[this.undoHistory.length - 1];
    if (val !== undefined) return val
    throw new Error("prevValue is undefined; it's probably not being updated in the neutral turn")
  }

  get nextValue() {
    let val = this.valueHistory[this.undoHistory.length];
    if (val === undefined) {
      let lastUndo = last(this.undoHistory);
      if (lastUndo === undefined) return undefined // special case: first move
      let prevInmunity = this.inmunity.prevValue
      if (lastUndo > prevInmunity) {
        let original_tick = get_original_tick(this.undoHistory.length, prevInmunity, this.undoHistory)
        return this.valueHistory[original_tick]
      } else {
        return undefined
      }
    } else {
      return val
    }
  }

  set nextValue(value) {
    if (value !== undefined) this.valueHistory[this.undoHistory.length] = value
  }

  /*set prevValue(_value) {
    throw new Error("Trying to update the prevValue")
  }*/
}

function get_original_tick(tick: number, max_inmune_to: number, true_timeline_undos: UndoHistory) {
  // for an object inmune to max_inmune levels of time travel,
  // when the real time is "tick", get the last real tick where
  // their free will was executed. Without time travel, it would
  // always be cur_tick itself; in Braid, for green objects, which
  // have max_inmune = 1, it will always be cur_tick (if there hasn't
  // been a "real undo") (or level 2, at least)

  if (tick <= 0) {
    // console.log("that's before time!");
    return tick
  } else if (tick > true_timeline_undos.length) {
    // console.log("that's the far future!")
    return tick
  } else if (true_timeline_undos[tick - 1] <= max_inmune_to) {
    // console.log("that's a good-ol-regular tick.")
    return tick
  } else {
    let travel_depth = true_timeline_undos[tick - 1]
    let counter = 1
    let res = tick - 1
    while (counter > 0 && res > 0) {
      let cur_depth = true_timeline_undos[res - 1]
      if (cur_depth == travel_depth) {
        counter += 1
        res -= 1
      } else if (cur_depth < travel_depth) {
        counter -= 1
        res -= 1
      } else {
        // higher level travel over here!
        res = get_original_tick(res, max_inmune_to, true_timeline_undos)
      }
    }
    // console.log("time traveling to: ", res)
    return res
  }
}

function get_original_tick_2(tick: number, max_inmune_to: IProperty<Inmunity>, true_timeline_undos: UndoHistory) {
  return get_original_tick(tick, max_inmune_to.prevValue, true_timeline_undos)
}

function last<T>(arr: Array<T>): T | undefined {
  if (arr.length > 0) {
    return arr[arr.length - 1]
  } else {
    return undefined
  }
}
