/**
 *	@fileOverview Sparc Worker
 *	@author Sparc
 *	@version 0.1.0
 *
 *  This class binds worker messages to functions
 *   
 *   worker.run() 			== worker.message( { request : 'run' } );
 *   worker.runLoop() 		== worker.message( { request : 'run-loop' } );
 *   worker.setup() 		== worker.message( { request : 'setup' } );
 *   worker.load( buffer ) 	== worker.message( { request : 'load', data : buffer } );
 *
 */
 
/** @namespace */
class SparcWorker{
  constructor( task ){
    let worker = new Worker(window.URL.createObjectURL(new Blob([ task.toString() ])));
	
    worker.id = '';
	worker.task = task;

    //Worker Workflow
    worker.load  = SparcWorker.message.bind(worker, 'load');
    worker.setup = SparcWorker.message.bind(worker, 'setup');
    worker.run   = SparcWorker.message.bind(worker, 'run');
	//get start time
	worker.runLoop = SparcWorker.message.bind(worker, 'run-loop');

    worker.addEventListener('message', SparcWorker.onMessage.bind(worker));

    return worker;
  }

  static onMessage(message){
    if(message.error){
      console.log(message.error);
    }else{
      let data = null;
      if( typeof message.data !== 'undefined'
      &&  typeof message.data.data !== 'undefined'){
        data = message.data.data;
      }

	  //add times
      this.onResponse(message.data.response, data);
    }
  }

  static message( request, data ){
    let message = {
      request : request
    };

    if(typeof data !== 'undefined'){
      message.data = data;
    }

    this.postMessage(message);
  }
}