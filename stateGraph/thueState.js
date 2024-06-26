let initialState = "#AAA#";
function parseRules(ascii) {
    return ascii.trim().split("\n").map(x => {
        return x.split("⇒").map(r => r.trim());
    });
}
const RULES = parseRules(`
#AAA#⇒Win!
AC⇒CA
CA⇒AC
AD⇒DA
DA⇒AD
BC⇒CB
CB⇒BC
BD⇒DB
DB⇒BD
ECA⇒CE
CE⇒ECA
EDB⇒DE
DE⇒EDB
CDCA⇒CDCAE
CDCAE⇒CDCA
CAAA⇒AAA
AAA⇒CAAA
DAAA⇒AAA
AAA⇒DAAA
`);
function isWon(state) {
    return state === "Win!";
}
function nextStates(state) {
    let result = {};
    RULES.forEach(([leftRule, rightRule], ruleIndex) => {
        let cur_pos = 0;
        while (cur_pos <= state.length - leftRule.length) {
            cur_pos = state.indexOf(leftRule, cur_pos);
            if (cur_pos === -1)
                break;
            let new_state = state.slice(0, cur_pos) + rightRule + state.slice(cur_pos + leftRule.length);
            result[`${ruleIndex}.${cur_pos}`] = new_state;
            cur_pos += 1;
        }
    });
    return result;
}
function id(state) {
    return state;
}
function isClearlyLost(state) {
    return false;
}
export let State = { initialState, nextStates, isWon, id, isClearlyLost };
