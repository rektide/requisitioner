var r_module = (function()
{
	function makeModule(name) { return {name:name,exports:{},loaded:false,deps:[],resolved:[],depsCnt:0} }
	function isArray(o) { return Object.prototype.toString.call(o) === "[object Array]"; }

	var r_module = makeModule("requisitioner"),
	  exports = r_module.exports,
	  exportsModule = makeModule("exports"),
	  moduleModule = makeModule("module"),
	  modules = {require:r_module,exports:exportsModule,module:moduleModule},
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

	function runModule(module_running)
	{
		exportsModule.exports = module_running.exports
		moduleModule.exports = module_running.exports
		module.exports = module_running.exports
		modules[module_running.name] = module_running

		var retval
		if(module_running.callback)
			retval = module_running.callback.call(null,module_running.resolved)
		if(module.exports != module_running.exports)
			module_running.exports = module.exports
		if(typeof retval == 'object')
			module_running.exports = retval

		var name = module_running.name,
		  thenModules = unresolved[name]
		for(var i in thenModules)
		{
			var then = thenModules[i],
			  definedIndex = then.deps.indexOf(name)
			if(definedIndex == -1)
				continue;
			delete then.deps[definedIndex]
			then.resolved[definedIndex] = module.exports

			var complete = true
			for(var i in then.deps)
				if(then.deps[i])
					complete = false
			if(complete)
				runModule(then)
		}
	}

	exports.define = function(name,dependencies,m)
	{
		if(!name)
			throw "Can't define you if you dont state your identity"

		var module = makeModule(name)

		var complete = true
		for(var i in dependencies)
		{
			var dep = dependencies[i]
			if(!modules[dep])
			{
				complete = false
				module.deps[i] = dep
				var unres = unresolved[dep] || (unresolved[dep] = [])
				unres.push(module)
			}
			else
			{
				module.resolved[dep] = dep.exports
			}
		}
		module.callback = m
		if(complete) {
			runModule(module)
		}
	}

	return exports
})();

if(typeof require == "undefined")
	require = r_module.require
if(typeof define == "undefined")
	define = r_module.define
if(typeof module == "undefined")
	module = require('module')
if(typeof exports == "undefined")
	module = require('exports')
