class SparcApp{
  constructor(){
	this.jobs = {};
    
	this.paused = true;
	
	this.maxSlots = 4;
	this.taskSlots = [];
	this.tasks = {};	
	this.workers = {};
	
	this.sockets = [];
	
	//this.board = ['http://jobboard.sparc.dev'];
	this.board = ['http://board.sparc.dev'];
	
	this.benchResults = {};
	/*
		job must select
			bandwidth: 
				low  : cap 1mb   || 3 requests
				med  : cap 100mb || 10 requests
				high : cap 1gb   || 100 requests
	    
		less miners will open their bandwith, causing price to go up and balance at supply
	*/
	
	//dashboard ui?
	
	//these modules are made available to global scope
	this.modules = {
	  SparcWorker,
	  SparcTask
	};
  }
  
  //move to utilities
  uuid(){
    return  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }
  
  stopMining() {
	this.paused = true;
		
	for(let i = 0, len = this.taskSlots.length; i < len; i++){
		this.taskSlots[i].active = false;
	}
  }
  
  startMining(numSlots, board = this.board[0]) {
	this.paused = false;
	
	for(let i = 0, len = this.taskSlots.length; i < len; i++){
		this.taskSlots[i].active = true;
		this.taskSlots[i].requestTask(board);
	}
	 
	while(numSlots > this.taskSlots.length){
		let slot = new SparcTaskSlot();
			slot.app = this;
			slot.requestTask(board);
			
		this.taskSlots.push(slot);
	}
	
	console.log(this.taskSlots);
  }

  benchmark(name = 'linpack') {
	let linpack = new Linpack();
	  
	if(typeof toggleWorking == 'function'){
		toggleWorking();
	}
	let job = new SparcJob(linpack.getJob());
		job.app = this;
	
	if(this.taskSlots.length < this.maxSlots){
		while(this.taskSlots.length < this.maxSlots){
			let slot = new SparcTaskSlot(job);
				slot.app = this;
			this.taskSlots.push(slot);
			benchmark.addProgressBar();
		}
	}else if(this.taskSlots.length > this.maxSlots){
		while(this.taskSlots.length > this.maxSlots){
			let taskslot = this.taskSlots.pop();
			benchmark.removeProgressBar();
		}
	}
	
	let results = [], t0, t1;
	
	t0 = performance.now();
	
	let tearDown = function(t2){
		for(let i = 1; i < results.length; i++){
			//report all reps
			results[0][0] += results[i][0];
			
			//report timings for slowest worker
			if(results[i][1] > results[0][1]){
				results[0][1] = results[i][1];
				results[0][2] = results[i][2];
				results[0][3] = results[i][3];
				results[0][4] = results[i][4];
			}
			
			//report numFlop
			results[0][5] += results[i][5];
			results[0][6] += results[i][6];
			results[0][7] += results[i][7];
		}
		
		//average kflops
		results[0][5] = results[0][5] / results.length;
		results[0][7] = results[0][7] / results.length;
		
		let totalTime = t2 - t0;
					
		//console.log(totalTime, results[0][7], results[0][6]);
		let gflops = ((results[0][6] * 1e-9) / (results[0][7] / 1000));
		
		benchmark.benchResults.gflops = gflops;
		benchmark.benchResults.totalTime = totalTime;
		benchmark.cpufinished = true;
		benchmark.endBench();
		
		//console.log('results:', results, 'GFlops:', gflops.toFixed(3));
		//console.log(totalTime, t1 - t0, t2 - t1);
	}
	
	job.onload = function(){
		/**
		* Result :
		* 	0 reps		1 time
		* 	2 dgefa		3 dgesl
		* 	4 overhead	5 kflops
		*	6 numKFlop  7 runTime
		*/
					
		t1 = performance.now();
		for(let i = 0; i < this.taskSlots.length; i++){
			let task = job.getTask(0);
				task.job = job;
				
			this.taskSlots[i].runTask(task, function(outBuffer){
				results.push(new Float64Array(outBuffer));
				if(results.length === this.taskSlots.length){
					tearDown(performance.now());
				}
			}.bind(this));
		}
		
		window.requestAnimationFrame(function(){
			benchmark.benchResults.gpuGflops = dotProductTest();
			benchmark.gpufinished = true;
			benchmark.endBench();
		});
	}.bind(this);
	
	job.load(linpack);
  }
}