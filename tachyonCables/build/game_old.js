"use strict";
class CableNode {
    constructor(x, y) {
        this.value = false;
        this.nextValue = false;
        this.x = x;
        this.y = y;
    }
}
class StandardCable {
    constructor(origin, target) {
        this.origin = origin;
        this.target = target;
    }
    update() {
        this.target.nextValue = this.origin.value;
    }
}
class TachyonCable {
    constructor(origin, target) {
        this.origin = origin;
        this.target = target;
    }
}
class BridgeCable {
    constructor(origin, target) {
        this.origin = origin;
        this.target = target;
    }
}
class Graph {
    constructor() {
        this.nodes = [];
        this.cables = [];
    }
    update() {
        this.cables.forEach(c => c.update());
    }
}
