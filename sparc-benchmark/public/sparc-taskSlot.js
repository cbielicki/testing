class SparcTaskSlot{
  constructor(job = {}){
	this.active = true;
	this.working = false;
	
	this.job  = job;
	this.task = null;
	
	this.workers = {};
	
	this.progressBar = false;
	
  }
  
  createWorker( task ){
    let worker = new SparcWorker( task );

    this.workers[worker.id] = worker;

    return worker;
  }
  
  onComplete(outBuffer, callback){
	if(this.active){
		//get next task?
	}else{
		let index = this.app.taskSlots.indexOf(this);
		if(index != -1){
			this.app.taskSlots.splice(index, 1);
		}
		
		worker.terminate();
	}
	
	if(typeof callback === 'function'){
		callback(outBuffer);
	}
	
	this.working = false;
  }
  
  runTask (task = this.task, callback) {
	if(this.working){
		console.log('Error: Slot full.');
		return false; // throw error?
	}
	
	this.task = task;
	this.working = true;
	
	let worker = this.createWorker(task);
		
	//this needs to be exposed
	worker.onResponse = function(res, data){
        if(res === 'ready'){
			benchmark.updateProgressBar(this.app.taskSlots.indexOf(this), 0);
			worker[task.job.command.worker]();
        }else if(res === 'loaded'){
            worker.setup();
        }else if(res === 'complete'){
		    this.onComplete(data, callback);
			benchmark.updateProgressBar(this.app.taskSlots.indexOf(this), 100);
        }else if(res === 'progress'){        
		    if(this.progressBar){
				benchmark.updateProgressBar(this.app.taskSlots.indexOf(this), 0);
		    }
        }
      
      //console.log(message);
    }.bind(this);
	
	//console.log(task);
	let options = {
		output  : task.job.command.options.output,
		//output  : job.command.options.output,
		input 	: task.getSlice()
	}
	
	//this needs to be exposed
    worker.load(options);
	
	return;    
  }
}