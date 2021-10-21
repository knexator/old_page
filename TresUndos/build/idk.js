(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./properties"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const properties_1 = require("./properties");
    class Player {
        constructor(level, i, j, dir) {
            this.inmunity = new properties_1.StaticProperty(0);
            this.position = new properties_1.DenseProperty({ i: i, j: j }, this.inmunity, level.undoHistory);
            this.direction = new properties_1.DenseProperty(dir, this.inmunity, level.undoHistory);
        }
    }
    class Level {
        constructor(data) {
            let rows = data.split('\n');
            this.h = rows.length;
            this.w = rows[0].length;
            this.undoHistory = [];
            let geo = [];
            let player = null;
            for (let j = 0; j < this.h; j++) {
                let geo_row = [];
                for (let i = 0; i < this.w; i++) {
                    let char = rows[j][i];
                    switch (char) {
                        case '#':
                            geo_row.push('#');
                            break;
                        case '@':
                            geo_row.push('.');
                            player = new Player(this, i, j, "right");
                            break;
                        default:
                            break;
                    }
                }
                geo.push(geo_row);
            }
            this.geo = geo;
            if (!player) {
                throw new Error("No player in the level");
            }
            this.player = player;
        }
    }
});
