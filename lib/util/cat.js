var fs= require("fs"),
  stream= require("stream")

/**
* cat accepts a variadic argument of files which it pipes one after another to an `Writable Stream`.
* @param out optional stream to cat output to: defaults to `process.stdout`
* @param files___ variadic name of files to read. or "-" for stdin. 
* @return the output stream
*/
module.exports= function(out, files___){
	if(!(out instanceof stream &&  out.writable)){
		return module.exports(process.stdout)

	function runArugment(i,args){
		if(i >= args.length)
			return
		var name= arguments[i],
		  stream= (i == 0 && name == undefined) || name == "-" ? process.stdin : fs.createReadStream(name)
		stream.pipe(out, {end: false})
		stream.on("end",function(){
			runArguments(i+1,args)
		})
	}

	runArgument(1,arguments)
	return out
}

/**
* alias to our top level exported function
*/
module.exports.cat= module.exports
