import * as vis from 'visjs-network';
/* Start here */
const my_nodes = `
sofa
cap
hat
soko
whale
house
stairs
snake
train
pipe
claw
toad
duck
car
factory
eyes
fish
worm
`.trim().split("\n").map(x => x.trim());
const my_edges = `
sofa cap
sofa snake
sofa whale
sofa hat
cap soko
cap house
cap factory
house duck
snake duck
snake claw
snake toad
whale stairs
whale toad
whale train
whale pipe
hat car
hat fish
hat toad
hat stairs
hat factory
claw worm
train claw
train pipe
`.trim().split("\n").map(x => x.trim().split(" "));
/* End here */
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
    physics: false /*{
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
    },*/
    // interaction: {
    //     multiselect: true,
    // },
});
for (const element of my_nodes) {
    nodes.add({
        id: element,
        // element: element,
        label: element,
    });
}
my_edges.forEach(([a, b]) => {
    edges.add({
        from: a,
        to: b,
    });
});
