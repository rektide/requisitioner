var events= require("events")

var gatherFiles

/**
* Create an event stream for all files listed in arguments, or files in directories listed in arguments.
*/
module.exports= gatherFiles= function(gatherFiles__){
	var out= new events.EventEmitter()

	for(var i in arguments){
		var item= arguments[i]
		if(typeof item != "string"){
			out.emit("warn",{type:"Not a string error",arg:i,item:item})
			continue
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

	return out
}
