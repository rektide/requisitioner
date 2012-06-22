var astify= require("./util/astify"),
  jsonpath= require("JSONPath").eval,
  lazy= require("lazy"),
  resolve= require("resolve")


/**
* emit a 
find all requires within a collection of js programs.
* @param ast___ signifies variadic/rest arguments, for files or strings to look at requires of.
* @return a paused lazy EventEmitter which will signal all found requires. 
*/
module.exports= exports= function(opts,ast___){
	var reqs= [], // existing requires, for de-dupeing
	  inspectees= Array.prototype.slice.call(arguments,typeof opts == "object"?1:0), // queue for files to be inspected
	  out= new lazy(), // output
	opts= opts||{}

	function inspectOne(){
		if(inspectees.length == 0){
			out.emit("end")
			return
		}
		var current= inspectees.shift()
		exports.shallowReqs(current,opts.basepath,function(err,requires){
			if(err){
				out.emit("warn",{source:current, type:"parse"})
			}else{
				out.emit("data",{source:current, requires:requires||[]})
			}
			for(var i in requires){
				var req= requires[i]
				// duplicate check
				if(reqs.indexOf(req) != -1)
					continue
				// we have a new require.
				reqs.push(req)
				// need to transitively check this requires's new dependencies.
				inspectees.push(req)
			}
			inspectOne()
		})
	}
	// expose our discovered dependency array
	out.requires= reqs
	// start reading, parsing, and finding requires from our inspectee queue, next tick
	process.nextTick(inspectOne)
	// out is already started, bind listeners and .resume()
	return out
}

exports.reqs= exports


/**
* shallowReqs finds all dependencies within a single file
* @param thing a file or string with a JavaScript program
* @param basepath base path to start resolving from
* @param cb callback with (err, dependencyArray)
*/
exports.shallowReqs= function(thing,basepath,cb){
	if(cb === undefined && typeof basepath == "function"){
		cb= basepath
		basepath= null
	}
	astify.liberal(thing,function(err,ast){
		if(err)
			cb(err)
		var calls= jsonpath(ast,"$..*[?(@.type == 'CallExpression' && @.callee.type == 'Identifier' && @.callee.name == 'require')].arguments[0].value",{resultType:"VALUE"})
		//var calls= jsonpath(ast,"$..*[?(@.type == 'CallExpression' && @.callee.type == 'Identifier' && @.callee.name == 'require')]")
		cb(calls?undefined:"Unexpected JSONPath result",calls)
	})
}

/**
* command line arguments
*/
if(process.argv[1].indexOf("deps") != -1){
	var files= process.argv.slice(2),
	  out= exports.reqs.apply(exports.deps,files)
	  seen= []
	out.addListener("data",function(moduleDep){
		for(var i in moduleDep.requires){
			var dep= moduleDep.requires[i]
			if(seen.indexOf(dep) == -1){
				seen.push(dep)
				console.log(dep)
			}
		}
	})
}
