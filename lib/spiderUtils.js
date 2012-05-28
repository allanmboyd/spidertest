var und = require("underscore");

/**
 * Given a String turn it into an Object if it represents an Object and return the Object. Otherwise just return the
 * string.
 * @param {String} s a string that might be a JSON representation of an Object.
 * @return the string as an Object if it is a JSON representation of an Object; otherwise the string
 */
exports.objectify = function(s) {
    var o;
    try {
        o = JSON.parse(s);
    } catch (error) {
        o = s;
    }

    return o;
};

/**
 * Given an array of headers and a headers object return true iff the array contains the headers object. Headers
 * object is tested for equality using the headersEqual method rather than by reference.
 *
 * @param {Object []} headersArray an Array of header Objects
 * @param {Object} headers an Object containing headers (name/value pairs)
 * @return true if headersArray contains headers; false otherwise.
 */
exports.containsHeaders = function(headersArray, headers) {
    var contains = false;
    for (var i = 0; i < headersArray.length && !contains; i += 1) {
        contains = exports.headersEqual(headersArray[i], headers);
    }

    return contains;
};

/**
 * Given two collections of headers return true if each collection contains the same values regardless of order with the
 * exception of the following headers:
 *
 *  - content-length
 *  - cookie
 *  - referer
 *
 * @param {Object} h1 an object of headers
 * @param {Object} h2 an object of headers
 * @return true if h1 and h2 are the same but for excluded headers mentioned above; false otherwise
 */
exports.headersEqual = function(h1, h2) {
    var merged = und.extend(und.clone(h1), h2);
    delete merged.cookie;
    delete merged['content-length'];
    delete merged.referer;
    var minor = und.size(h1) <= und.size(h2) ? h1 : h2;
    var equal = und.size(minor) === und.size(merged);
    if (equal) {
        var keys = und.keys(merged);
        for (var i = 0; i < keys.length && equal; i += 1) {
            equal = merged[keys[i]] === h1[keys[i]] && merged[keys[i]] === h2[keys[i]];
        }
    }

    return equal;
};