import * as vis from 'visjs-network';
import ManyKeysMap from 'many-keys-map';
const elements = [
    // [[1], [2], [3], [4]],
    [[1, 2], [3], [4]], [[1, 3], [2], [4]], [[1, 4], [3], [2]], [[2, 3], [3], [1]], [[2, 4], [3], [1]], [[3, 4], [1], [2]],
    // [[1, 2], [3, 4]], [[1, 3], [2, 4]], [[1, 4], [2, 3]],
    [[1, 2, 3], [4]], [[1, 2, 4], [3]], [[1, 3, 4], [2]], [[2, 3, 4], [1]],
    // [[1, 2, 3, 4]]
];
function getId(thing) {
    return JSON.stringify(thing);
}
function isSmallerThan(a, b) {
    if (a === b)
        return false;
    return a.every(clusterA => {
        for (let i = 0; i < clusterA.length; i++) {
            for (let j = i + 1; j < clusterA.length; j++) {
                if (!b.some(clusterB => clusterB.includes(clusterA[i]) && clusterB.includes(clusterA[j]))) {
                    return false;
                }
            }
        }
        return true;
    });
}
console.log(isSmallerThan([[1, 2], [3], [4]], [[1, 2, 3], [4]]));
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
    // interaction: {
    //     multiselect: true,
    // },
});
for (const element of elements) {
    let id = getId(element);
    nodes.add({
        id: id,
        element: element,
        label: id,
    });
}
let isSmallerThan_lut = new ManyKeysMap();
let draw_edge = new ManyKeysMap();
for (const elementA of elements) {
    for (const elementB of elements) {
        let v = isSmallerThan(elementA, elementB);
        isSmallerThan_lut.set([elementA, elementB], v);
        draw_edge.set([elementA, elementB], v);
    }
}
// remove redundant edges
for (const small of elements) {
    for (const big of elements) {
        if (!isSmallerThan_lut.get([small, big]))
            continue;
        for (const bigger of elements) {
            if (!isSmallerThan_lut.get([big, bigger]))
                continue;
            draw_edge.set([small, bigger], false);
        }
    }
}
draw_edge.forEach((value, [small, big]) => {
    if (!value)
        return;
    edges.add({
        from: getId(small),
        to: getId(big),
    });
});
