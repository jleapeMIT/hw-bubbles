var expect = require('chai').expect;
var fs = require('fs');
var ex = require('../exercise.js');

describe('Catalog', function() {
	it('Page Count', function() {
		var links = ex.one();
	    expect(links.length).to.be.at.least(80);
	});
});

describe('Catalog Files', function() {
	it('File Count', function() {
		ex.two();
		var files = fs.readdirSync('catalog');
	    expect(files.length).to.be.at.least(80);
	});
});

describe('Combined Catalog File', function() {
	it('File size', function() {
		ex.three();
		var stats = fs.statSync('catalog/catalog.txt');
		var fileSizeInBytes = stats.size;
	    expect(fileSizeInBytes).to.be.at.least(3863965);
	});
});

describe('Whitespace', function() {
	it('Whitespace and line breaks', function() {
		ex.four();
		var flag = false;
		var file = fs.readFileSync('catalog/catalog.txt', 'utf8');
		if (file.includes('\n')) {flag = true; console.log(true);}
		if (file.includes('\r\n')) {flag = true; console.log(true);}
	    expect(flag).to.be.false;
	});
});

describe('Courses', function() {
	it('Course Count', function() {
		var courses = ex.five();
	    expect(courses.length).to.be.at.least(1000);
	});
});

describe('Titles', function() {
	it('Title Count', function() {
		var courses = ex.six();
	    expect(courses.length).to.be.at.least(1000);
	});
});

describe('Clean Titles', function() {
	it('Clean Count', function() {
		var courses = ex.seven();
	    expect(courses.length).to.be.at.least(1000);
	});
});
