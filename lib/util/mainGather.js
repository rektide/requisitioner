var gatherFiles= require("./gatherFiles.js"),
  lazy= require("lazy")

var mainGather

/**
* complement of `gatherFiles` for programs whose only input is files: use stdin and argv for inupt, find files.
*/
module.exports= mainGather= function(argv,stdin){
	var gather= gatherFiles(),
	  haveStdin= false

	// pump a stream of filenames into gather
	function pumpStream(stream){
		// break stream into lines
		var lines= lazy()
			.lines
			.forEach(function(line){
				// push into gather
				gather.gather(line)
			})
		// pump stream into linebreaker
		stream.on("data",function(chunk){
			lines.emit("data",chunk)
		})
	}

	// pump our argv into gather
	if(argv && argv.length){
		for(var i in argv){
			var arg= argv[i]
			if(arg != "-"){
				gather.gather(arg)
			}else{
				// special case, stdin designator.
				haveStdin= true
				pumpStream(process.stdin)
			}
		}
	}

	// pump stdin into gather
	if(stdin && (!haveStdin || stdin != process.stdin)){
		pumpStream(stdin)
	}

	return gather
}
