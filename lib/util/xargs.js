var events= require("events"),
  lazy= require("lazy")

/**
* xargs emits a stream of data events for, first, each argument, then, each line of stdin.
*/
module.exports= function(argv,stdin){
	var out= new events.EventEmitter()

	// find lines in a stream and pump them to output
	function pumpStream(stream){
		// break stream into lines
		var lines= lazy()
			.lines
			.forEach(function(line){
				// push out
				out.emit("data",line)
			})
		// pump stream into linebreaker
		stream.on("data",function(chunk){
			// TODO: this is coming in as a buffer, not utf8 text.
			lines.emit("data",chunk)
		})
	}

	// wait for listeners to be set up, then start emitting
	process.nextTick(function(){
	  	var haveStdin= false

		// pump our argv to output
		if(argv && argv.length){
			for(var i in argv){
				var arg= argv[i]
				if(arg != "-"){
					out.emit("data",arg)
				}else{
					// special case, stdin designator.
					haveStdin= true
					pumpStream(stdin)
				}
			}
		}

		// pump stdin
		if(stdin && !haveStdin){
			pumpStream(stdin)
		}
	})

	return out
}

module.exports.main= main
function main(argv,stdin,stdout){
	argv= argv||process.argv.slice(2)
	stdin= stdin||process.stdin
	stdout= stdout||process.stdout

	var util= require("util")
	console.log(util.inspect(stdin))

	var xargs= module.exports(argv,stdin)
	xargs.on("data",function(line){
		stdout.write(line+"\n")
	})

	// let the input flow
	setTimeout(function(){
		stdin.resume()
	},33)

	return xargs
}

if(require.main == module){
	main()
}
