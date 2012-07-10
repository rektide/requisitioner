var astify= require("./util/astify.js"),
  gatherFiles= require("./util/gatherFiles.js"),  
  fs= require("fs"),
  jsonpath= require("JSONPath").eval,
  events= require("events"),
  resolve= require("node-module-resolver"),
  clone= require("clone"),
  path= require("path"),
  util= require("util")


/**
* emit a find all requires within a collection of js programs.
* @param opts
* @param ast___ signifies variadic/rest arguments, for files or strings to look at requires of.
* @return a paused lazy EventEmitter which will signal all found requires. 
*/
module.exports= function(opts,files___){
	var hadOpts= typeof opts == "object",
	  o= hadOpts? clone(opts): {},
	  resolved= o.noCycleCheck?undefined:[], // existing requires, prevent cycles
	  n= 0, // reference count to finish
	  start= Array.prototype.slice.call(arguments,hadOpts?1:0),
	  cwd= process.cwd()+"/",
	  out= new events.EventEmitter() // {source,requires,resolved} data event payload
	o.basepath= o.basepath||cwd

	// reference counting exit point for each resolveAndLookup attempt
	function endCheck(warn){
		if(warn){
			out.emit("warn",warn)
		}
		if(!--n){
			out.emit("end")
		}
	}

	// for a source, find an array of targets
	function resolveAndLookup(source,targets){
		var parentDir= path.dirname(source)
		if(parentDir[0] == ".")
			parentDir= cwd+parentDir

		for(var i in targets){
			var target= targets[i],
			  basedir= parentDir
			++n

			//console.log("-RESOLVE",target,source,basedir,n)
			o.basedir= basedir
			resolve(target,o,function(located,from){
				//console.log("+RESOLVE",from,located,n)

				// warn if we couldn't find
				if(!located){
					return endCheck({source:from, err:"Unresolved"})
				}

				// we've completed someone's lookup, emit
				out.emit("data",{source:source, requires:from, located:located})

				// prevent cycles
				if(resolved){
					if(resolved.indexOf(located) != -1){
						return endCheck()
					}
					// no cycle, continue
					resolved.push(located)
				}

				// stop if incomplete
				if(located[0] != "/"){
					return endCheck()
				}

				// dive into un-explored module
				fs.readFile(located,'utf8',function(err,file){
					if(err){
						return endCheck({type:"read", source:from, err:err, located:located})
					}
					astify.string(file,function(err2,ast){
						if(err2){
							return endCheck({type:"ast", source:from, err:err2, located:located})
						}

						var reqs= exports.shallowReqs(ast)
						if(reqs && reqs.length){
							// recurse into dependencies
							resolveAndLookup(located,reqs)
						}
						if(opts && opts.emitAst){
							out.emit("ast",{source:from, located:located, ast:ast})
						}
						endCheck()
					})
				})
			})
		}
	}

	// start
	if(start.length)
		resolveAndLookup(undefined,start)

	//// EXTERNAL ////

	// expose our discovered dependency array
	out.resolved= resolved

	/**
	* reqsMore kicks off a dependency graph search for new inputs.
	*/
	out.reqsMore= function(){
		resolveAndLookup(undefined,arguments)
	}

	// out is already started, bind listeners before next tick. and have a nice day!
	return out
}

module.exports.reqs= module.exports

/**
* shallowReqs finds all dependencies within a single file
* @param thing a file with a JavaScript program
* @param cb callback with (err, dependencyArray)
*/
exports.shallowReqs= function(ast){
	// TODO: slow!
	var calls= jsonpath(ast,"$..*[?(@.type == 'CallExpression' && @.callee.type == 'Identifier' && @.callee.name == 'require')].arguments[0].value",{resultType:"VALUE"})
	//var calls= jsonpath(ast,"$..*[?(@.type == 'CallExpression' && @.callee.type == 'Identifier' && @.callee.name == 'require')]")
	return calls
}

/**
* stdio wiring
*/
module.exports.main= main
function main(argv,stdin,stdout,stderr,run){
	argv= argv||process.argv.slice(2)
	stdin= stdin||process.stdin
	stdout= stdout||process.stdout
	stderr= stderr||process.stderr

	// insure we have a run
	run= run||module.exports.reqs()

	console.log("reqs running",run)

	// from reqs, build a basic output
	if(stdout){
		run.addListener("data",function(d){
			// we have a dependency edge, render it
			stdout.write(""+d.source+" <- "+d.located+"\n")
		})
		//run.addListener("end",function(){
		//	stdout.write(util.inspect(run.resolved))
		//})
	}

	// from reqs, build an error output
	if(stderr){
		run.addListener("warn",function(d){
			stderr.write("!"+util.inspect(d)+"\n")
		})
	}

	// gather all files passed in
	var xargs= require("./util/xargs.js")(argv,stdin),
	  gather= gatherFiles(xargs)
	console.log("reqs gather",gather)
	// pump all files into our reqs run
	gather.on("file",function(file){
		console.log("reqs main file",file)
		// we have files, reqs them
		run.reqsMore(file)
	})

	return run
}

if(require.main == module){
	main()
}
