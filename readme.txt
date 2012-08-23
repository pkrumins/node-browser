[![build status](https://secure.travis-ci.org/pkrumins/node-browser.png)](http://travis-ci.org/pkrumins/node-browser)
A node.js module for browsing a web in an awesome way! I wrote it for my
social-submitter software (http://github.com/pkrumins/social-submitter).

It was written by Peteris Krumins (peter@catonmat.net).
His blog is at http://www.catonmat.net  --  good coders code, great reuse.

------------------------------------------------------------------------------

Check this out:

    var Browser = require('browser');

    var browser = new Browser;
    browser
        .get('http://www.reddit.com')
        .post(
            'http://www.reddit.com/api/login/' + data.username,
            {
                op : 'login-main',
                user : data.username,
                passwd : data.password,
                id : '#login_login-main',
                renderstyle : 'html'
            }
        )
        .get('http://www.reddit.com/r/' + data.subreddit)
        .get('http://www.reddit.com/r/' + data.subreddit + '/submit')
        .post(
            'http://www.reddit.com/api/submit',
            {
                uh : 'todo',
                kind : 'link',
                sr : data.subreddit,
                url : data.url,
                title : data.title,
                id : '#newlink',
                r : data.subreddit,
                renderstyle : 'html'
            }
        )
        .end();

This logs you into Reddit and submits a story to data.subreddit subreddit.

Also check out social-submitter software that submits to hacker news, twitter,
facebook, and other sites:

    http://github.com/pkrumins/social-submitter


------------------------------------------------------------------------------

Happy browsing!


Sincerely,
Peteris Krumins
http://www.catonmat.net

