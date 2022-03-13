let fab;
let input;
let fileData;
let clear = true;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  background(255);

  // p5.fab setup
  fab = createFab();

  // file handling setup
  input = createFileInput(handleFile);
  input.position(0, 0);
}

function draw() {
  
}

function handleFile(file) {
  if (file.type === "text") {
    fileData = [];
    let d = file.data.split("\n");
    for (let i = 0; i < d.length; i++) {
      if (d[i] > 0) 
        fileData.push(d[i]);
    }
    // clear all the old data
    fab.commands = [];
    path = [];
    background(255);
    fabDraw();
    fab.parseGcode();
    fab.render();
  } else {
    dataFile = null;
  }
}

///


// Random Walk Variables
let path = [];
let minX = 10000;
let minY = 10000;
let maxX = -1000;
let maxY = -1000;
let centerX = 0;
let centerY = 0;
let k = 50; // scale factor

function fabDraw() {
  if (fileData) {
    print("fabDraw!");
    // setup!
    fab.setAbsolutePosition(); // set the coordinate system mode
    fab.setERelative(); // it's easier to work with the extruder axis in relative positioning
    fab.setTemps(205, 60);
    fab.autoHome();

    fab.introLine();

    let discCenter = new p5.Vector(100, 100);
    radius = 25;
    let z = 0.2;
    let s = 15;

    // begin random walk
    let currentX = 0;
    let currentY = 0;
    let dir = "r";
    let pos = true;
    let avg = computeAvg();

    for (let i = 0; i < fileData.length; i += 1) {
      let data = fileData[i];
      data -= avg;
      pos = data >= 0 ? true : false;

      switch (dir) {
        case "r":
          if (pos) {
            // turn right on positive aka move down
            currentY -= k * data;
            walk(currentX, currentY);
            dir = "d";
          } else {
            // turn left aka move up
            currentY += k * data;
            walk(currentX, currentY);
            dir = "u";
          }
          break;

        case "l":
          if (pos) {
            // turn right aka move up
            currentY += k * data;
            walk(currentX, currentY);
            dir = "u";
          } else {
            // turn left aka move down
            currentY -= k * data;
            walk(currentX, currentY);
            dir = "d";
          }
          break;

        case "u":
          if (pos) {
            // turn right aka move right
            currentX += k * data;
            walk(currentX, currentY);
            dir = "r";
          } else {
            // turn left aka move left
            currentX -= k * data;
            walk(currentX, currentY);
            dir = "l";
          }
          break;

        case "d":
          if (pos) {
            // turn right aka move left
            currentX -= k * data;
            walk(currentX, currentY);
            dir = "l";
          } else {
            // turn left aka move right
            currentX += k * data;
            walk(currentX, currentY);
            dir = "r";
          }
          break;
      }
    }

    // the path currently meanders along a 2D plane
    // map it to a disk
    for (let i = 0; i < path.length; i++) {
      let [xc, yc] = mapToCircle(path[i].x, path[i].y, radius);
      i == 0 ? fab.moveRetract(xc, yc, z) : fab.moveExtrude(xc, yc, z, s);
    }

    // end random walk

    fab.presentPart();
  }
}

function computeAvg() {
  let sum = 0;
  for (let i = 0; i < fileData.length; i++) {
      sum += parseFloat(fileData[i]);
    }
  
  return (sum / fileData.length);
}

function walk(x, y) {
  path.push(createVector(x, y));

  if (x < minX) {
    minX = x;
  } else if (x > maxX) {
    maxX = x;
  }

  if (y < minY) {
    minY = y;
  } else if (y > maxY) {
    maxY = y;
  }
}

function mapToCircle(x, y, r) {
  // transform unit square to unit circle
  let x_ = map(x, minX, maxX, -1, 1);
  let y_ = map(y, minY, maxY, -1, 1);
  let xc = x_ * sqrt(1 - y_ ** 2 / 2);
  let yc = y_ * sqrt(1 - x_ ** 2 / 2);

  // constrain() not working as expected so do it manually :
  if (xc > 1) {
    xc = 1;
  } else if (xc < -1) {
    xc = -1;
  }

  if (yc > 1) {
    yc = 1;
  } else if (yc < -1) {
    yc = -1;
  }

  xc = map(constrain(xc, -1, 1), -1, 1, fab.maxX/2 - r, fab.maxX/2 +r);
  yc = map(constrain(yc, -1, 1), -1, 1, fab.maxX/2 - r, fab.maxX/2 + r);

  return [xc, yc];
}
