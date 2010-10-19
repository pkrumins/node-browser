var Browser = require('browser');
var http = require('http');

var port =  parseInt(5000 + Math.random()*30000);
http.createServer(function (request, response) {
    response.writeHead(200, {
        'Set-Cookie' : [
            'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT',
            'lang=en; path=/',
            'auth_token=moo; domain=.twitter.com; path=/',
            '_twitter_sess=foo; domain=.twitter.com; path=/'
        ]
    });
    response.end();
}).listen(port);

module.exports.cookie = function (assert) {
    setTimeout(function () {
        var browser = new Browser;
        var executed = 0;
        browser
            .get('http://localhost:' + port)
            .tap(function (storage, response, data) {
                executed++;
                console.dir(response);
            })
            .end();

        setTimeout(function () {
            assert.equal(executed, 1)
        }, 2000);
    }, 1000);
}

