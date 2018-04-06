var exercise = {};
const cheerio = require('cheerio');
const request = require('sync-request');
const fs = require('fs');
const minify = require('html-minifier').minify;

const urlBase = 'http://student.mit.edu/catalog/';
const urlIndex = urlBase + 'index.cgi';

exercise.one = function(){
    // -----------------------------------------------
    //  Return the address of all the html pages in
    //  the MIT course catalog - string array.
    // -----------------------------------------------
    
    var makeRequest = function(url){
        var response = request('GET', url);
        var text = response.getBody();
        return text;
    }; 

    var text = makeRequest(urlIndex)
    var courseLinks = [];

    var $ = cheerio.load(text);
    $('a').each(function(){
        var link = $(this).attr('href');
        if(link.charAt(0) === 'm' && link.substr(link.length - 4) === 'html'){
            courseLinks.push(urlBase + link);
        }
    });

    console.log(courseLinks);
    return courseLinks;
};

exercise.two = function(){
    // -----------------------------------------------
    //  Download every course catalog page.
    //  Save every page to "your_folder/catalog"
    // -----------------------------------------------
    
    // request a page and write the html to /data
    const requestWrite = function(url,i){
        var response = request('GET', url);
        var text = response.getBody().toString();
        fs.writeFileSync('catalog/' + i + '.html', text, 'utf8');      
    };  

    var courseLinks = exercise.one();

    // download html from each url
    courseLinks.forEach(function(url,i){
        requestWrite(url,i)
        console.log('Link ' + i + ' written to file')
    });
};

exercise.three = function(){
    // -----------------------------------------------
    //  Combine all files into one,
    //  save to "your_folder/catalog/catalog.txt"
    // -----------------------------------------------
    
    // make array of files in catalog folder
    var path = './catalog/';
    var fileArr = [];
    var newFile = '';

    fileArr = fs.readdirSync(path);

    // combine files
    fs.writeFileSync(path + 'catalog.txt', '', 'utf8');
    var catalogRef = fs.openSync(path + 'catalog.txt', 'a');

    fileArr.forEach(function(file,i){
        newFile = fs.readFileSync(path + fileArr[i], 'utf8');
        fs.appendFileSync(catalogRef, newFile, 'utf8');
    });
    console.log('HTML files combined into catalog.txt');
};

exercise.four = function(){
    // -----------------------------------------------
    //  Remove line breaks and whitespaces
    //  from the file. Return a string of
    //  scrubbed HTML. In other words, HTML without
    //  line breaks or whitespaces.
    // -----------------------------------------------

    var catalogTxt = fs.readFileSync('./catalog/catalog.txt', 'utf8');
    
    // scrub combined html
    var scrubbed = minify(catalogTxt.toString(), {
        removeAttributeQuotes : true,
        collapseWhitespace : true,
        minifyJS : true,
        minifyCSS : true
    });

    // remove quotes that break string
    var clean = scrubbed.replace(/'/g, '');

    // write clean html to file
    fs.writeFileSync('./catalog/clean.txt', clean, 'utf8');
    
    console.log('HTML cleaned');
    return clean;
};

var courses = [];
exercise.five = function(){
    // -----------------------------------------------
    //  Load your scrubbed HTML into the DOM.
    //  Use the DOM structure to get all the courses.
    //  Return an array of courses.
    // -----------------------------------------------

    var clean = fs.readFileSync('./catalog/clean.txt', 'utf8');
    var $ = cheerio.load(clean);
    
    $('a').each(function(){
        var name = $(this).attr('name');
        if(name != undefined){
            courses.push(name);
        }
    });

    console.log(courses);
    return courses;
};

var titles = [];
exercise.six = function(){
    // -----------------------------------------------
    //  Return an array of course titles.
    // -----------------------------------------------
    
    // var courses = exercise.five();

    var clean = fs.readFileSync('./catalog/clean.txt', 'utf8');
    var $ = cheerio.load(clean);
    
    $('p').each(function(){
        var title = $(this).next('h3').text()
        if(title != undefined && title != ''){
            // title = title.slice(0, -1);
            titles.push(title);
        }
    });

    console.log(titles);
    return titles;
};

var words = [];
exercise.seven = function(){
    // -----------------------------------------------
    //  Filter out punctuation, numbers,
    //  and common words like "and", "the", "a", etc.
    //  Return clean array.
    // -----------------------------------------------
    
    // var titles = exercise.six();

    words = titles.map(function(title){
        return title.toLowerCase().match(/([a-z]+)/g);
    });

    console.log('printing words');
    console.log(words);

    // filter common words

    // var dirt = [' and ', ' the ', ' a ', ' for ', 
    // ' of ', ' to ', ' in ', ' I ', ' II ', 
    // ' III ', ' with ', 'introduction', '.', ',', ':', ';', '/', '[j], '];
    
    // words.forEach((title) => {
    //     dirt.forEach((item) => {
    //         filteredTitle = title.replace(item, ' ');
    //     });
    //     filteredTitles.push(filteredTitle);
    // });
};

var wordsFlat = [];
exercise.eight = function(){
    // -----------------------------------------------
    //  Make an array of words from the titles.
    //  Return array of words.
    // -----------------------------------------------
   
    // var words = exercise.seven();
    wordsFlat = words.reduce(function(previous, current) {
        return previous.concat(current);
    }, []);

    console.log('printing wordsFlat');
    console.log(wordsFlat);
    return wordsFlat;
    
};

var scores = {};
exercise.nine = function(){
    // -----------------------------------------------
    //  Count the word frequency.
    //  Return a word count array.
    // -----------------------------------------------

    // var wordsFlat = exercise.eight();

    // get word frequency using reduce
    scores = wordsFlat.reduce(function(previous, current){
        if(current in previous){
            previous[current] += 1;
        } else {
            previous[current] = 1;
        }
        return previous;
    },{});
    
    console.log(scores);
    return scores;
};

exercise.ten = function(){

    // var scores = exercise.nine();

    // write scores object to js file
    var scoresStr = 'var scores = ' + JSON.stringify(scores);
    fs.writeFileSync('./catalogSample/scores.js', scoresStr);

    console.log('Scores written to JSON')
}

module.exports = exercise;