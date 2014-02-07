var Canvas = require('canvas');
var quantize = require('quantize');

var Image = Canvas.Image

/*
 * Color Thief v2.0
 * by Lokesh Dhakar - http://www.lokeshdhakar.com
 *
 * License
 * -------
 * Creative Commons Attribution 2.5 License:
 * http://creativecommons.org/licenses/by/2.5/
 *
 * Thanks
 * ------
 * Nick Rabinowitz - For creating quantize.js.
 * John Schulz - For clean up and optimization. @JFSIII
 * Nathan Spady - For adding drag and drop support to the demo page.
 *
 */

/*
  CanvasImage Class
  Class that wraps the html image element and canvas.
  It also simplifies some of the canvas context manipulation
  with a set of helper functions.
*/
var CanvasImage = function(path, _callback) {

    var img, self;

    self = this;
    img = new Image;

    img.onerror = function(err) {
        _callback(err);
    }

    img.onload = function() {

        self.canvas = new Canvas(img.width, img.height);
        self.context = self.canvas.getContext('2d');

        self.width = img.width;
        self.height = img.height;

        self.context.drawImage(img, 0, 0, img.width, img.height);

        _callback();

    }

    img.src = path;

};

CanvasImage.prototype.clear = function() {
    this.context.clearRect(0, 0, this.width, this.height);
};

CanvasImage.prototype.update = function(imageData) {
    this.context.putImageData(imageData, 0, 0);
};

CanvasImage.prototype.getPixelCount = function() {
    return this.width * this.height;
};

CanvasImage.prototype.getImageData = function() {
    return this.context.getImageData(0, 0, this.width, this.height);
};

CanvasImage.prototype.removeCanvas = function() {
    // TODO add cleanup methods
};


var ColorThief = function() {};

/*
 * getColor(sourceImage[, quality])
 * returns {r: num, g: num, b: num}
 *
 * Use the median cut algorithm provided by quantize.js to cluster similar
 * colors and return the base color from the largest cluster.
 *
 * Quality is an optional argument. It needs to be an integer. 0 is the highest quality settings.
 * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
 * faster a color will be returned but the greater the likelihood that it will not be the visually
 * most dominant color.
 *
 * */
ColorThief.prototype.getColor = function(sourceImage, quality, _callback) {
    var palette = this.getPalette(sourceImage, 5, quality, function(err, palette) {
        if (err) {
            _callback(err);
        } else {
            _callback(null, palette[0]);
        }
    });
};


/*
 * getPalette(sourceImage[, colorCount, quality])
 * returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
 *
 * Use the median cut algorithm provided by quantize.js to cluster similar colors.
 *
 * colorCount determines the size of the palette; the number of colors returned. If not set, it
 * defaults to 10.
 *
 * BUGGY: Function does not always return the requested amount of colors. It can be +/- 2.
 *
 * quality is an optional argument. It needs to be an integer. 0 is the highest quality settings.
 * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
 * faster the palette generation but the greater the likelihood that colors will be missed.
 *
 *
 */
ColorThief.prototype.getPalette = function(path, colorCount, quality, _callback) {

    if (typeof colorCount === 'undefined') {
        colorCount = 10;
    };
    if (typeof quality === 'undefined') {
        quality = 10;
    };

    // Create custom CanvasImage object
    var image = new CanvasImage(path, function(err) {

        if (err) {
            _callback(err);
        } else {

            var imageData = image.getImageData();
            var pixels = imageData.data;
            var pixelCount = image.getPixelCount();

            // Store the RGB values in an array format suitable for quantize function
            var pixelArray = [];
            for (var i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
                offset = i * 4;
                r = pixels[offset + 0];
                g = pixels[offset + 1];
                b = pixels[offset + 2];
                a = pixels[offset + 3];
                // If pixel is mostly opaque and not white
                if (a >= 125) {
                    if (!(r > 250 && g > 250 && b > 250)) {
                        pixelArray.push([r, g, b]);
                    }
                }
            }

            // Send array to quantize function which clusters values
            // using median cut algorithm
            var cmap = quantize(pixelArray, colorCount);
            var palette = cmap.palette();

            // Clean up
            image.removeCanvas();

            _callback(null, palette);

        }

    });

};

module.exports = new ColorThief();
