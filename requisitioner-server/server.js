var http = require('http'),
	fs = require('fs'),
	path = require('path'),
	util = require('./lib/util')

var server = module.exports = {
	listen: listen,
	addPath: addPath,
	setRoot: setRoot
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

function listen(port, host) {
	port = port || 1234
	host = typeof host == 'undefined' ? 'localhost' : host
	var server = http.createServer(function(req, res) {
		var reqPath = req.url.substr(root.length)
		if (reqPath.match(/\.js$/)) {
			fs.readFile(reqPath, function(err, content) {
				if (err) { return res.end('alert("' + err + '")') }
				var code = content.toString()

				// name
				var name = reqPath.substring(0,reqPath.length-3),
				  preamble = [closureStart,"'",name,"',["]

				// dependencies	
				var requireStatements = util.getRequireStatements(code),
				  isFirst = true
				for (var i=0, requireEntry; requireEntry = requireStatements[i]; i++) 
				{
					if(!isFirst)
						preamble.push(",")
					var val = stripRequire(requireEntry)
					preamble.push("'",val,"'")
				}
				// module definition
				preamble.push("],function(){\n")
				res.write(preamble.join(""))

				res.write(code)

				// footer
				res.end(closureEnd)
			})
		} else {
			// main module
			try {
				var modulePath = util.resolve(reqPath),
					deps = util.getDependencyList(modulePath),
					base = '//' + host + ':' + port + root
	
				res.write('var require = {}\n')
				for (var i=0; i<deps.length; i++) {
					var depPath = base + deps[i]
					res.write('document.write(\'<script src="'+depPath+'"></script>\')\n')
				}
			} catch(e) {
				res.write('alert("error in ' + (modulePath || reqPath) + ': ' + e + '")')
			}
			res.end()
		}
	})
	server.listen(port, host)
	return server
}

