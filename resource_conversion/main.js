var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/ansi-regex/index.js
var require_ansi_regex = __commonJS({
  "node_modules/ansi-regex/index.js"(exports, module2) {
    "use strict";
    module2.exports = (options) => {
      options = Object.assign({
        onlyFirst: false
      }, options);
      const pattern = [
        "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
        "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
      ].join("|");
      return new RegExp(pattern, options.onlyFirst ? void 0 : "g");
    };
  }
});

// node_modules/strip-ansi/index.js
var require_strip_ansi = __commonJS({
  "node_modules/strip-ansi/index.js"(exports, module2) {
    "use strict";
    var ansiRegex = require_ansi_regex();
    var stripAnsi = (string) => typeof string === "string" ? string.replace(ansiRegex(), "") : string;
    module2.exports = stripAnsi;
    module2.exports.default = stripAnsi;
  }
});

// node_modules/prompt-sync/index.js
var require_prompt_sync = __commonJS({
  "node_modules/prompt-sync/index.js"(exports, module2) {
    "use strict";
    var fs = require("fs");
    var stripAnsi = require_strip_ansi();
    var term = 13;
    function create(config) {
      config = config || {};
      var sigint = config.sigint;
      var eot = config.eot;
      var autocomplete = config.autocomplete = config.autocomplete || function() {
        return [];
      };
      var history = config.history;
      prompt.history = history || { save: function() {
      } };
      prompt.hide = function(ask) {
        return prompt(ask, { echo: "" });
      };
      return prompt;
      function prompt(ask, value, opts) {
        var insert = 0, savedinsert = 0, res, i, savedstr;
        opts = opts || {};
        if (Object(ask) === ask) {
          opts = ask;
          ask = opts.ask;
        } else if (Object(value) === value) {
          opts = value;
          value = opts.value;
        }
        ask = ask || "";
        var echo = opts.echo;
        var masked = "echo" in opts;
        autocomplete = opts.autocomplete || autocomplete;
        var fd = process.platform === "win32" ? process.stdin.fd : fs.openSync("/dev/tty", "rs");
        var wasRaw = process.stdin.isRaw;
        if (!wasRaw) {
          process.stdin.setRawMode && process.stdin.setRawMode(true);
        }
        var buf = Buffer.alloc(3);
        var str = "", character, read;
        savedstr = "";
        if (ask) {
          process.stdout.write(ask);
        }
        var cycle = 0;
        var prevComplete;
        while (true) {
          read = fs.readSync(fd, buf, 0, 3);
          if (read > 1) {
            switch (buf.toString()) {
              case "\x1B[A":
                if (masked)
                  break;
                if (!history)
                  break;
                if (history.atStart())
                  break;
                if (history.atEnd()) {
                  savedstr = str;
                  savedinsert = insert;
                }
                str = history.prev();
                insert = str.length;
                process.stdout.write("\x1B[2K\x1B[0G" + ask + str);
                break;
              case "\x1B[B":
                if (masked)
                  break;
                if (!history)
                  break;
                if (history.pastEnd())
                  break;
                if (history.atPenultimate()) {
                  str = savedstr;
                  insert = savedinsert;
                  history.next();
                } else {
                  str = history.next();
                  insert = str.length;
                }
                process.stdout.write("\x1B[2K\x1B[0G" + ask + str + "\x1B[" + (insert + ask.length + 1) + "G");
                break;
              case "\x1B[D":
                if (masked)
                  break;
                var before = insert;
                insert = --insert < 0 ? 0 : insert;
                if (before - insert)
                  process.stdout.write("\x1B[1D");
                break;
              case "\x1B[C":
                if (masked)
                  break;
                insert = ++insert > str.length ? str.length : insert;
                process.stdout.write("\x1B[" + (insert + ask.length + 1) + "G");
                break;
              default:
                if (buf.toString()) {
                  str = str + buf.toString();
                  str = str.replace(/\0/g, "");
                  insert = str.length;
                  promptPrint(masked, ask, echo, str, insert);
                  process.stdout.write("\x1B[" + (insert + ask.length + 1) + "G");
                  buf = Buffer.alloc(3);
                }
            }
            continue;
          }
          character = buf[read - 1];
          if (character == 3) {
            process.stdout.write("^C\n");
            fs.closeSync(fd);
            if (sigint)
              process.exit(130);
            process.stdin.setRawMode && process.stdin.setRawMode(wasRaw);
            return null;
          }
          if (character == 4) {
            if (str.length == 0 && eot) {
              process.stdout.write("exit\n");
              process.exit(0);
            }
          }
          if (character == term) {
            fs.closeSync(fd);
            if (!history)
              break;
            if (!masked && str.length)
              history.push(str);
            history.reset();
            break;
          }
          if (character == 9) {
            res = autocomplete(str);
            if (str == res[0]) {
              res = autocomplete("");
            } else {
              prevComplete = res.length;
            }
            if (res.length == 0) {
              process.stdout.write("	");
              continue;
            }
            var item = res[cycle++] || res[cycle = 0, cycle++];
            if (item) {
              process.stdout.write("\r\x1B[K" + ask + item);
              str = item;
              insert = item.length;
            }
          }
          if (character == 127 || process.platform == "win32" && character == 8) {
            if (!insert)
              continue;
            str = str.slice(0, insert - 1) + str.slice(insert);
            insert--;
            process.stdout.write("\x1B[2D");
          } else {
            if (character < 32 || character > 126)
              continue;
            str = str.slice(0, insert) + String.fromCharCode(character) + str.slice(insert);
            insert++;
          }
          ;
          promptPrint(masked, ask, echo, str, insert);
        }
        process.stdout.write("\n");
        process.stdin.setRawMode && process.stdin.setRawMode(wasRaw);
        return str || value || "";
      }
      ;
      function promptPrint(masked, ask, echo, str, insert) {
        if (masked) {
          process.stdout.write("\x1B[2K\x1B[0G" + ask + Array(str.length + 1).join(echo));
        } else {
          process.stdout.write("\x1B[s");
          if (insert == str.length) {
            process.stdout.write("\x1B[2K\x1B[0G" + ask + str);
          } else {
            if (ask) {
              process.stdout.write("\x1B[2K\x1B[0G" + ask + str);
            } else {
              process.stdout.write("\x1B[2K\x1B[0G" + str + "\x1B[" + (str.length - insert) + "D");
            }
          }
          var askLength = stripAnsi(ask).length;
          process.stdout.write(`\x1B[${askLength + 1 + (echo == "" ? 0 : insert)}G`);
        }
      }
    }
    module2.exports = create;
  }
});

// main.ts
var prompt_sync = require_prompt_sync()({ sigint: true });
var types = ["a", "b", "c", "ab", "ac", "bc", "aa", "bb", "cc", "1", "2"];
var human_rules = [
  ["a,a", "aa,1"],
  ["b,b", "bb,1"],
  ["c,c", "cc,1"],
  ["a,b", "ab,1"],
  ["a,c", "ac,1"],
  ["b,c", "bc,1"],
  ["c,cc", "ab,2"],
  ["b,bb", "ac,2"],
  ["a,aa", "bc,2"],
  ["bc,a", "aa,2"],
  ["ac,b", "bb,2"],
  ["ab,c", "cc,2"]
];
var n_types = types.length;
function str2counts(str) {
  let result = Array(n_types).fill(0);
  if (Array.isArray(types)) {
    str = str.split(",");
  }
  for (let k = 0; k < str.length; k++) {
    const char = str[k];
    result[types.indexOf(char)] += 1;
  }
  return result;
}
function count2str(state) {
  let res = [];
  for (let i = 0; i < n_types; i++) {
    for (let j = 0; j < state[i]; j++) {
      res.push(types[i]);
    }
  }
  if (Array.isArray(types)) {
    return res.join(",");
  } else {
    return res.join("");
  }
}
var all_rules = human_rules.map(([input, output]) => {
  return {
    input: str2counts(input),
    output: str2counts(output),
    basic_count: 1
  };
}).concat(human_rules.map(([input, output]) => {
  return {
    input: str2counts(output),
    output: str2counts(input),
    basic_count: 1
  };
}));
var max_depth = 5;
var depth_helper = [0, all_rules.length];
var cur_complexity_target = 2;
while (depth_helper.length <= max_depth) {
  for (let first_rule_index = 0; first_rule_index < all_rules.length; first_rule_index++) {
    let block_1 = all_rules[first_rule_index];
    let depth_1 = block_1.basic_count;
    for (let second_rule_index = depth_helper[cur_complexity_target - depth_1 - 1]; second_rule_index < depth_helper[cur_complexity_target - depth_1]; second_rule_index++) {
      let block_2 = all_rules[second_rule_index];
      let depth_2 = block_2.basic_count;
      if (depth_1 + depth_2 !== cur_complexity_target) {
        console.log(depth_1, depth_2, cur_complexity_target);
        throw new Error("Bad depth calculation");
      }
      let extra_input = Array(n_types).fill(0);
      let extra_output = Array(n_types).fill(0);
      let any_intersection = false;
      for (let k = 0; k < n_types; k++) {
        let generated = block_1.output[k];
        let consumed = block_2.input[k];
        if (generated > 0 && consumed > 0) {
          any_intersection = true;
        }
        if (generated > consumed) {
          extra_output[k] += generated - consumed;
        } else if (generated < consumed) {
          extra_input[k] += consumed - generated;
        }
      }
      if (any_intersection) {
        for (let k = 0; k < n_types; k++) {
          extra_input[k] += block_1.input[k];
          extra_output[k] += block_2.output[k];
        }
        if (equalCounts(extra_input, extra_output))
          continue;
        let redundant = all_rules.some((block) => isTrivialAddition(block, extra_input, extra_output));
        if (!redundant) {
          all_rules.push({
            input: extra_input,
            output: extra_output,
            basic_count: cur_complexity_target
          });
        }
      }
    }
  }
  depth_helper.push(all_rules.length);
  console.log("Rules with complexity ", cur_complexity_target, ": ", all_rules.length - depth_helper[cur_complexity_target - 1]);
  cur_complexity_target++;
}
console.log("Done!");
all_rules.sort((a, b) => {
  return totalElements(a.input) + totalElements(a.output) - a.basic_count + b.basic_count - totalElements(b.input) - totalElements(b.output);
});
for (let k = 0; k < Math.min(all_rules.length, 200); k++) {
  const cur_rule = all_rules[k];
  console.log(`${count2str(cur_rule.input)} -> ${count2str(cur_rule.output)} (${cur_rule.basic_count})`);
}
while (true) {
  let user_input = str2counts(prompt_sync("Input: "));
  all_rules.filter((x) => equalCounts(x.input, user_input)).forEach((x) => console.log(`${count2str(x.input)} -> ${count2str(x.output)} (${x.basic_count})`));
}
function equalCounts(count_1, count_2) {
  for (let k = 0; k < n_types; k++) {
    if (count_1[k] !== count_2[k])
      return false;
  }
  return true;
}
function isTrivialAddition(block, input, output) {
  for (let k = 0; k < n_types; k++) {
    let i1 = input[k] - block.input[k];
    let o1 = output[k] - block.output[k];
    if (i1 < 0 || o1 < 0)
      return false;
    if (i1 !== o1)
      return false;
  }
  return true;
}
function totalElements(state) {
  let n = 0;
  for (let k = 0; k < n_types; k++) {
    n += state[k];
  }
  return n;
}
