var http = require('http'),
	fs = require('fs'),
	path = require('path'),
	util = require('./lib/util')

var server = module.exports = {
	listen: listen,
	addPath: addPath,
	setRoot: setRoot,
	pipeModule: pipeModule
}

var modules = {},
	closureStart = "define("
	moduleDef = 'var module = {exports:{}}; var exports = module.exports;',
	closureEnd = '})',
	root = '/'

function setRoot(_root) {
	root = _root
	return server
}

function addPath(path) {
	util.addPath(path)
	return server
}

function stripRequire(requireStatement) {
	var open = requireStatement.indexOf("(")+1,
	  close= requireStatement.indexOf(")"),
	  expr = requireStatement.substring(open,close),
	  evalled = eval(expr)
	return evalled
}

function pipeModule(module,outStream,options) {
	fs.readFile(module,function(err,content) {
			if (err) { return outStream.end('alert("' + err + '")') }
			var code = content.toString()

			// name
			var name = module.substring(0,module.length-3),
				preamble = [closureStart,"'",name,"',["]

			// dependencies     
			var requireStatements = util.getRequireStatements(code),
			isFirst = true
			for (var i=0, requireEntry; requireEntry = requireStatements[i]; i++) {    
				if(!isFirst)
				preamble.push(",")
				var val = stripRequire(requireEntry)
				preamble.push("'",val,"'")
			}
			// code and closure-end
			preamble.push("],function(){\n",code,closureEnd)

			if(options && options["end"] === false)
				outStream.write(preamble.join(""))
			else
				outStream.end(preamble.join(""))
	})
}


function listen(port, host) {
	port = port || 1234
	host = typeof host == 'undefined' ? 'localhost' : host
	var server = http.createServer(function(req, res) {
		var reqPath = req.url.substr(root.length)
		if (reqPath.match(/\.jsm$/)) {
			reqPath = reqPath.substring(0,reqPath.length-1)
			pipeModule(reqPath,res)
		} else {
			try {
				var fsStream = fs.createReadStream(reqPath)
				fsStream.pipe(res)
			}
			catch (ex) {
				res.writeHead(404)
				res.end()
			}
		}
	})
	server.listen(port, host)
	return server
}

