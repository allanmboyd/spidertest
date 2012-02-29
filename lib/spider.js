var request = require('request');
var urlParse = require('url').parse;
var routes = require('routes');
var events = require('events');
var util = require('util');
var errors = require("./errors");
var cheerio = require('cheerio');
var options = require("./spiderOptions");
var url = require("url");

var AUTO = options.AUTO;

var headers = {
    'accept': "application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,image/jpg,*/*;q=0.5",
    'accept-language': 'en-US,en;q=0.8',
    'accept-charset':  'ISO-8859-1,utf-8;q=0.7,*;q=0.3'
};

var firefoxUA = 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_4; en-US) ' +
    'AppleWebKit/534.7 (KHTML, like Gecko) Chrome/7.0.517.41 Safari/534.7';

var copy = function (obj) {
    var n = {};
    for (var i in obj) {
        n[i] = obj[i];
    }
    return n;
};

var debug = 1, info = 50, error = 100;

var logLevels = {debug:debug, info:info, error:error, 1:'debug', 50:'info', 100:'error'};

function MemoryCache() {
    this.cache = {};
}
MemoryCache.prototype.get = function (url, cb) {
    if (!this.cache[url]) return cb(null);
    cb(this.cache[url].response);
};
MemoryCache.prototype.set = function (url, response) {
    this.cache[url] = {response:response};
};

MemoryCache.prototype.getResponse = function (url, cb) {
    if (!this.cache[url]) return cb(null);
    cb(this.cache[url].response);
};

function NoCache() {
}
NoCache.prototype.get = function (url, cb) {
    cb(null);
};

NoCache.prototype.getResponse = function (url, cb) {
    cb(null);
};

NoCache.prototype.set = function () {
};


function Spider(options) {
    this.autoSpiderAll = options.auto || 0;
    this.throwOnMissingRoute = options.throwOnMissingRoute || false;
    this.maxSockets = options.maxSockets || 4;
    this.userAgent = options.userAgent || firefoxUA;
    this.cache = options.cache || new NoCache();
    this.pool = options.pool || {maxSockets: options.maxSockets};
    this.options = options;
    this.currentUrl = null;
    this.routers = {};
    this.urls = [];
}
util.inherits(Spider, events.EventEmitter);
Spider.prototype.get = function (url, referer) {
    if (!url) return;
    var self = this, h = copy(headers);
    referer = referer || this.currentUrl;

    url = url.slice(0, (url.indexOf('#') === -1) ? url.length : url.indexOf('#'));

    if (this.urls.indexOf(url) !== -1) {
        // Already handled this request
        this.emit('log', debug, 'Already received one get request for ' + url + '. skipping.');
        return this;
    }
    this.urls.push(url);

    var u = urlParse(url);
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

    if (referer) h.referer = referer;
    h['user-agent'] = this.userAgent;

    this.cache.getResponse(url, function (c) {
        if (c) {
            if (c['last-modifed']) {
                h['if-modified-since'] = c['last-modified'];
            }
            if (c.etag) {
                h['if-none-match'] = c.etag;
            }
        }

        request.get({url:url, headers:h, pool:self.pool}, function (e, resp) {
            self.emit('log', debug, 'Response received for ' + url + '.');
            if (e || !resp) {
                console.log(e); //todo make sure this exception is visible when it is needed
                self.emit('log', debug, 'Error getting URL ' + url);
                throw new Error("Failed to get response from: " + url);
            } else if (resp.statusCode === 304) {
                self.cache.get(url, function (c_) {
                    c_.statusCode = 304;
                    self._handler(url, referer, c_);
                });
            } else {
                self.cache.set(url, resp);
                self._handler(url, referer, resp);
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
        if (!self.routers[host]) self.routers[host] = new routes.Router();
        self.routers[host].addRoute(pattern, cb);
    });
    return self;
};

Spider.prototype._handler = function (url, referer, response) {
    var u = urlParse(url);
    var $ = cheerio.load(response.body);
    if (this.routers[u.host]) {
        var r = this.routers[u.host].match(u.href.slice(u.href.indexOf(u.host) + u.host.length));
        r.spider = this;
        r.response = response;
        r.url = u;

        this.currentUrl = url;
        r.fn.call(r, $, url);
        this.currentUrl = null;
    }
    if (this.options.autoSpider) {
        var auto = this.options.autoSpider;
        if (auto & AUTO.ANCHORS) {
            spiderUrls("a", this, response, $);
        }
        if (auto & AUTO.IMAGES) {
            spiderUrls("img", this, response, $, "src");
        }
        if (auto & AUTO.LINKS) {
            spiderUrls("link", this, response, $);
        }
        if (auto & AUTO.SCRIPTS) {
            spiderUrls("script", this, response, $, "src");
        }
    }
};

Spider.prototype.log = function (level) {
    if (typeof level === 'string') level = logLevels[level];
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

function spiderUrls(tagName, spider, response, $, attr) {
    var base = baseUrl(response);
    $(tagName).each(function() {
        callSpider(spider, $, this, base, attr);
    });
}

function callSpider(spider, $, tag, baseURL, attr) {
    attr = attr ? attr : "href";
    var href = $(tag).attr(attr);
    href = url.resolve(baseURL, href);
    spider.get(href);
}

function baseUrl(response) {
    return response.request.uri.protocol + "//" + response.request.uri.host;
}