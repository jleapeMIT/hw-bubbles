var child_process = require('child_process');
var gulp = require('gulp');
var mute = require('mute');
var mocha = require('mocha');
var CLIEngine = require("eslint").CLIEngine;
var request = require('request');
var fs = require('fs');
var q = require('q');
var request = require('cheerio');

var cache = {};

function storeCache() {
    for (var key in require.cache) {
        cache[key] = true;
    }
}

function clearCache() {
    for (var key in require.cache) {
        if (!cache[key] && !(/\.node$/).test(key)) {
            delete require.cache[key];
        }
    }
}

function send(data) {
    var auth = {};
    var task = {};
    var lint = {};
    var pkg = JSON.parse(fs.readFileSync('./package.json'));
    task.repo = pkg.name;

    function git(cat) {
        var d = q.defer();

        if (task.type == 'local') {
            child_process.exec(`git config user.${cat}`, function(err, out, code) {
                if (err) {
                    d.reject(err);
                }
                else {
                    auth[cat] = out.trim();
                    d.resolve();
                }
            });
        }
        else if (task.type == 'travis' || task.type == 'docker') {
            var symbol;
            if (cat == 'email') {
                symbol = 'E';
            }
            else if (cat == 'name') {
                symbol = 'n';
            }

            var command;
            if (auth.commit_id) {
                command = `git log -1 ${auth.commit_id} --pretty=%a${symbol}`;
            }
            else {
                command = `git log -n 1 HEAD --pretty=%a${symbol}`;
            }
            child_process.exec(command, function(err, out, code) {
                if (err) {
                    d.reject(err);
                }
                else {
                    auth[cat] = out.trim();
                    d.resolve();
                }
            });

        }

        return d.promise;
    }

    function name() {
        return git("name");
    }

    function email() {
        return git("email");
    }

    function docker() {
        var d = q.defer();
        task.type = 'docker';
        auth['task_id'] = process.env.DOCKER_TASK_ID;

        if (fs.existsSync('./webhook.json')) {
            var webhook = JSON.parse(fs.readFileSync('./webhook.json'));
            auth['commit_id'] = webhook.pull_request.head.sha;
        }
        else if (process.env.DOCKER_TASK_ID) {
            auth['commit_id'] = process.env.DOCKER_COMMIT_ID;
        }

        return name().then(email);
    }

    function travis() {
        task.type = 'travis';
        auth['job_id'] = process.env.TRAVIS_JOB_ID;
        auth['commit_id'] = process.env.TRAVIS_PULL_REQUEST_SHA;
        return name().then(email);
    }

    function local() {
        task.type = 'local';
        return name().then(email);
    }

    function post() {
        console.log(auth);
        console.log(task);
        var d = q.defer();
        request.post('http://app.onexi.org/record', {
            body: {
                auth: auth,
                task: task,
                data: data,
                lint: lint
            },
            json: true
        }, function (err, res, body) {
            if (err) {
                d.reject(err);
            }
            else {
                d.resolve(body);
            }
        });
        return d.promise;
    }

    function id() {
        if (process.env.DOCKER_TASK_ID) {
            return docker();
        }
        else if (process.env.TRAVIS_JOB_ID) {
            return travis();
        }
        else {
            return local();
        }
    }

    function linter() {
        var d = q.defer();

        cli = new CLIEngine({
            envs: ["browser", "node", "mocha", "phantomjs"],
            useEslintrc: false,
            rules: {
                semi: 2
            }
        });

        var report = cli.executeOnFiles(["exercise.js"]);

        lint = report;

        d.resolve();

        return d.promise;
    }

    return id()
        .then(linter)
        .then(post);
}

function capture() {
    var deferred = q.defer();

    return deferred.promise;
}


function test(reporter, silence) {
    var deferred = q.defer();
    storeCache();
    if (silence) unmute = mute();
    var m = new mocha({
        reporter: reporter
    });
    m.addFile('./test/test.js');

    try {
        r = m.run(function(failures) {
            var testResults = r.testResults;
            if (silence) unmute();
            clearCache();
            if (reporter == 'list') {
                if (failures) {
                    deferred.reject(testResults);
                }
                else {
                    deferred.resolve(testResults);
                }
            }
            else {
                deferred.resolve(testResults);
            }
        });
    }
    catch (exception) {
        if (silence) unmute();
        deferred.reject(exception);
    }

    return deferred.promise;
}

function record() {
    if (process.env.GULP) {
        var deferred = q.defer();
        deferred.resolve();
        return deferred.promise;
    }
    else {
        return test('json', true)
            .then(send)
            .catch(function(err) {
                console.log(err);
            });
    }
}

function display() {
    return test('list', false)
        .catch(function(err) {
            process.exit(1);
        });
}

gulp.task('test', function() {
    return record()
        .then(display);
});