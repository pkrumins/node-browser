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
                emitter.emit('done', data.toString());
            });
        });
    }

    function post (url, data) {
        console.log('post ' + url);
    }

    function tap (f) {
        console.log('tap ');
    }

    self.end = function () {
        function next (data) {
            var action = actionQueue.shift();
            if (!action) return;
            action.f.apply(self, action.args);
        }
        emitter.on('done', function (data) {
            console.log('data: ' + data)
            next(data);
        });
        emitter.emit('done');
    }
}

