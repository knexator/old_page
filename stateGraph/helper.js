/*interface State {
    id: string
}

type Bear = State & {
    honey: boolean
}

function nextStates<T extends {id: string }>(state: T): {[input: string]: T;} {
    return {
        "left": {
            id: "asdf",
        } as T,
    }
}

function solve<T extends State>(
    initState: T,
    nextStates: (state: T) => {[input: string]: T;},
    isWon: (state: T) => boolean,
): string[] | null {

    // etc

    return null;
}*/
// const Denque = require("denque");
import Denque from "denque";
// function solve<State, id extends keyof any, input extends keyof any>(
// function solve<State, id extends string, input extends string>(
export function solve(initialState, getNextStates, isWon, getId) {
    let pending = new Denque();
    let touchedIds = new Set();
    let reverseMap = {};
    let reverseInputsMap = {};
    pending.push(initialState);
    touchedIds.add(getId(initialState));
    while (!pending.isEmpty()) { // && touchedIds.size < limit
        let curState = pending.shift();
        if (isWon(curState)) {
            console.log("won!");
            let curStateId = getId(curState);
            let inputSequence = [];
            while (true) {
                let prevStateId = reverseMap[curStateId];
                if (prevStateId !== undefined) {
                    inputSequence.push(reverseInputsMap[curStateId]);
                    curStateId = prevStateId;
                }
                else {
                    break;
                }
            }
            inputSequence.reverse();
            return inputSequence;
        }
        let stateId = getId(curState);
        let nextStates = getNextStates(curState);
        for (const [cur_input, cur_nextState] of Object.entries(nextStates)) {
            // for (let cur_input in nextStates) {
            // let cur_nextState = nextStates[cur_input]
            let nextStateId = getId(cur_nextState);
            if (touchedIds.has(nextStateId))
                continue;
            touchedIds.add(nextStateId);
            pending.push(cur_nextState);
            reverseMap[nextStateId] = stateId;
            reverseInputsMap[nextStateId] = cur_input;
        }
    }
    return null;
}
export function generateAllPaths(initialState, getNextStates, getId) {
    let result = {};
    result[getId(initialState)] = {
        parent_id: null,
        parent_input: null,
        min_path_length: 0,
        state: initialState,
        // num_paths: 1,
    };
    let pending = new Denque();
    // let touchedIds = new Set<id>();
    // let reverseMap:       Record<id, id> = {};
    // let reverseInputsMap: Record<id, input> = {};
    pending.push(initialState);
    // touchedIds.add(getId(initialState));
    while (!pending.isEmpty()) { // && touchedIds.size < limit
        let curState = pending.shift();
        let stateId = getId(curState);
        let curResult = result[stateId];
        let nextStates = getNextStates(curState);
        for (const [cur_input, cur_nextState] of Object.entries(nextStates)) {
            // for (let cur_input in nextStates) {
            // let cur_nextState = nextStates[cur_input]
            let nextStateId = getId(cur_nextState);
            if (nextStateId in result) {
                if (curResult.min_path_length + 1 < result[nextStateId].min_path_length) {
                    result[nextStateId] = {
                        parent_id: stateId,
                        parent_input: cur_input,
                        min_path_length: curResult.min_path_length + 1,
                        state: cur_nextState,
                        // num_paths: curResult.num_paths,
                    };
                }
            }
            else {
                result[nextStateId] = {
                    parent_id: stateId,
                    parent_input: cur_input,
                    min_path_length: curResult.min_path_length + 1,
                    state: cur_nextState,
                    // num_paths: curResult.num_paths,
                };
                pending.push(cur_nextState);
            }
        }
    }
    return result;
}
export function playFromState(initialState, getNextStates, getId) {
    let cur_state = initialState;
    let quit = false;
    while (!quit) {
        let nextStates = getNextStates(cur_state);
        let options = Object.keys(nextStates);
        let valid_choice = false;
        let choice;
        while (!valid_choice) {
            choice = window.prompt(`Current state: ${getId(cur_state)}\nOptions:\n${options.join("\n")}\nor cancel to quit`);
            valid_choice = (choice === null) || options.includes(choice);
        }
        if (choice === null) {
            quit = true;
        }
        else {
            cur_state = nextStates[choice];
        }
    }
}
