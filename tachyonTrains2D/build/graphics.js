(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "hexGame", "./hexLib", "./index"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cableSample = exports.highlightCable = exports.drawGhostCable = exports.drawGhostHex = exports.drawBoard = exports.beginFrame = exports.ctx = exports.canvas = void 0;
    const hexGame_1 = require("hexGame");
    const hexLib_1 = require("./hexLib");
    const index_1 = require("./index");
    exports.canvas = document.querySelector("canvas");
    exports.ctx = exports.canvas.getContext("2d");
    let pending_flashes = [];
    let hex_111 = new hexLib_1.Hex(4.462745098039216, 1.1512207928207872, -5.613965890860003);
    let hex_112 = new hexLib_1.Hex(5.317647058823529, 1.1720653155641054, -6.489712374387635);
    let hex_121 = new hexLib_1.Hex(4.6117647058823525, 0.8457708812233689, -5.457535587105721);
    let hex_122 = new hexLib_1.Hex(5.52156862745098, 0.8459567796826422, -6.3675254071336225);
    let hex_off = new hexLib_1.Hex(2, -2, 0);
    let hex_zero = new hexLib_1.Hex(0, 0, 0);
    window.addEventListener("resize", _e => {
        exports.canvas.width = innerWidth;
        exports.canvas.height = innerHeight;
    });
    function beginFrame() {
        // ctx.clearRect(0,0,canvas.width,canvas.height);
        exports.ctx.fillStyle = "#4e4e4e"; // "#4e4e4e"; d9d9d9
        exports.ctx.fillRect(0, 0, exports.canvas.width, exports.canvas.height);
    }
    exports.beginFrame = beginFrame;
    function debugLine(hex1, hex2, offset) {
        let a = hexGame_1.layout.hexToPixel(hex1.add(offset));
        let b = hexGame_1.layout.hexToPixel(hex2.add(offset));
        exports.ctx.moveTo(a.x, a.y);
        exports.ctx.lineTo(b.x, b.y);
        exports.ctx.stroke();
    }
    function drawBoard(time) {
        if (allImgsLoaded) {
            pending_flashes = [];
            hexGame_1.board.forEach(tile => {
                drawTile(tile, time);
            });
            exports.ctx.fillStyle = "white";
            exports.ctx.strokeStyle = "black";
            exports.ctx.beginPath();
            pending_flashes.forEach(x => {
                let ballStart = cableSample(x.cable, x.t, time);
                exports.ctx.moveTo(ballStart.x + hexGame_1.layout.size * 0.5, ballStart.y);
                exports.ctx.arc(ballStart.x, ballStart.y, hexGame_1.layout.size * 0.5, 0, Math.PI * 2);
            });
            exports.ctx.fill();
            exports.ctx.stroke();
            exports.ctx.beginPath();
            exports.ctx.lineWidth = 5;
            if ((0, hexGame_1.BlockedAt)(Math.floor(time), true)) {
                debugLine(hex_111, hex_112, hex_zero);
                debugLine(hex_121, hex_122, hex_zero);
            }
            if ((0, hexGame_1.BlockedAt)(Math.floor(time), false)) {
                debugLine(hex_111, hex_112, hex_off);
                debugLine(hex_121, hex_122, hex_off);
            }
            exports.ctx.lineWidth = 1;
            /*ctx.globalAlpha = 0.5;
            contradictions.forEach(x => {
              if (Math.floor(x.time) === Math.floor(time)) {
                drawTrain(x.cable, time);
              }
            });
            ctx.globalAlpha = 1.0;*/
        }
        else {
            // draw loading screen
        }
    }
    exports.drawBoard = drawBoard;
    function drawTile(tile, time) {
        let tile_hex = tile.coords;
        let center = hexGame_1.layout.hexToPixel(tile_hex);
        if (center.x < 0 || center.x >= exports.canvas.width || center.y < 0 || center.y >= exports.canvas.height) {
            return;
        }
        exports.ctx.strokeStyle = index_1.time_dir === 0 ? "gray" : (index_1.time_dir < 0 ? "#FF9000" : "#00AEFF");
        pathHex(tile.coords);
        exports.ctx.stroke();
        if (tile.masterSwapper) {
            exports.ctx.globalAlpha = 0.3;
            drawCable(tile.coords, tile.swapCable1.getOrigin(time), tile.swapCable2.getTarget(time), tile.swapCable1.direction === "backward");
            drawCable(tile.coords, tile.swapCable2.getOrigin(time), tile.swapCable1.getTarget(time), tile.swapCable1.direction === "backward");
            exports.ctx.globalAlpha = 1.0;
        }
        for (let k = 0; k < 6; k++) {
            let cur_cable = tile.cables[k];
            if (cur_cable !== null && cur_cable.origin === k) {
                /*ctx.lineWidth = 3;
                let inputVal = cur_cable.inputReqs[Math.floor(time)];
                if (inputVal !== null && inputVal !== undefined) {
                  ctx.strokeStyle = inputVal ? "white" : "black";
                } else {
                  ctx.strokeStyle = "gray";
                }
                const fillStyles_normal = {
                  forward: "#bda564",
                  backward: "#a461ba",
                }
                const fillStyles_swapper = {
                  forward: "#751c1c",
                  backward: "#4b1c75"
                }
                let fillStyles = cur_cable.swapper ? fillStyles_swapper : fillStyles_normal;
                ctx.fillStyle = fillStyles[cur_cable.direction];
                // ctx.strokeStyle = fillStyles[cur_cable.type];
                // ctx.fillStyle = cur_cable.type === "swapper" ? "#751c1c" : "#6c751c"
                pathCable(tile.coords, cur_cable.getOrigin(time), cur_cable.getTarget(time));
                ctx.stroke();
                ctx.fill();
                ctx.lineWidth = 1;*/
                // TODO: inputReqs highlight
                drawCable(tile.coords, cur_cable.getOrigin(time), cur_cable.getTarget(time), cur_cable.direction === "backward");
                /*if (cur_cable.globalState[Math.floor(time)]) {
                  //drawTrain(cur_cable, time);
                  drawTrainMiddle(cur_cable, time);
                }
                if (cur_cable.globalState[Math.floor(time + 1)]) {
                  drawTrainEarly(cur_cable, time);
                }*/
                if (cur_cable.globalState[Math.floor(time)]) {
                    drawTrain(cur_cable, time, 0, false);
                }
                if (cur_cable.globalState[Math.floor(time + 1)]) {
                    drawTrain(cur_cable, time, -1, false);
                }
                if (cur_cable.globalState[Math.floor(time - 1)]) {
                    drawTrain(cur_cable, time, 1, false);
                }
                if (hexGame_1.contradictions.some(x => x.cable === cur_cable && x.time === Math.floor(time))) {
                    exports.ctx.globalAlpha = 0.5;
                    drawTrain(cur_cable, time, 0, index_1.contra_cable_highlight === cur_cable);
                    exports.ctx.globalAlpha = 1.0;
                }
                // flashes of time travel
                if (cur_cable.direction === "forward") {
                    let next_cable = (0, hexGame_1.magicAdjacentCable)(cur_cable, time, "forward");
                    let prev_cable = (0, hexGame_1.magicAdjacentCable)(cur_cable, time, "backward");
                    if (prev_cable && prev_cable.direction === "backward" && (0, index_1.mod)(time, 1) < 0.2 && cur_cable.globalState[Math.floor(time)]) {
                        pending_flashes.push({ cable: cur_cable, t: 0 });
                    }
                    if (prev_cable && prev_cable.direction === "backward" && (0, index_1.mod)(time, 1) > 0.8 && cur_cable.globalState[Math.floor(time + 1)]) {
                        pending_flashes.push({ cable: cur_cable, t: 0 });
                    }
                    if (next_cable && next_cable.direction === "backward" && (0, index_1.mod)(time, 1) > 0.8 && cur_cable.globalState[Math.floor(time)]) {
                        pending_flashes.push({ cable: cur_cable, t: 1 });
                    }
                    if (next_cable && next_cable.direction === "backward" && (0, index_1.mod)(time, 1) < 0.2 && cur_cable.globalState[Math.floor(time - 1)]) {
                        pending_flashes.push({ cable: cur_cable, t: 1 });
                    }
                }
            }
        }
    }
    function drawTrain(cur_cable, time, dt, highlight) {
        exports.ctx.strokeStyle = highlight ? "white" : "black";
        let t = (0, index_1.mod)(time, 1) + dt;
        let times = [t - .2, t, t + .2];
        if (cur_cable.direction === "backward") {
            times = times.map(x => 1 - x);
        }
        exports.ctx.beginPath();
        times.forEach(x => {
            if (x >= 0 && x <= 1) {
                let ballStart = cableSample(cur_cable, x, time - dt);
                exports.ctx.moveTo(ballStart.x + hexGame_1.layout.size * 0.2, ballStart.y);
                exports.ctx.arc(ballStart.x, ballStart.y, hexGame_1.layout.size * 0.2, 0, Math.PI * 2);
            }
        });
        exports.ctx.fillStyle = highlight ? "white" : cur_cable.direction === "forward" ? "orange" : "purple";
        exports.ctx.fill();
        exports.ctx.stroke();
    }
    function drawGhostHex(hex) {
        exports.ctx.fillStyle = "#65944a";
        pathHex(hex);
        exports.ctx.fill();
    }
    exports.drawGhostHex = drawGhostHex;
    function pathHex(hex) {
        let corners = hexGame_1.layout.polygonCorners(hex);
        exports.ctx.beginPath();
        exports.ctx.moveTo(corners[0].x, corners[0].y);
        for (let k = 1; k < 6; k++) {
            exports.ctx.lineTo(corners[k].x, corners[k].y);
        }
        exports.ctx.closePath();
    }
    function drawGhostCable(hex, origin, target) {
        pathCable(hex, origin, target);
        exports.ctx.stroke();
    }
    exports.drawGhostCable = drawGhostCable;
    function pathCable(hex, origin, target) {
        let start_hex = hex.add(hexLib_1.Hex.directions[origin].scale(0.5));
        let start_hex_right = start_hex.add(hexLib_1.Hex.diagonals[(0, index_1.mod)(origin + 1, 6)].scale(0.05));
        let start_hex_left = start_hex.add(hexLib_1.Hex.diagonals[(0, index_1.mod)(origin - 2, 6)].scale(0.05));
        let start = hexGame_1.layout.hexToPixel(start_hex);
        let start_right = hexGame_1.layout.hexToPixel(start_hex_right);
        let start_left = hexGame_1.layout.hexToPixel(start_hex_left);
        let end_hex = hex.add(hexLib_1.Hex.directions[target].scale(0.5));
        // let end_hex_right = end_hex.add(Hex.diagonals[mod(target+1,6)].scale(0.025));
        // let end_hex_left = end_hex.add(Hex.diagonals[mod(target-2,6)].scale(0.025));
        let end = hexGame_1.layout.hexToPixel(end_hex);
        // let end_right = layout.hexToPixel(end_hex_right);
        // let end_left = layout.hexToPixel(end_hex_left);
        // let middle = layout.hexToPixel(hex);
        let middle_start_hex = hex.add(hexLib_1.Hex.directions[origin].scale(0.5 / 4));
        let middle_end_hex = hex.add(hexLib_1.Hex.directions[target].scale(0.5 / 4));
        let middle_start = hexGame_1.layout.hexToPixel(middle_start_hex);
        let middle_end = hexGame_1.layout.hexToPixel(middle_end_hex);
        exports.ctx.beginPath();
        exports.ctx.moveTo(start_left.x, start_left.y);
        // ctx.bezierCurveTo(middle.x, middle.y, middle.x, middle.y, end_left.x, end_left.y);
        // ctx.lineTo(end_right.x, end_right.y);
        exports.ctx.bezierCurveTo(middle_start.x, middle_start.y, middle_end.x, middle_end.y, end.x, end.y);
        exports.ctx.moveTo(end.x, end.y);
        exports.ctx.bezierCurveTo(middle_end.x, middle_end.y, middle_start.x, middle_start.y, start_right.x, start_right.y);
        exports.ctx.lineTo(start_left.x, start_left.y);
        /*let startMarker = bezierSample(0.05, start, middle, middle, end);
        ctx.moveTo(startMarker.x, startMarker.y);
        ctx.arc(startMarker.x, startMarker.y, layout.size * 0.1, 0, Math.PI * 2);*/
    }
    function highlightCable(hex, origin, target) {
        let start = hexGame_1.layout.hexToPixel(hex.add(hexLib_1.Hex.directions[origin].scale(0.5)));
        let end = hexGame_1.layout.hexToPixel(hex.add(hexLib_1.Hex.directions[target].scale(0.5)));
        // let middle = layout.hexToPixel(hex);
        let middle_start_hex = hex.add(hexLib_1.Hex.directions[origin].scale(0.5 * 0.303525 / 0.866025));
        let middle_end_hex = hex.add(hexLib_1.Hex.directions[target].scale(0.5 * 0.303525 / 0.866025));
        let middle_start = hexGame_1.layout.hexToPixel(middle_start_hex);
        let middle_end = hexGame_1.layout.hexToPixel(middle_end_hex);
        exports.ctx.lineWidth = hexGame_1.layout.size / 3;
        exports.ctx.strokeStyle = "white";
        exports.ctx.beginPath();
        exports.ctx.moveTo(start.x, start.y);
        exports.ctx.bezierCurveTo(middle_start.x, middle_start.y, middle_end.x, middle_end.y, end.x, end.y);
        exports.ctx.stroke();
        exports.ctx.lineWidth = 1;
    }
    exports.highlightCable = highlightCable;
    function drawCable(hex, origin, target, tachyon) {
        if (target === origin)
            throw new Error("can't draw that cable");
        let center = hexGame_1.layout.hexToPixel(hex);
        let img_array = tachyon ? cable_images_tachyon : cable_images_normal;
        rotateAndPaintImage(img_array[(0, index_1.mod)(target - origin, 6)], (5 - origin) * Math.PI / 3, center.x, center.y, hexGame_1.layout.w / 2, hexGame_1.layout.h / 2, hexGame_1.layout.w, hexGame_1.layout.h);
    }
    // from https://stackoverflow.com/questions/3793397/html5-canvas-drawimage-with-at-an-angle
    function rotateAndPaintImage(image, angleInRad, positionX, positionY, axisX, axisY, sizeX, sizeY) {
        let scale = hexGame_1.layout.size / 85;
        exports.ctx.translate(positionX, positionY);
        exports.ctx.rotate(angleInRad);
        exports.ctx.scale(scale, scale);
        exports.ctx.drawImage(image, -axisX, -axisY, sizeX, sizeY);
        exports.ctx.scale(1 / scale, 1 / scale);
        exports.ctx.rotate(-angleInRad);
        exports.ctx.translate(-positionX, -positionY);
    }
    function cableSample(cable, t, time) {
        let hex = cable.tile.coords;
        let start = hexGame_1.layout.hexToPixel(hex.add(hexLib_1.Hex.directions[cable.getOrigin(time)].scale(0.5)));
        let end = hexGame_1.layout.hexToPixel(hex.add(hexLib_1.Hex.directions[cable.getTarget(time)].scale(0.5)));
        // let middle = layout.hexToPixel(hex);
        let middle_start_hex = hex.add(hexLib_1.Hex.directions[cable.getOrigin(time)].scale(0.5 * 0.303525 / 0.866025));
        let middle_end_hex = hex.add(hexLib_1.Hex.directions[cable.getTarget(time)].scale(0.5 * 0.303525 / 0.866025));
        let middle_start = hexGame_1.layout.hexToPixel(middle_start_hex);
        let middle_end = hexGame_1.layout.hexToPixel(middle_end_hex);
        return bezierSample(t, start, middle_start, middle_end, end);
    }
    exports.cableSample = cableSample;
    // https://stackoverflow.com/questions/16227300/how-to-draw-bezier-curves-with-native-javascript-code-without-ctx-beziercurveto
    function bezierSample(t, p0, p1, p2, p3) {
        var cX = 3 * (p1.x - p0.x), bX = 3 * (p2.x - p1.x) - cX, aX = p3.x - p0.x - cX - bX;
        var cY = 3 * (p1.y - p0.y), bY = 3 * (p2.y - p1.y) - cY, aY = p3.y - p0.y - cY - bY;
        var x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
        var y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;
        return { x: x, y: y };
    }
    ;
    // from https://stackoverflow.com/questions/34534549/how-do-you-deal-with-html5s-canvas-image-load-asynchrony
    let allImgsLoaded = false;
    let cable_images_normal = {};
    let cable_images_tachyon = {};
    let promiseArray = [];
    for (let k = 1; k <= 5; k++) {
        let prom1 = new Promise(function (resolve, reject) {
            let img = new Image();
            img.onload = function () {
                cable_images_tachyon[k] = img;
                resolve();
            };
            img.src = `./imgs/tachyon/cable_${k}.svg`;
        });
        promiseArray.push(prom1);
        let prom2 = new Promise(function (resolve, reject) {
            let img = new Image();
            img.onload = function () {
                cable_images_normal[k] = img;
                resolve();
            };
            img.src = `./imgs/normal/cable_${k}.svg`;
        });
        promiseArray.push(prom2);
    }
    Promise.all(promiseArray).then(() => {
        allImgsLoaded = true;
    });
});
