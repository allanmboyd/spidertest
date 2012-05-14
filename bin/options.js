exports.options = {
    "config": {
        "describe": "Path to a json configuration file defining custom options. All command line options - except this one and --help - will be used if present. Options specified directly on the command line override file loaded options."
    },
    "failOnMissingRoute": {
        "default": "false",
        "describe": "Set to true if spidering should stop when a route to an encountered link is not available"
    },
    "help": {
        "alias": "h",
        "describe": "This message."
    },
    "reporters": {
        "default": "../lib/reporters/ConsoleReporter",
        "describe": "Comma separated list of paths to reporter.js Reporter implementations for reporting test results."
    },
    "reportOptions": {
        "describe": "String of options passed into the createReporter() Reporter function. It is up to the reporter to determine what to do with it."
    },
    "spiderCrossDomain": {
        "default": "false",
        "describe": "Allow spidering to continue across different domains"
    },
    "spiderStartUrl": {
        "describe": "The full http url from which to start spidering."
    },
    "testDir" : {
        "describe": "Absolute path to folder containing javascript test definitions "
    }
};