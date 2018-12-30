/**
 * Wraps ImageData with extra utility and access functions.
 * Some useful docs:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray
 * https://developer.mozilla.org/en-US/docs/Web/API/ImageData
 * 
 */
export default class ImageWrap {

	/**
	 * {Object} Optional storage of original image source. Don't use if
	 * you want to free memory of original source.
	 */
	get source() {return this._source;}
	set source(v) {this._source=v;}

	/**
	 * {Object} rect - Original rect of the image from the image source.
	 * This is null if no rect was specified at the time of creation.
	 */
	get rect() { return this._rect; }
	set rect(v) { this._rect = v;}

	/**
	 * {UInt8ClampedArray} RGBA image data.
	 */
	get data() {return this._data;}

	/**
	 * {ImageData} ImageData representation of data.
	 */
	get imageData() { return this._imageData;}

	/**
	 * {Number}
	 */
	get width() { return this._width;}
	set width(v) {this._width=v;}

	/**
	 * {Number}
	 */
	get height() { return this._height; }
	set height(v) {this._height=v;}

	/**
	 * 
	 * @param {HTMLImageElement|ImageData|UInt8ClampedArray|Canvas} source - the original source
	 * of the ImageData.
	 * If a canvas is specified, the imageData will be read from the canvas.
	 * If an Image is specified, a temporary canvas will be created for reading the pixels.
	 * If a UInt8ClampedArray is specified, a rect must also be provided with the width of the image.
	 * @param {Object} [rect=null]
	 */
	constructor( source, rect=null ) {

		if ( source instanceof Image ) {

			this.fromImage( source, rect );

		} else if ( source instanceof Canvas ) {

			this.fromCanvas( source, rect );

		} else if ( source instanceof UInt8ClampedArray ) {
	
			this.fromArray( source, rect );

		} else if ( source instanceof ImageData ) {

			this.fromData( source, rect );

		} else throw new Error('Unknown Image Source');

	}

	/**
	 * 
	 * @param {UInt8ClampedArray} source 
	 * @param {Object} rect 
	 */
	fromArray(source, rect) {

		if ( !rect ) throw new Error( 'Size information required');

		if ( rect.width ) {

			if ( rect.height ) this.fromData( new ImageData( source, rect.width, rect.height) );
			else this.fromData( new ImageData( source, rect.width) );

		} else {

			if ( !rect.height ) throw new Error( 'Size information required');
			else this.fromData( new ImageData( source, (source.length/4)/rect.height, rect.height ) );
	
		}

	}

	/**
	 * 
	 * @param {Image} source 
	 * @param {Object} rect 
	 */
	fromImage( source, rect ) {

		let canvas = document.createElement('canvas');		
		let ctx = canvas.getContext( '2d');
		ctx.drawImage( source );

		this.fromCanvas( canvas, rect );
	}

	/**
	 * 
	 * @param {Canvas} source 
	 * @param {Object} rect 
	 */
	fromCanvas( source, rect ) {

		let ctx = canvas.getContext('2d');

		if ( rect ) this.fromData(
			ctx.getImageData( rect.x || 0, rect.y || 0, rect.width || source.width, rect.height || source.height ),
			rect );
		else this.fromData( ctx.getImageData( 0, 0, source.width, source.height ) );

	}

	/**
	 * 
	 * @param {ImageData} source 
	 * @param {Object} rect 
	 */
	fromData( source, rect ) {

		this._imageData = source;
		this._rect = rect;

		this._width = source.width;
		this._height = source.height;

		this._data = source.data;

	}

	/**
	 * Get the sum of the absolute value of the channel differences
	 * between a pixel and a color. Alpha is ignored.
	 * @param {*} x 
	 * @param {*} y 
	 * @param {*} color 
	 */
	absDiff( x, y, color ) {

		let ind = 4( y*this._width+x);
		return Math.abs( this._data[ind] - (0xff&(color>>16)) )
			+ Math.abs( this._data[ind+1] - (0xff&(color>>8))) +
			Math.abs( this._data[ind+2] - (0xff&color));

	}

	/**
	 * Get the sum of the channel differences between a pixel and a color.
	 * The color channels are subtracted from the image pixel channels.
	 * Alpha is ignored.
	 * @param {*} x 
	 * @param {*} y 
	 * @param {*} color 
	 */
	diff( x, y, color ) {

		let ind = 4( y*this._width+x);
		return ( this._data[ind] - (0xff&(color>>16)) ) +
			( this._data[ind+1] - (0xff&(color>>8))) +
			( this._data[ind+2] - (0xff&color));

	}

	/**
	 * Finds the direction of least color change from the given image coordinate.
	 * If a color is supplied, returns the direction of least change from the
	 * given color.
	 * TODO: Compute all pixels at the given radius using graphics drawing.
	 * @param {Number} x 
	 * @param {Number} y 
	 * @param {Number} [color=null] - color to compare to. 
	 * @param {Number} [radius=4] - radius at which to test pixels.
	 * @param {Number} [tests=10] maximum number of pixels to test.
	 * @returns { {dx:Number, dy:Number} } - direction of least color change.
	 */
	minGrad( x, y, color=null, radius=4, tests=12 ) {

		var ind, r,g,b;
		var data = this._data;

		var minDx, minDy, del, dx, dy, minDel = Number.MAX_SAFE_INTEGER;

		if ( color === null ) {

			ind = 4*( y*this._width + x );
			r = data[ind]; g = data[ind+1]; b = data[ind+2];

		} else {
			r = 0xff&(color>>16);
			g = 0xff&(color>>8);
			b = 0xff&color;
		}

		let dtheta = 2*Math.PI/tests;
		for( let theta = 2*Math.PI; theta > 0; theta -= dtheta ) {

			dx = Math.cos( theta );
			dy = Math.sin( theta );
	
			var tx = x + Math.abs( radius*dx );
			var ty = y + Math.abs( radius*dy );

			if ( tx < 0 || tx >= this._width ) continue;
			if ( ty < 0 || ty >= this._height ) continue;

			ind = 4*( y*this._width + x );
			del = Math.abs( r - data[ind] ) + Math.abs( g - data[ind+1]) + Math.abs( b - data[ind+2]);
			if ( del < minDel ) {
				minDel = del;
				minDx = dx;
				minDy = dy;
			}

		}

		return { dx:minDx, dy:minDy };

	}

/**
	 * Finds the direction of maximal color change from the given image coordinate.
	 * If a color is supplied, returns the direction of most change from the
	 * given color.
	 * TODO: Compute all pixels at the given radius using graphics drawing.
	 * @param {Number} x 
	 * @param {Number} y 
	 * @param {Number} [color=null] - color to compare to. 
	 * @param {Number} [radius=4] - radius at which to test pixels.
	 * @param {Number} [tests=10] maximum number of pixels to test.
	 * @returns { {dx:Number, dy:Number} } - direction of most color change.
	 */
	maxGrad( x, y, color=null, radius=4, tests=12 ) {

		var ind, r,g,b;
		var data = this._data;

		var maxDx, maxDy, del, dx, dy, maxDel = -1;

		if ( color === null ) {

			ind = 4*( y*this._width + x );
			r = data[ind]; g = data[ind+1]; b = data[ind+2];

		} else {
			r = 0xff&(color>>16);
			g = 0xff&(color>>8);
			b = 0xff&color;
		}

		let dtheta = 2*Math.PI/tests;
		for( let theta = 2*Math.PI; theta > 0; theta -= dtheta ) {

			dx = Math.cos( theta );
			dy = Math.sin( theta );
	
			var tx = x + Math.abs( radius*dx );
			var ty = y + Math.abs( radius*dy );

			if ( tx < 0 || tx >= this._width ) continue;
			if ( ty < 0 || ty >= this._height ) continue;

			ind = 4*( y*this._width + x );
			del = Math.abs( r - data[ind] ) + Math.abs( g - data[ind+1]) + Math.abs( b - data[ind+2]);
			if ( del > maxDel ) {
				maxDel = del;
				maxDx = dx;
				maxDy = dy;
			}

		}

		return { dx:maxDx, dy:maxDy };

	}

	/**
	 * Get the color-channel components at the given location. Alpha is ignored.
	 * @param {Number} x 
	 * @param {Number} y
	 * @returns { r:Number, g:Number, b:Number } 
	 */
	parts( x,y ) {

		let ind = 4*( y*this._width + x);
		return { r:this._data[ind], g:this._data[ind+1], b:this._data[ind+2] };

	}

	/**
	 * Get the color-channel components at the given location.
	 * @param {Number} x 
	 * @param {Number} y
	 * @returns { r:Number, g:Number, b:Number } 
	*/
	parts32( x,y ) {

		let ind = 4*( y*this._width + x);
		return { r:this._data[ind], g:this._data[ind+1], b:this._data[ind+2], a:this._data[ind+3] };

	}

	/**
	 * Get the non-alpha color at the given pixel location.
	 * @param {Number} x 
	 * @param {Number} y
	 * @returns {Number} RGB color value.
	 */
	get(x,y) {

		let ind = 4*( y*this._width + x);
		return ( this._data[ind] << 16 ) + ( this._data[ind+1] << 8 ) + this._data[ind+2];

	}

	/**
	 * Get the ARGB color at the given pixel location.
	 * @param {Number} x 
	 * @param {Number} y
	 * @returns {Number} ARGB color value.
	 */
	get32(x,y) {

		let ind = 4*( y*this._width + x);
		return ( this._data[ind+3] << 24 ) + ( this._data[ind] << 16 ) +
			( this._data[ind+1] << 8 ) + this._data[ind+2];

	}

	/**
	 * Set the color at the given pixel location. Alpha is ignored.
	 * @param {Number} x 
	 * @param {Number} y 
	 * @param {Number} color - The RGB color to set. 
	 */
	set( x, y, color ) {

		let ind = 4*( y*this._width + x);
		this._data[ind++] = 0xFF & ( color >> 16 );
		this._data[ind++] = 0xFF & ( color >> 8 );
		this._data[ind] = 0xFF & color;

	}

	/**
	 * Set the ARGB color at the image location.
	 * @param {Number} x 
	 * @param {Number} y 
	 * @param {Number} color - The ARGB color to set. 
	 */
	set32( x, y, color ) {

		let ind = 4*( y*this._width + x);
		this._data[ind++] = 0xFF & ( color >> 16 );
		this._data[ind++] = 0xFF & ( color >> 8 );
		this._data[ind++] = 0xFF & color;
		this._data[ind] = 0xFF&( color >> 24 );

	}

	/**
	 * Get the red value at the given image location.
	 * @param {Number} x 
	 * @param {Number} y 
	 */
	red(x,y) {
		return this._data[ 4*( y*this._width + x )] = r;
	}

	/**
	 * Get the green value at the given image location.
	 * @param {Number} x 
	 * @param {Number} y 
	 */
	green(x,y) {
		return this._data[ 4*( y*this._width + x )+1];
	}

	/**
	 * Get the blue value at the given image location.
	 * @param {Number} x 
	 * @param {Number} y 
	 */
	blue(x,y){
		return this._data[ 4*( y*this._width + x )+2];
	}

	/**
	 * Get the alpha value at the given image location.
	 * @param {Number} x 
	 * @param {Number} y 
	 */
	alpha(x,y) {
		return this._data[ 4*( y*this._width + x )+3];
	}

	/**
	 * Set the red value at the given image location.
	 * @param {Number} x 
	 * @param {Number} y
	 * @param {Number} r
	 */
	setRed(x,y,r) {
		this._data[ 4*( y*this._width + x )] = r;
	}

	/**
	 * Set the green value at the given image location.
	 * @param {Number} x 
	 * @param {Number} y
	 * @param {Number} g 
	 */
	setGreen(x,y,g){
		this._data[ 4*( y*this._width + x )+1] = g;
	}

	/**
	 * Set the blue value at the given image location.
	 * @param {Number} x 
	 * @param {Number} y
	 * @param {Number} b
	 */
	setBlue(x,y,b){
		this._data[ 4*( y*this._width + x )+2] = b;
	}

	/**
	 * Set the alpha value at the given image location.
	 * @param {Number} x 
	 * @param {Number} y 
	 * @param {Number} a
	 */
	setAlpha(x,y,a){
		this._data[ 4*( y*this._width + x )+3] = a;
	}

}