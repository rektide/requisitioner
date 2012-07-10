var events= require("events"),
  fs= require("fs")

/**
* Recurse a file-system, firing "file" and "directory" events for everything found.
* @params fileOrDirs__ any variadic files or directories to start from
*/
module.exports= function(fileOrDirs__){
	var out= new events.EventEmitter()

	function gatherPath(item){
		if(typeof item != "string"){
			out.emit("warn",{type:"Not a string error",item:item})
			return
		}

		fs.stat(item,function(err,stats){
			if(err){
				out.emit("warn",{type:"Stats error",item:item})
				return
			}
			if(stats.isFile()){
				out.emit("file",item)
			}else if(stats.isDirectory()){
				out.emit("dir",item)
				fs.readdir(item,function(err,files){
					if(err){
						out.emit("warn",{type:"Readdir error",arg:i,item:item})
						return
					}
					for(var i in files){
						gatherPath(item+"/"+files[i])
					}
				})
			}
		})
	}

	function processString(string){
		if(!(string instanceof String)){
			out.emit("warn",{type: "Not a string",item:string})
			return
		}
		gatherPath(string)
	}
	function processStream(stream,ev){
		if(!(stream.on)){
			out.emit("warn",{type: "Not an event",item:stream})
			return
		}
		stream.on(ev||"data",function(item){
			gatherPath(item)
		})
	}
	

	/**
	* excessive fun with the chain of command pattern
	*   the behavior here is essentially an erlang guard, checking the method
	*/
	function argProcessor(arg__){
		for(var i in arguments){
			var arg= arguments[i]
			if(arg instanceof String){
				processString(arg)
			}else if(arg.on){
				processStream(arg)
			}else{
				out.emit("warn",{type:"Unhandled argument",item:arg})
			}
		}
	}

	out.gather= argProcessor
	out.gatherPath= processString
	out.gatherStream= processStream

	argProcessor.apply(null,arguments)
	return out
}

module.exports.main= main
function main(argv,stdin,stdout,stderr){
	argv= argv||process.argv.slice(2)
	stdin= stdin||process.stdin
	stdout= stdout||process.stdout
	stderr= stderr||process.stderr

	var util= require("util"),
	  xargs= require("./xargs.js")(argv,stdin),
	  gather= module.exports(xargs)

	gather.on("file",function(file){
		stdout.write("file: "+file+"\n")
	})
	gather.on("dir",function(dir){
		stdout.write("dir: "+dir+"\n")
	})
	gather.on("warn",function(warn){
		stderr.write("warn: "+util.inspect(warn)+"\n")
	})
	gather.out= stdout
	gather.in= stdin
	return gather
}

if(require.main == module){
	main()
}

