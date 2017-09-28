class SparcJob{
	constructor({
		id = 'unidentified',
		owner = 'anonymous',
		name = 'new-job',
		version = '0.0.0',
		dependencies = {},
		options = {},
		command = {}
	}){
		this.id = id;
		this.owner = owner;
		this.name = name;
		this.version = version;
		this.dependencies = dependencies;
		this.options = options;
		this.command = command;
		
		this.tasks = [];
		
		if(this.options.get !== void 0){
			this.loaded = false;
		}else{
			this.loaded = true;
		}
		
		this.slicePos = 0;
		//attach things in command to class?
	}
	
	load(linpack) { // needs promises
		this.fn = linpack.getFn();
		this.setup = linpack.getSetup();
		this.onload(this);
		return;
	
	
		if(this.options.get !== void 0){
			var getKeys = Object.keys(this.options.get);
			if(getKeys.length > 0){
				this.loaded = false;
				
				let returnedRequests = 0;
				for(let i = 0; i < getKeys.length; i++){
					let req = new XMLHttpRequest();
			
					req.onload = function(getKey, e) {
						this[getKey] = req.responseText;
						
						returnedRequests++;
						if(returnedRequests === getKeys.length){
							this.loaded = true;
							if(typeof this.onload === 'function'){
								this.onload(this);
							}
						}
					}.bind(this, getKeys[i]);
					
					req.open("GET", this.options.get[getKeys[i]]);
					req.send();
				}
			}
		}
	}
	
	getSlice (index = this.slicePos){
		let slice = this.command.slices[index];
		
		let dataType = slice.dataType;
		if(dataType === void 0 && this.options.input !== void 0){
			dataType = this.options.input.dataType;
		}
		
		if(dataType === void 0){
			dataType = 32;
		}
		
		let data = null;
		switch(dataType){
			case 32:
				data = new Int32Array(slice.data).buffer
				break;
			case 64:
				data = new Float64Array(slice.data).buffer;
				break;
			case 'n64':// aStart, aEnd, aInterval, bStart, bEnd, bInterval ..
				let dimensions = new Float64Array(slice.data);
				let counter  = new Float64Array(dimensions.length / 3);
				let ncounter = new Array(dimensions.length / 3).fill(0);
				
				let size = 1;
				for(let i = 0, index = 0; i < dimensions.length; i++, index += 3){
					size *= ((dimensions[index + 1] - dimensions[index]) / dimensions[index + 2]) + 1;
					counter[i] = dimensions[index];
				}
				
				let numDim = counter.length;
				let view = new Float64Array(size * numDim);
				let pos  = 0;
				
				outer : while(counter[0] <= dimensions[2]){ // make failsafe?
					view.set(counter, pos);
					pos += numDim;
					
					//increment next avail dimension
					inner : for(let i = 0, index = 0; i < counter.length; i++, index += 3){
						let nextValue = (ncounter[i] * dimensions[index + 2]) + dimensions[index];
						if(nextValue <= dimensions[index + 1]){
							counter[i] = nextValue;
							ncounter[i]++;
							break inner;
						}else if(i === counter.length - 1){
							break outer;
						}else{
							counter[i] = dimensions[index];
						}  
					}
				}
				
				data = view.buffer;
				break;
		}
		
		return { data, dataType }
	}
	
	//gives tasks from local jobs
	getTask(index = false) {
		let task = {
			source : 'Self',
			job : this.id,
			miner : 'minerid'
		};
		
		//needs sort order
		task.slices = [this.getSlice()];
		
		//miner.options.slices = 1
		// Slices:
		// 1 - phone size
		// 4 - laptop
		// 16 - desktop
		// more?
		
		// let currentSlice = parseInt(job.command.currentSlice);
		// let totalSlices  = job.command.data.length;
		// let clientSlices = 1;
		// 
		// task.sort = currentSlice;
		// task.data = [];
		// 
		// for(let i = 0; i < clientSlices; i++){
		//   if(currentSlice === totalSlices){
		// 	break;
		//   }
		//   
		//   task.data.push(job.command.data[currentSlice + i]);
		//   job.command.currentSlice++;
		// }
		
		//console.log(task);
		task.id = this.app.uuid();
		
		task = new SparcTask(task);
		task.app = this.app;
		
		this.tasks.push(task);
		
		return task;
	}
}