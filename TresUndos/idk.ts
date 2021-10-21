import { StaticProperty, DenseProperty, UndoHistory, Inmunity } from "./properties";

type IntVec = {
  i: number,
  j: number,
}
type Direction = "up" | "down" | "left" | "right"
type BlockType = "#" | "." | "_"  // wall, floor, hole

class Player {
  inmunity: StaticProperty<Inmunity>
  position: DenseProperty<IntVec>
  direction: DenseProperty<Direction>
  constructor(level: Level, i: number, j: number, dir: Direction) {
    this.inmunity = new StaticProperty<Inmunity>(0)
    this.position = new DenseProperty<IntVec>({i: i, j: j}, this.inmunity, level.undoHistory)
    this.direction = new DenseProperty<Direction>(dir, this.inmunity, level.undoHistory)
  }
}

class Level {
  undoHistory: UndoHistory;
  h: number;
  w: number;
  geo: BlockType[][];
  player: Player;

  constructor(data: string) {
    let rows = data.split('\n')

    this.h = rows.length
    this.w = rows[0].length
    this.undoHistory = []

    let geo: BlockType[][] = []
    let player = null;

    for (let j = 0; j < this.h; j++) {
      let geo_row: BlockType[] = []
      for (let i = 0; i < this.w; i++) {
        let char = rows[j][i]
        switch (char) {
          case '#':
            geo_row.push('#')
            break;
          case '@':
            geo_row.push('.')
            player = new Player(this, i, j, "right")
            break;
          default:
            break;
        }
      }
      geo.push(geo_row)
    }
    this.geo = geo
    if (!player) {
      throw new Error("No player in the level")
    }
    this.player = player;
  }
}
