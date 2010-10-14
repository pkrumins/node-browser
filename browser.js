module.exports = Browser;
function Browser () {
    if (!(this instanceof Browser)) return new Browser();
    var self = this;
    var actionQueue = [];

    function newAction(f, args) {
        actionQueue.push({ f : f, args : args });
    }

    self.get = function (url) {
        newAction(self.get, arguments);
        return self;
    }

    self.post = function (url, data) {
        newAction(self.post, arguments);
        return self;
    }

    self.tap = function () {
        newAction(self.tap, arguments);
        return self;
    }

    function get (url) {
        console.log('get ' + url);
    }

    function post (url, data) {
        console.log('post ' + url);
    }

    function tap () {
        console.log('tap ');
    }

    self.end = function () {
        self.get = get;
        self.post = post;
        (function f () {
            var action = actionQueue.shift();
            if (!action) return;
            action.f.apply(self, action.args);
            f();
        })();
    }
}

