class SparcTask{
	constructor({
		id = 'unidentified',
		source = 'Self',
		miner = 'anonymous',
		job = 'new-job',
		sort = 0,
		slices = []
	}){
	
		this.id 			= id 			
		this.source 		= source 		
		this.miner 			= miner 			
		this.job 			= job 			
		this.sort 			= sort 
		this.slices 		= slices 		
		
		this.slicePos = 0;
		
		//load job from id
		
		if(this.id === 'unidentified'){ // can hash for task id here
			this.id =	this.app.uuid();
		}
	}
  
  //tasks can have multiple slices
	getSlice (index = this.slicePos){
		let slice = this.job.command.slices[index];
		
		let dataType = slice.dataType;
		if(dataType === void 0 && this.job.options.input !== void 0){
			dataType = this.job.options.input.dataType;
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
  
  upload ( resultBuffer, callback ) {
	var xhr = new XMLHttpRequest();
	
	let server = '';
	if(this.put.data){
		server = this.put.data;
	}else{
		//server = board?
	}
	
    xhr.open("POST", server + '/upload', true);
    
    xhr.setRequestHeader("Content-type", "multipart/form-data");
	
	xhr.setRequestHeader("sparc-jobid", this.job);
	xhr.setRequestHeader("sparc-taskid", this.id);
	xhr.setRequestHeader("sparc-sort", this.sort);
	//need another secret?
    //sign?
	
    xhr.onreadystatechange = function() {
      if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
        if(typeof callback === 'function'){
		  callback('success'); // some message?
	    }
      }
    }
	
    xhr.send( resultBuffer ); 
  }

  static loadDependencies(depObject){
    let reqDeps = {}; //dependancy list
        
    let loadSubDependencies = function(depObject){
      let mkeys = Object.keys(depObject);
      
      for(let i = 0; i < mkeys.length; i++){
        let mkey = mkeys[i];
        let deps = depObject[mkey];
        
        if(mkey === 'Self' || reqDeps[mkey] === true){
          continue; // skip loading tree
        }else if(deps === true){
          reqDeps[mkey] = true; // true loads entire class
        }else if(typeof reqDeps[mkey] !== 'undefined'){  
          for(let j = 0; j < deps.length; j++){
            if(reqDeps[mkey].indexOf(deps[j]) === -1){
              reqDeps[mkey].push(deps[j]);
              
              let subDeps = new window[mkey]().dependencies;
              if(typeof subDeps !== 'undefined' 
              && typeof subDeps.Self !== 'undefined'){
                loadSubDependencies(subDeps);
                
                if(typeof subDeps.Self[deps[j]] !== 'undefined'){
                  loadSubDependencies(subDeps.Self[deps[j]]);
                }
              }
            }
          }
        }else{
          reqDeps[mkey] = deps;
          
          for(let j = 0; j < deps.length; j++){ //abstract?
            let subDeps = new window[mkey]().dependencies;
            if(typeof subDeps !== 'undefined' 
            && typeof subDeps.Self !== 'undefined'){
              loadSubDependencies(subDeps);
              
              if(typeof subDeps.Self[deps[j]] !== 'undefined'){
                loadSubDependencies(subDeps.Self[deps[j]]);
              }
            }
          }
        }
      }
    }
    
    // Get unique list of dependencies
    if(typeof depObject !== 'undefined'){
      loadSubDependencies(depObject);
    }
    
    // Compile them as strings
    let depStringList = [];
    let deps = Object.keys(reqDeps);
    for(let i = 0; i < deps.length; i++){
      let dep = deps[i];
      let subDep = reqDeps[dep];
      if(subDep === true){
        //load entire module;
        //I guess they need a list of all functions?
        //This stuff should happen dynamically, we should fork systemjs
      }else{
        let depShell = "{";
        for(let j = 0; j < subDep.length; j++){
          if(j > 0) depShell += ',';
            
          depShell += subDep[j] + ':' +  window[dep][subDep[j]].toString();
        }
        
        depStringList.push('let ' + dep + ' = ' + depShell + '};');
      }
    }
    
    return depStringList;
  }
  
  // this should be on sparc worker?
  static workerWrap(){
    let inB   = null;//input buffer
    let i     = 0;//input buffer position
    let ii    = 2;//input buffer interval (per n)

    let outB  = null;//output buffer
    let o     = 0;//output buffer position
    let oi    = 2;//output buffer interval (per n)

    let d     = 0;//depth counter -- not really nessisary
    let n     = 0;//function counter

    let wt    = 0;//throttle as percent -- doesn't work right now

    let s     = {};//Object for functions to keep custom setup vars

    var dependencies = function dependencies(_dependencies) {};//Gets replaced with modules in proper scope
    
    let setup = function setup(_setup) {};//Gets replaced with custom setup function

    let fn    = function fn(_fn) {};//Gets replaced with custom function

    let aSyncLoop = function(){
      //get before time

      fn();

      //get after time

      //browsers don't like timeouts.
      //minwait = 4ms.
      //need to wait less often
      setTimeout(aSyncLoop, wt);
    };

    let run = function(){
      //get before time
	  
      fn(); // handle exit requests? (return === false)

      //get after time

      postMessage({
        response : 'complete',
        data    : outB
      });
    };

    //for f(n) things
    let runLoop = function(){
      //needs new way to track loops?
      while(n << oi <= outB.byteLength){//number of runs * memory allocated per run <= output buffer length
        
		fn(); // handle exit requests? (return === false)

        //get after time

        //Report if interval of 1/8 complete
        if(o % (outB.byteLength >> 3) === 0){ //output buffer posistion / output buffer size
          
		  //send timing information based on priority (task slice info)
		  postMessage({
            response : 'progress',
            data    : o / outB.byteLength
          });
        }

        i = (1 << ii) + i;//increase input counter by input interval
        o = (1 << oi) + o;//increase output counter by output interval
        n = 1 + n;//increase function counter
      }

      postMessage({
        response : 'complete',
        data : outB
      });
    };

    this.onmessage = function(message){
      let req = message.data.request; //message type
      let dat = message.data.data;//message
      
      if(req === 'load'){
        if(typeof dat.input !== 'undefined'){
          inB = dat.input.data || new ArrayBuffer(); //load data or empty into array buffer
          ii = dat.input.dataType || 32; //load interval or set to 4 bytes. (1 << 2)
        }else{
          inB = new ArrayBuffer();
        }
		
		//hack
		if(ii === 'n64'){
			ii = 64;
		}
        
        oi = ii; // output interval default to input interval
        let olen = inB.byteLength / (ii >> 3) ;// Default output to input size * differnce in ii to oi
        if(typeof dat.output !== 'undefined'){
          olen = dat.output.length   || olen; //let user override output buffer size
          oi = dat.output.dataType   || 32;
        }
		
		//hack
		if(oi === 'n64'){
			oi = 64;
		}
        
        outB = new ArrayBuffer(olen * (oi >> 3)); // create output buffer
		
        postMessage({
          response : 'loaded'
        });
      }else if(req === 'setup'){
        //get before time

        setup();

        //get after time

        postMessage({
          response : 'ready'
        });
      }else if(req === 'run'){
        run();
      }else if(req === 'run-loop'){
        runLoop();
      }
    };
  };
  
  // returns source string to create webworker
  toString() {
    let fn = this.job.fn;
    let setup = this.job.setup;
    let dependencies = this.job.dependencies;
      
    if( typeof fn === 'function' )
      fn = Function.toString.apply(fn);

    if( typeof setup === 'function' )
      setup = Function.toString.apply(setup);

    //set defualt pkg requirments
    
    // this splits and injects the code into the wrapper as strings
    // these are getting changed when transpiled, so this has to work differntly.
    let sliceKeys = {
      dependencies : 'var dependencies = function dependencies(_dependencies) {}', // this has var part, because they are scoped to their names
      setup : 'function setup(_setup) {}',
      fn : 'function fn(_fn) {}'
    };

	// should change this nomenclature to not confuse
	
    let keys = Object.keys(sliceKeys);

    let slices = [SparcTask.workerWrap.toString()];
    for(let i = 0, s = 0; i < keys.length; i++){
      let key = keys[i];
      let sliced = slices[s].split(sliceKeys[key]);

      if(key === 'setup'){
        sliced.splice(1, 0, setup);
      }else if(key === 'fn'){
        sliced.splice(1, 0, fn);
      }else if(key === 'dependencies'){ //load dependencies
        let dlist = SparcTask.loadDependencies(dependencies);
        sliced.splice(1, 0, ...Object.values(dlist));
      }

      slices.splice(s, 1, ...sliced);

      s += sliced.length - 1;
    }
    
    return '( function ' + slices.join('') + ')()';
  }
}