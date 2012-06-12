exports.options = {
    "config": {
        "describe": "Path to a json configuration file defining custom options. All command line options - except this one and --help - will be used if present. Options specified directly on the command line override file loaded options."
    },
    "failOnMissingRoute": {
        "default": "false",
        "describe": "Set to true if spidering should stop when a route to an encountered link is not available"
    },
    "failOnNoResponse": {
        "default": "false",
        "describe": "Set to true if spidering should stop when a HTTP request fails to get a response"
    },
    "help": {
        "alias": "h",
        "describe": "This message."
    },
    "reporters": {
        "default": "../lib/reporters/ConsoleReporter",
        "describe": "Comma separated list of paths to reporter.js Reporter implementations for reporting test results."
    },
    "reporterOptions": {
        "describe": "String of options passed into the createReporter() Reporter function. If the given string is a " +
            "JSON object it is converted into a JSON object before being passed to the reporters. It is up to the " +
            "reporter to determine what to do with it."
    },
    "retainCookies": {
        "default": "true",
        "describe": "Retain cookies for future requests i.e. cookies returned by a response will be resent on the " +
            "request to subsequent spidered URLs."
    },
    "spiderCrossDomain": {
        "default": "false",
        "describe": "Allow spidering to continue across different domains"
    },
    "spiderStart": {
        "describe": "The full http url(s) from which to start spidering. This can be a single url or comma separated" +
            " list of urls."
    },
    "testDir" : {
        "describe": "Absolute path to folder containing javascript test definitions "
    }
};