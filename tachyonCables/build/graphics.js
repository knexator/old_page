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
    exports.drawGhostCable = exports.drawGhostHex = exports.drawBoard = exports.beginFrame = exports.ctx = exports.canvas = void 0;
    const hexGame_1 = require("hexGame");
    const hexLib_1 = require("./hexLib");
    const index_1 = require("./index");
    exports.canvas = document.querySelector("canvas");
    exports.ctx = exports.canvas.getContext("2d");
    window.addEventListener("resize", _e => {
        exports.canvas.width = innerWidth;
        exports.canvas.height = innerHeight;
    });
    function beginFrame() {
        // ctx.clearRect(0,0,canvas.width,canvas.height);
        exports.ctx.fillStyle = "#4e4e4e";
        exports.ctx.fillRect(0, 0, exports.canvas.width, exports.canvas.height);
    }
    exports.beginFrame = beginFrame;
    function drawBoard(time) {
        hexGame_1.board.forEach(tile => {
            drawTile(tile, time);
        });
    }
    exports.drawBoard = drawBoard;
    function drawTile(tile, time) {
        let tile_hex = tile.coords;
        let center = hexGame_1.layout.hexToPixel(tile_hex);
        if (center.x < 0 || center.x >= exports.canvas.width || center.y < 0 || center.y >= exports.canvas.height) {
            return;
        }
        exports.ctx.strokeStyle = "gray";
        pathHex(tile.coords);
        exports.ctx.stroke();
        for (let k = 0; k < 6; k++) {
            let cur_cable = tile.cables[k];
            if (cur_cable !== null && cur_cable.origin === k) {
                exports.ctx.lineWidth = 3;
                if (cur_cable.inputReqs.has(Math.floor(time))) {
                    exports.ctx.strokeStyle = cur_cable.inputReqs.get(Math.floor(time)) ? "white" : "black";
                }
                else {
                    exports.ctx.strokeStyle = "gray";
                }
                let fillStyles = {
                    standard: "#bda564",
                    tachyon: "#a461ba",
                    bridgeForward: "#61baa8",
                    bridgeBackward: "#ba6161",
                    swapper: "#751c1c",
                };
                exports.ctx.fillStyle = fillStyles[cur_cable.type];
                // ctx.strokeStyle = fillStyles[cur_cable.type];
                // ctx.fillStyle = cur_cable.type === "swapper" ? "#751c1c" : "#6c751c"
                pathCable(tile.coords, cur_cable.origin, cur_cable.target);
                exports.ctx.stroke();
                exports.ctx.fill();
                exports.ctx.lineWidth = 1;
                if (cur_cable.state) {
                    if (cur_cable.type === "standard" || cur_cable.type === "swapper") {
                        let ballStart = cableSample(cur_cable, (0, index_1.mod)(time, 1));
                        exports.ctx.beginPath();
                        exports.ctx.moveTo(ballStart.x, ballStart.y);
                        exports.ctx.arc(ballStart.x, ballStart.y, hexGame_1.layout.size * 0.2, 0, Math.PI * 2);
                        exports.ctx.fillStyle = "orange";
                        exports.ctx.fill();
                    }
                    else if (cur_cable.type === "tachyon") {
                        let ballStart = cableSample(cur_cable, 1 - (0, index_1.mod)(time, 1));
                        exports.ctx.beginPath();
                        exports.ctx.moveTo(ballStart.x, ballStart.y);
                        exports.ctx.arc(ballStart.x, ballStart.y, hexGame_1.layout.size * 0.2, 0, Math.PI * 2);
                        exports.ctx.fillStyle = "purple";
                        exports.ctx.fill();
                    }
                    else if (cur_cable.type === "bridgeBackward") {
                        if ((0, index_1.mod)(time, 1) < 0.5) {
                            let ballStart1 = cableSample(cur_cable, (0, index_1.mod)(time, 1));
                            exports.ctx.beginPath();
                            exports.ctx.moveTo(ballStart1.x, ballStart1.y);
                            exports.ctx.arc(ballStart1.x, ballStart1.y, hexGame_1.layout.size * 0.2, 0, Math.PI * 2);
                            exports.ctx.fillStyle = "orange";
                            exports.ctx.fill();
                            let ballStart2 = cableSample(cur_cable, 1 - (0, index_1.mod)(time, 1));
                            exports.ctx.beginPath();
                            exports.ctx.moveTo(ballStart2.x, ballStart2.y);
                            exports.ctx.arc(ballStart2.x, ballStart2.y, hexGame_1.layout.size * 0.2, 0, Math.PI * 2);
                            exports.ctx.fillStyle = "purple";
                            exports.ctx.fill();
                        }
                    }
                    else if (cur_cable.type === "bridgeForward") {
                        if ((0, index_1.mod)(time, 1) > 0.5) {
                            let ballStart1 = cableSample(cur_cable, (0, index_1.mod)(time, 1));
                            exports.ctx.beginPath();
                            exports.ctx.moveTo(ballStart1.x, ballStart1.y);
                            exports.ctx.arc(ballStart1.x, ballStart1.y, hexGame_1.layout.size * 0.2, 0, Math.PI * 2);
                            exports.ctx.fillStyle = "orange";
                            exports.ctx.fill();
                            let ballStart2 = cableSample(cur_cable, 1 - (0, index_1.mod)(time, 1));
                            exports.ctx.beginPath();
                            exports.ctx.moveTo(ballStart2.x, ballStart2.y);
                            exports.ctx.arc(ballStart2.x, ballStart2.y, hexGame_1.layout.size * 0.2, 0, Math.PI * 2);
                            exports.ctx.fillStyle = "purple";
                            exports.ctx.fill();
                        }
                    }
                }
            }
        }
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
        let middle = hexGame_1.layout.hexToPixel(hex);
        exports.ctx.beginPath();
        exports.ctx.moveTo(start_left.x, start_left.y);
        // ctx.bezierCurveTo(middle.x, middle.y, middle.x, middle.y, end_left.x, end_left.y);
        // ctx.lineTo(end_right.x, end_right.y);
        exports.ctx.bezierCurveTo(middle.x, middle.y, middle.x, middle.y, end.x, end.y);
        exports.ctx.moveTo(end.x, end.y);
        exports.ctx.bezierCurveTo(middle.x, middle.y, middle.x, middle.y, start_right.x, start_right.y);
        exports.ctx.lineTo(start_left.x, start_left.y);
        /*let startMarker = bezierSample(0.05, start, middle, middle, end);
        ctx.moveTo(startMarker.x, startMarker.y);
        ctx.arc(startMarker.x, startMarker.y, layout.size * 0.1, 0, Math.PI * 2);*/
    }
    function cableSample(cable, t) {
        let hex = cable.tile.coords;
        let start = hexGame_1.layout.hexToPixel(hex.add(hexLib_1.Hex.directions[cable.origin].scale(0.5)));
        let end = hexGame_1.layout.hexToPixel(hex.add(hexLib_1.Hex.directions[cable.target].scale(0.5)));
        let middle = hexGame_1.layout.hexToPixel(hex);
        return bezierSample(t, start, middle, middle, end);
    }
    // https://stackoverflow.com/questions/16227300/how-to-draw-bezier-curves-with-native-javascript-code-without-ctx-beziercurveto
    function bezierSample(t, p0, p1, p2, p3) {
        var cX = 3 * (p1.x - p0.x), bX = 3 * (p2.x - p1.x) - cX, aX = p3.x - p0.x - cX - bX;
        var cY = 3 * (p1.y - p0.y), bY = 3 * (p2.y - p1.y) - cY, aY = p3.y - p0.y - cY - bY;
        var x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
        var y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;
        return { x: x, y: y };
    }
    ;
});
