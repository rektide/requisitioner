var astify= require("./util/astify"),
  fs= require("fs"),
  jsonpath= require("JSONPath").eval,
  events= require("events"),
  resolve= require("node-module-resolver"),
  clone= require("clone"),
  path= require("path")


/**
* emit a 
find all requires within a collection of js programs.
* @param ast___ signifies variadic/rest arguments, for files or strings to look at requires of.
* @return a paused lazy EventEmitter which will signal all found requires. 
*/
module.exports= exports= function(opts,ast___){
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
						return endCheck({source:from, err:err, located:located})
					}
					astify.string(file,function(err,ast){
						if(err){
							return endCheck({source:from, err:err, located:located})
						}
						var reqs= exports.shallowReqs(ast)
						if(reqs && reqs.length){
							// recurse into dependencies
							resolveAndLookup(located,reqs)
						}
						if(opts.emitAst){
							out.emit("ast",{source:from, located:located, ast:ast})
						}
						endCheck()
					})
				})
			})
		}
	}

	// start
	resolveAndLookup(undefined,start)

	// expose our discovered dependency array
	out.resolved= resolved
	// out is already started, bind listeners before next tick.
	return out
}

exports.reqs= exports


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
* command line arguments
*/
if(process.argv[1].indexOf("reqs") != -1){
	var files= process.argv.slice(2),
	  out= exports.reqs.apply(exports.deps,files)
	  seen= []
	out.addListener("data",function(d){
		console.log(""+d.source,"<-",d.located)
	})
	out.addListener("warn",function(d){
		//if(d && d.source && d.source[0] != "/")
		//	return
		console.error(d)
	})
	//out.addListener("end",function(d){
	//	console.log(out.resolved)
	//})
}

