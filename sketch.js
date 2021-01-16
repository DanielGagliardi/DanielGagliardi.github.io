var shapeNames = ["deer", "pi", "sigma"];
var shapeIndex = 0;

var t;
var timeIncrement = 0.002;

var fourierSeries;
var req;
var numberOfTerms = 1000;
var indexes;

var drawnLine = [];
var totalLength;
var pathString;
var maxShapeHeight = window.innerHeight * 0.9;
var maxShapeWidth = window.innerWidth * 0.9;
var transX;
var transY;


var fade = 0;
var fadeTimeRatio = 0.1;

var shapeHue;

function setup() {
	class Complex {
		constructor(realPart, imaginaryPart) {
			this.re = realPart;
			this.im = imaginaryPart;
		}
	}

	function Complex_Add(z, w) {
		//adds 2 complex numbers together
		var result = new Complex(z.re + w.re, z.im + w.im);
		return result
	}

	function Complex_Multiply(z, w) {
		//adds 2 complex numbers together
		var result = new Complex(z.re * w.re - z.im * w.im, z.re * w.im + z.im * w.re);
		return result
	}

	function Index_Gen(numberOfTerms) {
		if (numberOfTerms === 0) {
			return [];
		} else if (numberOfTerms === 1) {
			return [0];
		} else {
			var odd = numberOfTerms % 2;
			var indexes = [0];
			for (index = 1; index <= numberOfTerms / 2; index++) {
				indexes.push(index);
				indexes.push(-1 * index);
			}
			if (odd === 0) {
				indexes.pop();
			}
			return indexes;
		}
	}

	function Fourier_Coefficient(path, index) {
		//declaring variables 
		var n = index;
		var N = path.length;
		var coefficient = new Complex(0, 0);
		//summation
		for (k = 1; k <= N; k++) {
			var x = path[k - 1][0];
			var y = path[k - 1][1];
			var term1 = new Complex(x, y);
			var term2 = new Complex(cos(-n * 2 * PI * k / N), sin(-n * 2 * PI * k / N));
			var insert = Complex_Multiply(term1, term2);
			var coefficient = Complex_Add(coefficient, insert);
		}
		//dividing by N
		var finalCoefficient = new Complex(coefficient.re / N, coefficient.im / N);
		return finalCoefficient;
	}

	function FourierSeries_Gen(path, numberOfTerms) {
		var numberOfPoints = path.length;
		var indexes = Index_Gen(numberOfTerms);
		//Fourier series is an array of complex coefficients that match the order of the indexes eg. [C0,C1,C-1,C2,C-2,…]
		var fourierSeries = [];
		for (i = 0; i <= numberOfTerms - 1; i++) {
			var index = indexes[i];
			fourierSeries.push(Fourier_Coefficient(path, index));
		}
		return fourierSeries
	}

	req = new XMLHttpRequest();
	req.onload = function () {
		//reseting variables
		var points = [];
		fade = 0;
		t = 0;
		shapeHue = 100 * Math.random();
		drawnLine = [];

		var text = this.responseText;
		var parser = new DOMParser();
		var svg = parser.parseFromString(text, "text/xml");
		pathString = svg.getElementsByTagName("path")[0].getAttribute("d");
		var initialXPoints = [];
		var initialYPoints = [];
		for (i = 0; i <= Snap.path.getTotalLength(pathString); i++) {
			var point = Snap.path.getPointAtLength(pathString, i);
			initialXPoints.push(point.x);
			initialYPoints.push(point.y);
		}
		var maxX = Math.max.apply(null, initialXPoints);
		var maxY = Math.max.apply(null, initialYPoints);
		var minX = Math.min.apply(null, initialXPoints);
		var minY = Math.min.apply(null, initialYPoints);

		var xOffset = (maxX - minX)/2 + minX;
		var yOffset = (maxY - minY)/2 + minY;

		xEnlargement = maxShapeWidth/(maxX - minX);
		yEnlargement = maxShapeHeight/(maxY - minY);
		if (xEnlargement < yEnlargement) {
			var enlargementFactor = xEnlargement;
		} else {
			var enlargementFactor = yEnlargement;
		}
		for (i = 0; i < initialXPoints.length; i++) {
			points.push([ enlargementFactor * (initialXPoints[i] - xOffset), enlargementFactor * (initialYPoints[i] - yOffset) ]);
		}

		fourierSeries = FourierSeries_Gen(points, numberOfTerms);
	}
	req.open("GET", "./resources/".concat(shapeNames[shapeIndex],".svg"), false);
	req.send();
	indexes = Index_Gen(numberOfTerms);
	createCanvas(windowWidth, windowHeight);
	transX = windowWidth/2;
	transY = windowHeight/2;


	background("black");
	frameRate(60);
}

function draw() {
	background("black");
	var x = 0;
	var y = 0;

	translate(transX, transY);
	for (i = 0; i < numberOfTerms; i++) {
		var oldx = x;
		var oldy = y;
		var Ci = fourierSeries[i];

		radius = sqrt(Ci.re * Ci.re + Ci.im * Ci.im);
		initialAngle = atan2(Ci.im, Ci.re);
		frequency = indexes[i];
		x += radius * cos(frequency * t * TWO_PI + initialAngle);
		y += radius * sin(frequency * t * TWO_PI + initialAngle);
		
		colorMode(RGB, 255);
		noFill();
		strokeWeight(1);
		stroke(255,255,255,100 * fade);
		circle(oldx, oldy, radius * 2);

		strokeWeight(1);
		stroke(255,255,255,100 * fade);
		line(oldx, oldy, x, y);
	}

	if (t <= 1) {
		drawnLine.push([x, y]);
	} else if (t <= 2) {
		drawnLine.shift();
	}

	noFill();
	beginShape();
	colorMode(HSB, 100);
	stroke(shapeHue, 100, 100, 100 * fade);
	strokeWeight(2);
	for (var i = 0; i < drawnLine.length; i++) {
		vertex(drawnLine[i][0], drawnLine[i][1]);
	}
	endShape();

	t += timeIncrement;

	if (t <= fadeTimeRatio && fade <=1) {
		fade += timeIncrement / fadeTimeRatio;
	} else if (t < 2 - fadeTimeRatio) {
		fade = 1;
	} else if (t <= 2 + timeIncrement * 2) {
		fade -= timeIncrement / fadeTimeRatio;
	} else {
		//switch to new shape
		shapeIndex = (shapeIndex + 1) % shapeNames.length;
		req.open("GET", "./resources/".concat(shapeNames[shapeIndex],".svg"), false);
		req.send();
	}
}
