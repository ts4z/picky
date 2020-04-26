'use strict';

// rng picks a number between 0 and max.  This is a poor implementation and
// probably has small biases.
function rng(max) {
    return Math.floor(Math.random() * max);
}

// fyShuffle performs a Fisher-Yates shuffle on 'a'.
function fyShuffle(a) {
    for (var i = a.length; i--; ) {
        var j = rng(i);
        var t = a[i];
        a[i] = a[j];
        a[j] = t;
    }
    return a;
}

// rngShuffle performs a decorate-sort-undecorate operation with random keys.
// This is not a true random shuffle as the keys assigned may duplicate, so it
// should not be used alone.  But combined with fyShuffle, it may help cover up
// any possible bugs in fyShuffle (and shuffling a deck twice won't put it back
// in order).
function rngShuffle(a) {
    var decorated = a.map(v => [rng(16*a.length), v]);
    decorated.sort((one, two) => one[0] - two[0]);
    return decorated.map(el => el[1]);
}

// Shuffle the array, returning a new, shuffled array.
function shuffle(a) {
    return rngShuffle(fyShuffle(a));
}

// Split on newline, return values in an array.  Ignore empty lines and
// whitespace at the start or end of the line.
function splitLines(s) {
    var t = s.split(/\s*\n+\s*/);
    var r = [];
    for (var i = 0; i < t.length; i++) {
        var tt = t[i].trim();
        if (tt !== "") {
            r.push(tt);
        }
    }
    return r;
}

// Expand multiplier labels.  ["3x A", "B"] => ["A","A","A","B"].  If someone's
// name begins with /\d+x/, e.g., "3000x Bobby Tables", you can escape it with
// 1x like this: "1x 3000x Bobby Tables".  And we actually don't care if the
// 'x' is there anymore.
function expandMultipliers(a) {
    var prizes = [];
    var re = /(?:(\d+)x?)\s+(.*)/;
    for (var i = 0; i < a.length; i++) {
        var p = a[i];
        var match = re.exec(p);
        if (match) {
            for (var j = 0; j < match[1]; j++) {
                prizes.push(match[2]);
            }
        } else {
            prizes.push(p);
        }
    }
    return prizes;
}

function valueOrDefault(el, def="") {
    var el = document.getElementById(el);
    if (el !== null) {
        return el.value;
    }
    return def;
}

var selectedWinners = undefined;
const winnersId = "out";

function actuallyClearWinners() {
    document.getElementById(winnersId).value = "";
    selectedWinners = undefined;
    enable("selectWinners");
    disable("clearWinners");
}

function maybeClearWinners() {
    if (confirm("Are you sure you want to clear the winners list?")) {
        actuallyClearWinners();
    }
}

function selectWinners() {
    var contestants = shuffle(expandMultipliers(splitLines(valueOrDefault("contestants"))));
    var prizes = expandMultipliers(splitLines(valueOrDefault("prizes")));
    var out = document.getElementById(winnersId);

    if (contestants.length < prizes.length) {
        out.value =
            ("There are more prizes than contestants.\n" +
             "That seems weird.");
        return;
    }

    var winners = [];
    for (var i = 0; i < prizes.length; i++) {
        winners.push({natural: i, name: contestants[i], prize: prizes[i]});
    }

    selectedWinners = winners;
    populateWinnersBox();
}

function enable(id) {
    document.getElementById(id).disabled = false;
}

function disable(id) {
    document.getElementById(id).disabled = true;
}

function populateWinnersBox() {
    if (selectedWinners.length == 0) {
        return;
    }
    
    enable("clearWinners");
    disable("selectWinners");
    
    switch (valueOrDefault("sortBy")) {
    case "name":
        selectedWinners.sort((a,b) => a.name.localeCompare(b.name));
        break;
    case "prize":
        selectedWinners.sort((a,b) => a.prize.localeCompare(b.prize));
        break;
    case "no": default:
        selectedWinners.sort((a,b) => a.natural - b.natural);
        break;
    }
    
    var v = "";
    var l = (selectedWinners.length + "").length;
    for (var i = 0; i < selectedWinners.length; i++) {
        var w = selectedWinners[i];
        v += (i+1+"").padStart(l) +
            " -- " + (w.name.padEnd(30)) +
            " -- " + w.prize + "\n";
    }

    var out = document.getElementById(winnersId);
    out.value = v;
}

function relativeFile(f) {
    var here = location.href;
    return here.substring(0, here.lastIndexOf('/')) + '/' + f;
}

function fetchMy(file, andThen) {
    var req = new XMLHttpRequest();
    req.addEventListener("load", () => { andThen(req.responseText); })
    req.addEventListener("error", () => {
        console.alert("Couldn't load test data (failed). Just make some up.");
    })
    req.addEventListener("error", () => {
        console.alert("Couldn't load test data (aborted). Just make some up.");
    })
    req.open("GET", relativeFile(file));
    req.send();
}

function insertData(file, id) {
    var el = document.getElementById(id);
    if (el === null) {
        console.log("can't find element id:", id);
        return;
    }
    if (el.value !== "") {
        if (!confirm("Really throw away data and replace with test data?")) {
            return;
        }
    }
    fetchMy(file, contents => { el.value = contents })
}
