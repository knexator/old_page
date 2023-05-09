const prompt_sync = require("prompt-sync")({ sigint: true });

type counts = number[];

// Shmup, v3

// 1: join/split
// 2: invert (a -> bc)
// 3: bubble
const types = ["a", "b", "c", "ab", "ac", "bc", "aa", "bb", "cc", "1", "2"]; //, "3"];
// const types = ["a", "b", "c", "ab", "ac", "bc", "aa", "bb", "cc"];

let human_rules = [
    ["a,a", "aa,1"],
    ["b,b", "bb,1"],
    ["c,c", "cc,1"],

    ["a,b", "ab,1"],
    ["a,c", "ac,1"],
    ["b,c", "bc,1"],

    ["c,cc", "ab,2"],
    ["b,bb", "ac,2"],
    ["a,aa", "bc,2"],

    ["bc,a", "aa,2"],
    ["ac,b", "bb,2"],
    ["ab,c", "cc,2"],

    // ["1,1", "2,2"],
    // ["1,2", "3,3"],


];


/*
Shmup, v2
// 1: join/split
// 2: invert (a -> bc)
const types = ["a", "b", "c", "ab", "ac", "bc", "aa", "bb", "cc", "1", "2"];
// const types = ["a", "b", "c", "ab", "ac", "bc", "aa", "bb", "cc"];

let human_rules = [
    ["a,a", "aa,1"],
    ["b,b", "bb,1"],
    ["c,c", "cc,1"],

    ["a,b", "ab,1"],
    ["a,c", "ac,1"],
    ["b,c", "bc,1"],

    ["2,a", "bc,2"]
    // ["a,b", "ab,c"],
    // ["a,c", "ac,b"],
    // ["b,c", "bc,a"],

    // ["ab,bc", "ac,bb"],
    // ["ac,bc", "ab,cc"],
    // ["ab,ac", "bc,aa"],
    // ["aa,cc", "ac,ac"],
    // ["aa,bb", "ab,ab"],
    // ["bb,cc", "bc,bc"],
];
*/
/*
Shmup, v1
const types = "abc:ABC!OxyzXYZ";

let human_rules = [
    ["bc", "a:"],
    ["ac", "b:"],
    ["ab", "c:"],

    ["aa", "A!"],
    ["bb", "B!"],
    ["cc", "C!"],

    [":!", "O"],

    ["aO", "x"],
    ["bO", "y"],
    ["cO", "z"],
    ["AO", "X"],
    ["BO", "Y"],
    ["CO", "Z"],

    // ["AA", "BC"],
    // ["BB", "AC"],
    // ["CC", "AB"],
    // ["AC", "B@"],
    // ["AB", "C@"],
    // ["BC", "A@"],
];
*/

/*
// Null Hypothesis

const types = "RGBTYPAZQ";

let human_rules = [
    ["RRR", ""],
    ["GGG", ""],
    ["BBB", ""],
    ["RGB", "T"],
    ["TT", ""],
    ["TR", "RRR"],
    ["TB", "BBB"],
    ["TG", "GGG"],
    ["TY", "YYY"],
    ["YBG", "R"],
    ["YRB", "G"],
    ["YRG", "B"],
    ["TP", "PPP"],
    ["BGP", "R"],
    ["RBP", "G"],
    ["RGP", "B"],
    ["TA", "AAA"],
    ["TZ", "ZZZ"],
    ["AAZ", "Y"],
    ["AZZ", "P"],
    ["TQ", "QQQ"],
    ["YP", "Q"],
    ["QY", "AAZ"],
    ["QP", "AZZ"],

];

// function canon(state: counts) {
//     // 012 are interchangeable, so ensure that
//     // #0 >= #1 >= #2
//     if (state[0] < state[1]) {
//         state[0], state[1] = state[1], state[0];
//     }
//     if (state[1] < state[2]) {
//         state[1], state[2] = state[2], state[1];
//     }
//     if (state[0] < state[1]) {
//         state[0], state[1] = state[1], state[0];
//     }
// }
*/

// end

interface Block {
    input: counts,
    output: counts,
    basic_count: number,
    // expandable: boolean,
    // child_1: Block | null,
    // child_2: Block | null,
    // paths: number,
}

const n_types = types.length;

// only called at the start so no need to optimize
function str2counts(str: string) {
    let result = Array(n_types).fill(0);
    if (Array.isArray(types)) {
        // @ts-ignore
        str = str.split(",");
    }
    for (let k = 0; k < str.length; k++) {
        const char = str[k];
        result[types.indexOf(char)] += 1;
    }
    return result;
}

function count2str(state: counts) {
    let res: string[] = [];
    for (let i = 0; i < n_types; i++) {
        for (let j = 0; j < state[i]; j++) {
            res.push(types[i]);
        }
    }
    if (Array.isArray(types)) {
        return res.join(",");
    } else {
        return res.join("");
    }
}

let all_rules: Block[] = human_rules.map(([input, output]) => {
    return {
        input: str2counts(input),
        output: str2counts(output),
        basic_count: 1,
        // expandable: true,
        // child_1: null,
        // child_2: null,
        // paths: 1,
    };
}).concat(human_rules.map(([input, output]) => {
    return {
        input: str2counts(output),
        output: str2counts(input),
        basic_count: 1,
        // expandable: true,
        // child_1: null,
        // child_2: null,
        // paths: 1,
    };
}));

// Generate all blocks with basic_count 2, then basic_count 3, etc.

let max_depth = 5;
/** rules in [depth_helper[k-1], depth_helper[k]) have complexity k */
let depth_helper = [0, all_rules.length];

let cur_complexity_target = 2;
while (depth_helper.length <= max_depth) {
    for (let first_rule_index = 0; first_rule_index < all_rules.length; first_rule_index++) {
        let block_1 = all_rules[first_rule_index];
        let depth_1 = block_1.basic_count;
        for (let second_rule_index = depth_helper[cur_complexity_target - depth_1 - 1]; second_rule_index < depth_helper[cur_complexity_target - depth_1]; second_rule_index++) {
            let block_2 = all_rules[second_rule_index];
            let depth_2 = block_2.basic_count;

            if (depth_1 + depth_2 !== cur_complexity_target) {
                console.log(depth_1, depth_2, cur_complexity_target)
                throw new Error("Bad depth calculation");
            }
            // console.log(first_rule_index, second_rule_index)

            let extra_input = Array(n_types).fill(0);
            let extra_output = Array(n_types).fill(0);
            let any_intersection = false;
            for (let k = 0; k < n_types; k++) {
                let generated = block_1.output[k];
                let consumed = block_2.input[k];
                if (generated > 0 && consumed > 0) {
                    any_intersection = true;
                }
                if (generated > consumed) {
                    extra_output[k] += generated - consumed;
                } else if (generated < consumed) {
                    extra_input[k] += consumed - generated;
                }
            }

            if (any_intersection) {
                for (let k = 0; k < n_types; k++) {
                    extra_input[k] += block_1.input[k];
                    extra_output[k] += block_2.output[k];
                }
                if (equalCounts(extra_input, extra_output)) continue; // trivial rule

                let redundant = all_rules.some(block => isTrivialAddition(block, extra_input, extra_output));
                if (!redundant) {
                    all_rules.push({
                        input: extra_input,
                        output: extra_output,
                        basic_count: cur_complexity_target,
                        // expandable: (totalElements(extra_input) < max_complexity) && (totalElements(extra_output) < max_complexity),
                        // child_1: block_1,
                        // child_2: block_2,
                        // paths: Math.max(), // idk
                    })
                }
            }
        }
    }
    depth_helper.push(all_rules.length);
    console.log("Rules with complexity ", cur_complexity_target, ": ", all_rules.length - depth_helper[cur_complexity_target - 1])
    cur_complexity_target++;
    // console.log("complexity target is now ", cur_complexity_target)
    // console.log(all_rules.length);
}

console.log("Done!");
// all_rules = all_rules.filter(block => block.output.every(x => x === 0));
all_rules.sort((a, b) => {
    return totalElements(a.input) + totalElements(a.output) - a.basic_count + b.basic_count - totalElements(b.input) - totalElements(b.output);
})
// for (let k = 0; k < all_rules.length; k++) {
for (let k = 0; k < Math.min(all_rules.length, 200); k++) {
    const cur_rule = all_rules[k];
    console.log(`${count2str(cur_rule.input)} -> ${count2str(cur_rule.output)} (${cur_rule.basic_count})`)
    // if (cur_rule.basic_count === 7) {
    //     console.log(detailedString(cur_rule));
    // }
}

while (true) {
    let user_input = str2counts(prompt_sync("Input: "));
    all_rules.filter(x => equalCounts(x.input, user_input)).forEach(x => console.log(`${count2str(x.input)} -> ${count2str(x.output)} (${x.basic_count})`))
    // console.log("---");
    // all_rules.filter(x => {
    //     if (equalCounts(x.input, user_input)) return false;
    //     for (let k = 0; k < n_types; k++) {
    //         if (user_input[k] > x.input[k]) {
    //             return false;
    //         }
    //     }
    //     return true;
    // }).forEach(x => console.log(`${count2str(x.input)} -> ${count2str(x.output)} (${x.basic_count})`))
}

// function detailedString(block: Block) {
//     if (block.child_1 === null || block.child_2 === null) {
//         return `${count2str(block.input)} -> ${count2str(block.output)}`
//     } else {
//         return `(${detailedString(block.child_1)} + ${detailedString(block.child_2)})`
//     }
// }

function equalCounts(count_1: counts, count_2: counts) {
    for (let k = 0; k < n_types; k++) {
        if (count_1[k] !== count_2[k]) return false;
    }
    return true;
}

/** Is input->output just block with some extra identities? */
function isTrivialAddition(block: Block, input: counts, output: counts) {
    for (let k = 0; k < n_types; k++) {
        let i1 = input[k] - block.input[k];
        let o1 = output[k] - block.output[k];
        if (i1 < 0 || o1 < 0) return false;
        if (i1 !== o1) return false;
    }
    return true;
}

function totalElements(state: counts) {
    let n = 0;
    for (let k = 0; k < n_types; k++) {
        n += state[k];
    }
    return n;
}

// todo: fix parallel blocks
// for example, if x,y=>xy, then the program will think that a,x,x,y,y=>a,xy,xy is an interesting rule