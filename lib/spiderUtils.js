var und = require("underscore");

/**
 * Define a RegExp for separating words in string - don't include ':' because that is a special case
 */
var WORD_SEPARATOR_REGEXP = /[\ ,"';\.\{\}\[\]\(\)\?\!\/\-_<>@€#£$%\\`]/;

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
    headers = exports.objectKeysToLowerCase(headers);
    var contains = false;
    for (var i = 0; i < headersArray.length && !contains; i += 1) {
        var lowerCased = exports.objectKeysToLowerCase(headersArray[i]);
        contains = exports.headersEqual(lowerCased, headers);
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
    h1 = exports.objectKeysToLowerCase(h1);
    h2 = exports.objectKeysToLowerCase(h2);

    function removeIgnoredHeaders(headers) {
        delete headers.cookie;
        delete headers['content-length'];
        delete headers.referer;
    }

    removeIgnoredHeaders(h1);
    removeIgnoredHeaders(h2);

    var merged = und.extend(und.clone(h1), h2);
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

/**
 * Given a path replace occurrences of /:something with /.* and return the result.
 *
 * @param {String} path a regular expression string
 * @return {String} path with :something path segments replaced by .*
 */
exports.replacePlaceholdersWithWildcard = function(path) {
    return replaceStringComponents(path, '/', ".*");
};

/**
 * Given a string that is a path (i.e. URL path) and a representation of the path with placeholders
 * determine the values of the placeholders and assign them to an object with the placeholder variable names as
 * object keys.
 *
 * For example:
 *
 *     var v = determinePathVariableValues('/1/2/3', '/:one/:two/:three');
 *     console.log(v);
 *
 * Would output something like:
 *
 *     {
 *         one: '1',
 *         two: '2',
 *         three: '3'
 *     }
 *
 * If _pathWithPlaceholders_ does not match _path_ then an empty object is returned.
 *
 * @param {String} path a URL path - can be relative or absolute
 * @param {String} pathWithPlaceholders the same path but with placeholders for variable path
 * components whose value to determine
 * @return {Object} an Object mapping the placeholder names (without the ':') to the corresponding values in the path
 */
exports.determinePathVariableValues = function(path, pathWithPlaceholders) {
    var pathVariableValues = {};
    var pattern = replaceStringComponents(pathWithPlaceholders, '/', '.*');
    var re = new RegExp(pattern);
    var match = re.exec(path);
    if (match) {
        var pathSegments = path.split('/');
        var placeholderSegments = pathWithPlaceholders.split('/');
        for (var i = 0; i < placeholderSegments.length; i += 1) {
            var subSeg = placeholderSegments[i];
            if (subSeg[0] === ":") {
                var key = subSeg.substr(1);
                pathVariableValues[key] = pathSegments[i];
            }
        }
    }

    return pathVariableValues;
};

/**
 * Given a string containing placeholders and some values replace the placeholders with their values. If a specified
 * placeholder value is not found then the placeholder is replaced with 'undefined'.
 *
 * For example:
 *
 *    var vals = {
 *        'one': '1',
 *        'two': '2',
 *        'three': '3'
 *    };
 *
 *    var replaced = replacePlaceholdersInString("Numbers :one, :two and :three are all expected", vals);
 *    console.log(replaced)
 *
 * Would output:
 *
 *     Numbers 1, 2 and 3 are all expected
 *
 * @param {String) s the string containing placeholders (aka substitutes to replace)
    * @param {Object} values the values of the placeholders - key/value pairs
 * @return {String} the given string with it placeholders replaced by their values.
 */
exports.replacePlaceholdersInString = function(s, values) {
    var replacedString = "";
    var words = s.split(WORD_SEPARATOR_REGEXP);
    var sindex = 0;

    for (var i = 0; i < words.length; i += 1) {
        var word = words[i];
        var extension = '';
        sindex += word.length;
        if (word[0] === ':') {
            if (word[word.length - 1] === ':') {
                word = word.substring(0, word.length - 1);
                extension = ':';
            }
            word = values[word.substr(1)];
        }
        replacedString += word + extension;
        if (i + 1 < words.length) {
            replacedString += s[sindex];
            sindex += 1;
        }
    }

    return replacedString;
};

/**
 * Given an object return a copy of the object but with the keys converted to lower case.
 * @param {Object} object an object
 * @return {Object} another object the same as the given object but with all key names in lower case
 */
exports.objectKeysToLowerCase = function(object) {
    var lowerCased = {};
    var headerNames = und.keys(object);
    headerNames.forEach(function(headerName) {
        lowerCased[headerName.toLowerCase()] = object[headerName];
    });
    return lowerCased;
};

function replaceStringComponents(s, separator, replacement) {
    var result = '';
    var segments = s.split(separator);
    for (var i = 0; i < segments.length; i += 1) {
        var segment = segments[i];
        if (segment[0] === ':') {
            segment = replacement;
        }
        result += segment;
        if (i + 1 < segments.length) {
            result += separator;
        }
    }

    return result;
}