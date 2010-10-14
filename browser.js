var http = require('http');
var parse = require('url').parse;
var EventEmitter = require('events').EventEmitter;
var BufferList = require('bufferlist').BufferList;

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

    function get (url) {
        var parsed = parse(url);
        var client = http.createClient(parsed.port || 80, parsed.hostname);
        var path = (parsed.pathname || '/') + (parsed.search || '');
        var request = client.request('GET', path, {
            host : parsed.hostname
        });
        request.end();
        var data = new BufferList;
        request.on('response', function (response) {
            response.on('data', function (chunk) {
                data.push(chunk);
            });
            response.on('end', function () {
                emitter.emit('done', response, data.toString());
            });
        });
    }

    function post (url, data) {
        console.log('post ' + url);
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

