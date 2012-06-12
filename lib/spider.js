/**
 * Based on a fork of v0.0.1 of https://github.com/mikeal/spider from https://github.com/rgarcia/spider updated by me
 * this spider adds auto spidering options, an option to throw an exception on a missing route and some other bits.
 */
var request = require('request');
var urlParse = require('url').parse;
var routes = require('routes');
var events = require('events');
var util = require('util');
var errors = require("./errors");
var cheerio = require('cheerio');
var options = require("./spiderOptions");
var url = require("url");
var retainCookies = true;

var AUTO = options.AUTO;

var defaultUserAgent = 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_4; en-US) ' +
    'AppleWebKit/534.7 (KHTML, like Gecko) Chrome/7.0.517.41 Safari/534.7';

var headers = {
    'accept': "application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,image/jpg,*/*;q=0.5",
    'accept-language': 'en-US,en;q=0.8',
    'accept-charset':  'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
    'user-agent': defaultUserAgent
};

var debug = 1, info = 50, error = 100;

var logLevels = {debug:debug, info:info, error:error, 1:'debug', 50:'info', 100:'error'};


function Spider(options) {
    this.autoSpiderAll = options.auto || 0;
    this.throwOnFailedResponseParse = options.throwOnFailedResponseParse || false;
    this.throwOnMissingRoute = options.throwOnMissingRoute || false;
    this.throwOnNoResponse = options.throwOnNoResponse || false;
    this.retainCookies = options.retainCookies === undefined || options.retainCookies ? retainCookies : false;
    this.maxSockets = options.maxSockets || 4;
    this.pool = options.pool || {maxSockets: options.maxSockets};
    this.spiderCrossDomain = options.spiderCrossDomain || false;
    this.options = options;
    this.currentUrl = null;
    this.routers = {};
    this.urls = [];
    this.headers = options.defaultHeaders || headers;
    this.responseCookies = [];
}

util.inherits(Spider, events.EventEmitter);

/**
 * Invoke a HTTP GET request on the specified URL. The URL is parsed and checked for known routes. Some request
 * headers are set by default: accept, accept-language, accept-charset, referer, user-agent
 *
 * @param {String} url the URL to request
 * @param {Function} requestHeaderProvider optional Function that is given the url and is expected to
 * return the set of headers to use for the HTTP GET associated with the given url. If an array containing multiple
 * sets of headers is returned then the url will be requested once for each set of headers.
 */
Spider.prototype.get = function (url, requestHeaderProvider) {
    if (!url) {
        return;
    }
    var self = this;

    url = url.slice(0, (url.indexOf('#') === -1) ? url.length : url.indexOf('#'));

    if (this.urls.indexOf(url) !== -1) {
        // Already handled this request
        this.emit('log', debug, 'Already received one get request for ' + url + '. skipping.');
        return this;
    }
    this.urls.push(url);

    var u = urlParse(url);
    if (!this.domain) {
        this.domain = u.hostname;
    }
    if (!this.routers[u.host]) {
        if (this.throwOnMissingRoute) {
            errors.NO_ROUTES_FOR_HOST.thro("No routes for host '" + u.host + "'");
        } else {
            this.emit('log', debug, 'No routes for host: ' + u.host + '. skipping.');
            return this;
        }
    }
    if (!this.routers[u.host].match(u.href.slice(u.href.indexOf(u.host) + u.host.length))) {
        if (this.throwOnMissingRoute) {
            errors.NO_ROUTES_FOR_PATH.thro("No routes for path '" + u.href + "'");
        } else {
            this.emit('log', debug, 'No routes for path ' + u.href.slice(u.href.indexOf(u.host) + u.host.length) +
                '. skipping.');
            return this;
        }
    }
    if (u.hostname !== this.domain && !options.spiderCrossDomain) {
        return this;
    }

    var headerSets = [self.headers];
    if (requestHeaderProvider) {
        var providedHeaderSets = requestHeaderProvider(url);
        if (providedHeaderSets && providedHeaderSets.length > 0) {
            headerSets = providedHeaderSets;
        }
    }

    headerSets.forEach(function(headerSet) {
        if (!headerSet.referer) {
            headerSet.referer = url;
        }

        var jar = request.jar();
        if (self.retainCookies) {
            // todo may need to consider domain of the next request when adding cookies from the last response
            self.responseCookies.forEach(function(cookieString) {
                var cookie = request.cookie(cookieString);
                jar.add(cookie);
            });
        }
        var headerCookies = extractHeaderCookies(headerSet);
        headerCookies.forEach(function(cookieString) {
            var cookie = request.cookie(cookieString);
            jar.add(cookie);
        });
        
        var requestOptions = {
            url: url,
            headers: headerSet,
            pool: self.pool,
            jar: jar
        };

//        console.log("******* JAR ********");
//        console.log(jar);
        request(requestOptions, function (e, resp) {
            self.emit('log', debug, 'Response received for ' + url + '.');

            if (e || !resp) {
                if (this.throwOnNoResponse) {
                    console.log(e); //todo make sure this exception is visible when it is needed
                    self.emit('log', debug, 'Error getting URL ' + url);
                    throw new Error("Failed to get response from: " + url);
                } else {
                    self.emit('log', error, 'Failed to get reponse from: ' + url);
                }
            } else {
                self._handler(url, requestHeaderProvider, resp);
            }
        });
    });

    return this;
};

Spider.prototype.route = function (hosts, pattern, cb) {
    var self = this;
    if (typeof hosts === 'string') {
        hosts = [hosts];
    }
    hosts.forEach(function (host) {
        if (!self.routers[host]) {
            self.routers[host] = new routes.Router();
        }
        self.routers[host].addRoute(new RegExp(pattern), cb);
    });
    return self;
};

Spider.prototype._handler = function (url, headerProvider, response) {
    try {
        this.responseCookies = serverCookies(response);
        var u = urlParse(url);
        var $;
        try {
            $ = cheerio.load(response.body);
        } catch(e) {
            if (options.throwOnFailedResponseParse) {
                throw e;
            } else {
                this.emit('log', error, 'Failed to parse response from: ' + url);
                this.emit('log', error, e.message);
                return;
            }
        }
        if (this.routers[u.host]) {
            var r = this.routers[u.host].match(u.href.slice(u.href.indexOf(u.host) + u.host.length));
            r.spider = this;
            r.response = response;
            r.url = u;

            this.currentUrl = url;
            r.fn.call(r, $, url); // This calls the function associated with the matched route
            this.currentUrl = null;
        }
        if (this.options.autoSpider) {
            var auto = this.options.autoSpider;
            if (auto & AUTO.ANCHORS) {
                spiderUrls("a", this, headerProvider, response, $);
            }
            if (auto & AUTO.IMAGES) {
                spiderUrls("img", this, headerProvider, response, $, "src");
            }
            if (auto & AUTO.LINKS) {
                spiderUrls("link", this, headerProvider, response, $);
            }
            if (auto & AUTO.SCRIPTS) {
                spiderUrls("script", this, headerProvider, response, $, "src");
            }
        }
    } catch(e) {
        if (e.message === "Maximum call stack size exceeded") {
            this.emit('log', error, e.message);
            this.emit('log', error, "This might be happening because some http response is too large for the available stack memory. See node --max-stack-size.");
        } else {
            this.emit('log', error, e);
            throw e;
        }
    }
};

Spider.prototype.log = function (level) {
    if (typeof level === 'string') {
        level = logLevels[level];
    }
    this.on('log', function (l, text) {
        if (l >= level) {
            console.log('[' + (logLevels[l] || l) + ']', text);
        }
    });
    return this;
};

module.exports = function (options) {
    return new Spider(options || {});
};

function spiderUrls(tagName, spider, headerProvider, response, $, attr) {
    var base = baseUrl(response);
    $(tagName).each(function() {
        callSpider(spider, headerProvider, $, this, base, attr);
    });
}

function callSpider(spider, headerProvider, $, tag, baseURL, attr) {
    attr = attr ? attr : "href";
    var href = $(tag).attr(attr);
    if (href) {
        href = url.resolve(baseURL, href);
        spider.get(href, headerProvider);
    }
}

function baseUrl(response) {
    return response.request.uri.protocol + "//" + response.request.uri.host;
}

/**
 * Pull out the cookie from a header set. It is assumed that there is a max of 1 cookie header per header set. The
 * cookie is removed from the headerSet if found.
 *
 * @param {Object} headerSet the set of headers from which to extract the cookies
 */
function extractHeaderCookies(headerSet) {
    var cookie = headerSet.cookie;
    var cookies = cookie ? cookies.split(';') : [];
    delete headerSet.cookie;
    return cookies;
}

function serverCookies(response) {
    var responseCookies = [];
    var cookies = response.headers['set-cookie'];
    if (cookies) {
        responseCookies = cookies;
    }
    return responseCookies;
}