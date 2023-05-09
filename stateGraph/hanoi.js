import { generateAllPaths } from "./helper";
import { sort } from "fast-sort";
import * as genetics from "geneticalgorithm";
let GeneticAlgorithmConstructor = genetics.default;
import * as annealing from "simulated-annealing";
let simulatedAnnealing = annealing.default;
function walkthroughToCoolestStateOfMagicTable(localTable) {
    let paths = generateAllPaths({
        poles: [
            {
                contents: [5, 4, 3, 2, 1],
            },
            { contents: [], }, { contents: [], }
        ]
    }, (state) => nextStates(state, localTable), hanoiId);
    let coolest_state = sort(Object.values(paths)).asc(({ state, min_path_length }) => {
        if (state.poles[2].contents.length !== 5)
            return null;
        return min_path_length;
    })[0];
    let coolest_path = [];
    let curStateId = hanoiId(coolest_state.state);
    while (true) {
        let prevStateId = paths[curStateId].parent_id;
        if (prevStateId !== null) {
            coolest_path.push(paths[curStateId].parent_input);
            curStateId = prevStateId;
        }
        else {
            break;
        }
    }
    coolest_path.reverse();
    return coolest_path;
}
function canItemStackOnItem(itemHigh, itemLow, dataTable) {
    // magicTable[j][i] == can item i sit on item j?
    // standard
    // const magicTable = [
    //   [0, 0, 0, 0, 0],
    //   [1, 0, 0, 0, 0],
    //   [1, 1, 0, 0, 0],
    //   [1, 1, 1, 0, 0],
    //   [1, 1, 1, 1, 0]
    // ]
    return dataTable[itemLow - 1][itemHigh - 1] === 1;
}
function nextStates(state, thingyTable) {
    let result = {};
    // if (magicTable === undefined) {
    //   magicTable = [
    //     [0, 0, 1, 1, 0],
    //     [1, 0, 0, 1, 0],
    //     [0, 1, 0, 0, 1],
    //     [0, 0, 1, 0, 0],
    //     [0, 1, 0, 1, 0]
    //   ]
    // }
    state.poles.forEach((from, fromIndex) => {
        state.poles.forEach((to, toIndex) => {
            if (to === from)
                return;
            // simplest version
            if (from.contents.length === 0)
                return;
            let valid = false;
            if (to.contents.length === 0) {
                valid = true;
            }
            else {
                valid = canItemStackOnItem(from.contents.at(-1), to.contents.at(-1), thingyTable);
            }
            if (valid) {
                let newState = JSON.parse(JSON.stringify(state));
                newState.poles[toIndex].contents.push(newState.poles[fromIndex].contents.pop());
                result[`${fromIndex}->${toIndex}`] = newState;
            }
        });
    });
    return result;
}
function hanoiId(state) {
    return state.poles
        .map((places, placesIndex) => {
        return `${placesIndex}: [${places.contents
            .map(x => x.toString())
            .join(', ')}]`;
    })
        .join('\n');
}
// console.log("the thing: ", walkthroughToCoolestStateOfMagicTable([
//   [0, 0, 0, 0, 0],
//   [1, 0, 0, 0, 0],
//   [1, 1, 0, 0, 0],
//   [1, 1, 1, 0, 0],
//   [1, 1, 1, 1, 0]
// ]))
// magicTable[j][i] == can item i sit on item j?
let N_DISKS = 5;
// standard
let magicTable = [
    [0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 0, 0, 0],
    [1, 1, 1, 0, 0],
    [1, 1, 1, 1, 0],
];
let button_div = document.getElementById("buttons");
let button_elements = [];
for (let row = 0; row < N_DISKS; row++) {
    let cur_row = document.createElement("div");
    let cur_row_buttons = [];
    for (let col = 0; col < N_DISKS; col++) {
        let cur_button = document.createElement("input");
        // Assigning the attributes
        // to created checkbox
        cur_button.type = "checkbox";
        cur_button.checked = magicTable[row][col] === 1;
        cur_button.id = `${col}_${row}`;
        cur_button.addEventListener("change", (ev) => {
            magicTable[row][col] = cur_button.checked ? 1 : 0;
            recalcScore();
        });
        cur_row.appendChild(cur_button);
        cur_row_buttons.push(cur_button);
    }
    button_div.appendChild(cur_row);
    button_elements.push(cur_row_buttons);
}
let result_div = document.getElementById("result");
function recalcScore() {
    let stuff = walkthroughToCoolestStateOfMagicTable(magicTable);
    result_div.innerText = `${stuff.length.toString()}: ${stuff.join(" ; ")}`;
}
function makeRandomTable() {
    let result = [];
    for (let j = 0; j < N_DISKS; j++) {
        let cur_row = [];
        for (let i = 0; i < N_DISKS; i++) {
            if (i === j || i + 1 === j || Math.random() < .5) {
                cur_row.push(1);
            }
            else {
                cur_row.push(0);
            }
        }
        result.push(cur_row);
    }
    return result;
}
function mutateTable(table) {
    let newTable = JSON.parse(JSON.stringify(table));
    for (let k = 0; k < 4; k++) {
        let rand_row = Math.floor(Math.random() * N_DISKS);
        let rand_col = Math.floor(Math.random() * N_DISKS);
        while (rand_col === rand_row || rand_col + 1 === rand_row) {
            rand_row = Math.floor(Math.random() * N_DISKS);
            rand_col = Math.floor(Math.random() * N_DISKS);
        }
        newTable[rand_row][rand_col] = 1 - newTable[rand_row][rand_col];
    }
    return newTable;
}
/*
let geneticalgorithm = GeneticAlgorithmConstructor({
    mutationFunction: mutateTable,
    crossoverFunction: (parent_1: DataTable, parent_2: DataTable): [DataTable, DataTable] => {
        let child_1 = JSON.parse(JSON.stringify(parent_1)) as DataTable;
        let child_2 = JSON.parse(JSON.stringify(parent_2)) as DataTable;
        for (let row = 0; row < N_DISKS; row++) {
            for (let col = 0; col < N_DISKS; col++) {
                // change?
                if (Math.random() < .5) {
                    child_1[row][col] = parent_2[row][col];
                    child_2[row][col] = parent_1[row][col];
                }
            }
        }
        return [child_1, child_2];
    },
    fitnessFunction: (state: DataTable): number => {
        // Higher is better, lower is worse
        let solution = walkthroughToCoolestStateOfMagicTable(state);
        return 100 - solution.length;
    },
    // doesABeatBFunction: yourCompetitionFunction,
    population: Array(1000).fill(null).map(() => makeRandomTable()),
    // populationSize: 1000,
    // populationSize: aDecimalNumberGreaterThanZero 	// defaults to 100
})
*/
let evolve_button = document.getElementById("evolve");
/*evolve_button.addEventListener("click", (ev) => {
    geneticalgorithm.evolve();
    magicTable = geneticalgorithm.best();
    for (let row = 0; row < N_DISKS; row++) {
        for (let col = 0; col < N_DISKS; col++) {
            button_elements[row][col].checked = magicTable[row][col] === 1;
        }
    }
    recalcScore();
})*/
evolve_button.addEventListener("click", (ev) => {
    magicTable = simulatedAnnealing({
        initialState: magicTable,
        tempMax: 15,
        tempMin: 0.001,
        newState: mutateTable,
        getTemp: (temp) => temp - .001,
        getEnergy: (state) => {
            // Lower is better
            let solution = walkthroughToCoolestStateOfMagicTable(state);
            return -solution.length;
        },
    });
    for (let row = 0; row < N_DISKS; row++) {
        for (let col = 0; col < N_DISKS; col++) {
            button_elements[row][col].checked = magicTable[row][col] === 1;
        }
    }
    recalcScore();
});
