import { BlendModes } from "shaku/lib/gfx";
import Shaku from "shaku/lib/shaku";
import TextureAsset from "shaku/lib/assets/texture_asset";
import * as dat from 'dat.gui';
import Color from "shaku/lib/utils/color";

const CONFIG = {
    value_1: 100,
    value_2: 0.6,
};
let gui = new dat.GUI({});
gui.remember(CONFIG);
gui.add(CONFIG, "value_1", 0, 200);
gui.add(CONFIG, "value_2", -1, 1);

// init shaku
await Shaku.init();

// add shaku's canvas to document and set resolution to 800x600
document.body.appendChild(Shaku!.gfx!.canvas);
Shaku.gfx!.setResolution(800, 600, true);
// Shaku.gfx!.centerCanvas();
// Shaku.gfx!.maximizeCanvasSize(false, false);

console.log(CONFIG.value_1);
console.log(CONFIG.value_2);

// Loading Screen
Shaku.startFrame();
Shaku.gfx!.clear(Shaku.utils.Color.cornflowerblue);
Shaku.endFrame();

// TODO: INIT STUFF AND LOAD ASSETS HERE
let soundAsset = await Shaku.assets.loadSound('sounds/example_sound.wav');
let soundInstance = Shaku.sfx!.createSound(soundAsset);

let texture = await Shaku.assets.loadTexture('imgs/example_image.png', null);
let sprite = new Shaku.gfx!.Sprite(texture);
sprite.position.set(Shaku.gfx!.canvas.width / 2, Shaku.gfx!.canvas.height / 2);

let texture2 = await loadAsciiTexture(`
        .000.
        .111.
        22222
        .333.
        .3.3.
    `, [Shaku.utils.Color.black,
Shaku.utils.Color.orange,
Shaku.utils.Color.white,
Shaku.utils.Color.blue
]);
let sprite2 = new Shaku.gfx!.Sprite(texture2);
sprite2.position.set(Shaku.gfx!.canvas.width / 2, Shaku.gfx!.canvas.height / 2);
sprite2.size.mulSelf(30);


// do a single main loop step and request the next step
function step() {
    // start a new frame and clear screen
    Shaku.startFrame();
    Shaku.gfx!.clear(Shaku.utils.Color.cornflowerblue);

    // TODO: PUT YOUR GAME UPDATES / RENDERING HERE
    Shaku.gfx!.drawSprite(sprite);
    if (Shaku.input!.pressed("a")) {
        soundInstance.play();
    }

    Shaku.gfx!.drawSprite(sprite2);

    // end frame and request next step
    Shaku.endFrame();
    Shaku.requestAnimationFrame(step);
}

// start main loop
step();


async function loadAsciiTexture(ascii: string, colors: (string | Color)[]): Promise<TextureAsset> {

    let rows = ascii.trim().split("\n").map(x => x.trim())
    console.log(rows)
    let height = rows.length
    let width = rows[0].length

    // create render target
    // @ts-ignore
    let renderTarget = await Shaku.assets.createRenderTarget(null, width, height, 4);

    // use render target
    Shaku.gfx!.setRenderTarget(renderTarget, false);

    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            let val = rows[j][i];
            if (val === '.' || val === ' ') continue;
            let n = parseInt(val);

            let col = colors[n];
            if (typeof col === 'string') {
                col = Shaku.utils.Color.fromHex(col);
            }
            Shaku.gfx!.fillRect(
                new Shaku.utils.Rectangle(i, height - j - 1, 1, 1),
                col,
                BlendModes.Opaque, 0
            );
        }
    }

    // reset render target
    // @ts-ignore
    Shaku.gfx!.setRenderTarget(null, false);

    return renderTarget;
}
