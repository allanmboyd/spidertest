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