// sets up the ui from client data



//starts the hand builder
function startBuilder(){}




//renders the hand builder
function renderBuilder(){};




//starts the board
function startBoard(data){
  let canvas;
  canvas = document.createElement('canvas');
  canvas.id = 'canvas';
  canvas.width = '1000';
  canvas.height = '500';
  document.body.appendChild(canvas);
  let gl2 = canvas.getContext('webgl2');
  if(typeof gl2 === 'undefined') console.log('unable to initialize webgl 2.0');

  gl2.clearColor(0.1, 0.3, 0.0, 1.0);
  gl2.clear(gl2.COLOR_BUFFER_BIT);

  let vertexShader = createShader(gl2, gl2.VERTEX_SHADER, vertexShaderString);
  let fragmentShader = createShader(gl2, gl2.FRAGMENT_SHADER, fragmentShaderString);

  let program = createProgram(gl2, vertexShader, fragmentShader);

  let positionAttributeLocation = gl2.getAttribLocation(program, 'a_position');


  let positionBuffer = gl2.createBuffer();

  gl2.bindBuffer(gl2.ARRAY_BUFFER, positionBuffer);

  let positions = [
    0, 0,
    0, 0.5,
    0.7, 0,
  ];
  gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(positions), gl2.STATIC_DRAW);


  gl2.viewport(0, 0, gl2.canvas.width, gl2.canvas.height);

  gl2.clearColor(0, 0, 0, 0);
  gl2.clear(gl2.COLOR_BUFFER_BIT);

  gl2.useProgram(program);

  gl2.enableVertexAttribArray(positionAttributeLocation);

  gl2.bindBuffer(gl2.ARRAY_BUFFER, positionBuffer);

  let size = 2;
  let type = gl2.FLOAT;
  let normalize = false;
  let stride = 0;
  let offset = 0;
  gl2.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

  let primitiveType = gl2.TRIANGLES;
  offset = 0;
  let count = 3;
  gl2.drawArrays(primitiveType, offset, count);
};




//renders the board from data
function renderBoard(data){
};




//vertex shader string
let vertexShaderString = `
  attribute vec4 a_position;

  void main() {
    gl_Position = a_position;
  }
`;



//fragment shader string
let fragmentShaderString = `
  precision mediump float;

  void main() {
    gl_FragColor = vec4(1, 0, 0.5, 1);
  }
`;


//compiles a shader
function createShader(gl, type, source) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if(success) {
    return shader;
  };

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
};



//creates a program
function createProgram(gl, vertexShader, fragmentShader) {
  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  let success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if(success) {
    return program;
  };

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
};
