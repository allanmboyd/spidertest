exports.options = {
    "config": {
        "describe": "Path to a json configuration file defining custom options. All command line options - except this one and --help - will be used if present. Options specified directly on the command line override file loaded options."
    },
    "help": {
        "alias": "h",
        "describe": "This message."
    },
    "reporters": {
        "alias": "reporters",
        "default": "lib/reporters/ConsoleReporter",
        "describe": "Comma separated list of paths to reporter.js Reporter implementations for reporting test results."
    },
    "reportOptions": {
        "describe": "String of options passed into the createReporter() Reporter function. It is up to the reporter to determine what to do with it."
    },
    "spiderStartUrl": {
        "describe": "The full http url from which to start spidering."
    },
    "test" : {
        "describe": "Path to folder or file containing javascript test definitions "
    }
};