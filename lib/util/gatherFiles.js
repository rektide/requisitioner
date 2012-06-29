var events= require("events"),
  fs= require("fs")

var gatherFiles

/**
* Create an event stream for all files listed in arguments, or files in directories listed in arguments.
*/
module.exports= gatherFiles= function(gatherFiles__){
	var out= new events.EventEmitter()

	function gatherItem(item){
		if(typeof item != "string"){
			out.emit("warn",{type:"Not a string error",arg:i,item:item})
			return
		}

		fs.stat(item,function(err,stats){
			if(err){
				out.emit("warn",{type:"Stats error",arg:i,item:item})
				return
			}
			if(stats.isFile()){
				out.emit("data",[item])
			}else{
				fs.readdir(item,function(err,files){
					if(err){
						out.emit("warn",{type:"Readdir error",arg:i,item:item})
						return
					}
					out.emit("data",files)
				})
			}
		})
	}

	out.gather= function(fileOrDirs__){
		for(var i in arguments){
			var item= arguments[i]
			gatherItem(item)
		}
	}
	return out
}


