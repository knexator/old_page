hole_levels_raw = [
[`\
,,,,,,#.#,,,,
,,,,,,#*####,
,,,,,,#.#..##
,,,,,,#_..1.#
,,,,,,#..1..#
,,,,,,#.#._.#
#######.#####
.O..1.._#,,,,
#########,,,,`, [1, 0], [0, -1]],  // ,,,,,,#_..1.#
[`\
,######,,,
##....#,,,
#.1.2.####
#..#..__.#
##O#####*#
,#.#,,,#.#`, [0, -1], [0, 1]],
[`\
#.#,,
#O###
#.2.#
#...#
#_###
#*#,,`, [0, 1], [0, 1]],
[`\
#.#,,,,,,
#O#,,####
#.#,,#_*.
#.####.##
#.2_.._#,
#...#..#,
###..1.#,
,,#....#,
,,######,`, [0, 1], [1, 0]],
[`\
,,,######
####.__*.
.O..1.###
###2..#,,
,,#..##,,
,,####,,,`, [1, 0], [1, 0]],
[`\
,,#########
,,#...__.*.
###..2_####
.O.1.#...#,
##.._2...#,
,####..###,
,,,,####,,,`, [1, 0], [1, 0]],
[`\
,####,
##..##
.O.1.#
##.23#
,##._#
,,##_#
,,,#_#
,,,#*#`, [1, 0], [0, 1]],
[`\
#.#,,,,,,
#O#,,####
#.#,,#_*.
#.####.##
#.3_.._#,
#...#..#,
###.2..#,
,,#...##,
,,#####,,`, [0, 1], [1, 0]],
[`\
########,
.O.....#,
###.1..##
,,#.##..#
,,#__...#
,,#.#3###
###...#,,
.*._###,,
#####,,,,`, [1, 0], [-1, 0]],
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
];


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