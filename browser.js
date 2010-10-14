var http = require('http');
var parse = require('url').parse;
var EventEmitter = require('events').EventEmitter;
var BufferList = require('bufferlist').BufferList;
var Hash = require('traverse/hash');

module.exports = Browser;
function Browser () {
    if (!(this instanceof Browser)) return new Browser();
    var self = this;
    var actionQueue = [];
    var emitter = new EventEmitter;
    var storage = {};

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

    Client.prototype = new EventEmitter;
    function Client (url, opts) {
        if (!(this instanceof Client)) return new Client(url);
        var self = this;

        opts = opts || {};
        opts.method = opts.method || 'GET';
        opts.headers = opts.headers || {};

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
            response.on('data', function (chunk) {
                data.push(chunk);
            });
            response.on('end', function () {
                self.emit('done', response, data.toString());
            });
        });

    }

    function get (url) {
        var client = new Client(url);
        client.on('done', function (response, data) {
            emitter.emit('done', response, data);
        });
    }

    function post (url, data) {
        var formData = data;
        var client = new Client(url, { method : 'POST', data : formData });
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

