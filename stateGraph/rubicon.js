// @ts-ignore
import vis from "https://unpkg.com/vis-network@9.1.2/dist/vis-network.esm.min.js";
console.log("vis: ", vis);
// @ts-ignore
import "https://unpkg.com/3d-force-graph@1.71.1/dist/3d-force-graph.min.js";
// @ts-ignore
import "https://unpkg.com/three@0.150.0/build/three.js";
console.log("three: ", THREE);
export const initialState = {
    player: false,
    cabbage: false,
    sheep: false,
    wolf: false,
};
export function nextStates(state) {
    let result = {
        "empty": {
            player: !state.player,
            cabbage: state.cabbage,
            sheep: state.sheep,
            wolf: state.wolf,
        },
    };
    if (state.player == state.cabbage) {
        let next_state = {
            player: !state.player,
            cabbage: !state.cabbage,
            sheep: state.sheep,
            wolf: state.wolf,
        };
        if (validState(next_state)) {
            result["cabbage"] = next_state;
        }
    }
    if (state.player == state.sheep) {
        let next_state = {
            player: !state.player,
            cabbage: state.cabbage,
            sheep: !state.sheep,
            wolf: state.wolf,
        };
        if (validState(next_state)) {
            result["sheep"] = next_state;
        }
    }
    if (state.player == state.wolf) {
        let next_state = {
            player: !state.player,
            cabbage: state.cabbage,
            sheep: state.sheep,
            wolf: !state.wolf,
        };
        if (validState(next_state)) {
            result["wolf"] = next_state;
        }
    }
    return result;
}
function validState(state) {
    // is cabbage safe?
    let cabbage_safe = (state.player == state.cabbage) || (state.cabbage != state.sheep);
    // is sheep safe?
    let sheep_safe = (state.player == state.sheep) || (state.sheep != state.wolf);
    return cabbage_safe && sheep_safe;
}
export function isWon(state) {
    return state.player && state.cabbage && state.sheep && state.wolf;
}
export function stateId(state) {
    return `${state.player},${state.cabbage},${state.sheep},${state.wolf}`;
}
export function stateToPos(state) {
    return {
        x: Number(state.cabbage) * 100 + Number(state.player) * 20,
        y: Number(state.sheep) * 100 + Number(state.player) * 30,
        z: Number(state.wolf) * 100 + Number(state.player) * 40,
    };
}
let CONFIG = {
    showIDs: false,
};
// create a network
let nodes = new vis.DataSet();
let edges = new vis.DataSet();
function expandNode(cur_node) {
    if (cur_node.expanded)
        return;
    // console.log("cur node: ", cur_node);
    let next_states = nextStates(cur_node.state);
    for (const [input, new_state] of Object.entries(next_states)) {
        let new_id = stateId(new_state);
        if (nodes.get(new_id) === null) {
            addNode(new_state, new_id, cur_node);
            // nodes.add({
            //     id: new_id,
            //     state: new_state,
            //     won: new_state.isWon(),
            //     expanded: false,
            // });
        }
        edges.add({
            id: `${cur_node.id}_${input}`,
            from: cur_node.id,
            to: new_id,
            input: input,
            // label: input,
        });
    }
    nodes.update({ id: cur_node.id, expanded: true, color: "#fcba03" });
}
let pending_expansion = [];
let expandCount = 1;
let expandTime = 100;
function autoStep() {
    for (let k = 0; k < expandCount; k++) {
        if (pending_expansion.length == 0) {
            // end expansion
            return;
        }
        ;
        expandNode(pending_expansion.shift());
    }
    if (expandTime < 50) {
        expandCount = Math.min(expandCount + .1, 10);
    }
    else {
        expandTime *= .92;
    }
    setTimeout(autoStep, expandTime);
}
// Separated this to add styling
function addNode(state, id = undefined, parent_node = undefined) {
    if (id === undefined)
        id = stateId(state);
    let pos = stateToPos(state);
    let won = isWon(state);
    let cur_node = {
        id: id,
        state: state,
        won: won,
        expanded: false,
        label: id,
        // label: CONFIG.showIDs ? id : "",
        // label: "",
        color: "#9803fc",
        shape: (state === initialState) ? "diamond" : won ? "star" : "dot",
        // shape: "image",
        x: pos.x,
        y: pos.y,
        z: pos.z,
        // image: State.drawToUrl(state),
        // size: 50,
        // ctxRenderer: ctxRenderer,
    };
    nodes.add(cur_node);
    pending_expansion.push(cur_node);
}
addNode(initialState);
while (pending_expansion.length > 0) {
    expandNode(pending_expansion.shift());
}
console.log(nodes);
console.log(edges);
// Random tree
const N = 300;
const gData = {
    nodes: nodes.map((node) => ({
        id: node.id,
        fx: node.x,
        fy: node.y,
        fz: node.z,
        label: node.label,
        state: node.state,
        color: ["white", "blue", "red"][node.state.player_color],
        val: (node.won || node.state == initialState) ? 30 : 4
    })),
    links: edges.map(edge => {
        return {
            source: edge.from,
            target: edge.to,
        };
    })
};
// .nodeColor(d => d.type=="OK" ? '#4caf50' : '#f44336')
// spritesheet.onload = function() {
const Graph = ForceGraph3D()(document.getElementById("mynetwork"))
    .graphData(gData)
    .linkDirectionalArrowLength(10)
    // .linkDirectionalArrowRelPos(0)
    .linkWidth(1);
// .nodeRelSize(25)
// .enableNodeDrag(false)
// .linkOpacity(1);
// .linkCurvature(0.25);
// }
setTimeout(() => {
    Graph.enableNodeDrag(false);
}, 500);
document.getElementById("unfold").addEventListener("click", () => {
    Graph.graphData()["nodes"].forEach(x => {
        delete x.fx;
        delete x.fy;
        delete x.fz;
    });
    Graph.d3ReheatSimulation();
    Graph.enableNodeDrag(true);
    console.log(Graph.enableNodeDrag());
    Graph.d3VelocityDecay(1);
    for (let k = 0; k <= 1; k += .05) {
        setTimeout(() => {
            Graph.d3VelocityDecay(1.0 - .6 * k);
        }, 50 + k * 500);
    }
});
