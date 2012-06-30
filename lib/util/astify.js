var fs= require("fs"),
  esprima= require("esprima"),
  async= require("async")
 
/**
* parse a program-string into an ast
* @param js a string which is a syntactically valid javascript program
* @param cb callback(err,ast) called with the ast or error.
*/
exports.string= function(js,cb){
	try{
		var ast= esprima.parse(js)
		cb(undefined,ast)
	}catch(ex){
		cb(ex)
	}
}

/**
* parse a javascript file into an ast
* @param file a file which is a syntactically valid javascript program
a
* @param cb a callback to call 
*/
exports.file= function(file,cb){
	fs.readFile(file,"utf8",function(err,content){
		if(err){
			cb(err)
			return
		}
		exports.string(content,cb)
	})
}

exports.fileJs= function(file,cb){
	var attempt= file+".js"
	fs.readFile(attempt,function(err,content){
		if(err){
			cb(err)
			return
		}
		exports.string(content,cb)
	})
}

function isAst(predicant){
	if(!predicant || predicant.type != "Program")
		return false
	return predicant.body.length != 1 || predicant.body[0].type != "ExpressionStatement" || predicant.body[0].expression.type != "Identifier"
}

/**
* attempt a couple different strategies for turning input into an ast: try using it as a file, as a program, or pass through raw ast.
*/
exports.liberal= function(thing,cb){
	if(isAst(thing)){
		cb(undefined,thing)
	}
	if(thing.constructor.name != "String"){
		cb("Unknown thing to look for an AST in")
	}
	async.reduce(["file", "fileJs", "string"],null,function(val,fnName,cbReduce){
		var fn= exports[fnName]
		if(!fn)
			return
		if(isAst(val)){
			// use our existing good value
			cbReduce(undefined,val)
		}else{
			// run the next ast retrieval function
			fn(thing,function(err,ast){
				cbReduce(undefined,ast)
			})
		}
	},function(err,result){
		if(isAst(result))
			cb(undefined,result)
		else
			cb(true)
	})
}
