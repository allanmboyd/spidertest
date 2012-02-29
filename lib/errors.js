var Exception = require("exceptions").Exception;

exports.NO_ROUTES_FOR_HOST = new Exception("NoRoutesForHost");
exports.NO_ROUTES_FOR_PATH = new Exception("NoRoutesForPath");