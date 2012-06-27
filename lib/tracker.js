var reqs= require("./reqs"),
  fs= require("fs"),
  events= require("events")

var tracker

/**
* tracker is a reqs implementation which continues to watch files in the dependency graph, re-running the search for files on modified files.
*/
module.exports= tracker= function(opts,fileOrDirs__){
	var hasOpts= typeof opts == "object",
	  out= reqs()

	for(var i= hadOpts? 1: 0; i < arguments.length; ++i){
		var item= arguments[i]
		fs.stat(item,function(err,stats){
			if(err){
				out.emit("warn",err)
				return
			}
			if(stats.isFile()){
				out.reqsMore(item)
				return
			}
			fs.readdir(item,function(err,files){
				if(err){
					out.emit("warn",err)
					return
				}
				out.reqsMore.apply(out,files)
			})
		})
	}

	out.on("data",function(data){
		// watch
	})
}
