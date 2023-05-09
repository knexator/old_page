import * as dat from 'dat.gui';
import * as vis from 'visjs-network';
import { State } from "./sokobanState";
let CONFIG = {
    showIDs: true,
};
let gui = new dat.GUI();
let BUTTONS = {
    expandLevel: expandLevel,
    expandAll: expandAll,
    clusterByCratePosition: clusterByCratePosition,
    hideLostCrates: () => {
        for (let node_id of Object.keys(network.body.nodes)) {
            if (network.isCluster(node_id)) {
                let representative_id = network.getNodesInCluster(node_id)[0];
                if (State.isClearlyLost(nodes.get(representative_id).state)) {
                    network.clustering.updateClusteredNode(node_id, { hidden: true });
                }
            }
            else {
                if (State.isClearlyLost(nodes.get(node_id).state)) {
                    nodes.update({ id: node_id, hidden: true });
                }
            }
        }
    }
};
gui.add(BUTTONS, "expandLevel");
gui.add(BUTTONS, "expandAll");
gui.add(BUTTONS, "clusterByCratePosition");
gui.add(BUTTONS, "hideLostCrates");
// create a network
let nodes = new vis.DataSet();
let edges = new vis.DataSet();
let network = new vis.Network(document.getElementById("mynetwork"), {
    nodes: nodes,
    edges: edges,
}, {
    edges: {
        arrows: "to",
        smooth: false, /*{
        type: "continuous",
    },*/
    },
    physics: {
        barnesHut: {
            // theta: 0.5,
            gravitationalConstant: -20000,
            // centralGravity: 0.3,
            // springLength: 55,
            // springConstant: 0.04,
            damping: 0.25,
            // avoidOverlap: 0
        },
        minVelocity: 0,
    },
    interaction: {
        hover: true,
    },
});
addNode(State.initialState);
expandNode(nodes.get()[0]);
network.on("click", function (params) {
    let clicked_node_id = params.nodes[0];
    // console.log(clicked_node_id);
    // console.log(params);
    if (clicked_node_id !== undefined) {
        let clicked_node = nodes.get(clicked_node_id);
        if (!clicked_node.expanded) {
            expandNode(clicked_node);
        }
    }
});
network.on("oncontext", function (params) {
    let clicked_node_id = network.getNodeAt(params.pointer.DOM);
    if (clicked_node_id !== undefined) {
        nodes.remove(clicked_node_id);
        cur_hover_id = null;
    }
});
let cur_hover_id = null;
network.on("hoverNode", function (params) {
    if (!network.isCluster(params.node)) {
        cur_hover_id = params.node;
    }
});
network.on("blurNode", function (params) {
    cur_hover_id = null;
});
network.on("afterDrawing", function (ctx) {
    if (cur_hover_id !== null) {
        let cur_hover_node = nodes.get(cur_hover_id);
        let pos = network.getPositions(cur_hover_id)[cur_hover_id];
        // ctx.translate(pos.x, pos.y);
        State.drawState(cur_hover_node.state, ctx, pos);
        // console.log(cur_hover_node);
        // ctx.fillStyle = "#000000";
        // ctx.fillRect(0, 0, 100, 100);
        // ctx.fillRect(pos.x, pos.y, 100, 100);
        // ctx.fillRect(cur_hover_pos.x, cur_hover_pos.y, 100, 100);
    }
});
function expandNode(cur_node) {
    if (cur_node.expanded)
        return;
    // console.log("cur node: ", cur_node);
    let next_states = State.nextStates(cur_node.state);
    for (const [input, new_state] of Object.entries(next_states)) {
        let new_id = State.id(new_state);
        if (nodes.get(new_id) === null) {
            addNode(new_state, new_id, cur_node);
            /*nodes.add({
                id: new_id,
                state: new_state,
                won: new_state.isWon(),
                expanded: false,
            });*/
        }
        edges.add({
            id: `${cur_node.id}_${input}`,
            from: cur_node.id,
            to: new_id,
            input: input,
            label: input,
        });
    }
    nodes.update({ id: cur_node.id, expanded: true, color: "#fcba03" });
}
function expandLevel() {
    nodes.forEach(expandNode);
}
function expandAll() {
    while (true) {
        if (nodes.get({ filter: x => !x.expanded }).length === 0)
            break;
        expandLevel();
    }
}
// Separate this to add styling
function addNode(state, id = undefined, parent_node = undefined) {
    if (id === undefined)
        id = State.id(state);
    let x = 0;
    let y = 0;
    if (parent_node !== undefined) {
        x = network.body.nodes[parent_node.id].x;
        y = network.body.nodes[parent_node.id].y;
    }
    let won = State.isWon(state);
    nodes.add({
        id: id,
        state: state,
        won: won,
        expanded: false,
        label: CONFIG.showIDs ? id : "",
        color: "#9803fc",
        shape: (state === State.initialState) ? "diamond" : won ? "star" : "dot",
        x: x,
        y: y,
    });
}
function clusterByCratePosition() {
    clusterByFunction(x => {
        if (network.isCluster(x.id))
            return false;
        return '[' + x.state.crates.map(c => `${c.x}:${c.y}`).join(',') + ']';
    });
}
// fun is called on the node object, which has an .id and a .stateç
// fun must return the id of the cluster, or false if it wont be clustered
function clusterByFunction(fun) {
    let clusterIdsToNodeIds = {};
    let clusterKeys = new Set();
    nodes.forEach(x => {
        let res = fun(x);
        if (!res)
            return;
        if (clusterKeys.has(res)) {
            clusterIdsToNodeIds[res].add(x.id);
        }
        else {
            clusterIdsToNodeIds[res] = new Set([x.id]);
            clusterKeys.add(res);
        }
    });
    clusterKeys.forEach(res => {
        network.cluster({
            joinCondition: (node) => {
                return clusterIdsToNodeIds[res].has(node.id);
            },
            clusterNodeProperties: {
                id: res,
                label: CONFIG.showIDs ? res : "",
            },
            processProperties: (clusterOptions, childNodes, childEdges) => {
                for (var i = 0; i < childNodes.length; i++) {
                    if (childNodes[i].shape === "diamond") {
                        clusterOptions.shape = "diamond";
                        break;
                    }
                    else if (childNodes[i].shape === "star") {
                        clusterOptions.shape = "star";
                        break;
                    }
                }
                return clusterOptions;
            },
        });
    });
}
