levels_named = [
[`\
########.#####
########*#####
########.#..##
########_..1.#
########..1..#
########.#._.#
########.#####
..O...1._#####
##############`, [1, 0], [0, -1], "Intro", "knexator"],
/*
[`\
.######...
##....#...
#.1.2.####
#..#..__.#
##O#####*#
.#.#...#.#
.#.#...#.#`, [0, -1], [0, 1]],*/
[`\
##########
##....####
#.1.2.####
#..#..__.#
##O#####*#
##.#####.#`, [0, -1], [0, 1], "Don't reset yet", "knexator"],
/*[`\
##########
##....####
#.1.2.####
#..#..__.#
##O#####*#
##.#####.#
##.#####.#`, [0, -1], [0, 1]],*/
/*[`\
########
#####.##
.O....##
###2..##
###.._*.
########`, [1, 0], [1, 0]],*/
[`\
##.#####
##O#####
##.#####
##.2.###
##.#.###
#...._*.
########`, [0, 1], [1, 0], "Undo Donut", "knexator"],
[`\
############
########_.*.
###.2_.._###
.O....#..###
#####..1.###
#####....###
############`, [1, 0], [1, 0], "Reuse", "knexator"],
[`\
#########
####.__*.
.O..1.###
###2..###
###..####
#########`, [1, 0], [1, 0], "Undoing good deeds", "knexator"],
[`\
###########
###...__.*.
###..2_####
.O.1.#...##
###._2...##
#####..####
###########`, [1, 0], [1, 0], "Rise of the undoed", "knexator"],
[`\
##.#######
##O#######
#...######
#.12.#####
##.3___.*.
##########`, [0, 1], [1, 0], "Tres", "knexator"],
[`\
############
########_.*.
###.3_.._###
.O....#..###
#####.2..###
#####...####
############`, [1, 0], [1, 0], "Recycle", "knexator"],
[`\
##.#####
##O#####
##.#####
##3.####
#..._.*.
##..####
########`, [0, 1], [1, 0], "Oh no", "knexator"],
[`\
#########
#..._..##
#.1#2#3.#
#.._._..#
##.#_####
.O.#_..*.
#########`, [1, 0], [1, 0], "Binary", "knexator"],
[`\
###.#######
###O#######
###...#####
#_..1.__.*.
##3#..#####
##._..#####
###########`, [0, 1], [1, 0], "Tres Undos", "knexator"],
[`\
#########
###.___*.
###3.####
###_..###
.O..2_###
###.1.###
###..####
#########`, [1, 0], [1, 0], "Misdirected", "knexator"],
[`\
###########
###......##
.O.i_1.1.##
##..#....##
#####_#####
####..._.*.
###########`, [1, 0], [1, 0], "Z Sigil", "knexator"],
[`\
##########
#...#.####
#.u..._2.#
###2._...#
.O....####
#####.####
####..._*.
##########`, [1, 0], [1, 0], "X Sigil", "knexator"],
[`\
#########
###....##
.O.2.2.##
####u####
###.i####
###.._###
###_.._*.
#########`, [1, 0], [1, 0], "Peeling paint", "knexator"],
[`\
###########
###..######
.O..1_._.*.
###...o####
#####..####
###########`, [1, 0], [1, 0], "C Sigil", "knexator"],
/*[`\
,,,,,#.#
,,####*#
###..#_#
#.._2#_#
#..u...#
#.2.##.#
##_.####
,#..#,,,
,##O#,,,
,,#.#,,,
,,#.#,,,`, [0, -1], [0, -1]],*/
[`\
###########
#####...###
###._2..###
.O....u_.##
######.2.##
######.####
#####..__*.
###########`, [1, 0], [1, 0], "Dirty floor", "knexator"],
[`\
.......#.#....
.......#.####.
.......#*#..##
.......#_..1.#
.......#..1..#
.......#.#._.#
########.#####
..O..1.._#....
##########....`, [1, 0], [0, -1], "The end", "knexator"],
];
/*
[`\
....#####.
#####...##
.*.._..1.#
#####....#
#####....#
..O1..._.#
#####...##
....#####.`, [1, 0], [-1, 0]],
*/
/*[`\
###..##,,,,,
..O.1.#,,,,,
###.23#,,,,,
,,##._#,,,,,
,,,##_#,,,,,
,,,,#*#,,,,,
,,,,#.#,,,,,
,,,,#.#,,,,,`, [1, 0], [0, 1]],*/
/*[`\
,######,,
##....#,,
#.1.2.###
#..#_._*.
##O######
,#.#,,,,,`, [0, -1], [1, 0]],*/
/*[`\
,######,,
##....#,,
#.1.2.###
#..#.__*.
##O######
,#.#,,,,,`, [0, -1], [1, 0]],*/
/*[`\
,######,,
##....#,,
#.1.2.###
#..#.._-.
##O######
,#.#,,,,,`, [0, -1], [1, 0]],*/
/*[`\
,######,,,
##....#,,,
#.1.2.####
#..#..__*.
##O#######
,#.#,,,,,,`, [0, -1], [1, 0]],*/

/*[`\
,,,,####,,,
,####..###,
##.._2...#,
.O.1.#...#,
###..2_####
,,#...__.*.
,,#########`, [1, 0], [1, 0]],*/ // vflip
/*[`\
,,###,
###.#,
.O..#,
##2.##
,#.._*
,#####`, [1, 0], [1, 0]],*/
/*[`\
#######,,
.O....#,,
##_...###
##.#1...#
.*.#_.1.#
#########`, [1, 0], [-1, 0]],*/ // just bad sokoban
/*[`\
#######
#.....#
#.2._.#
####1##
.O..._*
#######`, [1, 0], [1, 0]],*/

/*[`\
########,
.O.....#,
###.1..##
,,#.##..#
,,#__...#
,,#.#3###
###...#,,
.*._###,,
#####,,,,`, [1, 0], [-1, 0]],*/
/*[`\
,########
,#.....O.
##..1.###
#..##.#,,
#..._.#,,
###3#.#,,
,,#...###
,,###..*.
,,,,#####`, [-1, 0], [1, 0]],*/