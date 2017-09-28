class Linpack{
	constructor(){};
	
	getJob(){
		return {
			"id" : "linpack",
			"owner" : "benchmark",
			"name" : "linpack",
			"version" : "1.0.0",		
			"dependencies" : {},
			
			"options" : {
				"get" : {
					"setup" : "linpack/linpack-setup.js",
					"fn" 	: "linpack/linpack-fn.js"
				},
				"put" : {
					"slices" : "http://host.sparc.dev"
				}
			},
			
			"command" : {
				"worker" : "run",
				"currentSlice" : 0,
				"slices" : [{
					"data" : [1024, 256]
				}],
				"options" : {
					"input" : {
						"dataType" : 64
					},
					"output" : {
						"dataType" : 64,
						"length" : 8
					}
				}
			}
		};
	}
	
	getSetup(){
		return (() => {
			/**
			* Options :
			*   0 nreps		1 size
			*
			* Result :
			* 	0 reps		1 time
			* 	2 dgefa		3 dgesl
			* 	4 overhead	5 kflops
			*   6 numKFlop  7 runTime
			*/
			let options = new Uint32Array(inB);
			let nreps = options[0];
			let size = options[1];
			
			let result = new Float64Array(outB);
			
			let a = new Array(size * (size >> 1));
			let b = new Array(size * 3); // is this right?
			let ipvt = new Array(size >> 1)
			
			a[0] = size * size;
			b[0] = size;
			ipvt[0] = size;
			
			//s is setup object that fn has access to
			s = {
				result,
				a,
				b,
				ipvt,
				nreps,
				size
			};
		}).toString();
	}
	
	
	
	getFn(){
		return (() => {
			let {result, a, b, ipvt, nreps, size} = s;
			//ipvt = [];
			let t1, tdgefa = 0, tdgesl = 0, totalt, toverhead, kflops;
			let lda = s.size;
			let n = lda >> 1;
			let ops = ( ( 2.0 * n * n * n ) / 3.0 + 2.0 * n * n );
			
			/**
			*	These are utilities. There is probably a better way to load them
			*
			*/
			
			let matgen = function(){
				let init, norma, i, j, apos;
				
				init  = 1325;
				norma = 0.0;
				
				for(j = 0; j < n; j++){	
					apos = lda * j;
					for (i = 0; i < n; i++, apos++){
						init = 3125 * init % 65536;
						a[apos] = (init - 32768.0) / 16384.0;
						norma = (a[apos] > norma) ? a[apos] : norma;
					}
				}
				
				for (i = 0; i < n; i++){
					b[i] = 0.0;
				}
				
				for (j = 0; j < n; j++){
					apos = lda * j;
					for(i = 0; i < n; i++, apos++){
						b[i] = a[apos] + b[i];
					}
				}
			};
	
			/*
			**
			** DGEFA benchmark
			**
			** We would like to declare a[][lda], but c does not allow it.  In this
			** function, references to a[i][j] are written a[lda*i+j].
			**
			**   dgefa factors a double precision matrix by gaussian elimination.
			**
			**   dgefa is usually called by dgeco, but it can be called
			**   directly with a saving in time if  rcond  is not needed.
			**   (time for dgeco) = (1 + 9/n)*(time for dgefa) .
			**
			**   on entry
			**
			**      a       REAL precision[n][lda]
			**              the matrix to be factored.
			**
			**      lda     integer
			**              the leading dimension of the array  a .
			**
			**      n       integer
			**              the order of the matrix  a .
			**
			**   on return
			**
			**      a       an upper triangular matrix and the multipliers
			**              which were used to obtain it.
			**              the factorization can be written  a = l*u  where
			**              l  is a product of permutation and unit lower
			**              triangular matrices and  u  is upper triangular.
			**
			**      ipvt    integer[n]
			**              an integer vector of pivot indices.
			**
			**      info    integer	<removed>
			**              = 0  normal value.
			**              = k  if  u[k][k] .eq. 0.0 .  this is not an error
			**                   condition for this subroutine, but it does
			**                   indicate that dgesl or dgedi will divide by zero
			**                   if called.  use  rcond  in dgeco for a reliable
			**                   indication of singularity.
			**
			**   linpack. this version dated 08/14/78 .
			**   cleve moler, university of New Mexico, argonne national lab.
			**
			**   functions
			**
			**   blas daxpy,dscal,idamax
			**
			*/
			
			//move to shader here -> setup, load values
			//run values ->	
			dgefa = function(){
				let kp1, klda, kklda, kllda, jllda, jklda, i, j, k, n, ntemp, m, t, l, nm1, offset_dx, offset_dy, dmax, cdmax;
				
				n = lda >> 1;
				nm1  = n - 1;
				t = 1.1; //float64
				
				/* gaussian elimination with partial pivoting */
				for (k = 0; k < nm1; k++){
					kp1 = 1 + k;
					klda = k * lda; // - no l yet
					kklda = k + klda;
					ntemp = n - k;
					
					l = 0;
					if(ntemp > 1){
						//l = idamax(n - k, a, kklda, 1) + k | 0;
						//let idamax = function(n, dx, offset_dx, incx){ //incx is one
						offset_dx = kklda;
						dmax = Math.abs(a[offset_dx]);
						for(i = 1; i < ntemp; i++, offset_dx++){
							cdmax = Math.abs(a[offset_dx]);
							if(cdmax > dmax){
								l = i;
								dmax = cdmax;
							}
						}
					}else{
						l = -1; // this doesnt happen?
					}
					
					ipvt[k] = l;
					
					/* zero pivot implies this column already
						triangularized */
					kllda = l + klda;
					if(a[kllda] !== 0){
						/* interchange if necessary */
						if (l !== k){
							t = a[kklda];
							a[kklda] = a[kllda];
							a[kllda] = t;
						}
	
						/* compute multipliers */
	
						t = -1 / a[kklda];
						//can cast?
						
						// dscal_r has been placed in-line here
						//dscal(n - (k + 1), t, a, kklda + 1, 1);
						//for (let j = 0, nr = n - (k + 1), offset_dx = kklda + 1; j < nr; j++, offset_dx++) {
						//	a[offset_dx] = t * a[offset_dx];
						//}
						//let dscal_ur = function(n, da, dx, offset_dx, incx){
						
						offset_dx = kklda + 1;
						ntemp = n - (k + 1);
						if(n !== k){
							/* code for increment not equal to 1 */
							for (i = 0; i < ntemp; i++, offset_dx++){
								a[offset_dx] = t * a[offset_dx];
							}
						}else{
							/* code for increment equal to 1 */
							m = ntemp % 5;
							if (m !== 0){
								for (i = 0; i < m; i++, offset_dx++){
									a[offset_dx] = t * a[offset_dx];
								}
								
							}
							
							if (ntemp > 4){
								for (; i < ntemp; i += 5, offset_dx += 5){
									a[offset_dx] 	 = t * a[offset_dx];
									a[offset_dx + 1] = t * a[offset_dx + 1];
									a[offset_dx + 2] = t * a[offset_dx + 2];
									a[offset_dx + 3] = t * a[offset_dx + 3];
									a[offset_dx + 4] = t * a[offset_dx + 4];
								}
							}
						}			
	
						/* row elimination with column indexing */
	
						for (j = kp1, nk1 = n - (k + 1); j < n; j++){
							jllda = lda * j + l;
							jklda = lda * j + k;
							t = a[jllda];
							if (l !== k){  
								a[jllda] = a[jklda];
								a[jklda] = t;
							}
							
							if(nk1 > 0 && a[jllda] !== 0){
								//daxpy_ur(nk1, t, a, kklda + 1, 1, a, jklda + 1, 1);
								//let daxpy_ur = function(n, da, dx, offset_dx, incx, dy, offset_dy, incy){
								
								m = nk1 % 8;
								offset_dx = kklda + 1;
								offset_dy = jklda + 1;
								
								if (m !== 0){
									for (i = 0; i < m; i++, offset_dx++, offset_dy++) {
										a[offset_dy] = t * a[offset_dx] + a[offset_dy];
									}
								}
								
								if(nk1 > 7){
									for (i = m; i < nk1; i += 8, offset_dx += 8, offset_dy += 8){
										a[offset_dy] 		= t * a[offset_dx] + a[offset_dy];
										a[offset_dy + 1] 	= t * a[offset_dx + 1] + a[offset_dy + 1];
										a[offset_dy + 2] 	= t * a[offset_dx + 2] + a[offset_dy + 2];
										a[offset_dy + 3] 	= t * a[offset_dx + 3] + a[offset_dy + 3];
										a[offset_dy + 4] 	= t * a[offset_dx + 4] + a[offset_dy + 4];
										a[offset_dy + 5] 	= t * a[offset_dx + 5] + a[offset_dy + 5];
										a[offset_dy + 6] 	= t * a[offset_dx + 6] + a[offset_dy + 6];
										a[offset_dy + 7] 	= t * a[offset_dx + 7] + a[offset_dy + 7];
									}
								}
	
							}
						}
					}
				}
				ipvt[n - 1] = nm1;
			};
			
			/*
			**
			** DGESL benchmark
			**
			** We would like to declare a[][lda], but c does not allow it.  In this
			** function, references to a[i][j] are written a[lda*i+j].
			**
			**   dgesl solves the double precision system
			**   a * x = b  or  trans(a) * x = b
			**   using the factors computed by dgeco or dgefa.
			**
			**   on entry
			**
			**      a       double precision[n][lda]
			**              the output from dgeco or dgefa.
			**
			**      lda     integer
			**              the leading dimension of the array  a .
			**
			**      n       integer
			**              the order of the matrix  a .
			**
			**      ipvt    integer[n]
			**              the pivot vector from dgeco or dgefa.
			**
			**      b       double precision[n]
			**              the right hand side vector.
			**
			**      job     integer
			**              = 0         to solve  a*x = b ,
			**              = nonzero   to solve  trans(a)*x = b  where
			**                          trans(a)  is the transpose.
			**
			**  on return
			**
			**      b       the solution vector  x .
			**
			**   error condition
			**
			**      a division by zero will occur if the input factor contains a
			**      zero on the diagonal.  technically this indicates singularity
			**      but it is often caused by improper arguments or improper
			**      setting of lda .  it will not occur if the subroutines are
			**      called correctly and if dgeco has set rcond .gt. 0.0
			**      or dgefa has set info .eq. 0 .
			**
			**   to compute  inverse(a) * c  where  c  is a matrix
			**   with  p  columns
			**         dgeco(a,lda,n,ipvt,rcond,z)
			**         if (!rcond is too small){
			**              for (j=0,j<p,j++)
			**                      dgesl(a,lda,n,ipvt,c[j][0],0);
			**         }
			**
			**   linpack. this version dated 08/14/78 .
			**   cleve moler, university of new mexico, argonne national lab.
			**
			**   functions
			**
			**   blas daxpy,ddot
			*/
			dgesl = function(){
				let nbkwd, i, offset_dx, offset_dy;
				let n = lda >> 1;
				let m = n % 4;
				let nm1 = n - 1;
				let t = 1.1;
				
				for (nbkwd = nm1; nbkwd >= 0; nbkwd--){
					//klda
					b[nbkwd] = b[nbkwd] / a[lda * nbkwd + nbkwd];
					t = -b[nbkwd];
					
					if(t === 0 || nbkwd === 0){
						continue;
					}
					
					offset_dx = lda * nbkwd;
					offset_dy = 0;
					if (m !== 0){  
						for (i = 0; i < m; i++, offset_dx++, offset_dy++) {
							b[offset_dy] = t * a[offset_dx] + b[offset_dy];
						}
					}
	
					for (i = m; i < n; i = 4 + i, offset_dx = 4 + offset_dx, offset_dy = 4 + offset_dy){
						b[offset_dy] 	 = t * a[offset_dx]     + b[offset_dy];
						b[offset_dy + 1] = t * a[offset_dx + 1] + b[offset_dy + 1];
						b[offset_dy + 2] = t * a[offset_dx + 2] + b[offset_dy + 2];
						b[offset_dy + 3] = t * a[offset_dx + 3] + b[offset_dy + 3];
					}
				}
			};
			
			let start = new Date().getTime();
			
			for(let i = 0; i < nreps; i++){
				matgen();
				
				t1 		= new Date().getTime();
				dgefa();        
				tdgefa += new Date().getTime() - t1;
				
				t1 		= new Date().getTime();		
				dgesl();		
				tdgesl += new Date().getTime() - t1
				
				//if(i % 256 === 0){
				//	postMessage({
				//		response : 'progress',
				//		data     : (i / nreps)
				//	});
				//}
			}
			
			totalt = new Date().getTime() - start;
			
			if (totalt / 1000 < 0.5 || (tdgefa + tdgesl) / 1000 < 0.2) {
				return;
			}
			
			kflops = nreps * ops / (1000 * (tdgefa + tdgesl) / 1000);
			
			toverhead = totalt - tdgefa - tdgesl;
			
			if(tdgefa / 1000 < 0){
				tdgefa = 0;
			}
			
			if(tdgesl / 1000 < 0){
				tdgesl = 0;
			}
			
			if(toverhead / 1000 < 0){
				toverhead = 0;
			}
			
			/**
			* Result :
			* 	0 reps		1 time
			* 	2 dgefa		3 dgesl
			* 	4 overhead	5 kflops
			*	6 numKFlop  7 runTime
			*/
			
			result[0] = nreps;
			result[1] = ((totalt/1000));
			result[2] = (100 * tdgefa / totalt);
			result[3] = (100 * tdgesl / totalt);
			result[4] = (100 * toverhead / totalt);
			result[5] = kflops;
			result[6] = nreps * ops;
			result[7] = tdgefa + tdgesl / 1000;
		}).toString();
	}
};