(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "engine"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const engine_1 = require("engine");
    let canvas = document.querySelector("canvas");
    let ctx = canvas.getContext("2d");
    let last_time = 0;
    let EDITOR = false;
    let MAX_T = 100;
    let N_MODULES = 3;
    /*let delays = zeroDelays(N_MODULES);
    let connections = selfConnections(N_MODULES);
    let data = emptyData(N_MODULES, MAX_T);*/
    let delays = [[-3, -2, 2], [2, -4, -1], [-2, 2, 2]];
    let connections = [[[0, 0], [1, 0], [2, 0]], [[0, 2], [2, 1], [2, 2]], [[0, 1], [1, 2], [1, 1]]];
    let data = emptyData(N_MODULES, MAX_T);
    let faultyConnections = findFaultyConnections();
    let reverseConnections = findReverseConnections();
    maybeLoadProblem();
    const BUTTON_W = 100;
    const BUTTON_H = 50;
    let table_off_x = BUTTON_W * 10 - BUTTON_W / 2;
    let table_off_y = -BUTTON_H / 2;
    function zeroDelays(n_mod) {
        let res = [];
        for (let k = 0; k < n_mod; k++) {
            res.push([0, 1, 2]);
        }
        return res;
    }
    function selfConnections(n_mod) {
        let res = [];
        for (let k = 0; k < n_mod; k++) {
            res.push([[k, 0], [k, 1], [k, 2]]);
        }
        return res;
    }
    function emptyData(n_mod, max_t) {
        let res = [];
        for (let k = 0; k < n_mod; k++) {
            res.push([Array(max_t).fill(false), Array(max_t).fill(false), Array(max_t).fill(false)]);
        }
        return res;
    }
    function writeContradictions() {
        for (let i = 0; i < N_MODULES; i++) {
            for (let j = 0; j < 3; j++) {
                for (let t = 0; t < MAX_T; t++) {
                    data[i][j][t] = Boolean(data[i][j][t]);
                }
            }
        }
        for (let i = 0; i < N_MODULES; i++) {
            for (let j = 0; j < 3; j++) {
                for (let t = 1; t + 1 < MAX_T; t++) {
                    let source_val = data[i][j][t];
                    if (source_val) {
                        let [prev_mod, prev_part] = reverseConnections[i][j];
                        let prev_t = t - delays[prev_mod][prev_part];
                        if (prev_t > 0 && prev_t + 1 < MAX_T) {
                            if (prev_part !== 2 && data[prev_mod][2][prev_t]) {
                                prev_part = 1 - prev_part;
                            }
                            let prev_val = data[prev_mod][prev_part][prev_t];
                            if (!prev_val) {
                                data[prev_mod][prev_part][prev_t] = null;
                            }
                        }
                        else {
                            data[prev_mod][prev_part][prev_t === 0 ? 0 : MAX_T - 1] = null;
                        }
                    }
                    if (j !== 2 && data[i][2][t]) {
                        source_val = data[i][1 - j][t];
                    }
                    if (source_val) {
                        let [target_mod, target_part] = connections[i][j];
                        let target_t = t + delays[i][j];
                        if (target_t > 0 && target_t + 1 < MAX_T) {
                            let target_val = data[target_mod][target_part][target_t];
                            if (!target_val) {
                                data[target_mod][target_part][target_t] = null;
                            }
                        }
                        else {
                            data[target_mod][target_part][target_t === 0 ? 0 : MAX_T - 1] = null;
                        }
                    }
                }
            }
        }
    }
    function findFaultyConnections() {
        let res = [];
        for (let k = 0; k < N_MODULES; k++) {
            res.push([false, false, false]);
        }
        let sources = Array(N_MODULES * 3).fill(-1);
        for (let source_mod = 0; source_mod < N_MODULES; source_mod++) {
            for (let source_part = 0; source_part < 3; source_part++) {
                let [target_mod, target_part] = connections[source_mod][source_part];
                if (target_mod < 0 || target_mod >= N_MODULES) {
                    res[source_mod][source_part] = true;
                    continue;
                }
                let target_j = target_mod * 3 + target_part;
                if (sources[target_j] === -1) {
                    // everything correct
                    sources[target_j] = source_mod * 3 + source_part;
                }
                else {
                    let other_source_mod = Math.floor(sources[target_j] / 3);
                    let other_source_part = sources[target_j] % 3;
                    res[source_mod][source_part] = true;
                    res[other_source_mod][other_source_part] = true;
                }
            }
        }
        return res;
    }
    function findReverseConnections() {
        let res = [];
        for (let k = 0; k < N_MODULES; k++) {
            res.push([[-1, -1], [-1, -1], [-1, -1]]);
        }
        for (let source_mod = 0; source_mod < N_MODULES; source_mod++) {
            for (let source_part = 0; source_part < 3; source_part++) {
                if (faultyConnections[source_mod][source_part])
                    continue;
                let [target_mod, target_part] = connections[source_mod][source_part];
                res[target_mod][target_part] = [source_mod, source_part];
            }
        }
        return res;
    }
    function saveProblem() {
        localStorage.setItem('N_MODULES', JSON.stringify(N_MODULES));
        localStorage.setItem('delays', JSON.stringify(delays));
        localStorage.setItem('connections', JSON.stringify(connections));
    }
    function maybeLoadProblem() {
        let maybe_n_mod = JSON.parse(localStorage.getItem('N_MODULES') || 'null');
        let maybe_delays = JSON.parse(localStorage.getItem('delays') || 'null');
        let maybe_connections = JSON.parse(localStorage.getItem('connections') || 'null');
        if (maybe_n_mod && maybe_delays && maybe_connections) {
            N_MODULES = maybe_n_mod;
            delays = maybe_delays;
            connections = maybe_connections;
            data = emptyData(N_MODULES, MAX_T);
            faultyConnections = findFaultyConnections();
            reverseConnections = findReverseConnections();
        }
    }
    window.addEventListener("resize", _e => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    });
    function initOnce() {
        window.dispatchEvent(new Event('resize'));
        window.requestAnimationFrame(update);
    }
    function update(curTime) {
        let deltaTime = curTime - last_time;
        deltaTime = Math.min(deltaTime, 30.0);
        last_time = curTime;
        let mi = Math.floor((engine_1.mouse.x + table_off_x) / BUTTON_W) - 1;
        let mj = Math.floor((engine_1.mouse.y + table_off_y) / BUTTON_H) - 1;
        if (!EDITOR) {
            if ((0, engine_1.isKeyDown)('a'))
                table_off_x -= deltaTime * 1.0;
            if ((0, engine_1.isKeyDown)('d'))
                table_off_x += deltaTime * 1.0;
        }
        if ((0, engine_1.isKeyDown)('w'))
            table_off_y -= deltaTime * 1.0;
        if ((0, engine_1.isKeyDown)('s'))
            table_off_y += deltaTime * 1.0;
        if (EDITOR) {
            if ((0, engine_1.wasKeyPressed)('+')) {
                delays.push([0, 0, 0]);
                connections.push([[N_MODULES, 0], [N_MODULES, 1], [N_MODULES, 2]]);
                data.push([Array(MAX_T).fill(false), Array(MAX_T).fill(false), Array(MAX_T).fill(false)]);
                N_MODULES += 1;
                faultyConnections.push([false, false, false]);
                reverseConnections = findReverseConnections();
            }
            if ((0, engine_1.wasKeyPressed)('-')) {
                delays.pop();
                connections.pop();
                data.pop();
                N_MODULES -= 1;
                faultyConnections = findFaultyConnections();
                reverseConnections = findReverseConnections();
            }
        }
        // UI
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        table_off_x -= BUTTON_W;
        table_off_y -= BUTTON_H;
        let min_i = Math.max(0, Math.floor(table_off_x / BUTTON_W) + 2);
        let max_i = Math.min(MAX_T - 1, Math.floor((table_off_x + canvas.width) / BUTTON_W));
        let min_j = Math.max(0, Math.floor(table_off_y / BUTTON_H) + 2);
        let max_j = Math.min(N_MODULES * 3 - 1, Math.floor((table_off_y + canvas.height) / BUTTON_H));
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${BUTTON_H * .7}px Arial`;
        ctx.fillStyle = "black";
        ctx.strokeStyle = "black";
        if (!EDITOR) {
            for (let i = min_i; i <= max_i; i++) {
                for (let j = min_j; j <= max_j; j++) {
                    let x = i * BUTTON_W - table_off_x;
                    let y = j * BUTTON_H - table_off_y;
                    let data_val = data[Math.floor(j / 3)][j % 3][i];
                    let text = (data_val === null) ? "?" : data_val ? "✓" : "-";
                    ctx.fillText(text, x + BUTTON_W / 2, y + BUTTON_H / 2);
                }
            }
            ctx.beginPath();
            for (let i = min_i - 1; i <= max_i; i++) {
                let x = i * BUTTON_W - table_off_x + BUTTON_W;
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
            }
            ctx.stroke();
            ctx.beginPath();
            for (let j = min_j; j < max_j; j++) {
                let y = j * BUTTON_H - table_off_y + BUTTON_H;
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
            }
            ctx.stroke();
            ctx.beginPath();
            ctx.lineWidth = 3;
            for (let j = min_j - 1; j <= max_j; j++) {
                if (mod(j, 3) === 2) {
                    let y = j * BUTTON_H - table_off_y + BUTTON_H;
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                }
            }
            ctx.stroke();
            ctx.lineWidth = 1;
            for (let i = min_i; i <= max_i; i++) {
                if (i > 0 && i + 1 < MAX_T) {
                    let x = i * BUTTON_W - table_off_x + BUTTON_W / 2;
                    let y = BUTTON_H / 2;
                    ctx.fillText(i.toString(), x, y);
                }
            }
            for (let j = min_j; j <= max_j; j++) {
                let x = BUTTON_W / 2;
                let y = j * BUTTON_H - table_off_y + BUTTON_H / 2;
                let mod = Math.floor(j / 3);
                let part = 'abc'[j % 3];
                ctx.fillText((mod + 1).toString() + part, x, y);
            }
            if (mi > 0 && mi + 1 < MAX_T && mj >= 0 && mj < N_MODULES * 3) {
                document.body.style.cursor = 'pointer';
                let m_mod = Math.floor(mj / 3);
                let m_part = mj % 3;
                if ((0, engine_1.wasButtonPressed)("left")) {
                    data[m_mod][m_part][mi] = !data[m_mod][m_part][mi];
                    writeContradictions();
                }
                let x = mi * BUTTON_W - table_off_x + BUTTON_W / 2;
                let y = mj * BUTTON_H - table_off_y + BUTTON_H / 2;
                let [prev_mod, prev_part] = reverseConnections[m_mod][m_part];
                let prev_t = mi - delays[prev_mod][prev_part];
                prev_t = Math.max(0, Math.min(MAX_T - 1, prev_t));
                if (prev_part !== 2 && data[prev_mod][2][prev_t]) {
                    prev_part = 1 - prev_part;
                }
                ctx.beginPath();
                ctx.strokeStyle = "blue";
                let prev_x = prev_t * BUTTON_W - table_off_x + BUTTON_W / 2;
                let prev_y = (prev_mod * 3 + prev_part) * BUTTON_H - table_off_y + BUTTON_H / 2;
                ctx.arc(prev_x, prev_y, BUTTON_H / 3, 0, Math.PI * 2);
                draw_arrow(prev_x, prev_y, x, y);
                ctx.stroke();
                if (m_part !== 2 && data[m_mod][2][mi]) {
                    m_part = 1 - m_part;
                }
                let [target_mod, target_part] = connections[m_mod][m_part];
                let target_t = mi + delays[m_mod][m_part];
                target_t = Math.max(0, Math.min(MAX_T - 1, target_t));
                ctx.beginPath();
                ctx.strokeStyle = "red";
                let target_x = target_t * BUTTON_W - table_off_x + BUTTON_W / 2;
                let target_y = (target_mod * 3 + target_part) * BUTTON_H - table_off_y + BUTTON_H / 2;
                ctx.arc(target_x, target_y, BUTTON_H / 3, 0, Math.PI * 2);
                draw_arrow(x, y, target_x, target_y);
                ctx.stroke();
            }
            else {
                document.body.style.cursor = 'default';
            }
        }
        else {
            ctx.fillStyle = "red";
            for (let j = min_j; j <= max_j; j++) {
                let y = j * BUTTON_H - table_off_y;
                let mod = Math.floor(j / 3);
                let part = j % 3;
                if (faultyConnections[mod][part]) {
                    ctx.fillRect(0, y, BUTTON_W, BUTTON_H);
                }
            }
            ctx.fillStyle = "black";
            ctx.beginPath();
            for (let i = 1; i < 5; i++) {
                let x = i * BUTTON_W;
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
            }
            ctx.stroke();
            ctx.beginPath();
            for (let j = min_j; j < max_j; j++) {
                let y = j * BUTTON_H - table_off_y + BUTTON_H;
                ctx.moveTo(0, y);
                ctx.lineTo(BUTTON_W * 4, y);
            }
            ctx.stroke();
            ctx.beginPath();
            ctx.lineWidth = 3;
            for (let j = min_j - 1; j <= max_j; j++) {
                if (mod(j, 3) === 2) {
                    let y = j * BUTTON_H - table_off_y + BUTTON_H;
                    ctx.moveTo(0, y);
                    ctx.lineTo(BUTTON_W * 4, y);
                }
            }
            ctx.stroke();
            ctx.lineWidth = 1;
            for (let j = min_j; j <= max_j; j++) {
                let x = BUTTON_W / 2;
                let y = j * BUTTON_H - table_off_y + BUTTON_H / 2;
                let mod = Math.floor(j / 3);
                let part = j % 3;
                ctx.fillText((mod + 1).toString() + 'abc'[part], x, y);
                ctx.fillText("=>", x + BUTTON_W, y);
                let [target_mod, target_part] = connections[mod][part];
                let target_delay = delays[mod][part];
                ctx.fillText((target_mod + 1).toString() + 'abc'[target_part], x + BUTTON_W * 2, y);
                ctx.fillText((target_delay <= 0 ? "" : "+") + target_delay.toString(), x + BUTTON_W * 3, y);
            }
            if (mj >= 0 && mj < 3 * N_MODULES) {
                document.body.style.cursor = 'pointer';
                let m_mod = Math.floor(mj / 3);
                let m_part = mj % 3;
                mi = Math.floor(engine_1.mouse.x / BUTTON_W) - 1;
                if (mi === 1) {
                    let [target_mod, target_part] = connections[m_mod][m_part];
                    let [original_target_mod, original_target_part] = connections[m_mod][m_part];
                    if ((0, engine_1.wasKeyPressed)('a')) {
                        target_part = 0;
                    }
                    else if ((0, engine_1.wasKeyPressed)('b')) {
                        target_part = 1;
                    }
                    else if ((0, engine_1.wasKeyPressed)('c')) {
                        target_part = 2;
                    }
                    for (let k = 1; k <= 9; k++) {
                        if (k <= N_MODULES && (0, engine_1.wasKeyPressed)(k.toString())) {
                            target_mod = k - 1;
                        }
                    }
                    let target_j = target_mod * 3 + target_part;
                    target_j = mod(target_j - engine_1.mouse.wheel, N_MODULES * 3);
                    target_mod = Math.floor(target_j / 3);
                    target_part = target_j % 3;
                    if (original_target_mod !== target_mod || original_target_part !== target_part) {
                        connections[m_mod][m_part] = [target_mod, target_part];
                        faultyConnections = findFaultyConnections();
                        reverseConnections = findReverseConnections();
                    }
                }
                else if (mi === 2) {
                    delays[m_mod][m_part] -= engine_1.mouse.wheel;
                }
                else {
                    document.body.style.cursor = 'default';
                }
            }
            else {
                document.body.style.cursor = 'default';
            }
        }
        table_off_x += BUTTON_W;
        table_off_y += BUTTON_H;
        if ((0, engine_1.wasKeyPressed)(' ')) {
            if (EDITOR) {
                if (!faultyConnections.some(x => x.some(y => y))) {
                    EDITOR = false;
                    saveProblem();
                }
            }
            else {
                EDITOR = true;
            }
        }
        (0, engine_1.engine_update)();
        window.requestAnimationFrame(update);
    }
    initOnce();
    function mod(n, m) {
        return ((n % m) + m) % m;
    }
    function draw_arrow(fromx, fromy, tox, toy) {
        var headlen = BUTTON_H / 3; // length of head in pixels
        var dx = tox - fromx;
        var dy = toy - fromy;
        var angle = Math.atan2(dy, dx);
        let arrow_length = Math.sqrt(dx * dx + dy * dy);
        if (arrow_length < 1)
            return;
        let offset = (BUTTON_H / 3) / arrow_length;
        fromx += offset * dx;
        fromy += offset * dy;
        tox -= offset * dx;
        toy -= offset * dy;
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }
});
