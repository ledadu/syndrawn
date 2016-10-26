var Neuron = synaptic.Neuron,
    Layer = synaptic.Layer,
    Network = synaptic.Network,
    Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;

var Syndrawn = function() {

    this.buffers = {};

	this.init = function() {

        var that = this;

		_.bindAll(this, 'bindClick', 'learn', 'save', 'load', 'activate', 'activateFew' , 'activateAll');

		this.myNetwork = _.range(3).map(function () { return new Architect.Perceptron(3, 4, 1);});
		this.trainer = _.range(3).map(function (n,i) {return new Trainer(that.myNetwork[i]);});
		this.canvas = document.getElementById("source");
		this.ctx = this.canvas.getContext("2d");
		this.canvasCopy = document.getElementById("copy");
		this.ctxCopy = this.canvasCopy.getContext("2d");
		this.canvasOut = document.getElementById("output");
		this.ctxOut = this.canvasOut.getContext("2d");
		this.pixel = this.ctxOut.createImageData(1,1);
		this.pixelData  = this.pixel.data;

		    var img = new Image();
		    img.crossOrigin = "anonymous";
		    img.onload = start;
		    img.src = "metal+texture+pattern+21.jpg";
		    //img.src = "http://i2.cdn.turner.com/cnn/interactive/2010/10/world/quiz.skorea.poland/images/vrtgal.question3.jpg";
		    //img.src = "free-vector-mire.jpg";

		    var img2= new Image();
		    img2.crossOrigin = "anonymous";
		    img2.onload = start2;
		    img2.src = "free-vector-mire.jpg";

		    function start() {
			    syndrawn.ctx.drawImage(img, 0, 0,320,180);
                that.buffers.learning = new ImageBuffer(syndrawn.ctx.getImageData(0,0,320,180));
		    }

		    function start2() {
                syndrawn.ctxCopy.drawImage(img2, 0, 0,320,180);
                that.buffers.source = new ImageBuffer(syndrawn.ctxCopy.getImageData(0,0,320,180));
            }

		this.bindClick();
	}

	return this;

};

Syndrawn.prototype.bindClick = function() {
	$('.learn').on('click',this.learn);
	$('.save').on('click',this.save);
	$('.load').on('click',this.load);
	$('.activate').on('click',this.activateFew);
	$('.all').on('click',this.activateAll);
}

Syndrawn.prototype.save = function() {
	var $textearea = $('textArea#networkexport');
	$textearea.val(JSON.stringify(syndrawn.myNetwork.toJSON()));
	document.querySelector("#networkexport").select();
    // Copy to the clipboard
    document.execCommand('copy');
}

Syndrawn.prototype.load = function() {
	var $textearea = $('textArea#networkexport');
    syndrawn.myNetwork = Network.fromJSON(JSON.parse($textearea.val()));
}



Syndrawn.prototype.learn = function() {

    var that = this
        learndata = [[],[],[]];

    for (var x=0; x<this.canvas.width; x++) {
        for (var y=0; y<this.canvas.height; y++) {
            var pixelBuffer  = this.buffers.learning.extractRegion(x, y, 1, 1),
                regionBuffer = this.buffers.learning.extractRegion(x-1, y-1, 2, 2);

            pixelData  = pixelBuffer.getDataByPixels();
            regionData = regionBuffer.getDataByPixels();

            regionData.splice(3,1);

            _.each(this.trainer,function (trainer,i){
                learndata[i].push(
                    {
                        input : _.map(regionData, function(data){return data[i]/255;}),
                        output: _.map(pixelData, function(data){return data[i]/255;}),
                    }
                );
            });

        }
    }


    _.each(this.trainer,function (trainer,i){

        console.log('Learn.... -> ' + i);

        console.log(trainer.train(
            learndata[i],
            {
                rate: .1,
                iterations: 2000,
                error: .005,
                shuffle: true,
                log: 100,
                cost: Trainer.cost.CROSS_ENTROPY
            }
        ));

        console.log(learndata[i],'Learn finished.... -> ' + i);
    });

    return this;

}

var syndrawn = new Syndrawn();

$(function() {

    syndrawn.init();

});




Syndrawn.prototype.activateFew = function() {

	var imageData = this.ctxCopy.getImageData(0 ,0 ,this.canvasCopy.width, this.canvasCopy.height);

    for (var i=0; i<300; i++) {
	    var x = Math.round(Math.random() * this.canvasOut.width),
	        y = Math.round(Math.random() * this.canvasOut.height);
    	this.activate(x,y,imageData);
    }
    return this;
};

Syndrawn.prototype.activateAll = function() {

	var imageData = this.ctxCopy.getImageData(0 ,0 ,this.canvasCopy.width, this.canvasCopy.height),
        n = performance.now();

    for (var x=1; x<this.canvasCopy.width; x++) {
        for (var y=1; y<this.canvasCopy.height; y++) {
        this.activate(x,y,imageData);
        }
    }
    console.log('time : ' + ((performance.now() - n) / 1000) + 's');

    return this;
};



Syndrawn.prototype.activate = function(x,y,imageData) {

       var that = this,
        regionBuffer = this.buffers.source.extractRegion(x-1, y-1, 2, 2);

        regionData = regionBuffer.getDataByPixels();
        regionData.splice(3,1);

	for (var i=0; i<3; i++) {
    	var color = this.myNetwork[i].activate(_.map(regionData, function(data){return data[i]/255;}));
	    this.pixelData[i]   = Math.round(255 * color[0]);
        console.log(_.map(regionData, function(data){return data[i]/255;}), color);
    }

    this.pixelData[3]   = 255;
	this.ctxOut.putImageData( this.pixel, x+1, y+1 );

    return this;

};

var ImageBuffer = function(imageData = null) {

    this.data = null;
    this.width = null;
    this.height = null;

    this.loadFromImageData(imageData);

	_.bindAll(this, 'loadFromImageData', 'extractRegion', 'getDataByPixels', 'groupSlice');

    return this;

}

ImageBuffer.prototype.loadFromImageData = function(imageData = null) {

    if (_.isNull(imageData)) {
        return this;
    }

    var imageBuffer = new ImageBuffer();

    this.data  = imageData.data;
    this.width = imageData.width;
    this.height  = imageData.height;

    return this;
}

ImageBuffer.prototype.extractRegion = function(startX, startY, width, height) {

    var imageBuffer = new ImageBuffer();

    imageBuffer.data   = [];
    imageBuffer.width  = width;
    imageBuffer.height = height;

    for (var y = startY; y < startY+height; y++) {

        var offset = y * this.width;

        for (var x = startX; x < startX+width; x++) {
            for (var colorBit = 0; colorBit < 4; colorBit++) {
                imageBuffer.data.push(this.data[(offset+x)*4+colorBit]);
            }
        }
    }

    return imageBuffer;

}

ImageBuffer.prototype.getDataByPixels =  function(nBits = 4) {
    return this.groupSlice(this.data, nBits);
}

ImageBuffer.prototype.groupSlice = function(ar,range) {
	var _return = [];
	for (var i=0; i < ar.length/range; i++) {
		_return.push(ar.slice(i*range,(i+1)*range));
	}
	return _return;
};

