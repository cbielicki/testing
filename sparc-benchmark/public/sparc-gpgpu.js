class SparcGPGPU{
	constructor({
		canvas = document.createElement('canvas'),
		attr = {alpha : false, antialias : false}
	} = {}){
		let gl, i, version, versions;
		
		canvas.width = '2';
		canvas.height = '1';
		
		//view for dev
		//document.body.appendChild(canvas);
		
		versions = ['webgl2', 'webgl', 'experimental-webgl'];
		for(i = 0; i < versions.length; i++){
			gl = canvas.getContext(versions[i], attr);
			if(gl){
				version = versions[i];
				break;
			}
		}
		
		// If we don't have a GL context, give up now
		if (!gl)
			throw new Error("Unable to initialize WebGL. Your browser may not support it.");

		this.float32Type = gl.RGBA32F;
		
		let texture_float = gl.getExtension('OES_texture_float') || gl.getExtension('MOZ_OES_texture_float') || gl.getExtension('WEBKIT_OES_texture_float');
		
		//get extensions for floating points
		
		//document.getElementById('results').innerText += "Texture Float: " + ((texture_float === null) ? "Yes" : "No.") + '\n';
		
		let texture_float_linear = gl.getExtension('OES_texture_float_linear') || gl.getExtension('MOZ_OES_texture_float_linear') || gl.getExtension('WEBKIT_OES_texture_float_linear');

		//document.getElementById('results').innerText += "Texture Linear: " + ((texture_float_linear === null) ? "Yes" : "No.") + '\n';
		
		let ext_color = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('MOZ_EXT_color_buffer_float') || gl.getExtension('WEBKIT_EXT_color_buffer_float');
		
		if(!texture_float && !texture_float_linear && ext_color){
			this.float32Type = gl.RGBA32F_EXT;
		}
		
		//document.getElementById('results').innerText += "EXT Color Buffer Float: " + ((ext_color === null) ? "Yes" : "No.") + '\n';
		
		//handle no extensions
		//this is a setting were going to have to flag per device
		
		this.version = version;
		this.gl = gl;
		this.program = null;
		
		// multiple?
		this.mvpLocation = null;
		
		//not needed anymore?
		this.shaders = {
			vs : '',
			fs : ''
		};
		
		this.mvp = new Float32Array([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        ]);
		
		this.width = 0;
		this.height = 0;
		this.depth = 1;
		//this.outLen	= 0;
		
		this.iterators = {}; // only the points lined up with your position buffer are available
		this.dataTextures = {}; // full array is available for each vertex
		this.uniforms = {};
		
		this.buffers = {
			iterators : {},
			dataTextures : {},
			uniforms : {},
			out : [], //array for utility with gl.. these are locations?
			positions : null
		}
		
		//document.body.appendChild(canvas);
	}
	
   /**
	* Creates and compiles a gl shader.
	*
	* @param {string} shaderSource The GLSL source code for the shader.
	* @param {number} shaderType The type of shader, VERTEX_SHADER or FRAGMENT_SHADER.
	* @return {!WebGLShader} The shader.
	*/
	createShader(shaderSource, shaderType){
		let gl = this.gl;
		// Create the shader object
		var shader = gl.createShader(shaderType);
		
		// Set the shader source code.
		gl.shaderSource(shader, shaderSource);
		
		// Compile the shader
		gl.compileShader(shader);
		
		// Check if it compiled
		var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (!success) {
			// Something went wrong during compilation; get the error
			throw "could not compile shader:" + gl.getShaderInfoLog(shader);
		}
		
		return shader;
	}
	
   /**
	* Returns a formed string representation of the current shader state
	*
	* @param {string} label The name of the shader
	* @param {number} type The number representing the desired gl type
	* gl.FRAGMENT_SHADER = 35632, gl.VERTEX_SHADER = 35633
	* @param {string} version The version to format for (webgl2 || webgl || experimental)
	* @return {string} The shader.
	*/
	getShaderAsString(label, type, version = 'webgl2'){
		let gl, shader, GL_EOL, i, labels, values, buffers, iterators, dataTextures, width, height, depth, eles, layerSize;
		
		gl = this.gl;
		GL_EOL = ';\n';
		
		shader = '#version 300 es\n';
		
		//precision
		shader += 'precision highp float' + GL_EOL;
		
		if(type === gl.VERTEX_SHADER){
			shader += 'uniform mat4 mvp' + GL_EOL;
			shader += 'layout(location = 0) in vec2 position' + GL_EOL;
			shader += 'layout(location = 1) in vec2 tex_position' + GL_EOL;
			
			iterators = this.iterators;
			labels = Object.keys(iterators);
			values = Object.values(iterators);
			for(i = 0; i < labels.length; i++){
				dataType = values[i].dataType;
				
				if(dataType[0] === 'n'){
					//handle creating buffer for ranges
					//put ranges under a seperate label
					
					dataType = dataType.slice(1);
				}
				
				//set locations?
				vs += 'in vec4 ' + labels[i] + GL_EOL;
				
				//this should be in load buffers
				//this.iterators[labels[i]] = this.createBuffer(values[i].data, dataType);
			}
			
			//uniforms
			
			shader += 'out vec2 vs_position' + GL_EOL;
			
			//helpers
			// shader += 'help(){  }';
		}else if(type === gl.FRAGMENT_SHADER){
			shader += 'precision highp sampler2DArray' + GL_EOL;
			shader += 'in vec2 vs_position' + GL_EOL;
			
			dataTextures = this.dataTextures;
			
			depth = this.depth;
			
			labels = Object.keys(dataTextures);
			values = Object.values(dataTextures);
			
			for(i = 0; i < labels.length; i++){
				
				//set locations?
				shader += 'uniform sampler2DArray ' + labels[i] + GL_EOL;
				
				//viewtype? = Float32Array
				//64x64 default size?
				// this is also happening when the texture is loaded
				eles = 4; //rgba
				layerSize = values[i].data.length / depth / eles;
				//layerSize = values[i].data.length / depth;
				
				if(values[i].cols){
					width  = values[i].cols;
					height = Math.ceil(layerSize / width);
				}else if(values[i].rows){
					height = values[i].rows;
					width  = Math.ceil(layerSize / height);
				}else{
					width  = Math.sqrt(layerSize) | 0;
					height = Math.ceil(Math.sqrt(layerSize / width));
				}
				
				if(width > this.width)
					this.width = width;
				if(height > this.height)
					this.height = height;
				
				//this is a hack. rgba is vec4
				//needs to add missing length to array
				//move to create buffers
				//this.dataTextures[labels[i]] = this.createTexture(values[i].data, width / 4, height);
			}
			
			//uniforms
			
			for(i = 0; i < this.depth; i++){
				shader += `layout(location = ${i}) out vec4 out${i + GL_EOL}`;
			}
			
			//helpers
			// shader += 'help(){  }';
			
		}
		
		this.shaders[label] = shader;
		
		return shader;
	}
	
	/**
	* Loads uniforms into compute shader
	*
	* uniforms = {
	* 		i : {
	*				data : int || vec4 arrayBuffer || mat4 arrayBuffer
	*				dataType : '32'
	*           }
	* }
	*
	* from Uint8 to mat4
	* @param {...uniformDefs} uniforms
	* @return {bool} success
	*/
	loadUniforms(uniforms){}
	
   /**
	* Loads buffers as dataTextures with iterators for them
	* 
	* These data buffers are entirely available to the fragment shader as textures
	* dataBuffers = {
	*		a : {
	*			cols : 64,
	*			data : buffer
	*		},
	*		b : buffer
	*	}
	*
	*
	* The elements in these array are only available during their vertex by index position
	* iterators = {
	* 		i : {
	*				data : array || buffer
	*				dataType : 'n32'
	*           }
	* }
	*
	* @param {[object]} dataBuffers describes a series of labled dataTextures
	* @param {[object]} primaryIndex defines the number of times the shader loops
	* @param {[array][objects]} iterators are additional per-vertex elements
	* @return {!WebGLShader} The shader.
	* primaryIndex = { i : { cols : 4, data : [1,2,3,4], dataType : 32 }}, 
	*/
	loadBuffers(dataTextures = {}, iterators = {}){
		let gl, i, labels, values, texture, width, height, depth, eles, layerSize;
		
		gl = this.gl;
		//right now everything is being split into 3d to take advantage of TEXTURE_2D_ARRAY
		//should fallback to TEXTURE_2D on depths 1, and 2
		
		this.dataTextures = dataTextures;
		
		labels = Object.keys(dataTextures);
		values = Object.values(dataTextures);
		for(i = 0; i < labels.length; i++){
			depth = values[i].depth;
			if(depth > this.depth){
				this.depth = depth;
			}
			
			eles = 4; //rgba
			layerSize = values[i].data.length / depth / eles;
			//layerSize = values[i].data.length / depth;
			
			if(values[i].cols){
				width  = values[i].cols;
				height = Math.ceil(layerSize / width);
			}else if(values[i].rows){
				height = values[i].rows;
				width  = Math.ceil(layerSize / height);
			}else{
				width  = Math.sqrt(layerSize) | 0;
				height = Math.ceil(Math.sqrt(layerSize / width));
			}
						
			texture = gl.createTexture();
			gl.activeTexture(gl.TEXTURE0 + i + 1);// outputTexture is 0
			
			gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_BASE_LEVEL, 0);
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAX_LEVEL,  0);
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			
			//needs to handle types
			
			gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, this.float32Type, width, height, depth, 0, gl.RGBA, gl.FLOAT, new Float32Array(values[i].data));
				
			this.buffers.dataTextures[labels[i]] = texture;
		}
		
		//iterators
	}
	
	   /**
    * Creates a program from 2 shaders.
    *
    * @param {string} vertexShader A main fuction for vertex shader.
    * @param {string} fragmentShader A main fuction for fragment shader.
    * @return {!WebGLProgram} A program.
    */
	loadProgram(vsMainFn, fsMainFn){
		let gl = this.gl;
		
		this.getShaderAsString('vs', gl.VERTEX_SHADER);
		this.getShaderAsString('fs', gl.FRAGMENT_SHADER);
		
		// validate this is happening at the right time
		if(this.shaders.vs.length === 0 || this.shaders.fs.length === 0){
			console.log("Error: trying to load SPARC-GPGPU program before buffers.");
			return null;
		}
		
		this.shaders.vs += vsMainFn;
		this.shaders.fs += fsMainFn;
		
		//console.log(this.shaders.vs);
		//console.log(this.shaders.fs);
		
		//gl.compileShader + util
		let vs = this.createShader(this.shaders.vs, gl.VERTEX_SHADER);
		let fs = this.createShader(this.shaders.fs, gl.FRAGMENT_SHADER);
		
		let program = gl.createProgram();
 
		// attach the shaders.
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		
		//gl.deleteShader ?
		
		// link the program.
		gl.linkProgram(program);
		
		// Check if it linked.
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
			// something went wrong with the link
			throw ("program filed to link:" + gl.getProgramInfoLog(program));
			
			//shader info log?
			//log = gl.getShaderInfoLog(fshader);
			//if (log) {
			//	console.log(log);
			//}			
		}
		
		this.mvpLocation = gl.getUniformLocation(program, 'mvp');
		this.program = program;
		
		return program;
	}
	
		
   /**
    * Run program
    *
    * @param {!WebGLProgram} A program.
    * @return {[blob]} Result
    */
	run(program = this.program){
		let gl, i, width, height, depth, labels, values, dataTextures, bytes, layerByteSize;
		
		gl = this.gl;
		dataTextures = this.dataTextures;
		width = this.width;
		height = this.height;
		depth = this.depth;
			
		//this should be created dynamically?
		var positions = new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
             1.0,  1.0,
             1.0,  1.0,
            -1.0,  1.0,
            -1.0, -1.0
        ]);
        var outputVertexPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, outputVertexPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
		
        gl.bindBuffer(gl.ARRAY_BUFFER, null); //clear
		
		var texcoords = new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0
        ]);
        var inputVertexTexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, inputVertexTexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);
        
		gl.bindBuffer(gl.ARRAY_BUFFER, null); //clear
		
		//trying to do this in load buffers breaks. Happens before use program?
		var outputVertexArray = gl.createVertexArray();
        gl.bindVertexArray(outputVertexArray);
        
		var outputVertexPosLocation = 0; // set with GLSL layout qualifier		
        gl.bindBuffer(gl.ARRAY_BUFFER, outputVertexPosBuffer);
        gl.vertexAttribPointer(outputVertexPosLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(outputVertexPosLocation);
        
		gl.bindBuffer(gl.ARRAY_BUFFER, null); //clear
		
		var inputVertexTexLocation = 1; // set with GLSL layout qualifier
        gl.bindBuffer(gl.ARRAY_BUFFER, inputVertexTexBuffer);
        gl.vertexAttribPointer(inputVertexTexLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(inputVertexTexLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
		
        gl.bindVertexArray(null); //clear
		
		//send this to create Texture?
		gl.activeTexture(gl.TEXTURE0);
        var outputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, outputTexture);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_BASE_LEVEL, 0);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAX_LEVEL, 0);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);        
		
		// depth? provides multiple out values per input (up to 4 x 32f per layer)
		// this needs toe select the right type to load 8, 16, 32, 32f
		// these should be floats?
		
        gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, this.float32Type, width, height, depth, 0, gl.RGBA, gl.FLOAT, null);
		
		// Draw
		
		// Creates the Output Framebuffer
		var frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, frameBuffer);
        
		this.buffers.out = [];
		for(i = 0; i < this.depth; i++){
			let bufferLocation = gl.COLOR_ATTACHMENT0 + i;
			
			this.buffers.out.push(bufferLocation);
			
			gl.framebufferTextureLayer(gl.DRAW_FRAMEBUFFER, bufferLocation, outputTexture, 0, i);
		}
        
		
		// This is extremely slow
		//var status = gl.checkFramebufferStatus(gl.DRAW_FRAMEBUFFER);
        //if (status != gl.FRAMEBUFFER_COMPLETE) {
		//	//change to error string gl.INCOMPLETE_ATTACHMENT
        //    console.log('fb status: ' + status.toString());
        //    return;
        //}
		
        gl.drawBuffers(this.buffers.out);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null); //is this required?
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, outputTexture);
		// unbind?
		// END Create Output Framebuffer
		
        
		// Draw -- runs the program
		
		// is this required? clear last frame buffer?
        // Clear color buffer
        //gl.clearColor(0.0, 0.0, 0.0, 1.0);
        //gl.clear(gl.COLOR_BUFFER_BIT);
		
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, frameBuffer);
        gl.useProgram(program);
        
		//gl.uniform1i(multipleOutputUniformTextureLocation, 0);
		dataTextures = this.buffers.dataTextures;
		labels = Object.keys(dataTextures);
		values = Object.values(dataTextures);
		for(i = 0; i < labels.length; i++){			
			gl.activeTexture(gl.TEXTURE0 + i + 1); // 0 is out texture
			gl.bindTexture(gl.TEXTURE_2D_ARRAY, values[i]); // does it matter these are in 3d?
			gl.uniform1i(gl.getUniformLocation(program, labels[i]), 1); // i + 1?
		}
		
		//this required?
		//gl.bindVertexArray(this.buffers.positions);
		
		// mvp
        gl.uniformMatrix4fv(this.mvpLocation, false, this.mvp);		
        gl.bindVertexArray(outputVertexArray);
        
		gl.viewport(0, 0, width, height);
        
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		
		return frameBuffer;
	}
	
	read (frameBuffer, width, height) {
		let gl = this.gl;
		let layerSize = width * height; // * 4?
		
		var data = new Float32Array(layerSize * this.depth);
		
		gl.bindFramebuffer(gl.READ_FRAMEBUFFER, frameBuffer);
		
		for(let i = 0; i < this.depth; i++){
			gl.readBuffer(gl.COLOR_ATTACHMENT0 + i);
			gl.readPixels(0, 0, (width / 4) | 0, height, gl.RGBA, gl.FLOAT, data, layerSize * i);
		}
		
		return data.buffer;
	}
	
	clear () {
		let gl = this.gl;
		
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
	}
	
	destroy(){
		let gl = this.gl;
		
		//other stuff + loops
		gl.deleteBuffer(vertexPosBuffer);
        gl.deleteVertexArray(multipleOutputVertexArray);
        gl.deleteFramebuffer(frameBuffer);
        gl.deleteTexture(texture);
        gl.deleteProgram(multipleOutputProgram);
	}
}

var gpu, buffers, program, result;

//assumes matrixes are square
var dotProductTest = function(){
	if(!gpu) gpu = new SparcGPGPU();
	
	let reps = 1000;
	let n = 512;
	let data = new Array(n * n);
	for(let i = 0; i < n * n; i++){
		data[i] = i + 1;		
	}
	
	buffers = gpu.loadBuffers({
		a : {
			cols : (n / 4) | 0, 
			depth : 1, //right now depth is static at 1 == 1 x vec4(32f) ouput
			data : data
		},
		b : {
			cols : (n / 4) | 0,
			depth : 1,
			data : data
		}
	},
	{});

	let vs = 
`void main(){
	gl_Position = mvp * vec4(position, 0.0, 1.0);
	vs_position = tex_position;
}`;

	let fs = 
`const float width = ${n / 4}.0;
const float height = ${n}.0;
void main(){
	vec4 sum0 = vec4(0., 0., 0., 0.);
	
	float i = 1. / width;
	float iy = 1. / height;
	float pos_x = vs_position.x;
	float pos_y = vs_position.y;
	float x = i / 2.;
	float y = iy / 2.;
	float j = 0.;
	vec4 texela = vec4(0.,0.,0.,0.);
	vec4 texelb = vec4(0.,0.,0.,0.);
	int r = 0;	
	for(int reps = 0; reps < ${reps}; reps++){
		sum0 = sum0 - sum0;
		for(x = i / 2., y = iy / 2.; x < 1.; x += i){
			texela = texture(a, vec3(x, pos_y, 0.));
			for(r = 0; r < 4; y += iy, r++){
				texelb = texture(b, vec3(pos_x, y, 0.));
				sum0 = texelb * texela[r] + sum0;
			}
		}
	}
	out0 = sum0;
}`;

	program = gpu.loadProgram(vs, fs);
	
	
	let framebuffer = null;
	let t1 = performance.now();
	
	framebuffer = gpu.run();
	result = new Float32Array(gpu.read(framebuffer, n, n));
	
	let milliseconds = performance.now() - t1;
	let seconds = milliseconds / 1000;
	
	let ops = ((2 * n * n * n) - (n * n)) * reps;
	
	//console.log('GFlops without read:', (ops / seconds) / 1000000000, seconds);
	
	//document.getElementById('results').innerText += 'GFlops with read: ' + ((ops / seconds) / 1000000000).toFixed(4) + '\n';
	
	//result = new Float32Array(gpu.read(framebuffer, n, n));
	
	//for 8x8 starting at 1 = [1,2,3,4..
	//let expectedResult = [1380, 1416, 1452, 1488, 1524, 1560, 1596, 1632, 3236, 3336, 3436, 3536, 3636, 3736, 3836, 3936, 5092, 5256, 5420, 5584, 5748, 5912, 6076, 6240, 6948, 7176, 7404, 7632, 7860, 8088, 8316, 8544, 8804, 9096, 9388, 9680, 9972, 10264, 10556, 10848, 10660, 11016, 11372, 11728, 12084, 12440, 12796, 13152, 12516, 12936, 13356, 13776, 14196, 14616, 15036, 15456, 14372, 14856, 15340, 15824, 16308, 16792, 17276, 17760];
	
	//console.log(result);
	
	return ((ops / seconds) / 1000000000);
}

var warmup = function(){
	if(!gpu) gpu = new SparcGPGPU();
	
	let reps = 100;
	let n = 64;
	let data = new Array(n * n);
	for(let i = 0; i < n * n; i++){
		data[i] = i + 1;		
	}
	
	buffers = gpu.loadBuffers({
		a : {
			cols : (n / 4) | 0, 
			depth : 1, //right now depth is static at 1 == 1 x vec4(32f) ouput
			data : data
		},
		b : {
			cols : (n / 4) | 0,
			depth : 1,
			data : data
		}
	},
	{});

	let vs = 
`void main(){
	gl_Position = mvp * vec4(position, 0.0, 1.0);
	vs_position = tex_position;
}`;

	let fs = 
`const float width = ${n / 4}.0;
const float height = ${n}.0;
void main(){
	vec4 sum0 = vec4(0., 0., 0., 0.);
	
	float i = 1. / width;
	float iy = 1. / height;
	float pos_x = vs_position.x;
	float pos_y = vs_position.y;
	float x = i / 2.;
	float y = iy / 2.;
	float j = 0.;
	vec4 texela = vec4(0.,0.,0.,0.);
	vec4 texelb = vec4(0.,0.,0.,0.);
	int r = 0;	
	for(int reps = 0; reps < ${reps}; reps++){
		sum0 = sum0 - sum0;
		for(x = i / 2., y = iy / 2.; x < 1.; x += i){
			texela = texture(a, vec3(x, pos_y, 0.));
			for(r = 0; r < 4; y += iy, r++){
				texelb = texture(b, vec3(pos_x, y, 0.));
				sum0 = texelb * texela[r] + sum0;
			}
		}
	}
	out0 = sum0;
}`;

	program = gpu.loadProgram(vs, fs);
	
	
	let framebuffer = null;
	let t1 = performance.now();
	
	framebuffer = gpu.run();
	result = new Float32Array(gpu.read(framebuffer, n, n));
	
	let milliseconds = performance.now() - t1;
	let seconds = milliseconds / 1000;
	
	let ops = ((2 * n * n * n) - (n * n)) * reps;
	
	//console.log('GFlops without read:', (ops / seconds) / 1000000000, seconds);
	
	//document.getElementById('results').innerText += 'GFlops with read: ' + ((ops / seconds) / 1000000000).toFixed(4) + '\n';
	
	//result = new Float32Array(gpu.read(framebuffer, n, n));
	
	//for 8x8 starting at 1 = [1,2,3,4..
	//let expectedResult = [1380, 1416, 1452, 1488, 1524, 1560, 1596, 1632, 3236, 3336, 3436, 3536, 3636, 3736, 3836, 3936, 5092, 5256, 5420, 5584, 5748, 5912, 6076, 6240, 6948, 7176, 7404, 7632, 7860, 8088, 8316, 8544, 8804, 9096, 9388, 9680, 9972, 10264, 10556, 10848, 10660, 11016, 11372, 11728, 12084, 12440, 12796, 13152, 12516, 12936, 13356, 13776, 14196, 14616, 15036, 15456, 14372, 14856, 15340, 15824, 16308, 16792, 17276, 17760];
	
	//console.log(result);
	
	return ((ops / seconds) / 1000000000);
}

gpu = null;
window.addEventListener('load', function(){
	//unitTest();
	//matTestLayers();
	//matTest2by1Layer();
	//matTest2by2();
	//matTest2by2_3Layers();
	//dotProductTest();
	warmup();
});