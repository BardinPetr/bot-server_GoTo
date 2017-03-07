'use strict';

module.exports.log = function(data) {
    console.log(data);
};

module.exports.dbarr_to_str = function(data) {
    var out = [];
    try {
        for (var i = 0; i < data.length; i++) {
            out[i] = data[i].join(": ");
        }
        return out.join("\n");
    }
    catch (E) {

    }
    return "";
};

module.exports.str_to_dbarr = function(data) {
    try {
        var prearr = data.split("\n");
        for (var i = 0; i < prearr.length; i++) {
            prearr[i] = prearr[i].split(": ");
        }
        return prearr;
    }
    catch (E) {

    }
    return [];
};


module.exports.unique = function(data) {
    data = data.sort();
    var a = data[0],
        k = 1;

    for (var i = 1; i < data.length; i++) {
        if (data[i] !== a) {
            data[k] = data[i];
            a = data[i];
            k++;
        }
    }
    data.length = k;
    return data;
};

module.exports.ncmd = function(text, cmds) {
    for (var i = 0; i < cmds.length; i++) {
        var x = cmds[i];
        if (text.indexOf(x) !== -1) {
            return 0;
        }
    }
    return 1;
};
