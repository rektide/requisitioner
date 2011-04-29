var r_module = (function()
{
	function makeModule(name) { return {name:name,exports:{},loaded:false,deps:[],resolved:[],depsCnt:0} }
	function isArray(o) { return Object.prototype.toString.call(o) === "[object Array]"; }

	var r_module = makeModule("require"),
	  exports = r_module.exports,
	  exportsModule = makeModule("exports"),
	  modules = {require:r_module,exports:exportsModule},
	  unresolved = {}

	exports.require = function(deps,callback)
	{
		if(!callback)
		{
			if(typeof deps == "string")
			{
				var module = modules[deps]
				if(module)
					return module.exports
				else
					throw "Module ["+deps+"] not available"
			}
			else
			{
				throw "Invalid state"
			}
		}

		var resolved = []
		for(var i in deps)
		{
			var dep = deps[i]
			  resolve = resolved[i] = modules[dep]
			if(!resolve)
				throw "Missing "+dep
		}
		callback.call(null,resolved)
	}

	function runModule(module)
	{
		exportsModule.exports = module.exports
		modules[module.name] = module

		var retval
		if(module.callback)
			retval = module.callback.call(null,module.resolved)
		if(typeof retval == 'object')
			module.exports = retval
	}

	exports.define = function(name,dependencies,m)
	{
		if(!name)
			throw "Can't define you if you dont state your identity"

		var module = makeModule(name),
		  thenModules = unresolved[name]
		for(var i in thenModules)
		{
			var then = thenModules[i],
			  definedIndex = then.deps.indexOf(module.name)
			delete then.deps[definedIndex]
			then.resolved[definedIndex] = module.exports

			if(!then.deps.length)
				runModule(then)
		}

		var complete = true
		for(var i in dependencies)
		{
			var dep = dependencies[i]
			if(!modules[dep])
			{
				complete = false
				module.deps[i] = dep
			}
			else
			{
				module.resolved[i] = dep.exports
			}
		}
		if(complete)
			runModule(module)
	}

	return exports
})();

if(typeof require == "undefined")
	require = r_module.require
if(typeof define == "undefined")
	define = r_module.define
