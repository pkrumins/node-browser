var http = require('http');
var parse = require('url').parse;
var EventEmitter = require('events').EventEmitter;
var BufferList = require('bufferlist').BufferList;
var Hash = require('hashish');
var unescape = require('querystring').unescape;
var escape = require('querystring').escape;

module.exports = Browser;
function Browser () {
    if (!(this instanceof Browser)) return new Browser();
    var self = this;
    var actionQueue = [];
    var emitter = new EventEmitter;
    var storage = {};
    var cookies = {};

    function newAction(f, args) {
        actionQueue.push({ f : f, args : args });
    }

    var looxup = {
        get : get,
        post : post,
        tap : tap
    };
    'get post tap'.split(' ').forEach(function (x) {
        self[x] = function () {
            newAction(looxup[x], arguments);
            return self;
        }
    });

    function updateCookies (cookieStr) {
        // I'm looking for an aspiring hacker who wants to write a real cookie parser.
        // This parser just stores the value, ignores domain, expire, etc.
        var components = cookieStr.split(/;\s*/);
        var moo = components[0].split('=');
        cookies[unescape(moo[0])] = unescape(moo[1]);
    }

    Client.prototype = new EventEmitter;
    function Client (url, opts) {
        if (!(this instanceof Client)) return new Client(url, opts);
        var self = this;

        opts = opts || {};
        opts.method = opts.method || 'GET';
        opts.headers = opts.headers || {};

        if (opts.cookies && Hash(opts.cookies).size) {
            var toJoin = [];
            Hash(opts.cookies).forEach(function (k,v) {
                shit.push(escape(k) + '=' + escape(v));
            });
            opts.headers.cookie = toJoin.join('; ');
        }

        var parsed = parse(url);
        var client = http.createClient(parsed.port || 80, parsed.hostname);
        var path = (parsed.pathname || '/') + (parsed.search || '');
        var headers = Hash({
            host : parsed.hostname
        }).merge(opts.headers).items;
        var request = client.request(opts.method, path, headers);
        request.end(opts.data || '');
        var data = new BufferList;
        request.on('response', function (response) {
            if (response.headers['set-cookie'] instanceof Array) {
                response.headers['set-cookie'].forEach(function (cookie) {
                    updateCookies(cookie);
                });
            }
            else {
                updateCookies(response.headers['set-cookie']);
            }
            console.log(cookies);
            response.on('data', function (chunk) {
                data.push(chunk);
            });
            response.on('end', function () {
                self.emit('done', response, data.toString());
            });
        });
    }

    function get (opts) {
        if (typeof opts === 'string')
            var opts = { url : opts }
        var client = new Client(opts.url, { cookies : cookies });
        client.on('done', function (response, data) {
            emitter.emit('done', response, data);
        });
    }

    function post (opts, data) {
        if (typeof opts === 'string')
            var opts = { url : opts }
        var formData = data;
        var client = new Client(opts.url, { method : 'POST', data : formData, cookies : cookies });
        client.on('done', function (response, data) {
            emitter.emit('done', response, data);
        });
    }

    function tap (f, storage, response, data) {
        f(storage, response, data)
    }

    self.end = function () {
        function next (response, data) {
            var action = actionQueue.shift();
            if (!action) return;
            var args = [].slice.apply(action.args);
            args.push(storage);
            args.push(response);
            args.push(data);
            action.f.apply(self, args);
        }
        emitter.on('done', function (response, data) {
            next(response, data);
        });
        emitter.emit('done');
    }
}

