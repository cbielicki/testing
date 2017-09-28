class SparcBenchmark{
	constructor(){
		this.benchResults = {
			'gflops' : 0,
			'gpuGflops' : 0,
			'totalTime' : 0
		};
		this.progressBars = [];
		
		//circle stuff
		this.circleOptions = {};
		this.canvas = null;
		this.span = null;
		this.graph = null;
		this.ctx = {};
		this.radius = 0;
		this.animTimer = 0;
		
		this.gpufinished = false;
		this.cpufinished = false;
	};
	
	//general ui scripts
	startBench(){
		if(sparcApp == null){
			return;
		};
		
		this.gpufinished = false;
		this.cpufinished = false;
		
		
		this.toggleWorking(true);
		this.clearTestCircle();
		sparcApp.maxSlots = document.getElementById('slot-input').value;
		sparcApp.benchmark();
	};
	
	endBench(){
		if(!this.gpufinished || !this.cpufinished){
			return;
		}
		
		let gflopsEle = document.getElementById('gflops');
			gflopsEle.innerText = this.benchResults.gflops.toFixed(3);
		                        
		let gpuGflopsEle = document.getElementById('gpu-gflops');
			gpuGflopsEle.innerText = this.benchResults.gpuGflops.toFixed(3);
		                        
		let totalTimeEle = document.getElementById('totaltime');
			totalTimeEle.innerText = (this.benchResults.totalTime / 1000).toFixed(3) + 's';
		
		//let cpuContextEle = document.getElementById('cpuContext');
		//	cpuContextEle.innerText = 'It would take ' + (431000 / this.benchResults.gflops ).toLocaleString(undefined, { maximumSignificantDigits: 3 }) + ' cpu devices like yours to be in the top 500!';
		//
		//let gpuContextEle = document.getElementById('gpuContext');
		//	gpuContextEle.innerText = 'It would take ' + (431000 / this.benchResults.gpuGflops).toLocaleString(undefined, {maximumSignificantDigits: 3}) + ' gpu devices like yours to be in the top 500!';
		
		this.fillTestCircle();
		this.toggleWorking(false);
	};
	
	resizeStuff(firstLoad){
		if(firstLoad == true){
			var loadingBox = document.getElementById('loadingBox');
			this.buildGraph();
		};
		this.updateTestCircle();
	};
	
	toggleWorking(isWorking){
		if(isWorking == true){
			loadingBox.style.display = 'block';
		}else{
			loadingBox.style.display = 'none';
		};
	};
	
	addProgressBar(){
		let ele = document.getElementById('progress-container');
		this.progressBars.push(document.createElement('div'));
		let index = this.progressBars.length - 1;
		this.progressBars[index].className = 'progress-bar';
		this.progressBars[index].style.width = '0%';
		this.progressBars[index].innerText = '0%';
		ele.appendChild(this.progressBars[index]);
	};
	
	removeProgressBar(){
		this.progressBars.pop();
	};
	
	updateProgressBar(taskIndex, progress){
		this.progressBars[taskIndex].style.width = progress + '%';
		this.progressBars[taskIndex].innerText = progress + '%';
	};
	
	
	
	
	
	//stuff for the circle ui	
	clearTestCircle(){
		this.circleOptions.percent = 0;
		this.updateTestCircle();
	};
	
	updateTestCircle(){
		this.drawCircle('#3a5a80', this.circleOptions.lineWidth, 100 / 100);
		if(this.circleOptions.percent > 0){
			this.drawCircle('#25af61', this.circleOptions.lineWidth, this.circleOptions.percent / 100);
		};
		this.span.textContent = this.circleOptions.percent.toLocaleString(undefined, { maximumSignificantDigits: 2 }) + '%';
	};
	
	fillTestCircle(){
		window.requestAnimationFrame(this.animate);
	};
	
	animate(timestamp){
		if(benchmark.animTimer == 0){
			benchmark.animTimer = timestamp;
		};
		benchmark.circleOptions.percent = ((timestamp - benchmark.animTimer) / 5);
		if(benchmark.circleOptions.percent > 100){
			benchmark.circleOptions.percent = 100;
			benchmark.updateTestCircle();
			benchmark.animTimer = 0;
		}else{
			benchmark.updateTestCircle();
			requestAnimationFrame(benchmark.animate);
		};
	};
	
	buildGraph(){
		this.graph = document.getElementById('graph'); // get canvas
		this.circleOptions = {
			percent:  graph.getAttribute('data-percent') || 25,
			size: graph.getAttribute('data-size') || 220,
			lineWidth: graph.getAttribute('data-line') || 15,
			rotate: graph.getAttribute('data-rotate') || 0
		};
		this.canvas = document.createElement('canvas');
		this.span = document.createElement('span');
		this.span.textContent = this.circleOptions.percent + '%';
			
		if (typeof(G_vmlCanvasManager) !== 'undefined') {
			G_vmlCanvasManager.initElement(this.canvas);
		};
		this.ctx = this.canvas.getContext('2d');
		this.canvas.width = this.canvas.height = this.circleOptions.size;

		this.graph.appendChild(this.span);
		this.graph.appendChild(this.canvas);

		this.ctx.translate(this.circleOptions.size / 2, this.circleOptions.size / 2); // change center
		this.ctx.rotate(0.8 * Math.PI); // rotate -90 deg
		//ctx.rotate((-1 / 2 + options.rotate / 180) * Math.PI); // rotate -90 deg

		//imd = ctx.getImageData(0, 0, 240, 240);
		this.radius = (this.circleOptions.size - this.circleOptions.lineWidth) / 2;
	};
	
	drawCircle(color, lineWidth, percent){
		percent = Math.min(Math.max(0, percent || 1), 1);
		this.ctx.beginPath();
		this.ctx.arc(0, 0, this.radius, 0, Math.PI * 1.4 * percent, false);
		this.ctx.strokeStyle = color;
		this.ctx.lineCap = 'round'; // butt, round or square
		this.ctx.lineWidth = lineWidth
		this.ctx.stroke();
	};
	
};

var benchmark = null;
var sparcApp = null;
window.addEventListener('load', function(){	
	sparcApp = new SparcApp();
	benchmark = new SparcBenchmark();
	benchmark.resizeStuff(true);
});