
import { generateAllPaths, input, id, playFromState } from "./helper";
import { sort } from "fast-sort"
import * as genetics from "geneticalgorithm"
// import { GeneticAlgorithmConstructor } from "geneticalgorithm"
// console.log(genetics.default)
// genetics.GeneticAlgorithmConstructor
let GeneticAlgorithmConstructor = genetics.default;

import * as annealing from "simulated-annealing"
let simulatedAnnealing = annealing.default;

interface Disk {
    isTopOut: boolean[];
    isBotOut: boolean[];
}

interface HanoiRotState {
    holding: Disk | null
    poles: {
        contents: Disk[]
    }[];
}

function walkthroughToCoolestStateOfMagicTable(initialState: HanoiRotState): input[] | null {
    let paths = generateAllPaths<HanoiRotState>(
        initialState,
        nextStates,
        hanoiId
    );

    let any_valid = false;
    let coolest_state = sort(Object.values(paths)).asc(({ state, min_path_length }) => {
        if (state.holding !== null) return null;
        if (state.poles[0].contents.length !== 0) return null;
        if (state.poles[1].contents.length !== 0) return null;
        any_valid = true;
        return min_path_length;
    })[0];

    if (!any_valid) return null;

    let coolest_path: input[] = [];
    let curStateId = hanoiId(coolest_state.state);
    while (true) {
        let prevStateId = paths[curStateId].parent_id
        if (prevStateId !== null) {
            coolest_path.push(paths[curStateId].parent_input!);
            curStateId = prevStateId;
        } else {
            break;
        }
    }
    coolest_path.reverse();
    return coolest_path;
}

function canItemStackOnItem(itemHigh: Disk, itemLow: Disk) {
    for (let k = 0; k < itemHigh.isBotOut.length; k++) {
        if (itemHigh.isBotOut[k] && itemLow.isTopOut[k]) return false;
    }
    return true;
}

function nextStates(state: HanoiRotState): Record<input, HanoiRotState> {
    let result = {}
    if (state === undefined) {
        console.log("undefined state");
        return {}
    }
    if (state.holding === null) {
        state.poles.forEach((pole, poleIndex) => {
            if (pole.contents.length === 0) return;
            let newState = JSON.parse(JSON.stringify(state)) as HanoiRotState;
            newState.holding = newState.poles[poleIndex].contents.pop()!
            result[`pick-${poleIndex}`] = newState
        })
    } else {
        state.poles.forEach((pole, poleIndex) => {
            if (pole.contents.length === 0 || canItemStackOnItem(state.holding!, pole.contents.at(-1)!)) {
                let newState = JSON.parse(JSON.stringify(state)) as HanoiRotState;
                newState.poles[poleIndex].contents.push(newState.holding!)
                newState.holding = null;
                result[`drop-${poleIndex}`] = newState
            }
        });

        // rotate held disk
        /*let newRotState = JSON.parse(JSON.stringify(state)) as HanoiRotState;
        newRotState.holding = {
            isTopOut: Array.from(state.holding.isBotOut).reverse(),
            isBotOut: Array.from(state.holding.isTopOut).reverse(),
        }
        result["rot"] = newRotState;*/
    }

    return result
}

// function diskToAscii(disk: Disk): string {
//     let top_row = disk.isTopOut.map(b => b ? '^' : '-').join('');
//     let bot_row = disk.isBotOut.map(b => b ? 'v' : '-').join('');
//     return [top_row, bot_row].join("\n");
// }

function diskToAscii(disk: Disk): string {
    return `{${disk.isTopOut.map(b => b ? '1' : '0').join('')};${disk.isBotOut.map(b => b ? '1' : '0').join('')}}`
}

function hanoiId(state: HanoiRotState): id {
    // let holding_line = `holding:${state.holding === null ? " none" : `\n${diskToAscii(state.holding)}`}`;
    return state.poles
        .map((places, placesIndex) => {
            return `${placesIndex}: [${places.contents
                .map(diskToAscii)
                .join(', ')}]`
        })
        .join('\n') + `holding:${state.holding === null ? " none" : `\n${diskToAscii(state.holding)}`}`
    // return holding_line; -^v8
}

function isValidPole(pole: HanoiRotState["poles"][0]): boolean {
    for (let k = 0; k < pole.contents.length - 1; k++) {
        if (!canItemStackOnItem(pole.contents[k + 1], pole.contents[k])) {
            return false
        }
    }
    return true;
}

function makePoleValid(pole: HanoiRotState["poles"][0]): void {
    for (let disk = 0; disk < N_DISKS - 1; disk++) {
        for (let segment = 0; segment < N_SEGMENTS; segment++) {
            if (pole.contents[disk].isTopOut[segment] && pole.contents[disk + 1].isBotOut[segment]) {
                if (Math.random() < .5) {
                    pole.contents[disk].isTopOut[segment] = false;
                } else {
                    pole.contents[disk + 1].isBotOut[segment] = false;
                }
            }
        }
    }
}

const N_DISKS = 5;
const N_POLES = 3;
const N_SEGMENTS = N_DISKS;

let mainState: HanoiRotState = {
    holding: null,
    poles: []
}


for (let k = 0; k < N_POLES; k++) {
    mainState.poles.push({ contents: [] })
}

for (let k = 0; k < N_DISKS; k++) {
    mainState.poles[0].contents.push({
        isTopOut: new Array(N_SEGMENTS).fill(false),
        isBotOut: new Array(N_SEGMENTS).fill(false),
    })
}

function makeRandomState(): HanoiRotState {
    let result: HanoiRotState = {
        holding: null,
        poles: []
    }

    for (let k = 0; k < N_POLES; k++) {
        result.poles.push({ contents: [] })
    }

    for (let k = 0; k < N_DISKS; k++) {
        let cur_disk: Disk = {
            isTopOut: [],
            isBotOut: [],
        }
        for (let s = 0; s < N_SEGMENTS; s++) {
            cur_disk.isTopOut.push(Math.random() < .5);
            cur_disk.isBotOut.push(Math.random() < .5);
        }
        result.poles[0].contents.push(cur_disk);
    }

    makePoleValid(result.poles[0]);

    return result;
}

let button_div = document.getElementById("buttons")!;
let button_elements: {
    top: HTMLInputElement[],
    bot: HTMLInputElement[],
}[] = [];

for (let disk = 0; disk < N_DISKS; disk++) {
    let cur_top_row = document.createElement("div");
    let cur_bot_row = document.createElement("div");

    let cur_top_buttons: HTMLInputElement[] = [];
    let cur_bot_buttons: HTMLInputElement[] = [];
    for (let segment = 0; segment < N_SEGMENTS; segment++) {
        let cur_button_top = document.createElement("input");
        cur_button_top.type = "checkbox";
        cur_button_top.checked = mainState.poles[0].contents[N_DISKS - disk - 1].isTopOut[segment];
        cur_button_top.addEventListener("change", (ev) => {
            mainState.poles[0].contents[N_DISKS - disk - 1].isTopOut[segment] = cur_button_top.checked;
            recalcScore();
        })
        cur_top_row.appendChild(cur_button_top);
        cur_top_buttons.push(cur_button_top);

        let cur_button_bot = document.createElement("input");
        cur_button_bot.type = "checkbox";
        cur_button_bot.checked = mainState.poles[0].contents[N_DISKS - disk - 1].isBotOut[segment];
        cur_button_bot.addEventListener("change", (ev) => {
            mainState.poles[0].contents[N_DISKS - disk - 1].isBotOut[segment] = cur_button_bot.checked;
            recalcScore();
        })
        cur_bot_row.appendChild(cur_button_bot);
        cur_bot_buttons.push(cur_button_bot);
    }

    button_elements.push({
        top: cur_top_buttons,
        bot: cur_bot_buttons,
    })

    let cur_disk = document.createElement("div");
    cur_disk.appendChild(cur_top_row)
    cur_disk.appendChild(cur_bot_row)
    cur_disk.appendChild(document.createElement("br"))

    button_div.appendChild(cur_disk);
}

let result_div = document.getElementById("result")!;
function recalcScore() {
    if (isValidPole(mainState.poles[0])) {
        let stuff = walkthroughToCoolestStateOfMagicTable(mainState);
        if (stuff === null) {
            result_div.innerText = "no solution";
        } else {
            result_div.innerText = `${stuff.length.toString()}: ${stuff.join(" ; ")}`
        }
    } else {
        result_div.innerText = "unvalid starting state";
    }
}

function mutateState(state: HanoiRotState): HanoiRotState {
    let newState = JSON.parse(JSON.stringify(state)) as HanoiRotState;
    let rand_disk = Math.floor(Math.random() * N_DISKS);
    let rand_segment = Math.floor(Math.random() * N_SEGMENTS);
    if (Math.random() < .5) {
        newState.poles[0].contents[rand_disk].isTopOut[rand_segment] = !newState.poles[0].contents[rand_disk].isTopOut[rand_segment];
        if (rand_disk < N_DISKS - 1 && newState.poles[0].contents[rand_disk].isTopOut[rand_segment]) {
            newState.poles[0].contents[rand_disk + 1].isBotOut[rand_segment] = false
        }
    } else {
        newState.poles[0].contents[rand_disk].isBotOut[rand_segment] = !newState.poles[0].contents[rand_disk].isBotOut[rand_segment];
        if (rand_disk > 0 && newState.poles[0].contents[rand_disk].isBotOut[rand_segment]) {
            newState.poles[0].contents[rand_disk - 1].isTopOut[rand_segment] = false
        }
    }
    return newState;
}

let geneticalgorithm = GeneticAlgorithmConstructor({
    mutationFunction: mutateState,
    crossoverFunction: (parent_1: HanoiRotState, parent_2: HanoiRotState): [HanoiRotState, HanoiRotState] => {
        let child_1 = JSON.parse(JSON.stringify(parent_1)) as HanoiRotState;
        let child_2 = JSON.parse(JSON.stringify(parent_2)) as HanoiRotState;
        for (let disk = 0; disk < N_DISKS; disk++) {
            for (let segment = 0; segment < N_SEGMENTS; segment++) {
                // change?
                if (Math.random() < .5) {
                    // top?
                    if (Math.random() < .5) {
                        child_1.poles[0].contents[disk].isTopOut[segment] = parent_2.poles[0].contents[disk].isTopOut[segment];
                        child_2.poles[0].contents[disk].isTopOut[segment] = parent_1.poles[0].contents[disk].isTopOut[segment];
                    } else {
                        child_1.poles[0].contents[disk].isBotOut[segment] = parent_2.poles[0].contents[disk].isBotOut[segment];
                        child_2.poles[0].contents[disk].isBotOut[segment] = parent_1.poles[0].contents[disk].isBotOut[segment];
                    }
                }
            }
        }
        makePoleValid(child_1.poles[0]);
        makePoleValid(child_2.poles[0]);
        return [child_1, child_2];
    },
    fitnessFunction: (state: HanoiRotState): number => {
        // Higher is better, lower is worse
        if (isValidPole(state.poles[0])) {
            let solution = walkthroughToCoolestStateOfMagicTable(state);
            if (solution !== null) {
                return solution.length; // + 0 * solution.filter(x => x === "rot").length;
            }
            return 5;
        } else {
            return 0;
        }

    },
    // doesABeatBFunction: yourCompetitionFunction,
    population: Array(20).fill(null).map(() => makeRandomState()),
    // populationSize: aDecimalNumberGreaterThanZero 	// defaults to 100
})

let evolve_button = document.getElementById("evolve")!;
/*
evolve_button.addEventListener("click", (ev) => {
    geneticalgorithm.evolve();
    mainState = geneticalgorithm.best();
    for (let disk = 0; disk < N_DISKS; disk++) {
        for (let segment = 0; segment < N_SEGMENTS; segment++) {
            button_elements[disk].top[segment].checked = mainState.poles[0].contents[N_DISKS - disk - 1].isTopOut[segment];
            button_elements[disk].bot[segment].checked = mainState.poles[0].contents[N_DISKS - disk - 1].isBotOut[segment];
        }
    }
    recalcScore();
})
*/

evolve_button.addEventListener("click", (ev) => {
    mainState = simulatedAnnealing({
        initialState: mainState,
        tempMax: 15,
        tempMin: 0.001,
        newState: mutateState,
        getTemp: (temp: number) => temp - .01,
        getEnergy: (state: HanoiRotState): number => {
            // lower is better
            if (isValidPole(state.poles[0])) {
                let solution = walkthroughToCoolestStateOfMagicTable(state);
                if (solution !== null) {
                    return -solution.length; // + 0 * solution.filter(x => x === "rot").length;
                }
                return 5;
            } else {
                return 20;
            }
        },
    });
    for (let disk = 0; disk < N_DISKS; disk++) {
        for (let segment = 0; segment < N_SEGMENTS; segment++) {
            button_elements[disk].top[segment].checked = mainState.poles[0].contents[N_DISKS - disk - 1].isTopOut[segment];
            button_elements[disk].bot[segment].checked = mainState.poles[0].contents[N_DISKS - disk - 1].isBotOut[segment];
        }
    }
    recalcScore();
})


let play_button = document.getElementById("play")!;
play_button.addEventListener("click", (ev) => {
    playFromState<HanoiRotState>(
        mainState,
        nextStates,
        hanoiId
    );
});
