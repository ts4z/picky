'use strict';

function dlog(...args) {
    // console.log(...args);
}

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
        if (tt != "") {
            r.push(tt);
        }
    }
    dlog("split output ", r, "length", r.length);
    return r;
}

// Expand multiplier labels.  ["3x A", "B"] => ["A","A","A","B"].  If someone's
// name begins with /\d+x/, e.g., "3000x Bobby Tables", you can escape it with
// 1x like this: "1x 3000x Bobby Tables".
function expandMultipliers(a) {
    var prizes = [];
    var re = /(?:(\d+)x)\s+(.*)/;
    for (var i = 0; i < a.length; i++) {
        var p = a[i];
        var match = re.exec(p);
        if (match) {
            dlog("match", match[1], match[2]);
            for (var j = 0; j < match[1]; j++) {
                prizes.push(match[2]);
            }
        } else {
            dlog("noexpand ", p);
            prizes.push(p);
        }
    }
    return prizes;
}

function valueOrEmpty(el) {
    var el = document.getElementById(el);
    if (el != null) {
        return el.value;
    }
    dlog("no value in ", el);
    return "";
}

function populateWinners() {
    var id = "out";
    var contestants = shuffle(expandMultipliers(splitLines(valueOrEmpty("contestants"))));
    var prizes = expandMultipliers(splitLines(valueOrEmpty("prizes")));
    var out = document.getElementById(id);

    if (contestants.length < prizes.length) {
        out.value =
            ("There are more prizes than contestants.\n" +
             "That seems weird.");
        return;
    }

    var v = "";
    var l = (prizes.length + "").length;
    for (var i = 0; i < prizes.length; i++) {
        v += (i+1+"").padStart(l) +
            " -- " + (contestants[i].padEnd(30)) +
            " -- " + prizes[i] + "\n";
    }

    out.value = v;
}

function relativeFile(f) {
    // var here = location.href;
    var here = "https://ts4z.net/picky/";
    return here.substring(0, here.lastIndexOf('/')) + '/' + f;
}

function fetchMy(file, andThen) {
    var req = new XMLHttpRequest();
    req.addEventListener("load", () => { andThen(req.responseText); })
    req.open("GET", relativeFile(file));
    req.send();
}

function insertData(file, id) {
    var el = document.getElementById(id);
    if (el == null) {
        console.log("can't find element id:", id);
        return;
    }
    fetchMy(file, contents => { el.value = contents })
}
