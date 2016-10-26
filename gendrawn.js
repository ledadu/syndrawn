var Neuron = synaptic.Neuron,
    Layer = synaptic.Layer,
    Network = synaptic.Network,
    Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;

var Syndrawn = function() {

    this.buffers = {};

	this.init = function() {

        var that = this;

		_.bindAll(this, 'bindClick', 'learn', 'groupSlice', 'save', 'load', 'activate', 'activateFew' , 'activateAll');

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
		    }
		    
		    function start2() {
		    	syndrawn.ctxCopy.drawImage(img2, 0, 0,320,180);
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
            var pixelData = _.map(that.ctx.getImageData(x, y, 1, 1).data,function(val){return val/255}),
                regionData = _.map(that.ctx.getImageData(x-1, y-1, 2, 2).data,function(val){return val/255;});

            pixelData = this.groupSlice(pixelData,4);
            regionData = this.groupSlice(regionData,4);
            
            regionData.splice(4,1);
            
            _.each(this.trainer,function (trainer,i){
                learndata[i].push(
                    {
                        input : _.map(regionData, function(data){return data[i];}),  			
                        output: _.map(pixelData, function(data){return data[i];}),  
                    }
                );
            });

        }
    }
    
    
    _.each(this.trainer,function (trainer,i){

        console.log('Learn.... -> ' + i);   
 
        trainer.train(
            learndata[i],
            {	
                rate: .1,
                iterations: 1,
                error: .005,
                shuffle: true,
                log: 10,
                cost: Trainer.cost.CROSS_ENTROPY
            }
        );

        console.log(learndata,'Learn finished.... -> ' + i);   
    });
    
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
};



Syndrawn.prototype.activate = function(x,y,imageData) {
	
       var that = this,
	    regionData = _.map(extractRegion(imageData,x-1, y-1, 2, 2),function(val){return val/255;});
	    //regionData = _.map(that.ctxCopy.getImageData(x-1, y-1, 2, 2).data,function(val){return val/255;});
    
	regionData = this.groupSlice(regionData,4);
 	regionData.splice(4,1);

	for (var i=0; i<3; i++) {
    	var color = this.myNetwork[i].activate(_.map(regionData, function(data){return data[i];}));	
	    this.pixelData[i]   = Math.round(255 * color[0]);
    }

    this.pixelData[3]   = 255;
	this.ctxOut.putImageData( this.pixel, x+1, y+1 );

};

var ImageBuffer = function() {
/*
 * var extractRegion = function(imageData, startX, startY, width, height ) {
        var extractData = [];

        for (var y = startY; y <= startY+height; y++) {

            var offset = y*imageData.width;
            
            for (var x = startX; x <= startX+width; x++) {
                for (var colorBit = 0; colorBit < 4; colorBit++) { 
                    extractData.push(imageData.data[(offset+x)*4+colorBit]);
                }
            }
        }

        return extractData;
    };
*/

    this.imageData = null;

    this.extractRegion = function(x,y,width,height){
        var buffer = new ImageBuffer();

        
        //CanvasRenderingContext2D.createImageData(width,height);
    }

    this.getImageDataGroupByPixels =  function(nBits = 4) {
        return this.groupSlice(this.imageData, nBits);
    }

    return this;

}

ImageBuffer.prototype.groupSlice = function(ar,range) {
	var _return = [];
	for (var i=0; i < ar.length/range; i++) {
		_return.push(ar.slice(i*range,(i+1)*range));
	}
	return _return;
};

