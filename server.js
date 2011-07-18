var util = require('./lib/util'),
	http = require('http'),
	fs = require('fs'),
	extend = require('std/extend')

var server = module.exports = {
	listen: listen,
	mount: mount,
	connect: connect,
	isRequireRequest: isRequireRequest
}

function listen(port, _opts) {
	_setOpts(_opts)
	port = opts.port = (port || 1234)
	opts.handleAllRequests = true
	var server = http.createServer()
	mount(server)
	server.listen(port, opts.host)
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
function mount(server, _opts, handleAllRequests) {
	_setOpts(_opts)
	server.on('request', function(req, res) {
		if (isRequireRequest(req) || opts.handleAllRequests) {
			_handleRequest(req, res)
		}
	})
	return server
}

function connect(opts) {
	_setOpts(opts)
	return function require(req, res, next) {
		if (!isRequireRequest(req)) { return next() }
		_handleRequest(req, res)
	}
}

function isRequireRequest(req) {
	return req.url.substr(1, opts.root.length) == opts.root
}

/* options
 *********/
var opts = {
	path: process.cwd(),
	root: '',
	port: null,
	host: null
}

function _setOpts(_opts) {
	if (typeof _opts == 'string') {
		opts = extend({ path:_opts }, opts)
	} else {
		opts = extend(_opts, opts)
	}
	if(opts.root.lastIndexOf("/") != opts.root.length-1) { root = root + "/" }
}

/* request handlers
 ******************/
function _handleRequest(req, res) {
	console.log("incoming",req.url)
	var reqPath = req.url.substr(opts.root.length + 1)
	if (!reqPath.match(/\.jsm$/)) {
		_handleAssetRequest(reqPath, res)
	} else {
		_handleModuleRequest(reqPath, res)
	}
}

function _handleAssetRequest(reqPath, res) {
	if(reqPath.substring(reqPath.length-3) == '.js') { res.writeHead(200, { 'Content-Type':'text/javascript' }) }
	try {
		var fullpath = opts.path + '/' + reqPath,
			fsStream = fs.createReadStream(fullpath)
		fsStream.on('error',function(ex){ console.log("blah",fullpath); _sendError(res,'Failed to read asset "'+reqPath+'"',404) })
		fsStream.pipe(res)
	} catch(ex) {
		_sendError(res,'Failed to pipe asset "'+reqPath+'" into response',500)
	}
}

var _closureStart = 'define(',
	_moduleDef = 'var module = {exports:{}}, exports = module.exports;\n',
	_closureEnd = '\nreturn module.exports\n})'
function _handleModuleRequest(reqPath, res) {
	var fullPath = opts.path +'/' + reqPath.substr(0,reqPath.length-1)
	fs.readFile(fullPath, function(err, content) {
		if (err) { return _sendError(res, err.stack) }
		var input = content.toString(),
			requireStatements = util.getRequireStatements(input),
			name = reqPath.substr(0,reqPath.length-4),
			output = [_closureStart,"'",name,"',["]

		var isFirst = true
		for(var requireStmnt in requireStatements) {
			var req = requireStatements[requireStmnt]
			if(!isFirst) { output.push(","); }
			else { isFirst = false }
			output.push("'",stripRequire(req),"'")
		}
		output.push("],function(){\n")

		res.writeHead(200, { 'Content-Type':'text/javascript' })
		res.write(output.join(""))
		res.write(_moduleDef)
		res.write(input)
		res.end(_closureEnd)
	})
}

/* util
 ******/
function _sendError(res, msg, code) {
	msg = msg.replace(/\n/g, '\\n').replace(/"/g, '\\"')
	res.writeHead(code||200)
	res.end('alert("error: ' + msg + '")')
}

function _getBase() {
	if (opts.host && opts.port) {
		return '//' + opts.host + ':' + opts.port + '/' + opts.root
	} else {
		return '/' + opts.root
	}
}

function stripRequire(requireStatement) {
	var open = requireStatement.indexOf("(")+1,
	  close= requireStatement.indexOf(")"),
	  expr = requireStatement.substring(open,close),
	  evalled = eval(expr)
	return evalled
}


