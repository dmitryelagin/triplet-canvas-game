/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.2.0 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/requirejs/LICENSE
 */
//Not using strict: uneven strict support in browsers, #392, and causes
//problems with requirejs.exec()/transpiler plugins that may not be strict.
/*jslint regexp: true, nomen: true, sloppy: true */
/*global window, navigator, document, importScripts, setTimeout, opera */

var requirejs, require, define;
(function (global) {
    var req, s, head, baseElement, dataMain, src,
        interactiveScript, currentlyAddingScript, mainScript, subPath,
        version = '2.2.0',
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        jsSuffixRegExp = /\.js$/,
        currDirRegExp = /^\.\//,
        op = Object.prototype,
        ostring = op.toString,
        hasOwn = op.hasOwnProperty,
        isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
        isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
        //PS3 indicates loaded and complete, but need to wait for complete
        //specifically. Sequence is 'loading', 'loaded', execution,
        // then 'complete'. The UA check is unfortunate, but not sure how
        //to feature test w/o causing perf issues.
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
                      /^complete$/ : /^(complete|loaded)$/,
        defContextName = '_',
        //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
        contexts = {},
        cfg = {},
        globalDefQueue = [],
        useInteractive = false;

    //Could match something like ')//comment', do not lose the prefix to comment.
    function commentReplace(match, multi, multiText, singlePrefix) {
        return singlePrefix || '';
    }

    function isFunction(it) {
        return ostring.call(it) === '[object Function]';
    }

    function isArray(it) {
        return ostring.call(it) === '[object Array]';
    }

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    /**
     * Helper function for iterating over an array backwards. If the func
     * returns a true value, it will break out of the loop.
     */
    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    function getOwn(obj, prop) {
        return hasProp(obj, prop) && obj[prop];
    }

    /**
     * Cycles over properties in an object and calls a function for each
     * property value. If the function returns a truthy value, then the
     * iteration is stopped.
     */
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    function mixin(target, source, force, deepStringMixin) {
        if (source) {
            eachProp(source, function (value, prop) {
                if (force || !hasProp(target, prop)) {
                    if (deepStringMixin && typeof value === 'object' && value &&
                        !isArray(value) && !isFunction(value) &&
                        !(value instanceof RegExp)) {

                        if (!target[prop]) {
                            target[prop] = {};
                        }
                        mixin(target[prop], value, force, deepStringMixin);
                    } else {
                        target[prop] = value;
                    }
                }
            });
        }
        return target;
    }

    //Similar to Function.prototype.bind, but the 'this' object is specified
    //first, since it is easier to read/figure out what 'this' will be.
    function bind(obj, fn) {
        return function () {
            return fn.apply(obj, arguments);
        };
    }

    function scripts() {
        return document.getElementsByTagName('script');
    }

    function defaultOnError(err) {
        throw err;
    }

    //Allow getting a global that is expressed in
    //dot notation, like 'a.b.c'.
    function getGlobal(value) {
        if (!value) {
            return value;
        }
        var g = global;
        each(value.split('.'), function (part) {
            g = g[part];
        });
        return g;
    }

    /**
     * Constructs an error with a pointer to an URL with more information.
     * @param {String} id the error ID that maps to an ID on a web page.
     * @param {String} message human readable error.
     * @param {Error} [err] the original error, if there is one.
     *
     * @returns {Error}
     */
    function makeError(id, msg, err, requireModules) {
        var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
        e.requireType = id;
        e.requireModules = requireModules;
        if (err) {
            e.originalError = err;
        }
        return e;
    }

    if (typeof define !== 'undefined') {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    if (typeof requirejs !== 'undefined') {
        if (isFunction(requirejs)) {
            //Do not overwrite an existing requirejs instance.
            return;
        }
        cfg = requirejs;
        requirejs = undefined;
    }

    //Allow for a require config object
    if (typeof require !== 'undefined' && !isFunction(require)) {
        //assume it is a config object.
        cfg = require;
        require = undefined;
    }

    function newContext(contextName) {
        var inCheckLoaded, Module, context, handlers,
            checkLoadedTimeoutId,
            config = {
                //Defaults. Do not set a default for map
                //config to speed up normalize(), which
                //will run faster if there is no default.
                waitSeconds: 7,
                baseUrl: './',
                paths: {},
                bundles: {},
                pkgs: {},
                shim: {},
                config: {}
            },
            registry = {},
            //registry of just enabled modules, to speed
            //cycle breaking code when lots of modules
            //are registered, but not activated.
            enabledRegistry = {},
            undefEvents = {},
            defQueue = [],
            defined = {},
            urlFetched = {},
            bundlesMap = {},
            requireCounter = 1,
            unnormalizedCounter = 1;

        /**
         * Trims the . and .. from an array of path segments.
         * It will keep a leading path segment if a .. will become
         * the first path segment, to help with module name lookups,
         * which act like paths, but can be remapped. But the end result,
         * all paths that use this function should look normalized.
         * NOTE: this method MODIFIES the input array.
         * @param {Array} ary the array of path segments.
         */
        function trimDots(ary) {
            var i, part;
            for (i = 0; i < ary.length; i++) {
                part = ary[i];
                if (part === '.') {
                    ary.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i === 1 && ary[2] === '..') || ary[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        ary.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
        }

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @param {Boolean} applyMap apply the map config to the value. Should
         * only be done if this normalization is for a dependency ID.
         * @returns {String} normalized name
         */
        function normalize(name, baseName, applyMap) {
            var pkgMain, mapValue, nameParts, i, j, nameSegment, lastIndex,
                foundMap, foundI, foundStarMap, starI, normalizedBaseParts,
                baseParts = (baseName && baseName.split('/')),
                map = config.map,
                starMap = map && map['*'];

            //Adjust any relative paths.
            if (name) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // If wanting node ID compatibility, strip .js from end
                // of IDs. Have to do this here, and not in nameToUrl
                // because node allows either .js or non .js to map
                // to same file.
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                // Starts with a '.' so need the baseName
                if (name[0].charAt(0) === '.' && baseParts) {
                    //Convert baseName to array, and lop off the last part,
                    //so that . matches that 'directory' and not name of the baseName's
                    //module. For instance, baseName of 'one/two/three', maps to
                    //'one/two/three.js', but we want the directory, 'one/two' for
                    //this normalization.
                    normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                    name = normalizedBaseParts.concat(name);
                }

                trimDots(name);
                name = name.join('/');
            }

            //Apply map config if available.
            if (applyMap && map && (baseParts || starMap)) {
                nameParts = name.split('/');

                outerLoop: for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join('/');

                    if (baseParts) {
                        //Find the longest baseName segment match in the config.
                        //So, do joins on the biggest to smallest lengths of baseParts.
                        for (j = baseParts.length; j > 0; j -= 1) {
                            mapValue = getOwn(map, baseParts.slice(0, j).join('/'));

                            //baseName segment has config, find if it has one for
                            //this name.
                            if (mapValue) {
                                mapValue = getOwn(mapValue, nameSegment);
                                if (mapValue) {
                                    //Match, update name to the new value.
                                    foundMap = mapValue;
                                    foundI = i;
                                    break outerLoop;
                                }
                            }
                        }
                    }

                    //Check for a star map match, but just hold on to it,
                    //if there is a shorter segment match later in a matching
                    //config, then favor over this star map.
                    if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
                        foundStarMap = getOwn(starMap, nameSegment);
                        starI = i;
                    }
                }

                if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI;
                }

                if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join('/');
                }
            }

            // If the name points to a package's name, use
            // the package main instead.
            pkgMain = getOwn(config.pkgs, name);

            return pkgMain ? pkgMain : name;
        }

        function removeScript(name) {
            if (isBrowser) {
                each(scripts(), function (scriptNode) {
                    if (scriptNode.getAttribute('data-requiremodule') === name &&
                            scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                        scriptNode.parentNode.removeChild(scriptNode);
                        return true;
                    }
                });
            }
        }

        function hasPathFallback(id) {
            var pathConfig = getOwn(config.paths, id);
            if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                //Pop off the first array value, since it failed, and
                //retry
                pathConfig.shift();
                context.require.undef(id);

                //Custom require that does not do map translation, since
                //ID is "absolute", already mapped/resolved.
                context.makeRequire(null, {
                    skipMap: true
                })([id]);

                return true;
            }
        }

        //Turns a plugin!resource to [plugin, resource]
        //with the plugin being undefined if the name
        //did not have a plugin prefix.
        function splitPrefix(name) {
            var prefix,
                index = name ? name.indexOf('!') : -1;
            if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }
            return [prefix, name];
        }

        /**
         * Creates a module mapping that includes plugin prefix, module
         * name, and path. If parentModuleMap is provided it will
         * also normalize the name via require.normalize()
         *
         * @param {String} name the module name
         * @param {String} [parentModuleMap] parent module map
         * for the module name, used to resolve relative names.
         * @param {Boolean} isNormalized: is the ID already normalized.
         * This is true if this call is done for a define() module ID.
         * @param {Boolean} applyMap: apply the map config to the ID.
         * Should only be true if this map is for a dependency.
         *
         * @returns {Object}
         */
        function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
            var url, pluginModule, suffix, nameParts,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                isDefine = true,
                normalizedName = '';

            //If no name, then it means it is a require call, generate an
            //internal name.
            if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
            }

            nameParts = splitPrefix(name);
            prefix = nameParts[0];
            name = nameParts[1];

            if (prefix) {
                prefix = normalize(prefix, parentName, applyMap);
                pluginModule = getOwn(defined, prefix);
            }

            //Account for relative paths if there is a base name.
            if (name) {
                if (prefix) {
                    if (pluginModule && pluginModule.normalize) {
                        //Plugin is loaded, use its normalize method.
                        normalizedName = pluginModule.normalize(name, function (name) {
                            return normalize(name, parentName, applyMap);
                        });
                    } else {
                        // If nested plugin references, then do not try to
                        // normalize, as it will not normalize correctly. This
                        // places a restriction on resourceIds, and the longer
                        // term solution is not to normalize until plugins are
                        // loaded and all normalizations to allow for async
                        // loading of a loader plugin. But for now, fixes the
                        // common uses. Details in #1131
                        normalizedName = name.indexOf('!') === -1 ?
                                         normalize(name, parentName, applyMap) :
                                         name;
                    }
                } else {
                    //A regular module.
                    normalizedName = normalize(name, parentName, applyMap);

                    //Normalized name may be a plugin ID due to map config
                    //application in normalize. The map config values must
                    //already be normalized, so do not need to redo that part.
                    nameParts = splitPrefix(normalizedName);
                    prefix = nameParts[0];
                    normalizedName = nameParts[1];
                    isNormalized = true;

                    url = context.nameToUrl(normalizedName);
                }
            }

            //If the id is a plugin id that cannot be determined if it needs
            //normalization, stamp it with a unique ID so two matching relative
            //ids that may conflict can be separate.
            suffix = prefix && !pluginModule && !isNormalized ?
                     '_unnormalized' + (unnormalizedCounter += 1) :
                     '';

            return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: (prefix ?
                        prefix + '!' + normalizedName :
                        normalizedName) + suffix
            };
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (!mod) {
                mod = registry[id] = new context.Module(depMap);
            }

            return mod;
        }

        function on(depMap, name, fn) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (hasProp(defined, id) &&
                    (!mod || mod.defineEmitComplete)) {
                if (name === 'defined') {
                    fn(defined[id]);
                }
            } else {
                mod = getModule(depMap);
                if (mod.error && name === 'error') {
                    fn(mod.error);
                } else {
                    mod.on(name, fn);
                }
            }
        }

        function onError(err, errback) {
            var ids = err.requireModules,
                notified = false;

            if (errback) {
                errback(err);
            } else {
                each(ids, function (id) {
                    var mod = getOwn(registry, id);
                    if (mod) {
                        //Set error on module, so it skips timeout checks.
                        mod.error = err;
                        if (mod.events.error) {
                            notified = true;
                            mod.emit('error', err);
                        }
                    }
                });

                if (!notified) {
                    req.onError(err);
                }
            }
        }

        /**
         * Internal method to transfer globalQueue items to this context's
         * defQueue.
         */
        function takeGlobalQueue() {
            //Push all the globalDefQueue items into the context's defQueue
            if (globalDefQueue.length) {
                each(globalDefQueue, function(queueItem) {
                    var id = queueItem[0];
                    if (typeof id === 'string') {
                        context.defQueueMap[id] = true;
                    }
                    defQueue.push(queueItem);
                });
                globalDefQueue = [];
            }
        }

        handlers = {
            'require': function (mod) {
                if (mod.require) {
                    return mod.require;
                } else {
                    return (mod.require = context.makeRequire(mod.map));
                }
            },
            'exports': function (mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                    if (mod.exports) {
                        return (defined[mod.map.id] = mod.exports);
                    } else {
                        return (mod.exports = defined[mod.map.id] = {});
                    }
                }
            },
            'module': function (mod) {
                if (mod.module) {
                    return mod.module;
                } else {
                    return (mod.module = {
                        id: mod.map.id,
                        uri: mod.map.url,
                        config: function () {
                            return getOwn(config.config, mod.map.id) || {};
                        },
                        exports: mod.exports || (mod.exports = {})
                    });
                }
            }
        };

        function cleanRegistry(id) {
            //Clean up machinery used for waiting modules.
            delete registry[id];
            delete enabledRegistry[id];
        }

        function breakCycle(mod, traced, processed) {
            var id = mod.map.id;

            if (mod.error) {
                mod.emit('error', mod.error);
            } else {
                traced[id] = true;
                each(mod.depMaps, function (depMap, i) {
                    var depId = depMap.id,
                        dep = getOwn(registry, depId);

                    //Only force things that have not completed
                    //being defined, so still in the registry,
                    //and only if it has not been matched up
                    //in the module already.
                    if (dep && !mod.depMatched[i] && !processed[depId]) {
                        if (getOwn(traced, depId)) {
                            mod.defineDep(i, defined[depId]);
                            mod.check(); //pass false?
                        } else {
                            breakCycle(dep, traced, processed);
                        }
                    }
                });
                processed[id] = true;
            }
        }

        function checkLoaded() {
            var err, usingPathFallback,
                waitInterval = config.waitSeconds * 1000,
                //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                noLoads = [],
                reqCalls = [],
                stillLoading = false,
                needCycleCheck = true;

            //Do not bother if this call was a result of a cycle break.
            if (inCheckLoaded) {
                return;
            }

            inCheckLoaded = true;

            //Figure out the state of all the modules.
            eachProp(enabledRegistry, function (mod) {
                var map = mod.map,
                    modId = map.id;

                //Skip things that are not enabled or in error state.
                if (!mod.enabled) {
                    return;
                }

                if (!map.isDefine) {
                    reqCalls.push(mod);
                }

                if (!mod.error) {
                    //If the module should be executed, and it has not
                    //been inited and time is up, remember it.
                    if (!mod.inited && expired) {
                        if (hasPathFallback(modId)) {
                            usingPathFallback = true;
                            stillLoading = true;
                        } else {
                            noLoads.push(modId);
                            removeScript(modId);
                        }
                    } else if (!mod.inited && mod.fetched && map.isDefine) {
                        stillLoading = true;
                        if (!map.prefix) {
                            //No reason to keep looking for unfinished
                            //loading. If the only stillLoading is a
                            //plugin resource though, keep going,
                            //because it may be that a plugin resource
                            //is waiting on a non-plugin cycle.
                            return (needCycleCheck = false);
                        }
                    }
                }
            });

            if (expired && noLoads.length) {
                //If wait time expired, throw error of unloaded modules.
                err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
                err.contextName = context.contextName;
                return onError(err);
            }

            //Not expired, check for a cycle.
            if (needCycleCheck) {
                each(reqCalls, function (mod) {
                    breakCycle(mod, {}, {});
                });
            }

            //If still waiting on loads, and the waiting load is something
            //other than a plugin resource, or there are still outstanding
            //scripts, then just try back later.
            if ((!expired || usingPathFallback) && stillLoading) {
                //Something is still waiting to load. Wait for it, but only
                //if a timeout is not already in effect.
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                    checkLoadedTimeoutId = setTimeout(function () {
                        checkLoadedTimeoutId = 0;
                        checkLoaded();
                    }, 50);
                }
            }

            inCheckLoaded = false;
        }

        Module = function (map) {
            this.events = getOwn(undefEvents, map.id) || {};
            this.map = map;
            this.shim = getOwn(config.shim, map.id);
            this.depExports = [];
            this.depMaps = [];
            this.depMatched = [];
            this.pluginMaps = {};
            this.depCount = 0;

            /* this.exports this.factory
               this.depMaps = [],
               this.enabled, this.fetched
            */
        };

        Module.prototype = {
            init: function (depMaps, factory, errback, options) {
                options = options || {};

                //Do not do more inits if already done. Can happen if there
                //are multiple define calls for the same module. That is not
                //a normal, common case, but it is also not unexpected.
                if (this.inited) {
                    return;
                }

                this.factory = factory;

                if (errback) {
                    //Register for errors on this module.
                    this.on('error', errback);
                } else if (this.events.error) {
                    //If no errback already, but there are error listeners
                    //on this module, set up an errback to pass to the deps.
                    errback = bind(this, function (err) {
                        this.emit('error', err);
                    });
                }

                //Do a copy of the dependency array, so that
                //source inputs are not modified. For example
                //"shim" deps are passed in here directly, and
                //doing a direct modification of the depMaps array
                //would affect that config.
                this.depMaps = depMaps && depMaps.slice(0);

                this.errback = errback;

                //Indicate this module has be initialized
                this.inited = true;

                this.ignore = options.ignore;

                //Could have option to init this module in enabled mode,
                //or could have been previously marked as enabled. However,
                //the dependencies are not known until init is called. So
                //if enabled previously, now trigger dependencies as enabled.
                if (options.enabled || this.enabled) {
                    //Enable this module and dependencies.
                    //Will call this.check()
                    this.enable();
                } else {
                    this.check();
                }
            },

            defineDep: function (i, depExports) {
                //Because of cycles, defined callback for a given
                //export can be called more than once.
                if (!this.depMatched[i]) {
                    this.depMatched[i] = true;
                    this.depCount -= 1;
                    this.depExports[i] = depExports;
                }
            },

            fetch: function () {
                if (this.fetched) {
                    return;
                }
                this.fetched = true;

                context.startTime = (new Date()).getTime();

                var map = this.map;

                //If the manager is for a plugin managed resource,
                //ask the plugin to load it now.
                if (this.shim) {
                    context.makeRequire(this.map, {
                        enableBuildCallback: true
                    })(this.shim.deps || [], bind(this, function () {
                        return map.prefix ? this.callPlugin() : this.load();
                    }));
                } else {
                    //Regular dependency.
                    return map.prefix ? this.callPlugin() : this.load();
                }
            },

            load: function () {
                var url = this.map.url;

                //Regular dependency.
                if (!urlFetched[url]) {
                    urlFetched[url] = true;
                    context.load(this.map.id, url);
                }
            },

            /**
             * Checks if the module is ready to define itself, and if so,
             * define it.
             */
            check: function () {
                if (!this.enabled || this.enabling) {
                    return;
                }

                var err, cjsModule,
                    id = this.map.id,
                    depExports = this.depExports,
                    exports = this.exports,
                    factory = this.factory;

                if (!this.inited) {
                    // Only fetch if not already in the defQueue.
                    if (!hasProp(context.defQueueMap, id)) {
                        this.fetch();
                    }
                } else if (this.error) {
                    this.emit('error', this.error);
                } else if (!this.defining) {
                    //The factory could trigger another require call
                    //that would result in checking this module to
                    //define itself again. If already in the process
                    //of doing that, skip this work.
                    this.defining = true;

                    if (this.depCount < 1 && !this.defined) {
                        if (isFunction(factory)) {
                            //If there is an error listener, favor passing
                            //to that instead of throwing an error. However,
                            //only do it for define()'d  modules. require
                            //errbacks should not be called for failures in
                            //their callbacks (#699). However if a global
                            //onError is set, use that.
                            if ((this.events.error && this.map.isDefine) ||
                                req.onError !== defaultOnError) {
                                try {
                                    exports = context.execCb(id, factory, depExports, exports);
                                } catch (e) {
                                    err = e;
                                }
                            } else {
                                exports = context.execCb(id, factory, depExports, exports);
                            }

                            // Favor return value over exports. If node/cjs in play,
                            // then will not have a return value anyway. Favor
                            // module.exports assignment over exports object.
                            if (this.map.isDefine && exports === undefined) {
                                cjsModule = this.module;
                                if (cjsModule) {
                                    exports = cjsModule.exports;
                                } else if (this.usingExports) {
                                    //exports already set the defined value.
                                    exports = this.exports;
                                }
                            }

                            if (err) {
                                err.requireMap = this.map;
                                err.requireModules = this.map.isDefine ? [this.map.id] : null;
                                err.requireType = this.map.isDefine ? 'define' : 'require';
                                return onError((this.error = err));
                            }

                        } else {
                            //Just a literal value
                            exports = factory;
                        }

                        this.exports = exports;

                        if (this.map.isDefine && !this.ignore) {
                            defined[id] = exports;

                            if (req.onResourceLoad) {
                                var resLoadMaps = [];
                                each(this.depMaps, function (depMap) {
                                    resLoadMaps.push(depMap.normalizedMap || depMap);
                                });
                                req.onResourceLoad(context, this.map, resLoadMaps);
                            }
                        }

                        //Clean up
                        cleanRegistry(id);

                        this.defined = true;
                    }

                    //Finished the define stage. Allow calling check again
                    //to allow define notifications below in the case of a
                    //cycle.
                    this.defining = false;

                    if (this.defined && !this.defineEmitted) {
                        this.defineEmitted = true;
                        this.emit('defined', this.exports);
                        this.defineEmitComplete = true;
                    }

                }
            },

            callPlugin: function () {
                var map = this.map,
                    id = map.id,
                    //Map already normalized the prefix.
                    pluginMap = makeModuleMap(map.prefix);

                //Mark this as a dependency for this plugin, so it
                //can be traced for cycles.
                this.depMaps.push(pluginMap);

                on(pluginMap, 'defined', bind(this, function (plugin) {
                    var load, normalizedMap, normalizedMod,
                        bundleId = getOwn(bundlesMap, this.map.id),
                        name = this.map.name,
                        parentName = this.map.parentMap ? this.map.parentMap.name : null,
                        localRequire = context.makeRequire(map.parentMap, {
                            enableBuildCallback: true
                        });

                    //If current map is not normalized, wait for that
                    //normalized name to load instead of continuing.
                    if (this.map.unnormalized) {
                        //Normalize the ID if the plugin allows it.
                        if (plugin.normalize) {
                            name = plugin.normalize(name, function (name) {
                                return normalize(name, parentName, true);
                            }) || '';
                        }

                        //prefix and name should already be normalized, no need
                        //for applying map config again either.
                        normalizedMap = makeModuleMap(map.prefix + '!' + name,
                                                      this.map.parentMap);
                        on(normalizedMap,
                            'defined', bind(this, function (value) {
                                this.map.normalizedMap = normalizedMap;
                                this.init([], function () { return value; }, null, {
                                    enabled: true,
                                    ignore: true
                                });
                            }));

                        normalizedMod = getOwn(registry, normalizedMap.id);
                        if (normalizedMod) {
                            //Mark this as a dependency for this plugin, so it
                            //can be traced for cycles.
                            this.depMaps.push(normalizedMap);

                            if (this.events.error) {
                                normalizedMod.on('error', bind(this, function (err) {
                                    this.emit('error', err);
                                }));
                            }
                            normalizedMod.enable();
                        }

                        return;
                    }

                    //If a paths config, then just load that file instead to
                    //resolve the plugin, as it is built into that paths layer.
                    if (bundleId) {
                        this.map.url = context.nameToUrl(bundleId);
                        this.load();
                        return;
                    }

                    load = bind(this, function (value) {
                        this.init([], function () { return value; }, null, {
                            enabled: true
                        });
                    });

                    load.error = bind(this, function (err) {
                        this.inited = true;
                        this.error = err;
                        err.requireModules = [id];

                        //Remove temp unnormalized modules for this module,
                        //since they will never be resolved otherwise now.
                        eachProp(registry, function (mod) {
                            if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                                cleanRegistry(mod.map.id);
                            }
                        });

                        onError(err);
                    });

                    //Allow plugins to load other code without having to know the
                    //context or how to 'complete' the load.
                    load.fromText = bind(this, function (text, textAlt) {
                        /*jslint evil: true */
                        var moduleName = map.name,
                            moduleMap = makeModuleMap(moduleName),
                            hasInteractive = useInteractive;

                        //As of 2.1.0, support just passing the text, to reinforce
                        //fromText only being called once per resource. Still
                        //support old style of passing moduleName but discard
                        //that moduleName in favor of the internal ref.
                        if (textAlt) {
                            text = textAlt;
                        }

                        //Turn off interactive script matching for IE for any define
                        //calls in the text, then turn it back on at the end.
                        if (hasInteractive) {
                            useInteractive = false;
                        }

                        //Prime the system by creating a module instance for
                        //it.
                        getModule(moduleMap);

                        //Transfer any config to this other module.
                        if (hasProp(config.config, id)) {
                            config.config[moduleName] = config.config[id];
                        }

                        try {
                            req.exec(text);
                        } catch (e) {
                            return onError(makeError('fromtexteval',
                                             'fromText eval for ' + id +
                                            ' failed: ' + e,
                                             e,
                                             [id]));
                        }

                        if (hasInteractive) {
                            useInteractive = true;
                        }

                        //Mark this as a dependency for the plugin
                        //resource
                        this.depMaps.push(moduleMap);

                        //Support anonymous modules.
                        context.completeLoad(moduleName);

                        //Bind the value of that module to the value for this
                        //resource ID.
                        localRequire([moduleName], load);
                    });

                    //Use parentName here since the plugin's name is not reliable,
                    //could be some weird string with no path that actually wants to
                    //reference the parentName's path.
                    plugin.load(map.name, localRequire, load, config);
                }));

                context.enable(pluginMap, this);
                this.pluginMaps[pluginMap.id] = pluginMap;
            },

            enable: function () {
                enabledRegistry[this.map.id] = this;
                this.enabled = true;

                //Set flag mentioning that the module is enabling,
                //so that immediate calls to the defined callbacks
                //for dependencies do not trigger inadvertent load
                //with the depCount still being zero.
                this.enabling = true;

                //Enable each dependency
                each(this.depMaps, bind(this, function (depMap, i) {
                    var id, mod, handler;

                    if (typeof depMap === 'string') {
                        //Dependency needs to be converted to a depMap
                        //and wired up to this module.
                        depMap = makeModuleMap(depMap,
                                               (this.map.isDefine ? this.map : this.map.parentMap),
                                               false,
                                               !this.skipMap);
                        this.depMaps[i] = depMap;

                        handler = getOwn(handlers, depMap.id);

                        if (handler) {
                            this.depExports[i] = handler(this);
                            return;
                        }

                        this.depCount += 1;

                        on(depMap, 'defined', bind(this, function (depExports) {
                            if (this.undefed) {
                                return;
                            }
                            this.defineDep(i, depExports);
                            this.check();
                        }));

                        if (this.errback) {
                            on(depMap, 'error', bind(this, this.errback));
                        } else if (this.events.error) {
                            // No direct errback on this module, but something
                            // else is listening for errors, so be sure to
                            // propagate the error correctly.
                            on(depMap, 'error', bind(this, function(err) {
                                this.emit('error', err);
                            }));
                        }
                    }

                    id = depMap.id;
                    mod = registry[id];

                    //Skip special modules like 'require', 'exports', 'module'
                    //Also, don't call enable if it is already enabled,
                    //important in circular dependency cases.
                    if (!hasProp(handlers, id) && mod && !mod.enabled) {
                        context.enable(depMap, this);
                    }
                }));

                //Enable each plugin that is used in
                //a dependency
                eachProp(this.pluginMaps, bind(this, function (pluginMap) {
                    var mod = getOwn(registry, pluginMap.id);
                    if (mod && !mod.enabled) {
                        context.enable(pluginMap, this);
                    }
                }));

                this.enabling = false;

                this.check();
            },

            on: function (name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cb);
            },

            emit: function (name, evt) {
                each(this.events[name], function (cb) {
                    cb(evt);
                });
                if (name === 'error') {
                    //Now that the error handler was triggered, remove
                    //the listeners, since this broken Module instance
                    //can stay around for a while in the registry.
                    delete this.events[name];
                }
            }
        };

        function callGetModule(args) {
            //Skip modules already defined.
            if (!hasProp(defined, args[0])) {
                getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
            }
        }

        function removeListener(node, func, name, ieName) {
            //Favor detachEvent because of IE9
            //issue, see attachEvent/addEventListener comment elsewhere
            //in this file.
            if (node.detachEvent && !isOpera) {
                //Probably IE. If not it will throw an error, which will be
                //useful to know.
                if (ieName) {
                    node.detachEvent(ieName, func);
                }
            } else {
                node.removeEventListener(name, func, false);
            }
        }

        /**
         * Given an event from a script node, get the requirejs info from it,
         * and then removes the event listeners on the node.
         * @param {Event} evt
         * @returns {Object}
         */
        function getScriptData(evt) {
            //Using currentTarget instead of target for Firefox 2.0's sake. Not
            //all old browsers will be supported, but this one was easy enough
            //to support and still makes sense.
            var node = evt.currentTarget || evt.srcElement;

            //Remove the listeners once here.
            removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
            removeListener(node, context.onScriptError, 'error');

            return {
                node: node,
                id: node && node.getAttribute('data-requiremodule')
            };
        }

        function intakeDefines() {
            var args;

            //Any defined modules in the global queue, intake them now.
            takeGlobalQueue();

            //Make sure any remaining defQueue items get properly processed.
            while (defQueue.length) {
                args = defQueue.shift();
                if (args[0] === null) {
                    return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' +
                        args[args.length - 1]));
                } else {
                    //args are id, deps, factory. Should be normalized by the
                    //define() function.
                    callGetModule(args);
                }
            }
            context.defQueueMap = {};
        }

        context = {
            config: config,
            contextName: contextName,
            registry: registry,
            defined: defined,
            urlFetched: urlFetched,
            defQueue: defQueue,
            defQueueMap: {},
            Module: Module,
            makeModuleMap: makeModuleMap,
            nextTick: req.nextTick,
            onError: onError,

            /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
            configure: function (cfg) {
                //Make sure the baseUrl ends in a slash.
                if (cfg.baseUrl) {
                    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
                        cfg.baseUrl += '/';
                    }
                }

                // Convert old style urlArgs string to a function.
                if (typeof cfg.urlArgs === 'string') {
                    var urlArgs = cfg.urlArgs;
                    cfg.urlArgs = function(id, url) {
                        return (url.indexOf('?') === -1 ? '?' : '&') + urlArgs;
                    };
                }

                //Save off the paths since they require special processing,
                //they are additive.
                var shim = config.shim,
                    objs = {
                        paths: true,
                        bundles: true,
                        config: true,
                        map: true
                    };

                eachProp(cfg, function (value, prop) {
                    if (objs[prop]) {
                        if (!config[prop]) {
                            config[prop] = {};
                        }
                        mixin(config[prop], value, true, true);
                    } else {
                        config[prop] = value;
                    }
                });

                //Reverse map the bundles
                if (cfg.bundles) {
                    eachProp(cfg.bundles, function (value, prop) {
                        each(value, function (v) {
                            if (v !== prop) {
                                bundlesMap[v] = prop;
                            }
                        });
                    });
                }

                //Merge shim
                if (cfg.shim) {
                    eachProp(cfg.shim, function (value, id) {
                        //Normalize the structure
                        if (isArray(value)) {
                            value = {
                                deps: value
                            };
                        }
                        if ((value.exports || value.init) && !value.exportsFn) {
                            value.exportsFn = context.makeShimExports(value);
                        }
                        shim[id] = value;
                    });
                    config.shim = shim;
                }

                //Adjust packages if necessary.
                if (cfg.packages) {
                    each(cfg.packages, function (pkgObj) {
                        var location, name;

                        pkgObj = typeof pkgObj === 'string' ? {name: pkgObj} : pkgObj;

                        name = pkgObj.name;
                        location = pkgObj.location;
                        if (location) {
                            config.paths[name] = pkgObj.location;
                        }

                        //Save pointer to main module ID for pkg name.
                        //Remove leading dot in main, so main paths are normalized,
                        //and remove any trailing .js, since different package
                        //envs have different conventions: some use a module name,
                        //some use a file name.
                        config.pkgs[name] = pkgObj.name + '/' + (pkgObj.main || 'main')
                                     .replace(currDirRegExp, '')
                                     .replace(jsSuffixRegExp, '');
                    });
                }

                //If there are any "waiting to execute" modules in the registry,
                //update the maps for them, since their info, like URLs to load,
                //may have changed.
                eachProp(registry, function (mod, id) {
                    //If module already has init called, since it is too
                    //late to modify them, and ignore unnormalized ones
                    //since they are transient.
                    if (!mod.inited && !mod.map.unnormalized) {
                        mod.map = makeModuleMap(id, null, true);
                    }
                });

                //If a deps array or a config callback is specified, then call
                //require with those args. This is useful when require is defined as a
                //config object before require.js is loaded.
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }
            },

            makeShimExports: function (value) {
                function fn() {
                    var ret;
                    if (value.init) {
                        ret = value.init.apply(global, arguments);
                    }
                    return ret || (value.exports && getGlobal(value.exports));
                }
                return fn;
            },

            makeRequire: function (relMap, options) {
                options = options || {};

                function localRequire(deps, callback, errback) {
                    var id, map, requireMod;

                    if (options.enableBuildCallback && callback && isFunction(callback)) {
                        callback.__requireJsBuild = true;
                    }

                    if (typeof deps === 'string') {
                        if (isFunction(callback)) {
                            //Invalid call
                            return onError(makeError('requireargs', 'Invalid require call'), errback);
                        }

                        //If require|exports|module are requested, get the
                        //value for them from the special handlers. Caveat:
                        //this only works while module is being defined.
                        if (relMap && hasProp(handlers, deps)) {
                            return handlers[deps](registry[relMap.id]);
                        }

                        //Synchronous access to one module. If require.get is
                        //available (as in the Node adapter), prefer that.
                        if (req.get) {
                            return req.get(context, deps, relMap, localRequire);
                        }

                        //Normalize module name, if it contains . or ..
                        map = makeModuleMap(deps, relMap, false, true);
                        id = map.id;

                        if (!hasProp(defined, id)) {
                            return onError(makeError('notloaded', 'Module name "' +
                                        id +
                                        '" has not been loaded yet for context: ' +
                                        contextName +
                                        (relMap ? '' : '. Use require([])')));
                        }
                        return defined[id];
                    }

                    //Grab defines waiting in the global queue.
                    intakeDefines();

                    //Mark all the dependencies as needing to be loaded.
                    context.nextTick(function () {
                        //Some defines could have been added since the
                        //require call, collect them.
                        intakeDefines();

                        requireMod = getModule(makeModuleMap(null, relMap));

                        //Store if map config should be applied to this require
                        //call for dependencies.
                        requireMod.skipMap = options.skipMap;

                        requireMod.init(deps, callback, errback, {
                            enabled: true
                        });

                        checkLoaded();
                    });

                    return localRequire;
                }

                mixin(localRequire, {
                    isBrowser: isBrowser,

                    /**
                     * Converts a module name + .extension into an URL path.
                     * *Requires* the use of a module name. It does not support using
                     * plain URLs like nameToUrl.
                     */
                    toUrl: function (moduleNamePlusExt) {
                        var ext,
                            index = moduleNamePlusExt.lastIndexOf('.'),
                            segment = moduleNamePlusExt.split('/')[0],
                            isRelative = segment === '.' || segment === '..';

                        //Have a file extension alias, and it is not the
                        //dots from a relative path.
                        if (index !== -1 && (!isRelative || index > 1)) {
                            ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                            moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
                        }

                        return context.nameToUrl(normalize(moduleNamePlusExt,
                                                relMap && relMap.id, true), ext,  true);
                    },

                    defined: function (id) {
                        return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
                    },

                    specified: function (id) {
                        id = makeModuleMap(id, relMap, false, true).id;
                        return hasProp(defined, id) || hasProp(registry, id);
                    }
                });

                //Only allow undef on top level require calls
                if (!relMap) {
                    localRequire.undef = function (id) {
                        //Bind any waiting define() calls to this context,
                        //fix for #408
                        takeGlobalQueue();

                        var map = makeModuleMap(id, relMap, true),
                            mod = getOwn(registry, id);

                        mod.undefed = true;
                        removeScript(id);

                        delete defined[id];
                        delete urlFetched[map.url];
                        delete undefEvents[id];

                        //Clean queued defines too. Go backwards
                        //in array so that the splices do not
                        //mess up the iteration.
                        eachReverse(defQueue, function(args, i) {
                            if (args[0] === id) {
                                defQueue.splice(i, 1);
                            }
                        });
                        delete context.defQueueMap[id];

                        if (mod) {
                            //Hold on to listeners in case the
                            //module will be attempted to be reloaded
                            //using a different config.
                            if (mod.events.defined) {
                                undefEvents[id] = mod.events;
                            }

                            cleanRegistry(id);
                        }
                    };
                }

                return localRequire;
            },

            /**
             * Called to enable a module if it is still in the registry
             * awaiting enablement. A second arg, parent, the parent module,
             * is passed in for context, when this method is overridden by
             * the optimizer. Not shown here to keep code compact.
             */
            enable: function (depMap) {
                var mod = getOwn(registry, depMap.id);
                if (mod) {
                    getModule(depMap).enable();
                }
            },

            /**
             * Internal method used by environment adapters to complete a load event.
             * A load event could be a script load or just a load pass from a synchronous
             * load call.
             * @param {String} moduleName the name of the module to potentially complete.
             */
            completeLoad: function (moduleName) {
                var found, args, mod,
                    shim = getOwn(config.shim, moduleName) || {},
                    shExports = shim.exports;

                takeGlobalQueue();

                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null) {
                        args[0] = moduleName;
                        //If already found an anonymous module and bound it
                        //to this name, then this is some other anon module
                        //waiting for its completeLoad to fire.
                        if (found) {
                            break;
                        }
                        found = true;
                    } else if (args[0] === moduleName) {
                        //Found matching define call for this script!
                        found = true;
                    }

                    callGetModule(args);
                }
                context.defQueueMap = {};

                //Do this after the cycle of callGetModule in case the result
                //of those calls/init calls changes the registry.
                mod = getOwn(registry, moduleName);

                if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
                    if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                        if (hasPathFallback(moduleName)) {
                            return;
                        } else {
                            return onError(makeError('nodefine',
                                             'No define call for ' + moduleName,
                                             null,
                                             [moduleName]));
                        }
                    } else {
                        //A script that does not call define(), so just simulate
                        //the call for it.
                        callGetModule([moduleName, (shim.deps || []), shim.exportsFn]);
                    }
                }

                checkLoaded();
            },

            /**
             * Converts a module name to a file path. Supports cases where
             * moduleName may actually be just an URL.
             * Note that it **does not** call normalize on the moduleName,
             * it is assumed to have already been normalized. This is an
             * internal API, not a public one. Use toUrl for the public API.
             */
            nameToUrl: function (moduleName, ext, skipExt) {
                var paths, syms, i, parentModule, url,
                    parentPath, bundleId,
                    pkgMain = getOwn(config.pkgs, moduleName);

                if (pkgMain) {
                    moduleName = pkgMain;
                }

                bundleId = getOwn(bundlesMap, moduleName);

                if (bundleId) {
                    return context.nameToUrl(bundleId, ext, skipExt);
                }

                //If a colon is in the URL, it indicates a protocol is used and it is just
                //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
                //or ends with .js, then assume the user meant to use an url and not a module id.
                //The slash is important for protocol-less URLs as well as full paths.
                if (req.jsExtRegExp.test(moduleName)) {
                    //Just a plain path, not module name lookup, so just return it.
                    //Add extension if it is included. This is a bit wonky, only non-.js things pass
                    //an extension, this method probably needs to be reworked.
                    url = moduleName + (ext || '');
                } else {
                    //A module that needs to be converted to a path.
                    paths = config.paths;

                    syms = moduleName.split('/');
                    //For each module name segment, see if there is a path
                    //registered for it. Start with most specific name
                    //and work up from it.
                    for (i = syms.length; i > 0; i -= 1) {
                        parentModule = syms.slice(0, i).join('/');

                        parentPath = getOwn(paths, parentModule);
                        if (parentPath) {
                            //If an array, it means there are a few choices,
                            //Choose the one that is desired
                            if (isArray(parentPath)) {
                                parentPath = parentPath[0];
                            }
                            syms.splice(0, i, parentPath);
                            break;
                        }
                    }

                    //Join the path parts together, then figure out if baseUrl is needed.
                    url = syms.join('/');
                    url += (ext || (/^data\:|^blob\:|\?/.test(url) || skipExt ? '' : '.js'));
                    url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
                }

                return config.urlArgs && !/^blob\:/.test(url) ?
                       url + config.urlArgs(moduleName, url) : url;
            },

            //Delegates to req.load. Broken out as a separate function to
            //allow overriding in the optimizer.
            load: function (id, url) {
                req.load(context, id, url);
            },

            /**
             * Executes a module callback function. Broken out as a separate function
             * solely to allow the build system to sequence the files in the built
             * layer in the right sequence.
             *
             * @private
             */
            execCb: function (name, callback, args, exports) {
                return callback.apply(exports, args);
            },

            /**
             * callback for script loads, used to check status of loading.
             *
             * @param {Event} evt the event from the browser for the script
             * that was loaded.
             */
            onScriptLoad: function (evt) {
                //Using currentTarget instead of target for Firefox 2.0's sake. Not
                //all old browsers will be supported, but this one was easy enough
                //to support and still makes sense.
                if (evt.type === 'load' ||
                        (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
                    //Reset interactive script so a script node is not held onto for
                    //to long.
                    interactiveScript = null;

                    //Pull out the name of the module and the context.
                    var data = getScriptData(evt);
                    context.completeLoad(data.id);
                }
            },

            /**
             * Callback for script errors.
             */
            onScriptError: function (evt) {
                var data = getScriptData(evt);
                if (!hasPathFallback(data.id)) {
                    var parents = [];
                    eachProp(registry, function(value, key) {
                        if (key.indexOf('_@r') !== 0) {
                            each(value.depMaps, function(depMap) {
                                if (depMap.id === data.id) {
                                    parents.push(key);
                                    return true;
                                }
                            });
                        }
                    });
                    return onError(makeError('scripterror', 'Script error for "' + data.id +
                                             (parents.length ?
                                             '", needed by: ' + parents.join(', ') :
                                             '"'), evt, [data.id]));
                }
            }
        };

        context.require = context.makeRequire();
        return context;
    }

    /**
     * Main entry point.
     *
     * If the only argument to require is a string, then the module that
     * is represented by that string is fetched for the appropriate context.
     *
     * If the first argument is an array, then it will be treated as an array
     * of dependency string names to fetch. An optional function callback can
     * be specified to execute when all of those dependencies are available.
     *
     * Make a local req variable to help Caja compliance (it assumes things
     * on a require that are not standardized), and to give a short
     * name for minification/local scope use.
     */
    req = requirejs = function (deps, callback, errback, optional) {

        //Find the right context, use default
        var context, config,
            contextName = defContextName;

        // Determine if have config object in the call.
        if (!isArray(deps) && typeof deps !== 'string') {
            // deps is a config object
            config = deps;
            if (isArray(callback)) {
                // Adjust args if there are dependencies
                deps = callback;
                callback = errback;
                errback = optional;
            } else {
                deps = [];
            }
        }

        if (config && config.context) {
            contextName = config.context;
        }

        context = getOwn(contexts, contextName);
        if (!context) {
            context = contexts[contextName] = req.s.newContext(contextName);
        }

        if (config) {
            context.configure(config);
        }

        return context.require(deps, callback, errback);
    };

    /**
     * Support require.config() to make it easier to cooperate with other
     * AMD loaders on globally agreed names.
     */
    req.config = function (config) {
        return req(config);
    };

    /**
     * Execute something after the current tick
     * of the event loop. Override for other envs
     * that have a better solution than setTimeout.
     * @param  {Function} fn function to execute later.
     */
    req.nextTick = typeof setTimeout !== 'undefined' ? function (fn) {
        setTimeout(fn, 4);
    } : function (fn) { fn(); };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    req.version = version;

    //Used to filter out dependencies that are already paths.
    req.jsExtRegExp = /^\/|:|\?|\.js$/;
    req.isBrowser = isBrowser;
    s = req.s = {
        contexts: contexts,
        newContext: newContext
    };

    //Create default context.
    req({});

    //Exports some context-sensitive methods on global require.
    each([
        'toUrl',
        'undef',
        'defined',
        'specified'
    ], function (prop) {
        //Reference from contexts instead of early binding to default context,
        //so that during builds, the latest instance of the default context
        //with its config gets used.
        req[prop] = function () {
            var ctx = contexts[defContextName];
            return ctx.require[prop].apply(ctx, arguments);
        };
    });

    if (isBrowser) {
        head = s.head = document.getElementsByTagName('head')[0];
        //If BASE tag is in play, using appendChild is a problem for IE6.
        //When that browser dies, this can be removed. Details in this jQuery bug:
        //http://dev.jquery.com/ticket/2709
        baseElement = document.getElementsByTagName('base')[0];
        if (baseElement) {
            head = s.head = baseElement.parentNode;
        }
    }

    /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * @param {Error} err the error object.
     */
    req.onError = defaultOnError;

    /**
     * Creates the node for the load command. Only used in browser envs.
     */
    req.createNode = function (config, moduleName, url) {
        var node = config.xhtml ?
                document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
                document.createElement('script');
        node.type = config.scriptType || 'text/javascript';
        node.charset = 'utf-8';
        node.async = true;
        return node;
    };

    /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {Object} context the require context to find state.
     * @param {String} moduleName the name of the module.
     * @param {Object} url the URL to the module.
     */
    req.load = function (context, moduleName, url) {
        var config = (context && context.config) || {},
            node;
        if (isBrowser) {
            //In the browser so use a script tag
            node = req.createNode(config, moduleName, url);

            node.setAttribute('data-requirecontext', context.contextName);
            node.setAttribute('data-requiremodule', moduleName);

            //Set up load listener. Test attachEvent first because IE9 has
            //a subtle issue in its addEventListener and script onload firings
            //that do not match the behavior of all other browsers with
            //addEventListener support, which fire the onload event for a
            //script right after the script execution. See:
            //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
            //UNFORTUNATELY Opera implements attachEvent but does not follow the script
            //script execution mode.
            if (node.attachEvent &&
                    //Check if node.attachEvent is artificially added by custom script or
                    //natively supported by browser
                    //read https://github.com/requirejs/requirejs/issues/187
                    //if we can NOT find [native code] then it must NOT natively supported.
                    //in IE8, node.attachEvent does not have toString()
                    //Note the test for "[native code" with no closing brace, see:
                    //https://github.com/requirejs/requirejs/issues/273
                    !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                    !isOpera) {
                //Probably IE. IE (at least 6-8) do not fire
                //script onload right after executing the script, so
                //we cannot tie the anonymous define call to a name.
                //However, IE reports the script as being in 'interactive'
                //readyState at the time of the define call.
                useInteractive = true;

                node.attachEvent('onreadystatechange', context.onScriptLoad);
                //It would be great to add an error handler here to catch
                //404s in IE9+. However, onreadystatechange will fire before
                //the error handler, so that does not help. If addEventListener
                //is used, then IE will fire error before load, but we cannot
                //use that pathway given the connect.microsoft.com issue
                //mentioned above about not doing the 'script execute,
                //then fire the script load event listener before execute
                //next script' that other browsers do.
                //Best hope: IE10 fixes the issues,
                //and then destroys all installs of IE 6-9.
                //node.attachEvent('onerror', context.onScriptError);
            } else {
                node.addEventListener('load', context.onScriptLoad, false);
                node.addEventListener('error', context.onScriptError, false);
            }
            node.src = url;

            //Calling onNodeCreated after all properties on the node have been
            //set, but before it is placed in the DOM.
            if (config.onNodeCreated) {
                config.onNodeCreated(node, config, moduleName, url);
            }

            //For some cache cases in IE 6-8, the script executes before the end
            //of the appendChild execution, so to tie an anonymous define
            //call to the module name (which is stored on the node), hold on
            //to a reference to this node, but clear after the DOM insertion.
            currentlyAddingScript = node;
            if (baseElement) {
                head.insertBefore(node, baseElement);
            } else {
                head.appendChild(node);
            }
            currentlyAddingScript = null;

            return node;
        } else if (isWebWorker) {
            try {
                //In a web worker, use importScripts. This is not a very
                //efficient use of importScripts, importScripts will block until
                //its script is downloaded and evaluated. However, if web workers
                //are in play, the expectation is that a build has been done so
                //that only one script needs to be loaded anyway. This may need
                //to be reevaluated if other use cases become common.

                // Post a task to the event loop to work around a bug in WebKit
                // where the worker gets garbage-collected after calling
                // importScripts(): https://webkit.org/b/153317
                setTimeout(function() {}, 0);
                importScripts(url);

                //Account for anonymous modules
                context.completeLoad(moduleName);
            } catch (e) {
                context.onError(makeError('importscripts',
                                'importScripts failed for ' +
                                    moduleName + ' at ' + url,
                                e,
                                [moduleName]));
            }
        }
    };

    function getInteractiveScript() {
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        eachReverse(scripts(), function (script) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        });
        return interactiveScript;
    }

    //Look for a data-main script attribute, which could also adjust the baseUrl.
    if (isBrowser && !cfg.skipDataMain) {
        //Figure out baseUrl. Get it from the script tag with require.js in it.
        eachReverse(scripts(), function (script) {
            //Set the 'head' where we can append children by
            //using the script's parent.
            if (!head) {
                head = script.parentNode;
            }

            //Look for a data-main attribute to set main script for the page
            //to load. If it is there, the path to data main becomes the
            //baseUrl, if it is not already set.
            dataMain = script.getAttribute('data-main');
            if (dataMain) {
                //Preserve dataMain in case it is a path (i.e. contains '?')
                mainScript = dataMain;

                //Set final baseUrl if there is not already an explicit one,
                //but only do so if the data-main value is not a loader plugin
                //module ID.
                if (!cfg.baseUrl && mainScript.indexOf('!') === -1) {
                    //Pull off the directory of data-main for use as the
                    //baseUrl.
                    src = mainScript.split('/');
                    mainScript = src.pop();
                    subPath = src.length ? src.join('/')  + '/' : './';

                    cfg.baseUrl = subPath;
                }

                //Strip off any trailing .js since mainScript is now
                //like a module name.
                mainScript = mainScript.replace(jsSuffixRegExp, '');

                //If mainScript is still a path, fall back to dataMain
                if (req.jsExtRegExp.test(mainScript)) {
                    mainScript = dataMain;
                }

                //Put the data-main script in the files to load.
                cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];

                return true;
            }
        });
    }

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    define = function (name, deps, callback) {
        var node, context;

        //Allow for anonymous modules
        if (typeof name !== 'string') {
            //Adjust args appropriately
            callback = deps;
            deps = name;
            name = null;
        }

        //This module may not have dependencies
        if (!isArray(deps)) {
            callback = deps;
            deps = null;
        }

        //If no name, and callback is a function, then figure out if it a
        //CommonJS thing with dependencies.
        if (!deps && isFunction(callback)) {
            deps = [];
            //Remove comments from the callback string,
            //look for require calls, and pull them into the dependencies,
            //but only if there are function args.
            if (callback.length) {
                callback
                    .toString()
                    .replace(commentRegExp, commentReplace)
                    .replace(cjsRequireRegExp, function (match, dep) {
                        deps.push(dep);
                    });

                //May be a CommonJS thing even without require calls, but still
                //could use exports, and module. Avoid doing exports and module
                //work though if it just needs require.
                //REQUIRES the function to expect the CommonJS variables in the
                //order listed below.
                deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
            }
        }

        //If in IE 6-8 and hit an anonymous define() call, do the interactive
        //work.
        if (useInteractive) {
            node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute('data-requiremodule');
                }
                context = contexts[node.getAttribute('data-requirecontext')];
            }
        }

        //Always save off evaluating the def call until the script onload handler.
        //This allows multiple modules to be in a file without prematurely
        //tracing dependencies, and allows for anonymous module support,
        //where the module name is not known until the script onload event
        //occurs. If no context, use the global queue, and get it processed
        //in the onscript load callback.
        if (context) {
            context.defQueue.push([name, deps, callback]);
            context.defQueueMap[name] = true;
        } else {
            globalDefQueue.push([name, deps, callback]);
        }
    };

    define.amd = {
        jQuery: true
    };

    /**
     * Executes the text. Normally just uses eval, but can be modified
     * to use a better, environment-specific call. Only used for transpiling
     * loader plugins, not for plain JS modules.
     * @param {String} text the text to execute/evaluate.
     */
    req.exec = function (text) {
        /*jslint evil: true */
        return eval(text);
    };

    //Set up with config info.
    req(cfg);
}(this));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJqcy9saWIvcmVxdWlyZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogdmltOiBldDp0cz00OnN3PTQ6c3RzPTRcclxuICogQGxpY2Vuc2UgUmVxdWlyZUpTIDIuMi4wIENvcHlyaWdodCBqUXVlcnkgRm91bmRhdGlvbiBhbmQgb3RoZXIgY29udHJpYnV0b3JzLlxyXG4gKiBSZWxlYXNlZCB1bmRlciBNSVQgbGljZW5zZSwgaHR0cDovL2dpdGh1Yi5jb20vcmVxdWlyZWpzL3JlcXVpcmVqcy9MSUNFTlNFXHJcbiAqL1xyXG4vL05vdCB1c2luZyBzdHJpY3Q6IHVuZXZlbiBzdHJpY3Qgc3VwcG9ydCBpbiBicm93c2VycywgIzM5MiwgYW5kIGNhdXNlc1xyXG4vL3Byb2JsZW1zIHdpdGggcmVxdWlyZWpzLmV4ZWMoKS90cmFuc3BpbGVyIHBsdWdpbnMgdGhhdCBtYXkgbm90IGJlIHN0cmljdC5cclxuLypqc2xpbnQgcmVnZXhwOiB0cnVlLCBub21lbjogdHJ1ZSwgc2xvcHB5OiB0cnVlICovXHJcbi8qZ2xvYmFsIHdpbmRvdywgbmF2aWdhdG9yLCBkb2N1bWVudCwgaW1wb3J0U2NyaXB0cywgc2V0VGltZW91dCwgb3BlcmEgKi9cclxuXHJcbnZhciByZXF1aXJlanMsIHJlcXVpcmUsIGRlZmluZTtcclxuKGZ1bmN0aW9uIChnbG9iYWwpIHtcclxuICAgIHZhciByZXEsIHMsIGhlYWQsIGJhc2VFbGVtZW50LCBkYXRhTWFpbiwgc3JjLFxyXG4gICAgICAgIGludGVyYWN0aXZlU2NyaXB0LCBjdXJyZW50bHlBZGRpbmdTY3JpcHQsIG1haW5TY3JpcHQsIHN1YlBhdGgsXHJcbiAgICAgICAgdmVyc2lvbiA9ICcyLjIuMCcsXHJcbiAgICAgICAgY29tbWVudFJlZ0V4cCA9IC8oXFwvXFwqKFtcXHNcXFNdKj8pXFwqXFwvfChbXjpdfF4pXFwvXFwvKC4qKSQpL21nLFxyXG4gICAgICAgIGNqc1JlcXVpcmVSZWdFeHAgPSAvW14uXVxccypyZXF1aXJlXFxzKlxcKFxccypbXCInXShbXidcIlxcc10rKVtcIiddXFxzKlxcKS9nLFxyXG4gICAgICAgIGpzU3VmZml4UmVnRXhwID0gL1xcLmpzJC8sXHJcbiAgICAgICAgY3VyckRpclJlZ0V4cCA9IC9eXFwuXFwvLyxcclxuICAgICAgICBvcCA9IE9iamVjdC5wcm90b3R5cGUsXHJcbiAgICAgICAgb3N0cmluZyA9IG9wLnRvU3RyaW5nLFxyXG4gICAgICAgIGhhc093biA9IG9wLmhhc093blByb3BlcnR5LFxyXG4gICAgICAgIGlzQnJvd3NlciA9ICEhKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5kb2N1bWVudCksXHJcbiAgICAgICAgaXNXZWJXb3JrZXIgPSAhaXNCcm93c2VyICYmIHR5cGVvZiBpbXBvcnRTY3JpcHRzICE9PSAndW5kZWZpbmVkJyxcclxuICAgICAgICAvL1BTMyBpbmRpY2F0ZXMgbG9hZGVkIGFuZCBjb21wbGV0ZSwgYnV0IG5lZWQgdG8gd2FpdCBmb3IgY29tcGxldGVcclxuICAgICAgICAvL3NwZWNpZmljYWxseS4gU2VxdWVuY2UgaXMgJ2xvYWRpbmcnLCAnbG9hZGVkJywgZXhlY3V0aW9uLFxyXG4gICAgICAgIC8vIHRoZW4gJ2NvbXBsZXRlJy4gVGhlIFVBIGNoZWNrIGlzIHVuZm9ydHVuYXRlLCBidXQgbm90IHN1cmUgaG93XHJcbiAgICAgICAgLy90byBmZWF0dXJlIHRlc3Qgdy9vIGNhdXNpbmcgcGVyZiBpc3N1ZXMuXHJcbiAgICAgICAgcmVhZHlSZWdFeHAgPSBpc0Jyb3dzZXIgJiYgbmF2aWdhdG9yLnBsYXRmb3JtID09PSAnUExBWVNUQVRJT04gMycgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgL15jb21wbGV0ZSQvIDogL14oY29tcGxldGV8bG9hZGVkKSQvLFxyXG4gICAgICAgIGRlZkNvbnRleHROYW1lID0gJ18nLFxyXG4gICAgICAgIC8vT2ggdGhlIHRyYWdlZHksIGRldGVjdGluZyBvcGVyYS4gU2VlIHRoZSB1c2FnZSBvZiBpc09wZXJhIGZvciByZWFzb24uXHJcbiAgICAgICAgaXNPcGVyYSA9IHR5cGVvZiBvcGVyYSAhPT0gJ3VuZGVmaW5lZCcgJiYgb3BlcmEudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgT3BlcmFdJyxcclxuICAgICAgICBjb250ZXh0cyA9IHt9LFxyXG4gICAgICAgIGNmZyA9IHt9LFxyXG4gICAgICAgIGdsb2JhbERlZlF1ZXVlID0gW10sXHJcbiAgICAgICAgdXNlSW50ZXJhY3RpdmUgPSBmYWxzZTtcclxuXHJcbiAgICAvL0NvdWxkIG1hdGNoIHNvbWV0aGluZyBsaWtlICcpLy9jb21tZW50JywgZG8gbm90IGxvc2UgdGhlIHByZWZpeCB0byBjb21tZW50LlxyXG4gICAgZnVuY3Rpb24gY29tbWVudFJlcGxhY2UobWF0Y2gsIG11bHRpLCBtdWx0aVRleHQsIHNpbmdsZVByZWZpeCkge1xyXG4gICAgICAgIHJldHVybiBzaW5nbGVQcmVmaXggfHwgJyc7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNGdW5jdGlvbihpdCkge1xyXG4gICAgICAgIHJldHVybiBvc3RyaW5nLmNhbGwoaXQpID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzQXJyYXkoaXQpIHtcclxuICAgICAgICByZXR1cm4gb3N0cmluZy5jYWxsKGl0KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEhlbHBlciBmdW5jdGlvbiBmb3IgaXRlcmF0aW5nIG92ZXIgYW4gYXJyYXkuIElmIHRoZSBmdW5jIHJldHVybnNcclxuICAgICAqIGEgdHJ1ZSB2YWx1ZSwgaXQgd2lsbCBicmVhayBvdXQgb2YgdGhlIGxvb3AuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGVhY2goYXJ5LCBmdW5jKSB7XHJcbiAgICAgICAgaWYgKGFyeSkge1xyXG4gICAgICAgICAgICB2YXIgaTtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGFyeS5sZW5ndGg7IGkgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGFyeVtpXSAmJiBmdW5jKGFyeVtpXSwgaSwgYXJ5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGVscGVyIGZ1bmN0aW9uIGZvciBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBiYWNrd2FyZHMuIElmIHRoZSBmdW5jXHJcbiAgICAgKiByZXR1cm5zIGEgdHJ1ZSB2YWx1ZSwgaXQgd2lsbCBicmVhayBvdXQgb2YgdGhlIGxvb3AuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGVhY2hSZXZlcnNlKGFyeSwgZnVuYykge1xyXG4gICAgICAgIGlmIChhcnkpIHtcclxuICAgICAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IGFyeS5sZW5ndGggLSAxOyBpID4gLTE7IGkgLT0gMSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGFyeVtpXSAmJiBmdW5jKGFyeVtpXSwgaSwgYXJ5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGhhc1Byb3Aob2JqLCBwcm9wKSB7XHJcbiAgICAgICAgcmV0dXJuIGhhc093bi5jYWxsKG9iaiwgcHJvcCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0T3duKG9iaiwgcHJvcCkge1xyXG4gICAgICAgIHJldHVybiBoYXNQcm9wKG9iaiwgcHJvcCkgJiYgb2JqW3Byb3BdO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3ljbGVzIG92ZXIgcHJvcGVydGllcyBpbiBhbiBvYmplY3QgYW5kIGNhbGxzIGEgZnVuY3Rpb24gZm9yIGVhY2hcclxuICAgICAqIHByb3BlcnR5IHZhbHVlLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyBhIHRydXRoeSB2YWx1ZSwgdGhlbiB0aGVcclxuICAgICAqIGl0ZXJhdGlvbiBpcyBzdG9wcGVkLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBlYWNoUHJvcChvYmosIGZ1bmMpIHtcclxuICAgICAgICB2YXIgcHJvcDtcclxuICAgICAgICBmb3IgKHByb3AgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgIGlmIChoYXNQcm9wKG9iaiwgcHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChmdW5jKG9ialtwcm9wXSwgcHJvcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNpbXBsZSBmdW5jdGlvbiB0byBtaXggaW4gcHJvcGVydGllcyBmcm9tIHNvdXJjZSBpbnRvIHRhcmdldCxcclxuICAgICAqIGJ1dCBvbmx5IGlmIHRhcmdldCBkb2VzIG5vdCBhbHJlYWR5IGhhdmUgYSBwcm9wZXJ0eSBvZiB0aGUgc2FtZSBuYW1lLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBtaXhpbih0YXJnZXQsIHNvdXJjZSwgZm9yY2UsIGRlZXBTdHJpbmdNaXhpbikge1xyXG4gICAgICAgIGlmIChzb3VyY2UpIHtcclxuICAgICAgICAgICAgZWFjaFByb3Aoc291cmNlLCBmdW5jdGlvbiAodmFsdWUsIHByb3ApIHtcclxuICAgICAgICAgICAgICAgIGlmIChmb3JjZSB8fCAhaGFzUHJvcCh0YXJnZXQsIHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlZXBTdHJpbmdNaXhpbiAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICFpc0FycmF5KHZhbHVlKSAmJiAhaXNGdW5jdGlvbih2YWx1ZSkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgISh2YWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0W3Byb3BdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtaXhpbih0YXJnZXRbcHJvcF0sIHZhbHVlLCBmb3JjZSwgZGVlcFN0cmluZ01peGluKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xyXG4gICAgfVxyXG5cclxuICAgIC8vU2ltaWxhciB0byBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCwgYnV0IHRoZSAndGhpcycgb2JqZWN0IGlzIHNwZWNpZmllZFxyXG4gICAgLy9maXJzdCwgc2luY2UgaXQgaXMgZWFzaWVyIHRvIHJlYWQvZmlndXJlIG91dCB3aGF0ICd0aGlzJyB3aWxsIGJlLlxyXG4gICAgZnVuY3Rpb24gYmluZChvYmosIGZuKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KG9iaiwgYXJndW1lbnRzKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNjcmlwdHMoKSB7XHJcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWZhdWx0T25FcnJvcihlcnIpIHtcclxuICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcblxyXG4gICAgLy9BbGxvdyBnZXR0aW5nIGEgZ2xvYmFsIHRoYXQgaXMgZXhwcmVzc2VkIGluXHJcbiAgICAvL2RvdCBub3RhdGlvbiwgbGlrZSAnYS5iLmMnLlxyXG4gICAgZnVuY3Rpb24gZ2V0R2xvYmFsKHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCF2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBnID0gZ2xvYmFsO1xyXG4gICAgICAgIGVhY2godmFsdWUuc3BsaXQoJy4nKSwgZnVuY3Rpb24gKHBhcnQpIHtcclxuICAgICAgICAgICAgZyA9IGdbcGFydF07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGc7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25zdHJ1Y3RzIGFuIGVycm9yIHdpdGggYSBwb2ludGVyIHRvIGFuIFVSTCB3aXRoIG1vcmUgaW5mb3JtYXRpb24uXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgdGhlIGVycm9yIElEIHRoYXQgbWFwcyB0byBhbiBJRCBvbiBhIHdlYiBwYWdlLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgaHVtYW4gcmVhZGFibGUgZXJyb3IuXHJcbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBbZXJyXSB0aGUgb3JpZ2luYWwgZXJyb3IsIGlmIHRoZXJlIGlzIG9uZS5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7RXJyb3J9XHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIG1ha2VFcnJvcihpZCwgbXNnLCBlcnIsIHJlcXVpcmVNb2R1bGVzKSB7XHJcbiAgICAgICAgdmFyIGUgPSBuZXcgRXJyb3IobXNnICsgJ1xcbmh0dHA6Ly9yZXF1aXJlanMub3JnL2RvY3MvZXJyb3JzLmh0bWwjJyArIGlkKTtcclxuICAgICAgICBlLnJlcXVpcmVUeXBlID0gaWQ7XHJcbiAgICAgICAgZS5yZXF1aXJlTW9kdWxlcyA9IHJlcXVpcmVNb2R1bGVzO1xyXG4gICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgZS5vcmlnaW5hbEVycm9yID0gZXJyO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAvL0lmIGEgZGVmaW5lIGlzIGFscmVhZHkgaW4gcGxheSB2aWEgYW5vdGhlciBBTUQgbG9hZGVyLFxyXG4gICAgICAgIC8vZG8gbm90IG92ZXJ3cml0ZS5cclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiByZXF1aXJlanMgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24ocmVxdWlyZWpzKSkge1xyXG4gICAgICAgICAgICAvL0RvIG5vdCBvdmVyd3JpdGUgYW4gZXhpc3RpbmcgcmVxdWlyZWpzIGluc3RhbmNlLlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNmZyA9IHJlcXVpcmVqcztcclxuICAgICAgICByZXF1aXJlanMgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy9BbGxvdyBmb3IgYSByZXF1aXJlIGNvbmZpZyBvYmplY3RcclxuICAgIGlmICh0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCcgJiYgIWlzRnVuY3Rpb24ocmVxdWlyZSkpIHtcclxuICAgICAgICAvL2Fzc3VtZSBpdCBpcyBhIGNvbmZpZyBvYmplY3QuXHJcbiAgICAgICAgY2ZnID0gcmVxdWlyZTtcclxuICAgICAgICByZXF1aXJlID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG5ld0NvbnRleHQoY29udGV4dE5hbWUpIHtcclxuICAgICAgICB2YXIgaW5DaGVja0xvYWRlZCwgTW9kdWxlLCBjb250ZXh0LCBoYW5kbGVycyxcclxuICAgICAgICAgICAgY2hlY2tMb2FkZWRUaW1lb3V0SWQsXHJcbiAgICAgICAgICAgIGNvbmZpZyA9IHtcclxuICAgICAgICAgICAgICAgIC8vRGVmYXVsdHMuIERvIG5vdCBzZXQgYSBkZWZhdWx0IGZvciBtYXBcclxuICAgICAgICAgICAgICAgIC8vY29uZmlnIHRvIHNwZWVkIHVwIG5vcm1hbGl6ZSgpLCB3aGljaFxyXG4gICAgICAgICAgICAgICAgLy93aWxsIHJ1biBmYXN0ZXIgaWYgdGhlcmUgaXMgbm8gZGVmYXVsdC5cclxuICAgICAgICAgICAgICAgIHdhaXRTZWNvbmRzOiA3LFxyXG4gICAgICAgICAgICAgICAgYmFzZVVybDogJy4vJyxcclxuICAgICAgICAgICAgICAgIHBhdGhzOiB7fSxcclxuICAgICAgICAgICAgICAgIGJ1bmRsZXM6IHt9LFxyXG4gICAgICAgICAgICAgICAgcGtnczoge30sXHJcbiAgICAgICAgICAgICAgICBzaGltOiB7fSxcclxuICAgICAgICAgICAgICAgIGNvbmZpZzoge31cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVnaXN0cnkgPSB7fSxcclxuICAgICAgICAgICAgLy9yZWdpc3RyeSBvZiBqdXN0IGVuYWJsZWQgbW9kdWxlcywgdG8gc3BlZWRcclxuICAgICAgICAgICAgLy9jeWNsZSBicmVha2luZyBjb2RlIHdoZW4gbG90cyBvZiBtb2R1bGVzXHJcbiAgICAgICAgICAgIC8vYXJlIHJlZ2lzdGVyZWQsIGJ1dCBub3QgYWN0aXZhdGVkLlxyXG4gICAgICAgICAgICBlbmFibGVkUmVnaXN0cnkgPSB7fSxcclxuICAgICAgICAgICAgdW5kZWZFdmVudHMgPSB7fSxcclxuICAgICAgICAgICAgZGVmUXVldWUgPSBbXSxcclxuICAgICAgICAgICAgZGVmaW5lZCA9IHt9LFxyXG4gICAgICAgICAgICB1cmxGZXRjaGVkID0ge30sXHJcbiAgICAgICAgICAgIGJ1bmRsZXNNYXAgPSB7fSxcclxuICAgICAgICAgICAgcmVxdWlyZUNvdW50ZXIgPSAxLFxyXG4gICAgICAgICAgICB1bm5vcm1hbGl6ZWRDb3VudGVyID0gMTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVHJpbXMgdGhlIC4gYW5kIC4uIGZyb20gYW4gYXJyYXkgb2YgcGF0aCBzZWdtZW50cy5cclxuICAgICAgICAgKiBJdCB3aWxsIGtlZXAgYSBsZWFkaW5nIHBhdGggc2VnbWVudCBpZiBhIC4uIHdpbGwgYmVjb21lXHJcbiAgICAgICAgICogdGhlIGZpcnN0IHBhdGggc2VnbWVudCwgdG8gaGVscCB3aXRoIG1vZHVsZSBuYW1lIGxvb2t1cHMsXHJcbiAgICAgICAgICogd2hpY2ggYWN0IGxpa2UgcGF0aHMsIGJ1dCBjYW4gYmUgcmVtYXBwZWQuIEJ1dCB0aGUgZW5kIHJlc3VsdCxcclxuICAgICAgICAgKiBhbGwgcGF0aHMgdGhhdCB1c2UgdGhpcyBmdW5jdGlvbiBzaG91bGQgbG9vayBub3JtYWxpemVkLlxyXG4gICAgICAgICAqIE5PVEU6IHRoaXMgbWV0aG9kIE1PRElGSUVTIHRoZSBpbnB1dCBhcnJheS5cclxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnkgdGhlIGFycmF5IG9mIHBhdGggc2VnbWVudHMuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gdHJpbURvdHMoYXJ5KSB7XHJcbiAgICAgICAgICAgIHZhciBpLCBwYXJ0O1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXJ5Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJ0ID0gYXJ5W2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhcnQgPT09ICcuJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGFyeS5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaSAtPSAxO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYXJ0ID09PSAnLi4nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgYXQgdGhlIHN0YXJ0LCBvciBwcmV2aW91cyB2YWx1ZSBpcyBzdGlsbCAuLixcclxuICAgICAgICAgICAgICAgICAgICAvLyBrZWVwIHRoZW0gc28gdGhhdCB3aGVuIGNvbnZlcnRlZCB0byBhIHBhdGggaXQgbWF5XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc3RpbGwgd29yayB3aGVuIGNvbnZlcnRlZCB0byBhIHBhdGgsIGV2ZW4gdGhvdWdoXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYXMgYW4gSUQgaXQgaXMgbGVzcyB0aGFuIGlkZWFsLiBJbiBsYXJnZXIgcG9pbnRcclxuICAgICAgICAgICAgICAgICAgICAvLyByZWxlYXNlcywgbWF5IGJlIGJldHRlciB0byBqdXN0IGtpY2sgb3V0IGFuIGVycm9yLlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpID09PSAwIHx8IChpID09PSAxICYmIGFyeVsyXSA9PT0gJy4uJykgfHwgYXJ5W2kgLSAxXSA9PT0gJy4uJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGkgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyeS5zcGxpY2UoaSAtIDEsIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpIC09IDI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHaXZlbiBhIHJlbGF0aXZlIG1vZHVsZSBuYW1lLCBsaWtlIC4vc29tZXRoaW5nLCBub3JtYWxpemUgaXQgdG9cclxuICAgICAgICAgKiBhIHJlYWwgbmFtZSB0aGF0IGNhbiBiZSBtYXBwZWQgdG8gYSBwYXRoLlxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIHRoZSByZWxhdGl2ZSBuYW1lXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGJhc2VOYW1lIGEgcmVhbCBuYW1lIHRoYXQgdGhlIG5hbWUgYXJnIGlzIHJlbGF0aXZlXHJcbiAgICAgICAgICogdG8uXHJcbiAgICAgICAgICogQHBhcmFtIHtCb29sZWFufSBhcHBseU1hcCBhcHBseSB0aGUgbWFwIGNvbmZpZyB0byB0aGUgdmFsdWUuIFNob3VsZFxyXG4gICAgICAgICAqIG9ubHkgYmUgZG9uZSBpZiB0aGlzIG5vcm1hbGl6YXRpb24gaXMgZm9yIGEgZGVwZW5kZW5jeSBJRC5cclxuICAgICAgICAgKiBAcmV0dXJucyB7U3RyaW5nfSBub3JtYWxpemVkIG5hbWVcclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBub3JtYWxpemUobmFtZSwgYmFzZU5hbWUsIGFwcGx5TWFwKSB7XHJcbiAgICAgICAgICAgIHZhciBwa2dNYWluLCBtYXBWYWx1ZSwgbmFtZVBhcnRzLCBpLCBqLCBuYW1lU2VnbWVudCwgbGFzdEluZGV4LFxyXG4gICAgICAgICAgICAgICAgZm91bmRNYXAsIGZvdW5kSSwgZm91bmRTdGFyTWFwLCBzdGFySSwgbm9ybWFsaXplZEJhc2VQYXJ0cyxcclxuICAgICAgICAgICAgICAgIGJhc2VQYXJ0cyA9IChiYXNlTmFtZSAmJiBiYXNlTmFtZS5zcGxpdCgnLycpKSxcclxuICAgICAgICAgICAgICAgIG1hcCA9IGNvbmZpZy5tYXAsXHJcbiAgICAgICAgICAgICAgICBzdGFyTWFwID0gbWFwICYmIG1hcFsnKiddO1xyXG5cclxuICAgICAgICAgICAgLy9BZGp1c3QgYW55IHJlbGF0aXZlIHBhdGhzLlxyXG4gICAgICAgICAgICBpZiAobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUuc3BsaXQoJy8nKTtcclxuICAgICAgICAgICAgICAgIGxhc3RJbmRleCA9IG5hbWUubGVuZ3RoIC0gMTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiB3YW50aW5nIG5vZGUgSUQgY29tcGF0aWJpbGl0eSwgc3RyaXAgLmpzIGZyb20gZW5kXHJcbiAgICAgICAgICAgICAgICAvLyBvZiBJRHMuIEhhdmUgdG8gZG8gdGhpcyBoZXJlLCBhbmQgbm90IGluIG5hbWVUb1VybFxyXG4gICAgICAgICAgICAgICAgLy8gYmVjYXVzZSBub2RlIGFsbG93cyBlaXRoZXIgLmpzIG9yIG5vbiAuanMgdG8gbWFwXHJcbiAgICAgICAgICAgICAgICAvLyB0byBzYW1lIGZpbGUuXHJcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnLm5vZGVJZENvbXBhdCAmJiBqc1N1ZmZpeFJlZ0V4cC50ZXN0KG5hbWVbbGFzdEluZGV4XSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lW2xhc3RJbmRleF0gPSBuYW1lW2xhc3RJbmRleF0ucmVwbGFjZShqc1N1ZmZpeFJlZ0V4cCwgJycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFN0YXJ0cyB3aXRoIGEgJy4nIHNvIG5lZWQgdGhlIGJhc2VOYW1lXHJcbiAgICAgICAgICAgICAgICBpZiAobmFtZVswXS5jaGFyQXQoMCkgPT09ICcuJyAmJiBiYXNlUGFydHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAvL0NvbnZlcnQgYmFzZU5hbWUgdG8gYXJyYXksIGFuZCBsb3Agb2ZmIHRoZSBsYXN0IHBhcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgLy9zbyB0aGF0IC4gbWF0Y2hlcyB0aGF0ICdkaXJlY3RvcnknIGFuZCBub3QgbmFtZSBvZiB0aGUgYmFzZU5hbWUnc1xyXG4gICAgICAgICAgICAgICAgICAgIC8vbW9kdWxlLiBGb3IgaW5zdGFuY2UsIGJhc2VOYW1lIG9mICdvbmUvdHdvL3RocmVlJywgbWFwcyB0b1xyXG4gICAgICAgICAgICAgICAgICAgIC8vJ29uZS90d28vdGhyZWUuanMnLCBidXQgd2Ugd2FudCB0aGUgZGlyZWN0b3J5LCAnb25lL3R3bycgZm9yXHJcbiAgICAgICAgICAgICAgICAgICAgLy90aGlzIG5vcm1hbGl6YXRpb24uXHJcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZEJhc2VQYXJ0cyA9IGJhc2VQYXJ0cy5zbGljZSgwLCBiYXNlUGFydHMubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IG5vcm1hbGl6ZWRCYXNlUGFydHMuY29uY2F0KG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRyaW1Eb3RzKG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUuam9pbignLycpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL0FwcGx5IG1hcCBjb25maWcgaWYgYXZhaWxhYmxlLlxyXG4gICAgICAgICAgICBpZiAoYXBwbHlNYXAgJiYgbWFwICYmIChiYXNlUGFydHMgfHwgc3Rhck1hcCkpIHtcclxuICAgICAgICAgICAgICAgIG5hbWVQYXJ0cyA9IG5hbWUuc3BsaXQoJy8nKTtcclxuXHJcbiAgICAgICAgICAgICAgICBvdXRlckxvb3A6IGZvciAoaSA9IG5hbWVQYXJ0cy5sZW5ndGg7IGkgPiAwOyBpIC09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lU2VnbWVudCA9IG5hbWVQYXJ0cy5zbGljZSgwLCBpKS5qb2luKCcvJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiYXNlUGFydHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9GaW5kIHRoZSBsb25nZXN0IGJhc2VOYW1lIHNlZ21lbnQgbWF0Y2ggaW4gdGhlIGNvbmZpZy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9TbywgZG8gam9pbnMgb24gdGhlIGJpZ2dlc3QgdG8gc21hbGxlc3QgbGVuZ3RocyBvZiBiYXNlUGFydHMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IGJhc2VQYXJ0cy5sZW5ndGg7IGogPiAwOyBqIC09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcFZhbHVlID0gZ2V0T3duKG1hcCwgYmFzZVBhcnRzLnNsaWNlKDAsIGopLmpvaW4oJy8nKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9iYXNlTmFtZSBzZWdtZW50IGhhcyBjb25maWcsIGZpbmQgaWYgaXQgaGFzIG9uZSBmb3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vdGhpcyBuYW1lLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hcFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwVmFsdWUgPSBnZXRPd24obWFwVmFsdWUsIG5hbWVTZWdtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFwVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9NYXRjaCwgdXBkYXRlIG5hbWUgdG8gdGhlIG5ldyB2YWx1ZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRNYXAgPSBtYXBWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRJID0gaTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWsgb3V0ZXJMb29wO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy9DaGVjayBmb3IgYSBzdGFyIG1hcCBtYXRjaCwgYnV0IGp1c3QgaG9sZCBvbiB0byBpdCxcclxuICAgICAgICAgICAgICAgICAgICAvL2lmIHRoZXJlIGlzIGEgc2hvcnRlciBzZWdtZW50IG1hdGNoIGxhdGVyIGluIGEgbWF0Y2hpbmdcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbmZpZywgdGhlbiBmYXZvciBvdmVyIHRoaXMgc3RhciBtYXAuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3VuZFN0YXJNYXAgJiYgc3Rhck1hcCAmJiBnZXRPd24oc3Rhck1hcCwgbmFtZVNlZ21lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kU3Rhck1hcCA9IGdldE93bihzdGFyTWFwLCBuYW1lU2VnbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJJID0gaTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZE1hcCAmJiBmb3VuZFN0YXJNYXApIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZE1hcCA9IGZvdW5kU3Rhck1hcDtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZEkgPSBzdGFySTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmRNYXApIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lUGFydHMuc3BsaWNlKDAsIGZvdW5kSSwgZm91bmRNYXApO1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lUGFydHMuam9pbignLycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGUgbmFtZSBwb2ludHMgdG8gYSBwYWNrYWdlJ3MgbmFtZSwgdXNlXHJcbiAgICAgICAgICAgIC8vIHRoZSBwYWNrYWdlIG1haW4gaW5zdGVhZC5cclxuICAgICAgICAgICAgcGtnTWFpbiA9IGdldE93bihjb25maWcucGtncywgbmFtZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcGtnTWFpbiA/IHBrZ01haW4gOiBuYW1lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcmVtb3ZlU2NyaXB0KG5hbWUpIHtcclxuICAgICAgICAgICAgaWYgKGlzQnJvd3Nlcikge1xyXG4gICAgICAgICAgICAgICAgZWFjaChzY3JpcHRzKCksIGZ1bmN0aW9uIChzY3JpcHROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjcmlwdE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLXJlcXVpcmVtb2R1bGUnKSA9PT0gbmFtZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtcmVxdWlyZWNvbnRleHQnKSA9PT0gY29udGV4dC5jb250ZXh0TmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHROb2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0Tm9kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBoYXNQYXRoRmFsbGJhY2soaWQpIHtcclxuICAgICAgICAgICAgdmFyIHBhdGhDb25maWcgPSBnZXRPd24oY29uZmlnLnBhdGhzLCBpZCk7XHJcbiAgICAgICAgICAgIGlmIChwYXRoQ29uZmlnICYmIGlzQXJyYXkocGF0aENvbmZpZykgJiYgcGF0aENvbmZpZy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAvL1BvcCBvZmYgdGhlIGZpcnN0IGFycmF5IHZhbHVlLCBzaW5jZSBpdCBmYWlsZWQsIGFuZFxyXG4gICAgICAgICAgICAgICAgLy9yZXRyeVxyXG4gICAgICAgICAgICAgICAgcGF0aENvbmZpZy5zaGlmdCgpO1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXF1aXJlLnVuZGVmKGlkKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL0N1c3RvbSByZXF1aXJlIHRoYXQgZG9lcyBub3QgZG8gbWFwIHRyYW5zbGF0aW9uLCBzaW5jZVxyXG4gICAgICAgICAgICAgICAgLy9JRCBpcyBcImFic29sdXRlXCIsIGFscmVhZHkgbWFwcGVkL3Jlc29sdmVkLlxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5tYWtlUmVxdWlyZShudWxsLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2tpcE1hcDogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfSkoW2lkXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vVHVybnMgYSBwbHVnaW4hcmVzb3VyY2UgdG8gW3BsdWdpbiwgcmVzb3VyY2VdXHJcbiAgICAgICAgLy93aXRoIHRoZSBwbHVnaW4gYmVpbmcgdW5kZWZpbmVkIGlmIHRoZSBuYW1lXHJcbiAgICAgICAgLy9kaWQgbm90IGhhdmUgYSBwbHVnaW4gcHJlZml4LlxyXG4gICAgICAgIGZ1bmN0aW9uIHNwbGl0UHJlZml4KG5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIHByZWZpeCxcclxuICAgICAgICAgICAgICAgIGluZGV4ID0gbmFtZSA/IG5hbWUuaW5kZXhPZignIScpIDogLTE7XHJcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBwcmVmaXggPSBuYW1lLnN1YnN0cmluZygwLCBpbmRleCk7XHJcbiAgICAgICAgICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHJpbmcoaW5kZXggKyAxLCBuYW1lLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIFtwcmVmaXgsIG5hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ3JlYXRlcyBhIG1vZHVsZSBtYXBwaW5nIHRoYXQgaW5jbHVkZXMgcGx1Z2luIHByZWZpeCwgbW9kdWxlXHJcbiAgICAgICAgICogbmFtZSwgYW5kIHBhdGguIElmIHBhcmVudE1vZHVsZU1hcCBpcyBwcm92aWRlZCBpdCB3aWxsXHJcbiAgICAgICAgICogYWxzbyBub3JtYWxpemUgdGhlIG5hbWUgdmlhIHJlcXVpcmUubm9ybWFsaXplKClcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIHRoZSBtb2R1bGUgbmFtZVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbcGFyZW50TW9kdWxlTWFwXSBwYXJlbnQgbW9kdWxlIG1hcFxyXG4gICAgICAgICAqIGZvciB0aGUgbW9kdWxlIG5hbWUsIHVzZWQgdG8gcmVzb2x2ZSByZWxhdGl2ZSBuYW1lcy5cclxuICAgICAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzTm9ybWFsaXplZDogaXMgdGhlIElEIGFscmVhZHkgbm9ybWFsaXplZC5cclxuICAgICAgICAgKiBUaGlzIGlzIHRydWUgaWYgdGhpcyBjYWxsIGlzIGRvbmUgZm9yIGEgZGVmaW5lKCkgbW9kdWxlIElELlxyXG4gICAgICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gYXBwbHlNYXA6IGFwcGx5IHRoZSBtYXAgY29uZmlnIHRvIHRoZSBJRC5cclxuICAgICAgICAgKiBTaG91bGQgb25seSBiZSB0cnVlIGlmIHRoaXMgbWFwIGlzIGZvciBhIGRlcGVuZGVuY3kuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIG1ha2VNb2R1bGVNYXAobmFtZSwgcGFyZW50TW9kdWxlTWFwLCBpc05vcm1hbGl6ZWQsIGFwcGx5TWFwKSB7XHJcbiAgICAgICAgICAgIHZhciB1cmwsIHBsdWdpbk1vZHVsZSwgc3VmZml4LCBuYW1lUGFydHMsXHJcbiAgICAgICAgICAgICAgICBwcmVmaXggPSBudWxsLFxyXG4gICAgICAgICAgICAgICAgcGFyZW50TmFtZSA9IHBhcmVudE1vZHVsZU1hcCA/IHBhcmVudE1vZHVsZU1hcC5uYW1lIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIG9yaWdpbmFsTmFtZSA9IG5hbWUsXHJcbiAgICAgICAgICAgICAgICBpc0RlZmluZSA9IHRydWUsXHJcbiAgICAgICAgICAgICAgICBub3JtYWxpemVkTmFtZSA9ICcnO1xyXG5cclxuICAgICAgICAgICAgLy9JZiBubyBuYW1lLCB0aGVuIGl0IG1lYW5zIGl0IGlzIGEgcmVxdWlyZSBjYWxsLCBnZW5lcmF0ZSBhblxyXG4gICAgICAgICAgICAvL2ludGVybmFsIG5hbWUuXHJcbiAgICAgICAgICAgIGlmICghbmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaXNEZWZpbmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIG5hbWUgPSAnX0ByJyArIChyZXF1aXJlQ291bnRlciArPSAxKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbmFtZVBhcnRzID0gc3BsaXRQcmVmaXgobmFtZSk7XHJcbiAgICAgICAgICAgIHByZWZpeCA9IG5hbWVQYXJ0c1swXTtcclxuICAgICAgICAgICAgbmFtZSA9IG5hbWVQYXJ0c1sxXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChwcmVmaXgpIHtcclxuICAgICAgICAgICAgICAgIHByZWZpeCA9IG5vcm1hbGl6ZShwcmVmaXgsIHBhcmVudE5hbWUsIGFwcGx5TWFwKTtcclxuICAgICAgICAgICAgICAgIHBsdWdpbk1vZHVsZSA9IGdldE93bihkZWZpbmVkLCBwcmVmaXgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL0FjY291bnQgZm9yIHJlbGF0aXZlIHBhdGhzIGlmIHRoZXJlIGlzIGEgYmFzZSBuYW1lLlxyXG4gICAgICAgICAgICBpZiAobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZWZpeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwbHVnaW5Nb2R1bGUgJiYgcGx1Z2luTW9kdWxlLm5vcm1hbGl6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1BsdWdpbiBpcyBsb2FkZWQsIHVzZSBpdHMgbm9ybWFsaXplIG1ldGhvZC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZE5hbWUgPSBwbHVnaW5Nb2R1bGUubm9ybWFsaXplKG5hbWUsIGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbm9ybWFsaXplKG5hbWUsIHBhcmVudE5hbWUsIGFwcGx5TWFwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbmVzdGVkIHBsdWdpbiByZWZlcmVuY2VzLCB0aGVuIGRvIG5vdCB0cnkgdG9cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm9ybWFsaXplLCBhcyBpdCB3aWxsIG5vdCBub3JtYWxpemUgY29ycmVjdGx5LiBUaGlzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBsYWNlcyBhIHJlc3RyaWN0aW9uIG9uIHJlc291cmNlSWRzLCBhbmQgdGhlIGxvbmdlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0ZXJtIHNvbHV0aW9uIGlzIG5vdCB0byBub3JtYWxpemUgdW50aWwgcGx1Z2lucyBhcmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9hZGVkIGFuZCBhbGwgbm9ybWFsaXphdGlvbnMgdG8gYWxsb3cgZm9yIGFzeW5jXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvYWRpbmcgb2YgYSBsb2FkZXIgcGx1Z2luLiBCdXQgZm9yIG5vdywgZml4ZXMgdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbW1vbiB1c2VzLiBEZXRhaWxzIGluICMxMTMxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWROYW1lID0gbmFtZS5pbmRleE9mKCchJykgPT09IC0xID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemUobmFtZSwgcGFyZW50TmFtZSwgYXBwbHlNYXApIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9BIHJlZ3VsYXIgbW9kdWxlLlxyXG4gICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWROYW1lID0gbm9ybWFsaXplKG5hbWUsIHBhcmVudE5hbWUsIGFwcGx5TWFwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy9Ob3JtYWxpemVkIG5hbWUgbWF5IGJlIGEgcGx1Z2luIElEIGR1ZSB0byBtYXAgY29uZmlnXHJcbiAgICAgICAgICAgICAgICAgICAgLy9hcHBsaWNhdGlvbiBpbiBub3JtYWxpemUuIFRoZSBtYXAgY29uZmlnIHZhbHVlcyBtdXN0XHJcbiAgICAgICAgICAgICAgICAgICAgLy9hbHJlYWR5IGJlIG5vcm1hbGl6ZWQsIHNvIGRvIG5vdCBuZWVkIHRvIHJlZG8gdGhhdCBwYXJ0LlxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWVQYXJ0cyA9IHNwbGl0UHJlZml4KG5vcm1hbGl6ZWROYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBwcmVmaXggPSBuYW1lUGFydHNbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZE5hbWUgPSBuYW1lUGFydHNbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgaXNOb3JtYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdXJsID0gY29udGV4dC5uYW1lVG9Vcmwobm9ybWFsaXplZE5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL0lmIHRoZSBpZCBpcyBhIHBsdWdpbiBpZCB0aGF0IGNhbm5vdCBiZSBkZXRlcm1pbmVkIGlmIGl0IG5lZWRzXHJcbiAgICAgICAgICAgIC8vbm9ybWFsaXphdGlvbiwgc3RhbXAgaXQgd2l0aCBhIHVuaXF1ZSBJRCBzbyB0d28gbWF0Y2hpbmcgcmVsYXRpdmVcclxuICAgICAgICAgICAgLy9pZHMgdGhhdCBtYXkgY29uZmxpY3QgY2FuIGJlIHNlcGFyYXRlLlxyXG4gICAgICAgICAgICBzdWZmaXggPSBwcmVmaXggJiYgIXBsdWdpbk1vZHVsZSAmJiAhaXNOb3JtYWxpemVkID9cclxuICAgICAgICAgICAgICAgICAgICAgJ191bm5vcm1hbGl6ZWQnICsgKHVubm9ybWFsaXplZENvdW50ZXIgKz0gMSkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAnJztcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBwcmVmaXg6IHByZWZpeCxcclxuICAgICAgICAgICAgICAgIG5hbWU6IG5vcm1hbGl6ZWROYW1lLFxyXG4gICAgICAgICAgICAgICAgcGFyZW50TWFwOiBwYXJlbnRNb2R1bGVNYXAsXHJcbiAgICAgICAgICAgICAgICB1bm5vcm1hbGl6ZWQ6ICEhc3VmZml4LFxyXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICBvcmlnaW5hbE5hbWU6IG9yaWdpbmFsTmFtZSxcclxuICAgICAgICAgICAgICAgIGlzRGVmaW5lOiBpc0RlZmluZSxcclxuICAgICAgICAgICAgICAgIGlkOiAocHJlZml4ID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZml4ICsgJyEnICsgbm9ybWFsaXplZE5hbWUgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkTmFtZSkgKyBzdWZmaXhcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldE1vZHVsZShkZXBNYXApIHtcclxuICAgICAgICAgICAgdmFyIGlkID0gZGVwTWFwLmlkLFxyXG4gICAgICAgICAgICAgICAgbW9kID0gZ2V0T3duKHJlZ2lzdHJ5LCBpZCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIW1vZCkge1xyXG4gICAgICAgICAgICAgICAgbW9kID0gcmVnaXN0cnlbaWRdID0gbmV3IGNvbnRleHQuTW9kdWxlKGRlcE1hcCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtb2Q7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBvbihkZXBNYXAsIG5hbWUsIGZuKSB7XHJcbiAgICAgICAgICAgIHZhciBpZCA9IGRlcE1hcC5pZCxcclxuICAgICAgICAgICAgICAgIG1vZCA9IGdldE93bihyZWdpc3RyeSwgaWQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGhhc1Byb3AoZGVmaW5lZCwgaWQpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgKCFtb2QgfHwgbW9kLmRlZmluZUVtaXRDb21wbGV0ZSkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSAnZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBmbihkZWZpbmVkW2lkXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBtb2QgPSBnZXRNb2R1bGUoZGVwTWFwKTtcclxuICAgICAgICAgICAgICAgIGlmIChtb2QuZXJyb3IgJiYgbmFtZSA9PT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZuKG1vZC5lcnJvcik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZC5vbihuYW1lLCBmbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG9uRXJyb3IoZXJyLCBlcnJiYWNrKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHMgPSBlcnIucmVxdWlyZU1vZHVsZXMsXHJcbiAgICAgICAgICAgICAgICBub3RpZmllZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKGVycmJhY2spIHtcclxuICAgICAgICAgICAgICAgIGVycmJhY2soZXJyKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVhY2goaWRzLCBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbW9kID0gZ2V0T3duKHJlZ2lzdHJ5LCBpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1NldCBlcnJvciBvbiBtb2R1bGUsIHNvIGl0IHNraXBzIHRpbWVvdXQgY2hlY2tzLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2QuZXJyb3IgPSBlcnI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtb2QuZXZlbnRzLmVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmllZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2QuZW1pdCgnZXJyb3InLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFub3RpZmllZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbkVycm9yKGVycik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEludGVybmFsIG1ldGhvZCB0byB0cmFuc2ZlciBnbG9iYWxRdWV1ZSBpdGVtcyB0byB0aGlzIGNvbnRleHQnc1xyXG4gICAgICAgICAqIGRlZlF1ZXVlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHRha2VHbG9iYWxRdWV1ZSgpIHtcclxuICAgICAgICAgICAgLy9QdXNoIGFsbCB0aGUgZ2xvYmFsRGVmUXVldWUgaXRlbXMgaW50byB0aGUgY29udGV4dCdzIGRlZlF1ZXVlXHJcbiAgICAgICAgICAgIGlmIChnbG9iYWxEZWZRdWV1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGVhY2goZ2xvYmFsRGVmUXVldWUsIGZ1bmN0aW9uKHF1ZXVlSXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpZCA9IHF1ZXVlSXRlbVswXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGlkID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmRlZlF1ZXVlTWFwW2lkXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGRlZlF1ZXVlLnB1c2gocXVldWVJdGVtKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgZ2xvYmFsRGVmUXVldWUgPSBbXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaGFuZGxlcnMgPSB7XHJcbiAgICAgICAgICAgICdyZXF1aXJlJzogZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG1vZC5yZXF1aXJlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vZC5yZXF1aXJlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKG1vZC5yZXF1aXJlID0gY29udGV4dC5tYWtlUmVxdWlyZShtb2QubWFwKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICdleHBvcnRzJzogZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgICAgICAgICAgICAgbW9kLnVzaW5nRXhwb3J0cyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpZiAobW9kLm1hcC5pc0RlZmluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtb2QuZXhwb3J0cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGRlZmluZWRbbW9kLm1hcC5pZF0gPSBtb2QuZXhwb3J0cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChtb2QuZXhwb3J0cyA9IGRlZmluZWRbbW9kLm1hcC5pZF0gPSB7fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAnbW9kdWxlJzogZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG1vZC5tb2R1bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9kLm1vZHVsZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChtb2QubW9kdWxlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogbW9kLm1hcC5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJpOiBtb2QubWFwLnVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0T3duKGNvbmZpZy5jb25maWcsIG1vZC5tYXAuaWQpIHx8IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRzOiBtb2QuZXhwb3J0cyB8fCAobW9kLmV4cG9ydHMgPSB7fSlcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNsZWFuUmVnaXN0cnkoaWQpIHtcclxuICAgICAgICAgICAgLy9DbGVhbiB1cCBtYWNoaW5lcnkgdXNlZCBmb3Igd2FpdGluZyBtb2R1bGVzLlxyXG4gICAgICAgICAgICBkZWxldGUgcmVnaXN0cnlbaWRdO1xyXG4gICAgICAgICAgICBkZWxldGUgZW5hYmxlZFJlZ2lzdHJ5W2lkXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGJyZWFrQ3ljbGUobW9kLCB0cmFjZWQsIHByb2Nlc3NlZCkge1xyXG4gICAgICAgICAgICB2YXIgaWQgPSBtb2QubWFwLmlkO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1vZC5lcnJvcikge1xyXG4gICAgICAgICAgICAgICAgbW9kLmVtaXQoJ2Vycm9yJywgbW9kLmVycm9yKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRyYWNlZFtpZF0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgZWFjaChtb2QuZGVwTWFwcywgZnVuY3Rpb24gKGRlcE1hcCwgaSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXBJZCA9IGRlcE1hcC5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVwID0gZ2V0T3duKHJlZ2lzdHJ5LCBkZXBJZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vT25seSBmb3JjZSB0aGluZ3MgdGhhdCBoYXZlIG5vdCBjb21wbGV0ZWRcclxuICAgICAgICAgICAgICAgICAgICAvL2JlaW5nIGRlZmluZWQsIHNvIHN0aWxsIGluIHRoZSByZWdpc3RyeSxcclxuICAgICAgICAgICAgICAgICAgICAvL2FuZCBvbmx5IGlmIGl0IGhhcyBub3QgYmVlbiBtYXRjaGVkIHVwXHJcbiAgICAgICAgICAgICAgICAgICAgLy9pbiB0aGUgbW9kdWxlIGFscmVhZHkuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlcCAmJiAhbW9kLmRlcE1hdGNoZWRbaV0gJiYgIXByb2Nlc3NlZFtkZXBJZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldE93bih0cmFjZWQsIGRlcElkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kLmRlZmluZURlcChpLCBkZWZpbmVkW2RlcElkXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2QuY2hlY2soKTsgLy9wYXNzIGZhbHNlP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtDeWNsZShkZXAsIHRyYWNlZCwgcHJvY2Vzc2VkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcHJvY2Vzc2VkW2lkXSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrTG9hZGVkKCkge1xyXG4gICAgICAgICAgICB2YXIgZXJyLCB1c2luZ1BhdGhGYWxsYmFjayxcclxuICAgICAgICAgICAgICAgIHdhaXRJbnRlcnZhbCA9IGNvbmZpZy53YWl0U2Vjb25kcyAqIDEwMDAsXHJcbiAgICAgICAgICAgICAgICAvL0l0IGlzIHBvc3NpYmxlIHRvIGRpc2FibGUgdGhlIHdhaXQgaW50ZXJ2YWwgYnkgdXNpbmcgd2FpdFNlY29uZHMgb2YgMC5cclxuICAgICAgICAgICAgICAgIGV4cGlyZWQgPSB3YWl0SW50ZXJ2YWwgJiYgKGNvbnRleHQuc3RhcnRUaW1lICsgd2FpdEludGVydmFsKSA8IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxyXG4gICAgICAgICAgICAgICAgbm9Mb2FkcyA9IFtdLFxyXG4gICAgICAgICAgICAgICAgcmVxQ2FsbHMgPSBbXSxcclxuICAgICAgICAgICAgICAgIHN0aWxsTG9hZGluZyA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbmVlZEN5Y2xlQ2hlY2sgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgLy9EbyBub3QgYm90aGVyIGlmIHRoaXMgY2FsbCB3YXMgYSByZXN1bHQgb2YgYSBjeWNsZSBicmVhay5cclxuICAgICAgICAgICAgaWYgKGluQ2hlY2tMb2FkZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaW5DaGVja0xvYWRlZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAvL0ZpZ3VyZSBvdXQgdGhlIHN0YXRlIG9mIGFsbCB0aGUgbW9kdWxlcy5cclxuICAgICAgICAgICAgZWFjaFByb3AoZW5hYmxlZFJlZ2lzdHJ5LCBmdW5jdGlvbiAobW9kKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWFwID0gbW9kLm1hcCxcclxuICAgICAgICAgICAgICAgICAgICBtb2RJZCA9IG1hcC5pZDtcclxuXHJcbiAgICAgICAgICAgICAgICAvL1NraXAgdGhpbmdzIHRoYXQgYXJlIG5vdCBlbmFibGVkIG9yIGluIGVycm9yIHN0YXRlLlxyXG4gICAgICAgICAgICAgICAgaWYgKCFtb2QuZW5hYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIW1hcC5pc0RlZmluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcUNhbGxzLnB1c2gobW9kKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIW1vZC5lcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vSWYgdGhlIG1vZHVsZSBzaG91bGQgYmUgZXhlY3V0ZWQsIGFuZCBpdCBoYXMgbm90XHJcbiAgICAgICAgICAgICAgICAgICAgLy9iZWVuIGluaXRlZCBhbmQgdGltZSBpcyB1cCwgcmVtZW1iZXIgaXQuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtb2QuaW5pdGVkICYmIGV4cGlyZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc1BhdGhGYWxsYmFjayhtb2RJZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzaW5nUGF0aEZhbGxiYWNrID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0aWxsTG9hZGluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub0xvYWRzLnB1c2gobW9kSWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlU2NyaXB0KG1vZElkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW1vZC5pbml0ZWQgJiYgbW9kLmZldGNoZWQgJiYgbWFwLmlzRGVmaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0aWxsTG9hZGluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbWFwLnByZWZpeCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9ObyByZWFzb24gdG8ga2VlcCBsb29raW5nIGZvciB1bmZpbmlzaGVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2xvYWRpbmcuIElmIHRoZSBvbmx5IHN0aWxsTG9hZGluZyBpcyBhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3BsdWdpbiByZXNvdXJjZSB0aG91Z2gsIGtlZXAgZ29pbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2JlY2F1c2UgaXQgbWF5IGJlIHRoYXQgYSBwbHVnaW4gcmVzb3VyY2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vaXMgd2FpdGluZyBvbiBhIG5vbi1wbHVnaW4gY3ljbGUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKG5lZWRDeWNsZUNoZWNrID0gZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChleHBpcmVkICYmIG5vTG9hZHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAvL0lmIHdhaXQgdGltZSBleHBpcmVkLCB0aHJvdyBlcnJvciBvZiB1bmxvYWRlZCBtb2R1bGVzLlxyXG4gICAgICAgICAgICAgICAgZXJyID0gbWFrZUVycm9yKCd0aW1lb3V0JywgJ0xvYWQgdGltZW91dCBmb3IgbW9kdWxlczogJyArIG5vTG9hZHMsIG51bGwsIG5vTG9hZHMpO1xyXG4gICAgICAgICAgICAgICAgZXJyLmNvbnRleHROYW1lID0gY29udGV4dC5jb250ZXh0TmFtZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvbkVycm9yKGVycik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vTm90IGV4cGlyZWQsIGNoZWNrIGZvciBhIGN5Y2xlLlxyXG4gICAgICAgICAgICBpZiAobmVlZEN5Y2xlQ2hlY2spIHtcclxuICAgICAgICAgICAgICAgIGVhY2gocmVxQ2FsbHMsIGZ1bmN0aW9uIChtb2QpIHtcclxuICAgICAgICAgICAgICAgICAgICBicmVha0N5Y2xlKG1vZCwge30sIHt9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL0lmIHN0aWxsIHdhaXRpbmcgb24gbG9hZHMsIGFuZCB0aGUgd2FpdGluZyBsb2FkIGlzIHNvbWV0aGluZ1xyXG4gICAgICAgICAgICAvL290aGVyIHRoYW4gYSBwbHVnaW4gcmVzb3VyY2UsIG9yIHRoZXJlIGFyZSBzdGlsbCBvdXRzdGFuZGluZ1xyXG4gICAgICAgICAgICAvL3NjcmlwdHMsIHRoZW4ganVzdCB0cnkgYmFjayBsYXRlci5cclxuICAgICAgICAgICAgaWYgKCghZXhwaXJlZCB8fCB1c2luZ1BhdGhGYWxsYmFjaykgJiYgc3RpbGxMb2FkaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAvL1NvbWV0aGluZyBpcyBzdGlsbCB3YWl0aW5nIHRvIGxvYWQuIFdhaXQgZm9yIGl0LCBidXQgb25seVxyXG4gICAgICAgICAgICAgICAgLy9pZiBhIHRpbWVvdXQgaXMgbm90IGFscmVhZHkgaW4gZWZmZWN0LlxyXG4gICAgICAgICAgICAgICAgaWYgKChpc0Jyb3dzZXIgfHwgaXNXZWJXb3JrZXIpICYmICFjaGVja0xvYWRlZFRpbWVvdXRJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNoZWNrTG9hZGVkVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrTG9hZGVkVGltZW91dElkID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tMb2FkZWQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCA1MCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGluQ2hlY2tMb2FkZWQgPSBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIE1vZHVsZSA9IGZ1bmN0aW9uIChtYXApIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHMgPSBnZXRPd24odW5kZWZFdmVudHMsIG1hcC5pZCkgfHwge307XHJcbiAgICAgICAgICAgIHRoaXMubWFwID0gbWFwO1xyXG4gICAgICAgICAgICB0aGlzLnNoaW0gPSBnZXRPd24oY29uZmlnLnNoaW0sIG1hcC5pZCk7XHJcbiAgICAgICAgICAgIHRoaXMuZGVwRXhwb3J0cyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmRlcE1hcHMgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5kZXBNYXRjaGVkID0gW107XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luTWFwcyA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLmRlcENvdW50ID0gMDtcclxuXHJcbiAgICAgICAgICAgIC8qIHRoaXMuZXhwb3J0cyB0aGlzLmZhY3RvcnlcclxuICAgICAgICAgICAgICAgdGhpcy5kZXBNYXBzID0gW10sXHJcbiAgICAgICAgICAgICAgIHRoaXMuZW5hYmxlZCwgdGhpcy5mZXRjaGVkXHJcbiAgICAgICAgICAgICovXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgTW9kdWxlLnByb3RvdHlwZSA9IHtcclxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24gKGRlcE1hcHMsIGZhY3RvcnksIGVycmJhY2ssIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vRG8gbm90IGRvIG1vcmUgaW5pdHMgaWYgYWxyZWFkeSBkb25lLiBDYW4gaGFwcGVuIGlmIHRoZXJlXHJcbiAgICAgICAgICAgICAgICAvL2FyZSBtdWx0aXBsZSBkZWZpbmUgY2FsbHMgZm9yIHRoZSBzYW1lIG1vZHVsZS4gVGhhdCBpcyBub3RcclxuICAgICAgICAgICAgICAgIC8vYSBub3JtYWwsIGNvbW1vbiBjYXNlLCBidXQgaXQgaXMgYWxzbyBub3QgdW5leHBlY3RlZC5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmluaXRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZhY3RvcnkgPSBmYWN0b3J5O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlcnJiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9SZWdpc3RlciBmb3IgZXJyb3JzIG9uIHRoaXMgbW9kdWxlLlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub24oJ2Vycm9yJywgZXJyYmFjayk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZXZlbnRzLmVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9JZiBubyBlcnJiYWNrIGFscmVhZHksIGJ1dCB0aGVyZSBhcmUgZXJyb3IgbGlzdGVuZXJzXHJcbiAgICAgICAgICAgICAgICAgICAgLy9vbiB0aGlzIG1vZHVsZSwgc2V0IHVwIGFuIGVycmJhY2sgdG8gcGFzcyB0byB0aGUgZGVwcy5cclxuICAgICAgICAgICAgICAgICAgICBlcnJiYWNrID0gYmluZCh0aGlzLCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vRG8gYSBjb3B5IG9mIHRoZSBkZXBlbmRlbmN5IGFycmF5LCBzbyB0aGF0XHJcbiAgICAgICAgICAgICAgICAvL3NvdXJjZSBpbnB1dHMgYXJlIG5vdCBtb2RpZmllZC4gRm9yIGV4YW1wbGVcclxuICAgICAgICAgICAgICAgIC8vXCJzaGltXCIgZGVwcyBhcmUgcGFzc2VkIGluIGhlcmUgZGlyZWN0bHksIGFuZFxyXG4gICAgICAgICAgICAgICAgLy9kb2luZyBhIGRpcmVjdCBtb2RpZmljYXRpb24gb2YgdGhlIGRlcE1hcHMgYXJyYXlcclxuICAgICAgICAgICAgICAgIC8vd291bGQgYWZmZWN0IHRoYXQgY29uZmlnLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5kZXBNYXBzID0gZGVwTWFwcyAmJiBkZXBNYXBzLnNsaWNlKDApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZXJyYmFjayA9IGVycmJhY2s7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9JbmRpY2F0ZSB0aGlzIG1vZHVsZSBoYXMgYmUgaW5pdGlhbGl6ZWRcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlnbm9yZSA9IG9wdGlvbnMuaWdub3JlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vQ291bGQgaGF2ZSBvcHRpb24gdG8gaW5pdCB0aGlzIG1vZHVsZSBpbiBlbmFibGVkIG1vZGUsXHJcbiAgICAgICAgICAgICAgICAvL29yIGNvdWxkIGhhdmUgYmVlbiBwcmV2aW91c2x5IG1hcmtlZCBhcyBlbmFibGVkLiBIb3dldmVyLFxyXG4gICAgICAgICAgICAgICAgLy90aGUgZGVwZW5kZW5jaWVzIGFyZSBub3Qga25vd24gdW50aWwgaW5pdCBpcyBjYWxsZWQuIFNvXHJcbiAgICAgICAgICAgICAgICAvL2lmIGVuYWJsZWQgcHJldmlvdXNseSwgbm93IHRyaWdnZXIgZGVwZW5kZW5jaWVzIGFzIGVuYWJsZWQuXHJcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5lbmFibGVkIHx8IHRoaXMuZW5hYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vRW5hYmxlIHRoaXMgbW9kdWxlIGFuZCBkZXBlbmRlbmNpZXMuXHJcbiAgICAgICAgICAgICAgICAgICAgLy9XaWxsIGNhbGwgdGhpcy5jaGVjaygpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbmFibGUoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVjaygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgZGVmaW5lRGVwOiBmdW5jdGlvbiAoaSwgZGVwRXhwb3J0cykge1xyXG4gICAgICAgICAgICAgICAgLy9CZWNhdXNlIG9mIGN5Y2xlcywgZGVmaW5lZCBjYWxsYmFjayBmb3IgYSBnaXZlblxyXG4gICAgICAgICAgICAgICAgLy9leHBvcnQgY2FuIGJlIGNhbGxlZCBtb3JlIHRoYW4gb25jZS5cclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5kZXBNYXRjaGVkW2ldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXBNYXRjaGVkW2ldID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlcENvdW50IC09IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXBFeHBvcnRzW2ldID0gZGVwRXhwb3J0cztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIGZldGNoOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mZXRjaGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5mZXRjaGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LnN0YXJ0VGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1hcCA9IHRoaXMubWFwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vSWYgdGhlIG1hbmFnZXIgaXMgZm9yIGEgcGx1Z2luIG1hbmFnZWQgcmVzb3VyY2UsXHJcbiAgICAgICAgICAgICAgICAvL2FzayB0aGUgcGx1Z2luIHRvIGxvYWQgaXQgbm93LlxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2hpbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQubWFrZVJlcXVpcmUodGhpcy5tYXAsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlQnVpbGRDYWxsYmFjazogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pKHRoaXMuc2hpbS5kZXBzIHx8IFtdLCBiaW5kKHRoaXMsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hcC5wcmVmaXggPyB0aGlzLmNhbGxQbHVnaW4oKSA6IHRoaXMubG9hZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9SZWd1bGFyIGRlcGVuZGVuY3kuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hcC5wcmVmaXggPyB0aGlzLmNhbGxQbHVnaW4oKSA6IHRoaXMubG9hZCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgbG9hZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHVybCA9IHRoaXMubWFwLnVybDtcclxuXHJcbiAgICAgICAgICAgICAgICAvL1JlZ3VsYXIgZGVwZW5kZW5jeS5cclxuICAgICAgICAgICAgICAgIGlmICghdXJsRmV0Y2hlZFt1cmxdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXJsRmV0Y2hlZFt1cmxdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmxvYWQodGhpcy5tYXAuaWQsIHVybCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQ2hlY2tzIGlmIHRoZSBtb2R1bGUgaXMgcmVhZHkgdG8gZGVmaW5lIGl0c2VsZiwgYW5kIGlmIHNvLFxyXG4gICAgICAgICAgICAgKiBkZWZpbmUgaXQuXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjaGVjazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQgfHwgdGhpcy5lbmFibGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZXJyLCBjanNNb2R1bGUsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQgPSB0aGlzLm1hcC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBkZXBFeHBvcnRzID0gdGhpcy5kZXBFeHBvcnRzLFxyXG4gICAgICAgICAgICAgICAgICAgIGV4cG9ydHMgPSB0aGlzLmV4cG9ydHMsXHJcbiAgICAgICAgICAgICAgICAgICAgZmFjdG9yeSA9IHRoaXMuZmFjdG9yeTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaW5pdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gT25seSBmZXRjaCBpZiBub3QgYWxyZWFkeSBpbiB0aGUgZGVmUXVldWUuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFoYXNQcm9wKGNvbnRleHQuZGVmUXVldWVNYXAsIGlkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZldGNoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdlcnJvcicsIHRoaXMuZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5kZWZpbmluZykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vVGhlIGZhY3RvcnkgY291bGQgdHJpZ2dlciBhbm90aGVyIHJlcXVpcmUgY2FsbFxyXG4gICAgICAgICAgICAgICAgICAgIC8vdGhhdCB3b3VsZCByZXN1bHQgaW4gY2hlY2tpbmcgdGhpcyBtb2R1bGUgdG9cclxuICAgICAgICAgICAgICAgICAgICAvL2RlZmluZSBpdHNlbGYgYWdhaW4uIElmIGFscmVhZHkgaW4gdGhlIHByb2Nlc3NcclxuICAgICAgICAgICAgICAgICAgICAvL29mIGRvaW5nIHRoYXQsIHNraXAgdGhpcyB3b3JrLlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGVmaW5pbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kZXBDb3VudCA8IDEgJiYgIXRoaXMuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihmYWN0b3J5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9JZiB0aGVyZSBpcyBhbiBlcnJvciBsaXN0ZW5lciwgZmF2b3IgcGFzc2luZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy90byB0aGF0IGluc3RlYWQgb2YgdGhyb3dpbmcgYW4gZXJyb3IuIEhvd2V2ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL29ubHkgZG8gaXQgZm9yIGRlZmluZSgpJ2QgIG1vZHVsZXMuIHJlcXVpcmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZXJyYmFja3Mgc2hvdWxkIG5vdCBiZSBjYWxsZWQgZm9yIGZhaWx1cmVzIGluXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3RoZWlyIGNhbGxiYWNrcyAoIzY5OSkuIEhvd2V2ZXIgaWYgYSBnbG9iYWxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vb25FcnJvciBpcyBzZXQsIHVzZSB0aGF0LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCh0aGlzLmV2ZW50cy5lcnJvciAmJiB0aGlzLm1hcC5pc0RlZmluZSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEub25FcnJvciAhPT0gZGVmYXVsdE9uRXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRzID0gY29udGV4dC5leGVjQ2IoaWQsIGZhY3RvcnksIGRlcEV4cG9ydHMsIGV4cG9ydHMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyID0gZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydHMgPSBjb250ZXh0LmV4ZWNDYihpZCwgZmFjdG9yeSwgZGVwRXhwb3J0cywgZXhwb3J0cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmF2b3IgcmV0dXJuIHZhbHVlIG92ZXIgZXhwb3J0cy4gSWYgbm9kZS9janMgaW4gcGxheSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZW4gd2lsbCBub3QgaGF2ZSBhIHJldHVybiB2YWx1ZSBhbnl3YXkuIEZhdm9yXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBtb2R1bGUuZXhwb3J0cyBhc3NpZ25tZW50IG92ZXIgZXhwb3J0cyBvYmplY3QuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5tYXAuaXNEZWZpbmUgJiYgZXhwb3J0cyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2pzTW9kdWxlID0gdGhpcy5tb2R1bGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNqc01vZHVsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRzID0gY2pzTW9kdWxlLmV4cG9ydHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnVzaW5nRXhwb3J0cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2V4cG9ydHMgYWxyZWFkeSBzZXQgdGhlIGRlZmluZWQgdmFsdWUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydHMgPSB0aGlzLmV4cG9ydHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnIucmVxdWlyZU1hcCA9IHRoaXMubWFwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVyci5yZXF1aXJlTW9kdWxlcyA9IHRoaXMubWFwLmlzRGVmaW5lID8gW3RoaXMubWFwLmlkXSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyLnJlcXVpcmVUeXBlID0gdGhpcy5tYXAuaXNEZWZpbmUgPyAnZGVmaW5lJyA6ICdyZXF1aXJlJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb25FcnJvcigodGhpcy5lcnJvciA9IGVycikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vSnVzdCBhIGxpdGVyYWwgdmFsdWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydHMgPSBmYWN0b3J5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cG9ydHMgPSBleHBvcnRzO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubWFwLmlzRGVmaW5lICYmICF0aGlzLmlnbm9yZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5lZFtpZF0gPSBleHBvcnRzO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXEub25SZXNvdXJjZUxvYWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzTG9hZE1hcHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYWNoKHRoaXMuZGVwTWFwcywgZnVuY3Rpb24gKGRlcE1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNMb2FkTWFwcy5wdXNoKGRlcE1hcC5ub3JtYWxpemVkTWFwIHx8IGRlcE1hcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uUmVzb3VyY2VMb2FkKGNvbnRleHQsIHRoaXMubWFwLCByZXNMb2FkTWFwcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vQ2xlYW4gdXBcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYW5SZWdpc3RyeShpZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlZmluZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy9GaW5pc2hlZCB0aGUgZGVmaW5lIHN0YWdlLiBBbGxvdyBjYWxsaW5nIGNoZWNrIGFnYWluXHJcbiAgICAgICAgICAgICAgICAgICAgLy90byBhbGxvdyBkZWZpbmUgbm90aWZpY2F0aW9ucyBiZWxvdyBpbiB0aGUgY2FzZSBvZiBhXHJcbiAgICAgICAgICAgICAgICAgICAgLy9jeWNsZS5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlZmluaW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRlZmluZWQgJiYgIXRoaXMuZGVmaW5lRW1pdHRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlZmluZUVtaXR0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2RlZmluZWQnLCB0aGlzLmV4cG9ydHMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlZmluZUVtaXRDb21wbGV0ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIGNhbGxQbHVnaW46IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBtYXAgPSB0aGlzLm1hcCxcclxuICAgICAgICAgICAgICAgICAgICBpZCA9IG1hcC5pZCxcclxuICAgICAgICAgICAgICAgICAgICAvL01hcCBhbHJlYWR5IG5vcm1hbGl6ZWQgdGhlIHByZWZpeC5cclxuICAgICAgICAgICAgICAgICAgICBwbHVnaW5NYXAgPSBtYWtlTW9kdWxlTWFwKG1hcC5wcmVmaXgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vTWFyayB0aGlzIGFzIGEgZGVwZW5kZW5jeSBmb3IgdGhpcyBwbHVnaW4sIHNvIGl0XHJcbiAgICAgICAgICAgICAgICAvL2NhbiBiZSB0cmFjZWQgZm9yIGN5Y2xlcy5cclxuICAgICAgICAgICAgICAgIHRoaXMuZGVwTWFwcy5wdXNoKHBsdWdpbk1hcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgb24ocGx1Z2luTWFwLCAnZGVmaW5lZCcsIGJpbmQodGhpcywgZnVuY3Rpb24gKHBsdWdpbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2FkLCBub3JtYWxpemVkTWFwLCBub3JtYWxpemVkTW9kLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBidW5kbGVJZCA9IGdldE93bihidW5kbGVzTWFwLCB0aGlzLm1hcC5pZCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPSB0aGlzLm1hcC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnROYW1lID0gdGhpcy5tYXAucGFyZW50TWFwID8gdGhpcy5tYXAucGFyZW50TWFwLm5hbWUgOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFJlcXVpcmUgPSBjb250ZXh0Lm1ha2VSZXF1aXJlKG1hcC5wYXJlbnRNYXAsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZUJ1aWxkQ2FsbGJhY2s6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vSWYgY3VycmVudCBtYXAgaXMgbm90IG5vcm1hbGl6ZWQsIHdhaXQgZm9yIHRoYXRcclxuICAgICAgICAgICAgICAgICAgICAvL25vcm1hbGl6ZWQgbmFtZSB0byBsb2FkIGluc3RlYWQgb2YgY29udGludWluZy5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5tYXAudW5ub3JtYWxpemVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vTm9ybWFsaXplIHRoZSBJRCBpZiB0aGUgcGx1Z2luIGFsbG93cyBpdC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBsdWdpbi5ub3JtYWxpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPSBwbHVnaW4ubm9ybWFsaXplKG5hbWUsIGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZShuYW1lLCBwYXJlbnROYW1lLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pIHx8ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3ByZWZpeCBhbmQgbmFtZSBzaG91bGQgYWxyZWFkeSBiZSBub3JtYWxpemVkLCBubyBuZWVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZm9yIGFwcGx5aW5nIG1hcCBjb25maWcgYWdhaW4gZWl0aGVyLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkTWFwID0gbWFrZU1vZHVsZU1hcChtYXAucHJlZml4ICsgJyEnICsgbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXAucGFyZW50TWFwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb24obm9ybWFsaXplZE1hcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkZWZpbmVkJywgYmluZCh0aGlzLCBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1hcC5ub3JtYWxpemVkTWFwID0gbm9ybWFsaXplZE1hcDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluaXQoW10sIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZhbHVlOyB9LCBudWxsLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZE1vZCA9IGdldE93bihyZWdpc3RyeSwgbm9ybWFsaXplZE1hcC5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub3JtYWxpemVkTW9kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL01hcmsgdGhpcyBhcyBhIGRlcGVuZGVuY3kgZm9yIHRoaXMgcGx1Z2luLCBzbyBpdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jYW4gYmUgdHJhY2VkIGZvciBjeWNsZXMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlcE1hcHMucHVzaChub3JtYWxpemVkTWFwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5ldmVudHMuZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkTW9kLm9uKCdlcnJvcicsIGJpbmQodGhpcywgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkTW9kLmVuYWJsZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvL0lmIGEgcGF0aHMgY29uZmlnLCB0aGVuIGp1c3QgbG9hZCB0aGF0IGZpbGUgaW5zdGVhZCB0b1xyXG4gICAgICAgICAgICAgICAgICAgIC8vcmVzb2x2ZSB0aGUgcGx1Z2luLCBhcyBpdCBpcyBidWlsdCBpbnRvIHRoYXQgcGF0aHMgbGF5ZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJ1bmRsZUlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFwLnVybCA9IGNvbnRleHQubmFtZVRvVXJsKGJ1bmRsZUlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxvYWQgPSBiaW5kKHRoaXMsIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluaXQoW10sIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZhbHVlOyB9LCBudWxsLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsb2FkLmVycm9yID0gYmluZCh0aGlzLCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5pdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lcnJvciA9IGVycjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyLnJlcXVpcmVNb2R1bGVzID0gW2lkXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vUmVtb3ZlIHRlbXAgdW5ub3JtYWxpemVkIG1vZHVsZXMgZm9yIHRoaXMgbW9kdWxlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3NpbmNlIHRoZXkgd2lsbCBuZXZlciBiZSByZXNvbHZlZCBvdGhlcndpc2Ugbm93LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlYWNoUHJvcChyZWdpc3RyeSwgZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1vZC5tYXAuaWQuaW5kZXhPZihpZCArICdfdW5ub3JtYWxpemVkJykgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhblJlZ2lzdHJ5KG1vZC5tYXAuaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRXJyb3IoZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy9BbGxvdyBwbHVnaW5zIHRvIGxvYWQgb3RoZXIgY29kZSB3aXRob3V0IGhhdmluZyB0byBrbm93IHRoZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vY29udGV4dCBvciBob3cgdG8gJ2NvbXBsZXRlJyB0aGUgbG9hZC5cclxuICAgICAgICAgICAgICAgICAgICBsb2FkLmZyb21UZXh0ID0gYmluZCh0aGlzLCBmdW5jdGlvbiAodGV4dCwgdGV4dEFsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKmpzbGludCBldmlsOiB0cnVlICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb2R1bGVOYW1lID0gbWFwLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVNYXAgPSBtYWtlTW9kdWxlTWFwKG1vZHVsZU5hbWUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzSW50ZXJhY3RpdmUgPSB1c2VJbnRlcmFjdGl2ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vQXMgb2YgMi4xLjAsIHN1cHBvcnQganVzdCBwYXNzaW5nIHRoZSB0ZXh0LCB0byByZWluZm9yY2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9mcm9tVGV4dCBvbmx5IGJlaW5nIGNhbGxlZCBvbmNlIHBlciByZXNvdXJjZS4gU3RpbGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9zdXBwb3J0IG9sZCBzdHlsZSBvZiBwYXNzaW5nIG1vZHVsZU5hbWUgYnV0IGRpc2NhcmRcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy90aGF0IG1vZHVsZU5hbWUgaW4gZmF2b3Igb2YgdGhlIGludGVybmFsIHJlZi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRleHRBbHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0QWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1R1cm4gb2ZmIGludGVyYWN0aXZlIHNjcmlwdCBtYXRjaGluZyBmb3IgSUUgZm9yIGFueSBkZWZpbmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jYWxscyBpbiB0aGUgdGV4dCwgdGhlbiB0dXJuIGl0IGJhY2sgb24gYXQgdGhlIGVuZC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0ludGVyYWN0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VJbnRlcmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1ByaW1lIHRoZSBzeXN0ZW0gYnkgY3JlYXRpbmcgYSBtb2R1bGUgaW5zdGFuY2UgZm9yXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vaXQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldE1vZHVsZShtb2R1bGVNYXApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9UcmFuc2ZlciBhbnkgY29uZmlnIHRvIHRoaXMgb3RoZXIgbW9kdWxlLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzUHJvcChjb25maWcuY29uZmlnLCBpZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5jb25maWdbbW9kdWxlTmFtZV0gPSBjb25maWcuY29uZmlnW2lkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5leGVjKHRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb25FcnJvcihtYWtlRXJyb3IoJ2Zyb210ZXh0ZXZhbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmcm9tVGV4dCBldmFsIGZvciAnICsgaWQgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgZmFpbGVkOiAnICsgZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW2lkXSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzSW50ZXJhY3RpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZUludGVyYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9NYXJrIHRoaXMgYXMgYSBkZXBlbmRlbmN5IGZvciB0aGUgcGx1Z2luXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vcmVzb3VyY2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXBNYXBzLnB1c2gobW9kdWxlTWFwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vU3VwcG9ydCBhbm9ueW1vdXMgbW9kdWxlcy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5jb21wbGV0ZUxvYWQobW9kdWxlTmFtZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL0JpbmQgdGhlIHZhbHVlIG9mIHRoYXQgbW9kdWxlIHRvIHRoZSB2YWx1ZSBmb3IgdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3Jlc291cmNlIElELlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFJlcXVpcmUoW21vZHVsZU5hbWVdLCBsb2FkKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy9Vc2UgcGFyZW50TmFtZSBoZXJlIHNpbmNlIHRoZSBwbHVnaW4ncyBuYW1lIGlzIG5vdCByZWxpYWJsZSxcclxuICAgICAgICAgICAgICAgICAgICAvL2NvdWxkIGJlIHNvbWUgd2VpcmQgc3RyaW5nIHdpdGggbm8gcGF0aCB0aGF0IGFjdHVhbGx5IHdhbnRzIHRvXHJcbiAgICAgICAgICAgICAgICAgICAgLy9yZWZlcmVuY2UgdGhlIHBhcmVudE5hbWUncyBwYXRoLlxyXG4gICAgICAgICAgICAgICAgICAgIHBsdWdpbi5sb2FkKG1hcC5uYW1lLCBsb2NhbFJlcXVpcmUsIGxvYWQsIGNvbmZpZyk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5lbmFibGUocGx1Z2luTWFwLCB0aGlzKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luTWFwc1twbHVnaW5NYXAuaWRdID0gcGx1Z2luTWFwO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgZW5hYmxlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBlbmFibGVkUmVnaXN0cnlbdGhpcy5tYXAuaWRdID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHRoaXMuZW5hYmxlZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9TZXQgZmxhZyBtZW50aW9uaW5nIHRoYXQgdGhlIG1vZHVsZSBpcyBlbmFibGluZyxcclxuICAgICAgICAgICAgICAgIC8vc28gdGhhdCBpbW1lZGlhdGUgY2FsbHMgdG8gdGhlIGRlZmluZWQgY2FsbGJhY2tzXHJcbiAgICAgICAgICAgICAgICAvL2ZvciBkZXBlbmRlbmNpZXMgZG8gbm90IHRyaWdnZXIgaW5hZHZlcnRlbnQgbG9hZFxyXG4gICAgICAgICAgICAgICAgLy93aXRoIHRoZSBkZXBDb3VudCBzdGlsbCBiZWluZyB6ZXJvLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbmFibGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9FbmFibGUgZWFjaCBkZXBlbmRlbmN5XHJcbiAgICAgICAgICAgICAgICBlYWNoKHRoaXMuZGVwTWFwcywgYmluZCh0aGlzLCBmdW5jdGlvbiAoZGVwTWFwLCBpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlkLCBtb2QsIGhhbmRsZXI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZGVwTWFwID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL0RlcGVuZGVuY3kgbmVlZHMgdG8gYmUgY29udmVydGVkIHRvIGEgZGVwTWFwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYW5kIHdpcmVkIHVwIHRvIHRoaXMgbW9kdWxlLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBNYXAgPSBtYWtlTW9kdWxlTWFwKGRlcE1hcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodGhpcy5tYXAuaXNEZWZpbmUgPyB0aGlzLm1hcCA6IHRoaXMubWFwLnBhcmVudE1hcCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIXRoaXMuc2tpcE1hcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGVwTWFwc1tpXSA9IGRlcE1hcDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBnZXRPd24oaGFuZGxlcnMsIGRlcE1hcC5pZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFuZGxlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXBFeHBvcnRzW2ldID0gaGFuZGxlcih0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXBDb3VudCArPSAxO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgb24oZGVwTWFwLCAnZGVmaW5lZCcsIGJpbmQodGhpcywgZnVuY3Rpb24gKGRlcEV4cG9ydHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnVuZGVmZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlZmluZURlcChpLCBkZXBFeHBvcnRzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2soKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZXJyYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb24oZGVwTWFwLCAnZXJyb3InLCBiaW5kKHRoaXMsIHRoaXMuZXJyYmFjaykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZXZlbnRzLmVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBkaXJlY3QgZXJyYmFjayBvbiB0aGlzIG1vZHVsZSwgYnV0IHNvbWV0aGluZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWxzZSBpcyBsaXN0ZW5pbmcgZm9yIGVycm9ycywgc28gYmUgc3VyZSB0b1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJvcGFnYXRlIHRoZSBlcnJvciBjb3JyZWN0bHkuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbihkZXBNYXAsICdlcnJvcicsIGJpbmQodGhpcywgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdlcnJvcicsIGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlkID0gZGVwTWFwLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZCA9IHJlZ2lzdHJ5W2lkXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy9Ta2lwIHNwZWNpYWwgbW9kdWxlcyBsaWtlICdyZXF1aXJlJywgJ2V4cG9ydHMnLCAnbW9kdWxlJ1xyXG4gICAgICAgICAgICAgICAgICAgIC8vQWxzbywgZG9uJ3QgY2FsbCBlbmFibGUgaWYgaXQgaXMgYWxyZWFkeSBlbmFibGVkLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vaW1wb3J0YW50IGluIGNpcmN1bGFyIGRlcGVuZGVuY3kgY2FzZXMuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFoYXNQcm9wKGhhbmRsZXJzLCBpZCkgJiYgbW9kICYmICFtb2QuZW5hYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmVuYWJsZShkZXBNYXAsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL0VuYWJsZSBlYWNoIHBsdWdpbiB0aGF0IGlzIHVzZWQgaW5cclxuICAgICAgICAgICAgICAgIC8vYSBkZXBlbmRlbmN5XHJcbiAgICAgICAgICAgICAgICBlYWNoUHJvcCh0aGlzLnBsdWdpbk1hcHMsIGJpbmQodGhpcywgZnVuY3Rpb24gKHBsdWdpbk1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtb2QgPSBnZXRPd24ocmVnaXN0cnksIHBsdWdpbk1hcC5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vZCAmJiAhbW9kLmVuYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5lbmFibGUocGx1Z2luTWFwLCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbmFibGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2soKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9uOiBmdW5jdGlvbiAobmFtZSwgY2IpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjYnMgPSB0aGlzLmV2ZW50c1tuYW1lXTtcclxuICAgICAgICAgICAgICAgIGlmICghY2JzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2JzID0gdGhpcy5ldmVudHNbbmFtZV0gPSBbXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNicy5wdXNoKGNiKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIGVtaXQ6IGZ1bmN0aW9uIChuYW1lLCBldnQpIHtcclxuICAgICAgICAgICAgICAgIGVhY2godGhpcy5ldmVudHNbbmFtZV0sIGZ1bmN0aW9uIChjYikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNiKGV2dCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9Ob3cgdGhhdCB0aGUgZXJyb3IgaGFuZGxlciB3YXMgdHJpZ2dlcmVkLCByZW1vdmVcclxuICAgICAgICAgICAgICAgICAgICAvL3RoZSBsaXN0ZW5lcnMsIHNpbmNlIHRoaXMgYnJva2VuIE1vZHVsZSBpbnN0YW5jZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vY2FuIHN0YXkgYXJvdW5kIGZvciBhIHdoaWxlIGluIHRoZSByZWdpc3RyeS5cclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5ldmVudHNbbmFtZV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBjYWxsR2V0TW9kdWxlKGFyZ3MpIHtcclxuICAgICAgICAgICAgLy9Ta2lwIG1vZHVsZXMgYWxyZWFkeSBkZWZpbmVkLlxyXG4gICAgICAgICAgICBpZiAoIWhhc1Byb3AoZGVmaW5lZCwgYXJnc1swXSkpIHtcclxuICAgICAgICAgICAgICAgIGdldE1vZHVsZShtYWtlTW9kdWxlTWFwKGFyZ3NbMF0sIG51bGwsIHRydWUpKS5pbml0KGFyZ3NbMV0sIGFyZ3NbMl0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihub2RlLCBmdW5jLCBuYW1lLCBpZU5hbWUpIHtcclxuICAgICAgICAgICAgLy9GYXZvciBkZXRhY2hFdmVudCBiZWNhdXNlIG9mIElFOVxyXG4gICAgICAgICAgICAvL2lzc3VlLCBzZWUgYXR0YWNoRXZlbnQvYWRkRXZlbnRMaXN0ZW5lciBjb21tZW50IGVsc2V3aGVyZVxyXG4gICAgICAgICAgICAvL2luIHRoaXMgZmlsZS5cclxuICAgICAgICAgICAgaWYgKG5vZGUuZGV0YWNoRXZlbnQgJiYgIWlzT3BlcmEpIHtcclxuICAgICAgICAgICAgICAgIC8vUHJvYmFibHkgSUUuIElmIG5vdCBpdCB3aWxsIHRocm93IGFuIGVycm9yLCB3aGljaCB3aWxsIGJlXHJcbiAgICAgICAgICAgICAgICAvL3VzZWZ1bCB0byBrbm93LlxyXG4gICAgICAgICAgICAgICAgaWYgKGllTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZGV0YWNoRXZlbnQoaWVOYW1lLCBmdW5jKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBmdW5jLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEdpdmVuIGFuIGV2ZW50IGZyb20gYSBzY3JpcHQgbm9kZSwgZ2V0IHRoZSByZXF1aXJlanMgaW5mbyBmcm9tIGl0LFxyXG4gICAgICAgICAqIGFuZCB0aGVuIHJlbW92ZXMgdGhlIGV2ZW50IGxpc3RlbmVycyBvbiB0aGUgbm9kZS5cclxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50fSBldnRcclxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIGdldFNjcmlwdERhdGEoZXZ0KSB7XHJcbiAgICAgICAgICAgIC8vVXNpbmcgY3VycmVudFRhcmdldCBpbnN0ZWFkIG9mIHRhcmdldCBmb3IgRmlyZWZveCAyLjAncyBzYWtlLiBOb3RcclxuICAgICAgICAgICAgLy9hbGwgb2xkIGJyb3dzZXJzIHdpbGwgYmUgc3VwcG9ydGVkLCBidXQgdGhpcyBvbmUgd2FzIGVhc3kgZW5vdWdoXHJcbiAgICAgICAgICAgIC8vdG8gc3VwcG9ydCBhbmQgc3RpbGwgbWFrZXMgc2Vuc2UuXHJcbiAgICAgICAgICAgIHZhciBub2RlID0gZXZ0LmN1cnJlbnRUYXJnZXQgfHwgZXZ0LnNyY0VsZW1lbnQ7XHJcblxyXG4gICAgICAgICAgICAvL1JlbW92ZSB0aGUgbGlzdGVuZXJzIG9uY2UgaGVyZS5cclxuICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXIobm9kZSwgY29udGV4dC5vblNjcmlwdExvYWQsICdsb2FkJywgJ29ucmVhZHlzdGF0ZWNoYW5nZScpO1xyXG4gICAgICAgICAgICByZW1vdmVMaXN0ZW5lcihub2RlLCBjb250ZXh0Lm9uU2NyaXB0RXJyb3IsICdlcnJvcicpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIG5vZGU6IG5vZGUsXHJcbiAgICAgICAgICAgICAgICBpZDogbm9kZSAmJiBub2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1yZXF1aXJlbW9kdWxlJylcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGludGFrZURlZmluZXMoKSB7XHJcbiAgICAgICAgICAgIHZhciBhcmdzO1xyXG5cclxuICAgICAgICAgICAgLy9BbnkgZGVmaW5lZCBtb2R1bGVzIGluIHRoZSBnbG9iYWwgcXVldWUsIGludGFrZSB0aGVtIG5vdy5cclxuICAgICAgICAgICAgdGFrZUdsb2JhbFF1ZXVlKCk7XHJcblxyXG4gICAgICAgICAgICAvL01ha2Ugc3VyZSBhbnkgcmVtYWluaW5nIGRlZlF1ZXVlIGl0ZW1zIGdldCBwcm9wZXJseSBwcm9jZXNzZWQuXHJcbiAgICAgICAgICAgIHdoaWxlIChkZWZRdWV1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGFyZ3MgPSBkZWZRdWV1ZS5zaGlmdCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFyZ3NbMF0gPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb25FcnJvcihtYWtlRXJyb3IoJ21pc21hdGNoJywgJ01pc21hdGNoZWQgYW5vbnltb3VzIGRlZmluZSgpIG1vZHVsZTogJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbYXJncy5sZW5ndGggLSAxXSkpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvL2FyZ3MgYXJlIGlkLCBkZXBzLCBmYWN0b3J5LiBTaG91bGQgYmUgbm9ybWFsaXplZCBieSB0aGVcclxuICAgICAgICAgICAgICAgICAgICAvL2RlZmluZSgpIGZ1bmN0aW9uLlxyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxHZXRNb2R1bGUoYXJncyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29udGV4dC5kZWZRdWV1ZU1hcCA9IHt9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29udGV4dCA9IHtcclxuICAgICAgICAgICAgY29uZmlnOiBjb25maWcsXHJcbiAgICAgICAgICAgIGNvbnRleHROYW1lOiBjb250ZXh0TmFtZSxcclxuICAgICAgICAgICAgcmVnaXN0cnk6IHJlZ2lzdHJ5LFxyXG4gICAgICAgICAgICBkZWZpbmVkOiBkZWZpbmVkLFxyXG4gICAgICAgICAgICB1cmxGZXRjaGVkOiB1cmxGZXRjaGVkLFxyXG4gICAgICAgICAgICBkZWZRdWV1ZTogZGVmUXVldWUsXHJcbiAgICAgICAgICAgIGRlZlF1ZXVlTWFwOiB7fSxcclxuICAgICAgICAgICAgTW9kdWxlOiBNb2R1bGUsXHJcbiAgICAgICAgICAgIG1ha2VNb2R1bGVNYXA6IG1ha2VNb2R1bGVNYXAsXHJcbiAgICAgICAgICAgIG5leHRUaWNrOiByZXEubmV4dFRpY2ssXHJcbiAgICAgICAgICAgIG9uRXJyb3I6IG9uRXJyb3IsXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogU2V0IGEgY29uZmlndXJhdGlvbiBmb3IgdGhlIGNvbnRleHQuXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjZmcgY29uZmlnIG9iamVjdCB0byBpbnRlZ3JhdGUuXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjb25maWd1cmU6IGZ1bmN0aW9uIChjZmcpIHtcclxuICAgICAgICAgICAgICAgIC8vTWFrZSBzdXJlIHRoZSBiYXNlVXJsIGVuZHMgaW4gYSBzbGFzaC5cclxuICAgICAgICAgICAgICAgIGlmIChjZmcuYmFzZVVybCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjZmcuYmFzZVVybC5jaGFyQXQoY2ZnLmJhc2VVcmwubGVuZ3RoIC0gMSkgIT09ICcvJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjZmcuYmFzZVVybCArPSAnLyc7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIENvbnZlcnQgb2xkIHN0eWxlIHVybEFyZ3Mgc3RyaW5nIHRvIGEgZnVuY3Rpb24uXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNmZy51cmxBcmdzID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmxBcmdzID0gY2ZnLnVybEFyZ3M7XHJcbiAgICAgICAgICAgICAgICAgICAgY2ZnLnVybEFyZ3MgPSBmdW5jdGlvbihpZCwgdXJsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAodXJsLmluZGV4T2YoJz8nKSA9PT0gLTEgPyAnPycgOiAnJicpICsgdXJsQXJncztcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vU2F2ZSBvZmYgdGhlIHBhdGhzIHNpbmNlIHRoZXkgcmVxdWlyZSBzcGVjaWFsIHByb2Nlc3NpbmcsXHJcbiAgICAgICAgICAgICAgICAvL3RoZXkgYXJlIGFkZGl0aXZlLlxyXG4gICAgICAgICAgICAgICAgdmFyIHNoaW0gPSBjb25maWcuc2hpbSxcclxuICAgICAgICAgICAgICAgICAgICBvYmpzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnVuZGxlczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXA6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGVhY2hQcm9wKGNmZywgZnVuY3Rpb24gKHZhbHVlLCBwcm9wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9ianNbcHJvcF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjb25maWdbcHJvcF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ1twcm9wXSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1peGluKGNvbmZpZ1twcm9wXSwgdmFsdWUsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ1twcm9wXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vUmV2ZXJzZSBtYXAgdGhlIGJ1bmRsZXNcclxuICAgICAgICAgICAgICAgIGlmIChjZmcuYnVuZGxlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGVhY2hQcm9wKGNmZy5idW5kbGVzLCBmdW5jdGlvbiAodmFsdWUsIHByb3ApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWFjaCh2YWx1ZSwgZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ICE9PSBwcm9wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVuZGxlc01hcFt2XSA9IHByb3A7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vTWVyZ2Ugc2hpbVxyXG4gICAgICAgICAgICAgICAgaWYgKGNmZy5zaGltKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWFjaFByb3AoY2ZnLnNoaW0sIGZ1bmN0aW9uICh2YWx1ZSwgaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9Ob3JtYWxpemUgdGhlIHN0cnVjdHVyZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcHM6IHZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgodmFsdWUuZXhwb3J0cyB8fCB2YWx1ZS5pbml0KSAmJiAhdmFsdWUuZXhwb3J0c0ZuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS5leHBvcnRzRm4gPSBjb250ZXh0Lm1ha2VTaGltRXhwb3J0cyh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hpbVtpZF0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBjb25maWcuc2hpbSA9IHNoaW07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy9BZGp1c3QgcGFja2FnZXMgaWYgbmVjZXNzYXJ5LlxyXG4gICAgICAgICAgICAgICAgaWYgKGNmZy5wYWNrYWdlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGVhY2goY2ZnLnBhY2thZ2VzLCBmdW5jdGlvbiAocGtnT2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbiwgbmFtZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBrZ09iaiA9IHR5cGVvZiBwa2dPYmogPT09ICdzdHJpbmcnID8ge25hbWU6IHBrZ09ian0gOiBwa2dPYmo7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lID0gcGtnT2JqLm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uID0gcGtnT2JqLmxvY2F0aW9uO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9jYXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5wYXRoc1tuYW1lXSA9IHBrZ09iai5sb2NhdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9TYXZlIHBvaW50ZXIgdG8gbWFpbiBtb2R1bGUgSUQgZm9yIHBrZyBuYW1lLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1JlbW92ZSBsZWFkaW5nIGRvdCBpbiBtYWluLCBzbyBtYWluIHBhdGhzIGFyZSBub3JtYWxpemVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2FuZCByZW1vdmUgYW55IHRyYWlsaW5nIC5qcywgc2luY2UgZGlmZmVyZW50IHBhY2thZ2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9lbnZzIGhhdmUgZGlmZmVyZW50IGNvbnZlbnRpb25zOiBzb21lIHVzZSBhIG1vZHVsZSBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3NvbWUgdXNlIGEgZmlsZSBuYW1lLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWcucGtnc1tuYW1lXSA9IHBrZ09iai5uYW1lICsgJy8nICsgKHBrZ09iai5tYWluIHx8ICdtYWluJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKGN1cnJEaXJSZWdFeHAsICcnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoanNTdWZmaXhSZWdFeHAsICcnKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvL0lmIHRoZXJlIGFyZSBhbnkgXCJ3YWl0aW5nIHRvIGV4ZWN1dGVcIiBtb2R1bGVzIGluIHRoZSByZWdpc3RyeSxcclxuICAgICAgICAgICAgICAgIC8vdXBkYXRlIHRoZSBtYXBzIGZvciB0aGVtLCBzaW5jZSB0aGVpciBpbmZvLCBsaWtlIFVSTHMgdG8gbG9hZCxcclxuICAgICAgICAgICAgICAgIC8vbWF5IGhhdmUgY2hhbmdlZC5cclxuICAgICAgICAgICAgICAgIGVhY2hQcm9wKHJlZ2lzdHJ5LCBmdW5jdGlvbiAobW9kLCBpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vSWYgbW9kdWxlIGFscmVhZHkgaGFzIGluaXQgY2FsbGVkLCBzaW5jZSBpdCBpcyB0b29cclxuICAgICAgICAgICAgICAgICAgICAvL2xhdGUgdG8gbW9kaWZ5IHRoZW0sIGFuZCBpZ25vcmUgdW5ub3JtYWxpemVkIG9uZXNcclxuICAgICAgICAgICAgICAgICAgICAvL3NpbmNlIHRoZXkgYXJlIHRyYW5zaWVudC5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1vZC5pbml0ZWQgJiYgIW1vZC5tYXAudW5ub3JtYWxpemVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZC5tYXAgPSBtYWtlTW9kdWxlTWFwKGlkLCBudWxsLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL0lmIGEgZGVwcyBhcnJheSBvciBhIGNvbmZpZyBjYWxsYmFjayBpcyBzcGVjaWZpZWQsIHRoZW4gY2FsbFxyXG4gICAgICAgICAgICAgICAgLy9yZXF1aXJlIHdpdGggdGhvc2UgYXJncy4gVGhpcyBpcyB1c2VmdWwgd2hlbiByZXF1aXJlIGlzIGRlZmluZWQgYXMgYVxyXG4gICAgICAgICAgICAgICAgLy9jb25maWcgb2JqZWN0IGJlZm9yZSByZXF1aXJlLmpzIGlzIGxvYWRlZC5cclxuICAgICAgICAgICAgICAgIGlmIChjZmcuZGVwcyB8fCBjZmcuY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlcXVpcmUoY2ZnLmRlcHMgfHwgW10sIGNmZy5jYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBtYWtlU2hpbUV4cG9ydHM6IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZm4oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJldDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUuaW5pdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXQgPSB2YWx1ZS5pbml0LmFwcGx5KGdsb2JhbCwgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldCB8fCAodmFsdWUuZXhwb3J0cyAmJiBnZXRHbG9iYWwodmFsdWUuZXhwb3J0cykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgbWFrZVJlcXVpcmU6IGZ1bmN0aW9uIChyZWxNYXAsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGxvY2FsUmVxdWlyZShkZXBzLCBjYWxsYmFjaywgZXJyYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpZCwgbWFwLCByZXF1aXJlTW9kO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5lbmFibGVCdWlsZENhbGxiYWNrICYmIGNhbGxiYWNrICYmIGlzRnVuY3Rpb24oY2FsbGJhY2spKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLl9fcmVxdWlyZUpzQnVpbGQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkZXBzID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihjYWxsYmFjaykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vSW52YWxpZCBjYWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb25FcnJvcihtYWtlRXJyb3IoJ3JlcXVpcmVhcmdzJywgJ0ludmFsaWQgcmVxdWlyZSBjYWxsJyksIGVycmJhY2spO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL0lmIHJlcXVpcmV8ZXhwb3J0c3xtb2R1bGUgYXJlIHJlcXVlc3RlZCwgZ2V0IHRoZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3ZhbHVlIGZvciB0aGVtIGZyb20gdGhlIHNwZWNpYWwgaGFuZGxlcnMuIENhdmVhdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy90aGlzIG9ubHkgd29ya3Mgd2hpbGUgbW9kdWxlIGlzIGJlaW5nIGRlZmluZWQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxNYXAgJiYgaGFzUHJvcChoYW5kbGVycywgZGVwcykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBoYW5kbGVyc1tkZXBzXShyZWdpc3RyeVtyZWxNYXAuaWRdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9TeW5jaHJvbm91cyBhY2Nlc3MgdG8gb25lIG1vZHVsZS4gSWYgcmVxdWlyZS5nZXQgaXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9hdmFpbGFibGUgKGFzIGluIHRoZSBOb2RlIGFkYXB0ZXIpLCBwcmVmZXIgdGhhdC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlcS5nZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXEuZ2V0KGNvbnRleHQsIGRlcHMsIHJlbE1hcCwgbG9jYWxSZXF1aXJlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9Ob3JtYWxpemUgbW9kdWxlIG5hbWUsIGlmIGl0IGNvbnRhaW5zIC4gb3IgLi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFwID0gbWFrZU1vZHVsZU1hcChkZXBzLCByZWxNYXAsIGZhbHNlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBtYXAuaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWhhc1Byb3AoZGVmaW5lZCwgaWQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb25FcnJvcihtYWtlRXJyb3IoJ25vdGxvYWRlZCcsICdNb2R1bGUgbmFtZSBcIicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1wiIGhhcyBub3QgYmVlbiBsb2FkZWQgeWV0IGZvciBjb250ZXh0OiAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHROYW1lICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChyZWxNYXAgPyAnJyA6ICcuIFVzZSByZXF1aXJlKFtdKScpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmluZWRbaWRdO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy9HcmFiIGRlZmluZXMgd2FpdGluZyBpbiB0aGUgZ2xvYmFsIHF1ZXVlLlxyXG4gICAgICAgICAgICAgICAgICAgIGludGFrZURlZmluZXMoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy9NYXJrIGFsbCB0aGUgZGVwZW5kZW5jaWVzIGFzIG5lZWRpbmcgdG8gYmUgbG9hZGVkLlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQubmV4dFRpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1NvbWUgZGVmaW5lcyBjb3VsZCBoYXZlIGJlZW4gYWRkZWQgc2luY2UgdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vcmVxdWlyZSBjYWxsLCBjb2xsZWN0IHRoZW0uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGludGFrZURlZmluZXMoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVNb2QgPSBnZXRNb2R1bGUobWFrZU1vZHVsZU1hcChudWxsLCByZWxNYXApKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vU3RvcmUgaWYgbWFwIGNvbmZpZyBzaG91bGQgYmUgYXBwbGllZCB0byB0aGlzIHJlcXVpcmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jYWxsIGZvciBkZXBlbmRlbmNpZXMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVNb2Quc2tpcE1hcCA9IG9wdGlvbnMuc2tpcE1hcDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVNb2QuaW5pdChkZXBzLCBjYWxsYmFjaywgZXJyYmFjaywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrTG9hZGVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbFJlcXVpcmU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbWl4aW4obG9jYWxSZXF1aXJlLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNCcm93c2VyOiBpc0Jyb3dzZXIsXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICAgICAqIENvbnZlcnRzIGEgbW9kdWxlIG5hbWUgKyAuZXh0ZW5zaW9uIGludG8gYW4gVVJMIHBhdGguXHJcbiAgICAgICAgICAgICAgICAgICAgICogKlJlcXVpcmVzKiB0aGUgdXNlIG9mIGEgbW9kdWxlIG5hbWUuIEl0IGRvZXMgbm90IHN1cHBvcnQgdXNpbmdcclxuICAgICAgICAgICAgICAgICAgICAgKiBwbGFpbiBVUkxzIGxpa2UgbmFtZVRvVXJsLlxyXG4gICAgICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgICAgIHRvVXJsOiBmdW5jdGlvbiAobW9kdWxlTmFtZVBsdXNFeHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gbW9kdWxlTmFtZVBsdXNFeHQubGFzdEluZGV4T2YoJy4nKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlZ21lbnQgPSBtb2R1bGVOYW1lUGx1c0V4dC5zcGxpdCgnLycpWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNSZWxhdGl2ZSA9IHNlZ21lbnQgPT09ICcuJyB8fCBzZWdtZW50ID09PSAnLi4nO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9IYXZlIGEgZmlsZSBleHRlbnNpb24gYWxpYXMsIGFuZCBpdCBpcyBub3QgdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZG90cyBmcm9tIGEgcmVsYXRpdmUgcGF0aC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSAmJiAoIWlzUmVsYXRpdmUgfHwgaW5kZXggPiAxKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ID0gbW9kdWxlTmFtZVBsdXNFeHQuc3Vic3RyaW5nKGluZGV4LCBtb2R1bGVOYW1lUGx1c0V4dC5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZVBsdXNFeHQgPSBtb2R1bGVOYW1lUGx1c0V4dC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5uYW1lVG9Vcmwobm9ybWFsaXplKG1vZHVsZU5hbWVQbHVzRXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxNYXAgJiYgcmVsTWFwLmlkLCB0cnVlKSwgZXh0LCAgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lZDogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBoYXNQcm9wKGRlZmluZWQsIG1ha2VNb2R1bGVNYXAoaWQsIHJlbE1hcCwgZmFsc2UsIHRydWUpLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBzcGVjaWZpZWQ6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IG1ha2VNb2R1bGVNYXAoaWQsIHJlbE1hcCwgZmFsc2UsIHRydWUpLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaGFzUHJvcChkZWZpbmVkLCBpZCkgfHwgaGFzUHJvcChyZWdpc3RyeSwgaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vT25seSBhbGxvdyB1bmRlZiBvbiB0b3AgbGV2ZWwgcmVxdWlyZSBjYWxsc1xyXG4gICAgICAgICAgICAgICAgaWYgKCFyZWxNYXApIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhbFJlcXVpcmUudW5kZWYgPSBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9CaW5kIGFueSB3YWl0aW5nIGRlZmluZSgpIGNhbGxzIHRvIHRoaXMgY29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9maXggZm9yICM0MDhcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFrZUdsb2JhbFF1ZXVlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFwID0gbWFrZU1vZHVsZU1hcChpZCwgcmVsTWFwLCB0cnVlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZCA9IGdldE93bihyZWdpc3RyeSwgaWQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kLnVuZGVmZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVTY3JpcHQoaWQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGRlZmluZWRbaWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdXJsRmV0Y2hlZFttYXAudXJsXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHVuZGVmRXZlbnRzW2lkXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vQ2xlYW4gcXVldWVkIGRlZmluZXMgdG9vLiBHbyBiYWNrd2FyZHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9pbiBhcnJheSBzbyB0aGF0IHRoZSBzcGxpY2VzIGRvIG5vdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL21lc3MgdXAgdGhlIGl0ZXJhdGlvbi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWFjaFJldmVyc2UoZGVmUXVldWUsIGZ1bmN0aW9uKGFyZ3MsIGkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmdzWzBdID09PSBpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZlF1ZXVlLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBjb250ZXh0LmRlZlF1ZXVlTWFwW2lkXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtb2QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vSG9sZCBvbiB0byBsaXN0ZW5lcnMgaW4gY2FzZSB0aGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbW9kdWxlIHdpbGwgYmUgYXR0ZW1wdGVkIHRvIGJlIHJlbG9hZGVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3VzaW5nIGEgZGlmZmVyZW50IGNvbmZpZy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtb2QuZXZlbnRzLmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZkV2ZW50c1tpZF0gPSBtb2QuZXZlbnRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFuUmVnaXN0cnkoaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9jYWxSZXF1aXJlO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIENhbGxlZCB0byBlbmFibGUgYSBtb2R1bGUgaWYgaXQgaXMgc3RpbGwgaW4gdGhlIHJlZ2lzdHJ5XHJcbiAgICAgICAgICAgICAqIGF3YWl0aW5nIGVuYWJsZW1lbnQuIEEgc2Vjb25kIGFyZywgcGFyZW50LCB0aGUgcGFyZW50IG1vZHVsZSxcclxuICAgICAgICAgICAgICogaXMgcGFzc2VkIGluIGZvciBjb250ZXh0LCB3aGVuIHRoaXMgbWV0aG9kIGlzIG92ZXJyaWRkZW4gYnlcclxuICAgICAgICAgICAgICogdGhlIG9wdGltaXplci4gTm90IHNob3duIGhlcmUgdG8ga2VlcCBjb2RlIGNvbXBhY3QuXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBlbmFibGU6IGZ1bmN0aW9uIChkZXBNYXApIHtcclxuICAgICAgICAgICAgICAgIHZhciBtb2QgPSBnZXRPd24ocmVnaXN0cnksIGRlcE1hcC5pZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAobW9kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0TW9kdWxlKGRlcE1hcCkuZW5hYmxlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogSW50ZXJuYWwgbWV0aG9kIHVzZWQgYnkgZW52aXJvbm1lbnQgYWRhcHRlcnMgdG8gY29tcGxldGUgYSBsb2FkIGV2ZW50LlxyXG4gICAgICAgICAgICAgKiBBIGxvYWQgZXZlbnQgY291bGQgYmUgYSBzY3JpcHQgbG9hZCBvciBqdXN0IGEgbG9hZCBwYXNzIGZyb20gYSBzeW5jaHJvbm91c1xyXG4gICAgICAgICAgICAgKiBsb2FkIGNhbGwuXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtb2R1bGVOYW1lIHRoZSBuYW1lIG9mIHRoZSBtb2R1bGUgdG8gcG90ZW50aWFsbHkgY29tcGxldGUuXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBjb21wbGV0ZUxvYWQ6IGZ1bmN0aW9uIChtb2R1bGVOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm91bmQsIGFyZ3MsIG1vZCxcclxuICAgICAgICAgICAgICAgICAgICBzaGltID0gZ2V0T3duKGNvbmZpZy5zaGltLCBtb2R1bGVOYW1lKSB8fCB7fSxcclxuICAgICAgICAgICAgICAgICAgICBzaEV4cG9ydHMgPSBzaGltLmV4cG9ydHM7XHJcblxyXG4gICAgICAgICAgICAgICAgdGFrZUdsb2JhbFF1ZXVlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGRlZlF1ZXVlLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBkZWZRdWV1ZS5zaGlmdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmdzWzBdID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbMF0gPSBtb2R1bGVOYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL0lmIGFscmVhZHkgZm91bmQgYW4gYW5vbnltb3VzIG1vZHVsZSBhbmQgYm91bmQgaXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy90byB0aGlzIG5hbWUsIHRoZW4gdGhpcyBpcyBzb21lIG90aGVyIGFub24gbW9kdWxlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vd2FpdGluZyBmb3IgaXRzIGNvbXBsZXRlTG9hZCB0byBmaXJlLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3NbMF0gPT09IG1vZHVsZU5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9Gb3VuZCBtYXRjaGluZyBkZWZpbmUgY2FsbCBmb3IgdGhpcyBzY3JpcHQhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxHZXRNb2R1bGUoYXJncyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmRlZlF1ZXVlTWFwID0ge307XHJcblxyXG4gICAgICAgICAgICAgICAgLy9EbyB0aGlzIGFmdGVyIHRoZSBjeWNsZSBvZiBjYWxsR2V0TW9kdWxlIGluIGNhc2UgdGhlIHJlc3VsdFxyXG4gICAgICAgICAgICAgICAgLy9vZiB0aG9zZSBjYWxscy9pbml0IGNhbGxzIGNoYW5nZXMgdGhlIHJlZ2lzdHJ5LlxyXG4gICAgICAgICAgICAgICAgbW9kID0gZ2V0T3duKHJlZ2lzdHJ5LCBtb2R1bGVOYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWZvdW5kICYmICFoYXNQcm9wKGRlZmluZWQsIG1vZHVsZU5hbWUpICYmIG1vZCAmJiAhbW9kLmluaXRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25maWcuZW5mb3JjZURlZmluZSAmJiAoIXNoRXhwb3J0cyB8fCAhZ2V0R2xvYmFsKHNoRXhwb3J0cykpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNQYXRoRmFsbGJhY2sobW9kdWxlTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvbkVycm9yKG1ha2VFcnJvcignbm9kZWZpbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnTm8gZGVmaW5lIGNhbGwgZm9yICcgKyBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbW9kdWxlTmFtZV0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vQSBzY3JpcHQgdGhhdCBkb2VzIG5vdCBjYWxsIGRlZmluZSgpLCBzbyBqdXN0IHNpbXVsYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdGhlIGNhbGwgZm9yIGl0LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsR2V0TW9kdWxlKFttb2R1bGVOYW1lLCAoc2hpbS5kZXBzIHx8IFtdKSwgc2hpbS5leHBvcnRzRm5dKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY2hlY2tMb2FkZWQoKTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBDb252ZXJ0cyBhIG1vZHVsZSBuYW1lIHRvIGEgZmlsZSBwYXRoLiBTdXBwb3J0cyBjYXNlcyB3aGVyZVxyXG4gICAgICAgICAgICAgKiBtb2R1bGVOYW1lIG1heSBhY3R1YWxseSBiZSBqdXN0IGFuIFVSTC5cclxuICAgICAgICAgICAgICogTm90ZSB0aGF0IGl0ICoqZG9lcyBub3QqKiBjYWxsIG5vcm1hbGl6ZSBvbiB0aGUgbW9kdWxlTmFtZSxcclxuICAgICAgICAgICAgICogaXQgaXMgYXNzdW1lZCB0byBoYXZlIGFscmVhZHkgYmVlbiBub3JtYWxpemVkLiBUaGlzIGlzIGFuXHJcbiAgICAgICAgICAgICAqIGludGVybmFsIEFQSSwgbm90IGEgcHVibGljIG9uZS4gVXNlIHRvVXJsIGZvciB0aGUgcHVibGljIEFQSS5cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIG5hbWVUb1VybDogZnVuY3Rpb24gKG1vZHVsZU5hbWUsIGV4dCwgc2tpcEV4dCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhdGhzLCBzeW1zLCBpLCBwYXJlbnRNb2R1bGUsIHVybCxcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnRQYXRoLCBidW5kbGVJZCxcclxuICAgICAgICAgICAgICAgICAgICBwa2dNYWluID0gZ2V0T3duKGNvbmZpZy5wa2dzLCBtb2R1bGVOYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocGtnTWFpbikge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUgPSBwa2dNYWluO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGJ1bmRsZUlkID0gZ2V0T3duKGJ1bmRsZXNNYXAsIG1vZHVsZU5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChidW5kbGVJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0Lm5hbWVUb1VybChidW5kbGVJZCwgZXh0LCBza2lwRXh0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvL0lmIGEgY29sb24gaXMgaW4gdGhlIFVSTCwgaXQgaW5kaWNhdGVzIGEgcHJvdG9jb2wgaXMgdXNlZCBhbmQgaXQgaXMganVzdFxyXG4gICAgICAgICAgICAgICAgLy9hbiBVUkwgdG8gYSBmaWxlLCBvciBpZiBpdCBzdGFydHMgd2l0aCBhIHNsYXNoLCBjb250YWlucyBhIHF1ZXJ5IGFyZyAoaS5lLiA/KVxyXG4gICAgICAgICAgICAgICAgLy9vciBlbmRzIHdpdGggLmpzLCB0aGVuIGFzc3VtZSB0aGUgdXNlciBtZWFudCB0byB1c2UgYW4gdXJsIGFuZCBub3QgYSBtb2R1bGUgaWQuXHJcbiAgICAgICAgICAgICAgICAvL1RoZSBzbGFzaCBpcyBpbXBvcnRhbnQgZm9yIHByb3RvY29sLWxlc3MgVVJMcyBhcyB3ZWxsIGFzIGZ1bGwgcGF0aHMuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVxLmpzRXh0UmVnRXhwLnRlc3QobW9kdWxlTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvL0p1c3QgYSBwbGFpbiBwYXRoLCBub3QgbW9kdWxlIG5hbWUgbG9va3VwLCBzbyBqdXN0IHJldHVybiBpdC5cclxuICAgICAgICAgICAgICAgICAgICAvL0FkZCBleHRlbnNpb24gaWYgaXQgaXMgaW5jbHVkZWQuIFRoaXMgaXMgYSBiaXQgd29ua3ksIG9ubHkgbm9uLS5qcyB0aGluZ3MgcGFzc1xyXG4gICAgICAgICAgICAgICAgICAgIC8vYW4gZXh0ZW5zaW9uLCB0aGlzIG1ldGhvZCBwcm9iYWJseSBuZWVkcyB0byBiZSByZXdvcmtlZC5cclxuICAgICAgICAgICAgICAgICAgICB1cmwgPSBtb2R1bGVOYW1lICsgKGV4dCB8fCAnJyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vQSBtb2R1bGUgdGhhdCBuZWVkcyB0byBiZSBjb252ZXJ0ZWQgdG8gYSBwYXRoLlxyXG4gICAgICAgICAgICAgICAgICAgIHBhdGhzID0gY29uZmlnLnBhdGhzO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzeW1zID0gbW9kdWxlTmFtZS5zcGxpdCgnLycpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vRm9yIGVhY2ggbW9kdWxlIG5hbWUgc2VnbWVudCwgc2VlIGlmIHRoZXJlIGlzIGEgcGF0aFxyXG4gICAgICAgICAgICAgICAgICAgIC8vcmVnaXN0ZXJlZCBmb3IgaXQuIFN0YXJ0IHdpdGggbW9zdCBzcGVjaWZpYyBuYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgLy9hbmQgd29yayB1cCBmcm9tIGl0LlxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IHN5bXMubGVuZ3RoOyBpID4gMDsgaSAtPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudE1vZHVsZSA9IHN5bXMuc2xpY2UoMCwgaSkuam9pbignLycpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50UGF0aCA9IGdldE93bihwYXRocywgcGFyZW50TW9kdWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudFBhdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vSWYgYW4gYXJyYXksIGl0IG1lYW5zIHRoZXJlIGFyZSBhIGZldyBjaG9pY2VzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9DaG9vc2UgdGhlIG9uZSB0aGF0IGlzIGRlc2lyZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0FycmF5KHBhcmVudFBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50UGF0aCA9IHBhcmVudFBhdGhbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeW1zLnNwbGljZSgwLCBpLCBwYXJlbnRQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvL0pvaW4gdGhlIHBhdGggcGFydHMgdG9nZXRoZXIsIHRoZW4gZmlndXJlIG91dCBpZiBiYXNlVXJsIGlzIG5lZWRlZC5cclxuICAgICAgICAgICAgICAgICAgICB1cmwgPSBzeW1zLmpvaW4oJy8nKTtcclxuICAgICAgICAgICAgICAgICAgICB1cmwgKz0gKGV4dCB8fCAoL15kYXRhXFw6fF5ibG9iXFw6fFxcPy8udGVzdCh1cmwpIHx8IHNraXBFeHQgPyAnJyA6ICcuanMnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdXJsID0gKHVybC5jaGFyQXQoMCkgPT09ICcvJyB8fCB1cmwubWF0Y2goL15bXFx3XFwrXFwuXFwtXSs6LykgPyAnJyA6IGNvbmZpZy5iYXNlVXJsKSArIHVybDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZmlnLnVybEFyZ3MgJiYgIS9eYmxvYlxcOi8udGVzdCh1cmwpID9cclxuICAgICAgICAgICAgICAgICAgICAgICB1cmwgKyBjb25maWcudXJsQXJncyhtb2R1bGVOYW1lLCB1cmwpIDogdXJsO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLy9EZWxlZ2F0ZXMgdG8gcmVxLmxvYWQuIEJyb2tlbiBvdXQgYXMgYSBzZXBhcmF0ZSBmdW5jdGlvbiB0b1xyXG4gICAgICAgICAgICAvL2FsbG93IG92ZXJyaWRpbmcgaW4gdGhlIG9wdGltaXplci5cclxuICAgICAgICAgICAgbG9hZDogZnVuY3Rpb24gKGlkLCB1cmwpIHtcclxuICAgICAgICAgICAgICAgIHJlcS5sb2FkKGNvbnRleHQsIGlkLCB1cmwpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEV4ZWN1dGVzIGEgbW9kdWxlIGNhbGxiYWNrIGZ1bmN0aW9uLiBCcm9rZW4gb3V0IGFzIGEgc2VwYXJhdGUgZnVuY3Rpb25cclxuICAgICAgICAgICAgICogc29sZWx5IHRvIGFsbG93IHRoZSBidWlsZCBzeXN0ZW0gdG8gc2VxdWVuY2UgdGhlIGZpbGVzIGluIHRoZSBidWlsdFxyXG4gICAgICAgICAgICAgKiBsYXllciBpbiB0aGUgcmlnaHQgc2VxdWVuY2UuXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwcml2YXRlXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBleGVjQ2I6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaywgYXJncywgZXhwb3J0cykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KGV4cG9ydHMsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIGNhbGxiYWNrIGZvciBzY3JpcHQgbG9hZHMsIHVzZWQgdG8gY2hlY2sgc3RhdHVzIG9mIGxvYWRpbmcuXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2dCB0aGUgZXZlbnQgZnJvbSB0aGUgYnJvd3NlciBmb3IgdGhlIHNjcmlwdFxyXG4gICAgICAgICAgICAgKiB0aGF0IHdhcyBsb2FkZWQuXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBvblNjcmlwdExvYWQ6IGZ1bmN0aW9uIChldnQpIHtcclxuICAgICAgICAgICAgICAgIC8vVXNpbmcgY3VycmVudFRhcmdldCBpbnN0ZWFkIG9mIHRhcmdldCBmb3IgRmlyZWZveCAyLjAncyBzYWtlLiBOb3RcclxuICAgICAgICAgICAgICAgIC8vYWxsIG9sZCBicm93c2VycyB3aWxsIGJlIHN1cHBvcnRlZCwgYnV0IHRoaXMgb25lIHdhcyBlYXN5IGVub3VnaFxyXG4gICAgICAgICAgICAgICAgLy90byBzdXBwb3J0IGFuZCBzdGlsbCBtYWtlcyBzZW5zZS5cclxuICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2xvYWQnIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChyZWFkeVJlZ0V4cC50ZXN0KChldnQuY3VycmVudFRhcmdldCB8fCBldnQuc3JjRWxlbWVudCkucmVhZHlTdGF0ZSkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9SZXNldCBpbnRlcmFjdGl2ZSBzY3JpcHQgc28gYSBzY3JpcHQgbm9kZSBpcyBub3QgaGVsZCBvbnRvIGZvclxyXG4gICAgICAgICAgICAgICAgICAgIC8vdG8gbG9uZy5cclxuICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdGl2ZVNjcmlwdCA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vUHVsbCBvdXQgdGhlIG5hbWUgb2YgdGhlIG1vZHVsZSBhbmQgdGhlIGNvbnRleHQuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBnZXRTY3JpcHREYXRhKGV2dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5jb21wbGV0ZUxvYWQoZGF0YS5pZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQ2FsbGJhY2sgZm9yIHNjcmlwdCBlcnJvcnMuXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBvblNjcmlwdEVycm9yOiBmdW5jdGlvbiAoZXZ0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IGdldFNjcmlwdERhdGEoZXZ0KTtcclxuICAgICAgICAgICAgICAgIGlmICghaGFzUGF0aEZhbGxiYWNrKGRhdGEuaWQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBlYWNoUHJvcChyZWdpc3RyeSwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5LmluZGV4T2YoJ19AcicpICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYWNoKHZhbHVlLmRlcE1hcHMsIGZ1bmN0aW9uKGRlcE1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZXBNYXAuaWQgPT09IGRhdGEuaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50cy5wdXNoKGtleSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9uRXJyb3IobWFrZUVycm9yKCdzY3JpcHRlcnJvcicsICdTY3JpcHQgZXJyb3IgZm9yIFwiJyArIGRhdGEuaWQgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAocGFyZW50cy5sZW5ndGggP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnXCIsIG5lZWRlZCBieTogJyArIHBhcmVudHMuam9pbignLCAnKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdcIicpLCBldnQsIFtkYXRhLmlkXSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29udGV4dC5yZXF1aXJlID0gY29udGV4dC5tYWtlUmVxdWlyZSgpO1xyXG4gICAgICAgIHJldHVybiBjb250ZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWFpbiBlbnRyeSBwb2ludC5cclxuICAgICAqXHJcbiAgICAgKiBJZiB0aGUgb25seSBhcmd1bWVudCB0byByZXF1aXJlIGlzIGEgc3RyaW5nLCB0aGVuIHRoZSBtb2R1bGUgdGhhdFxyXG4gICAgICogaXMgcmVwcmVzZW50ZWQgYnkgdGhhdCBzdHJpbmcgaXMgZmV0Y2hlZCBmb3IgdGhlIGFwcHJvcHJpYXRlIGNvbnRleHQuXHJcbiAgICAgKlxyXG4gICAgICogSWYgdGhlIGZpcnN0IGFyZ3VtZW50IGlzIGFuIGFycmF5LCB0aGVuIGl0IHdpbGwgYmUgdHJlYXRlZCBhcyBhbiBhcnJheVxyXG4gICAgICogb2YgZGVwZW5kZW5jeSBzdHJpbmcgbmFtZXMgdG8gZmV0Y2guIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIGNhbGxiYWNrIGNhblxyXG4gICAgICogYmUgc3BlY2lmaWVkIHRvIGV4ZWN1dGUgd2hlbiBhbGwgb2YgdGhvc2UgZGVwZW5kZW5jaWVzIGFyZSBhdmFpbGFibGUuXHJcbiAgICAgKlxyXG4gICAgICogTWFrZSBhIGxvY2FsIHJlcSB2YXJpYWJsZSB0byBoZWxwIENhamEgY29tcGxpYW5jZSAoaXQgYXNzdW1lcyB0aGluZ3NcclxuICAgICAqIG9uIGEgcmVxdWlyZSB0aGF0IGFyZSBub3Qgc3RhbmRhcmRpemVkKSwgYW5kIHRvIGdpdmUgYSBzaG9ydFxyXG4gICAgICogbmFtZSBmb3IgbWluaWZpY2F0aW9uL2xvY2FsIHNjb3BlIHVzZS5cclxuICAgICAqL1xyXG4gICAgcmVxID0gcmVxdWlyZWpzID0gZnVuY3Rpb24gKGRlcHMsIGNhbGxiYWNrLCBlcnJiYWNrLCBvcHRpb25hbCkge1xyXG5cclxuICAgICAgICAvL0ZpbmQgdGhlIHJpZ2h0IGNvbnRleHQsIHVzZSBkZWZhdWx0XHJcbiAgICAgICAgdmFyIGNvbnRleHQsIGNvbmZpZyxcclxuICAgICAgICAgICAgY29udGV4dE5hbWUgPSBkZWZDb250ZXh0TmFtZTtcclxuXHJcbiAgICAgICAgLy8gRGV0ZXJtaW5lIGlmIGhhdmUgY29uZmlnIG9iamVjdCBpbiB0aGUgY2FsbC5cclxuICAgICAgICBpZiAoIWlzQXJyYXkoZGVwcykgJiYgdHlwZW9mIGRlcHMgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIC8vIGRlcHMgaXMgYSBjb25maWcgb2JqZWN0XHJcbiAgICAgICAgICAgIGNvbmZpZyA9IGRlcHM7XHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gQWRqdXN0IGFyZ3MgaWYgdGhlcmUgYXJlIGRlcGVuZGVuY2llc1xyXG4gICAgICAgICAgICAgICAgZGVwcyA9IGNhbGxiYWNrO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBlcnJiYWNrO1xyXG4gICAgICAgICAgICAgICAgZXJyYmFjayA9IG9wdGlvbmFsO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGVwcyA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY29uZmlnICYmIGNvbmZpZy5jb250ZXh0KSB7XHJcbiAgICAgICAgICAgIGNvbnRleHROYW1lID0gY29uZmlnLmNvbnRleHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb250ZXh0ID0gZ2V0T3duKGNvbnRleHRzLCBjb250ZXh0TmFtZSk7XHJcbiAgICAgICAgaWYgKCFjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQgPSBjb250ZXh0c1tjb250ZXh0TmFtZV0gPSByZXEucy5uZXdDb250ZXh0KGNvbnRleHROYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjb25maWcpIHtcclxuICAgICAgICAgICAgY29udGV4dC5jb25maWd1cmUoY29uZmlnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBjb250ZXh0LnJlcXVpcmUoZGVwcywgY2FsbGJhY2ssIGVycmJhY2spO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFN1cHBvcnQgcmVxdWlyZS5jb25maWcoKSB0byBtYWtlIGl0IGVhc2llciB0byBjb29wZXJhdGUgd2l0aCBvdGhlclxyXG4gICAgICogQU1EIGxvYWRlcnMgb24gZ2xvYmFsbHkgYWdyZWVkIG5hbWVzLlxyXG4gICAgICovXHJcbiAgICByZXEuY29uZmlnID0gZnVuY3Rpb24gKGNvbmZpZykge1xyXG4gICAgICAgIHJldHVybiByZXEoY29uZmlnKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlIHNvbWV0aGluZyBhZnRlciB0aGUgY3VycmVudCB0aWNrXHJcbiAgICAgKiBvZiB0aGUgZXZlbnQgbG9vcC4gT3ZlcnJpZGUgZm9yIG90aGVyIGVudnNcclxuICAgICAqIHRoYXQgaGF2ZSBhIGJldHRlciBzb2x1dGlvbiB0aGFuIHNldFRpbWVvdXQuXHJcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gZnVuY3Rpb24gdG8gZXhlY3V0ZSBsYXRlci5cclxuICAgICAqL1xyXG4gICAgcmVxLm5leHRUaWNrID0gdHlwZW9mIHNldFRpbWVvdXQgIT09ICd1bmRlZmluZWQnID8gZnVuY3Rpb24gKGZuKSB7XHJcbiAgICAgICAgc2V0VGltZW91dChmbiwgNCk7XHJcbiAgICB9IDogZnVuY3Rpb24gKGZuKSB7IGZuKCk7IH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeHBvcnQgcmVxdWlyZSBhcyBhIGdsb2JhbCwgYnV0IG9ubHkgaWYgaXQgZG9lcyBub3QgYWxyZWFkeSBleGlzdC5cclxuICAgICAqL1xyXG4gICAgaWYgKCFyZXF1aXJlKSB7XHJcbiAgICAgICAgcmVxdWlyZSA9IHJlcTtcclxuICAgIH1cclxuXHJcbiAgICByZXEudmVyc2lvbiA9IHZlcnNpb247XHJcblxyXG4gICAgLy9Vc2VkIHRvIGZpbHRlciBvdXQgZGVwZW5kZW5jaWVzIHRoYXQgYXJlIGFscmVhZHkgcGF0aHMuXHJcbiAgICByZXEuanNFeHRSZWdFeHAgPSAvXlxcL3w6fFxcP3xcXC5qcyQvO1xyXG4gICAgcmVxLmlzQnJvd3NlciA9IGlzQnJvd3NlcjtcclxuICAgIHMgPSByZXEucyA9IHtcclxuICAgICAgICBjb250ZXh0czogY29udGV4dHMsXHJcbiAgICAgICAgbmV3Q29udGV4dDogbmV3Q29udGV4dFxyXG4gICAgfTtcclxuXHJcbiAgICAvL0NyZWF0ZSBkZWZhdWx0IGNvbnRleHQuXHJcbiAgICByZXEoe30pO1xyXG5cclxuICAgIC8vRXhwb3J0cyBzb21lIGNvbnRleHQtc2Vuc2l0aXZlIG1ldGhvZHMgb24gZ2xvYmFsIHJlcXVpcmUuXHJcbiAgICBlYWNoKFtcclxuICAgICAgICAndG9VcmwnLFxyXG4gICAgICAgICd1bmRlZicsXHJcbiAgICAgICAgJ2RlZmluZWQnLFxyXG4gICAgICAgICdzcGVjaWZpZWQnXHJcbiAgICBdLCBmdW5jdGlvbiAocHJvcCkge1xyXG4gICAgICAgIC8vUmVmZXJlbmNlIGZyb20gY29udGV4dHMgaW5zdGVhZCBvZiBlYXJseSBiaW5kaW5nIHRvIGRlZmF1bHQgY29udGV4dCxcclxuICAgICAgICAvL3NvIHRoYXQgZHVyaW5nIGJ1aWxkcywgdGhlIGxhdGVzdCBpbnN0YW5jZSBvZiB0aGUgZGVmYXVsdCBjb250ZXh0XHJcbiAgICAgICAgLy93aXRoIGl0cyBjb25maWcgZ2V0cyB1c2VkLlxyXG4gICAgICAgIHJlcVtwcm9wXSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGN0eCA9IGNvbnRleHRzW2RlZkNvbnRleHROYW1lXTtcclxuICAgICAgICAgICAgcmV0dXJuIGN0eC5yZXF1aXJlW3Byb3BdLmFwcGx5KGN0eCwgYXJndW1lbnRzKTtcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKGlzQnJvd3Nlcikge1xyXG4gICAgICAgIGhlYWQgPSBzLmhlYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xyXG4gICAgICAgIC8vSWYgQkFTRSB0YWcgaXMgaW4gcGxheSwgdXNpbmcgYXBwZW5kQ2hpbGQgaXMgYSBwcm9ibGVtIGZvciBJRTYuXHJcbiAgICAgICAgLy9XaGVuIHRoYXQgYnJvd3NlciBkaWVzLCB0aGlzIGNhbiBiZSByZW1vdmVkLiBEZXRhaWxzIGluIHRoaXMgalF1ZXJ5IGJ1ZzpcclxuICAgICAgICAvL2h0dHA6Ly9kZXYuanF1ZXJ5LmNvbS90aWNrZXQvMjcwOVxyXG4gICAgICAgIGJhc2VFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2Jhc2UnKVswXTtcclxuICAgICAgICBpZiAoYmFzZUVsZW1lbnQpIHtcclxuICAgICAgICAgICAgaGVhZCA9IHMuaGVhZCA9IGJhc2VFbGVtZW50LnBhcmVudE5vZGU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQW55IGVycm9ycyB0aGF0IHJlcXVpcmUgZXhwbGljaXRseSBnZW5lcmF0ZXMgd2lsbCBiZSBwYXNzZWQgdG8gdGhpc1xyXG4gICAgICogZnVuY3Rpb24uIEludGVyY2VwdC9vdmVycmlkZSBpdCBpZiB5b3Ugd2FudCBjdXN0b20gZXJyb3IgaGFuZGxpbmcuXHJcbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBlcnIgdGhlIGVycm9yIG9iamVjdC5cclxuICAgICAqL1xyXG4gICAgcmVxLm9uRXJyb3IgPSBkZWZhdWx0T25FcnJvcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgdGhlIG5vZGUgZm9yIHRoZSBsb2FkIGNvbW1hbmQuIE9ubHkgdXNlZCBpbiBicm93c2VyIGVudnMuXHJcbiAgICAgKi9cclxuICAgIHJlcS5jcmVhdGVOb2RlID0gZnVuY3Rpb24gKGNvbmZpZywgbW9kdWxlTmFtZSwgdXJsKSB7XHJcbiAgICAgICAgdmFyIG5vZGUgPSBjb25maWcueGh0bWwgP1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sJywgJ2h0bWw6c2NyaXB0JykgOlxyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XHJcbiAgICAgICAgbm9kZS50eXBlID0gY29uZmlnLnNjcmlwdFR5cGUgfHwgJ3RleHQvamF2YXNjcmlwdCc7XHJcbiAgICAgICAgbm9kZS5jaGFyc2V0ID0gJ3V0Zi04JztcclxuICAgICAgICBub2RlLmFzeW5jID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gbm9kZTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEb2VzIHRoZSByZXF1ZXN0IHRvIGxvYWQgYSBtb2R1bGUgZm9yIHRoZSBicm93c2VyIGNhc2UuXHJcbiAgICAgKiBNYWtlIHRoaXMgYSBzZXBhcmF0ZSBmdW5jdGlvbiB0byBhbGxvdyBvdGhlciBlbnZpcm9ubWVudHNcclxuICAgICAqIHRvIG92ZXJyaWRlIGl0LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IHRoZSByZXF1aXJlIGNvbnRleHQgdG8gZmluZCBzdGF0ZS5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtb2R1bGVOYW1lIHRoZSBuYW1lIG9mIHRoZSBtb2R1bGUuXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gdXJsIHRoZSBVUkwgdG8gdGhlIG1vZHVsZS5cclxuICAgICAqL1xyXG4gICAgcmVxLmxvYWQgPSBmdW5jdGlvbiAoY29udGV4dCwgbW9kdWxlTmFtZSwgdXJsKSB7XHJcbiAgICAgICAgdmFyIGNvbmZpZyA9IChjb250ZXh0ICYmIGNvbnRleHQuY29uZmlnKSB8fCB7fSxcclxuICAgICAgICAgICAgbm9kZTtcclxuICAgICAgICBpZiAoaXNCcm93c2VyKSB7XHJcbiAgICAgICAgICAgIC8vSW4gdGhlIGJyb3dzZXIgc28gdXNlIGEgc2NyaXB0IHRhZ1xyXG4gICAgICAgICAgICBub2RlID0gcmVxLmNyZWF0ZU5vZGUoY29uZmlnLCBtb2R1bGVOYW1lLCB1cmwpO1xyXG5cclxuICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcmVxdWlyZWNvbnRleHQnLCBjb250ZXh0LmNvbnRleHROYW1lKTtcclxuICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcmVxdWlyZW1vZHVsZScsIG1vZHVsZU5hbWUpO1xyXG5cclxuICAgICAgICAgICAgLy9TZXQgdXAgbG9hZCBsaXN0ZW5lci4gVGVzdCBhdHRhY2hFdmVudCBmaXJzdCBiZWNhdXNlIElFOSBoYXNcclxuICAgICAgICAgICAgLy9hIHN1YnRsZSBpc3N1ZSBpbiBpdHMgYWRkRXZlbnRMaXN0ZW5lciBhbmQgc2NyaXB0IG9ubG9hZCBmaXJpbmdzXHJcbiAgICAgICAgICAgIC8vdGhhdCBkbyBub3QgbWF0Y2ggdGhlIGJlaGF2aW9yIG9mIGFsbCBvdGhlciBicm93c2VycyB3aXRoXHJcbiAgICAgICAgICAgIC8vYWRkRXZlbnRMaXN0ZW5lciBzdXBwb3J0LCB3aGljaCBmaXJlIHRoZSBvbmxvYWQgZXZlbnQgZm9yIGFcclxuICAgICAgICAgICAgLy9zY3JpcHQgcmlnaHQgYWZ0ZXIgdGhlIHNjcmlwdCBleGVjdXRpb24uIFNlZTpcclxuICAgICAgICAgICAgLy9odHRwczovL2Nvbm5lY3QubWljcm9zb2Z0LmNvbS9JRS9mZWVkYmFjay9kZXRhaWxzLzY0ODA1Ny9zY3JpcHQtb25sb2FkLWV2ZW50LWlzLW5vdC1maXJlZC1pbW1lZGlhdGVseS1hZnRlci1zY3JpcHQtZXhlY3V0aW9uXHJcbiAgICAgICAgICAgIC8vVU5GT1JUVU5BVEVMWSBPcGVyYSBpbXBsZW1lbnRzIGF0dGFjaEV2ZW50IGJ1dCBkb2VzIG5vdCBmb2xsb3cgdGhlIHNjcmlwdFxyXG4gICAgICAgICAgICAvL3NjcmlwdCBleGVjdXRpb24gbW9kZS5cclxuICAgICAgICAgICAgaWYgKG5vZGUuYXR0YWNoRXZlbnQgJiZcclxuICAgICAgICAgICAgICAgICAgICAvL0NoZWNrIGlmIG5vZGUuYXR0YWNoRXZlbnQgaXMgYXJ0aWZpY2lhbGx5IGFkZGVkIGJ5IGN1c3RvbSBzY3JpcHQgb3JcclxuICAgICAgICAgICAgICAgICAgICAvL25hdGl2ZWx5IHN1cHBvcnRlZCBieSBicm93c2VyXHJcbiAgICAgICAgICAgICAgICAgICAgLy9yZWFkIGh0dHBzOi8vZ2l0aHViLmNvbS9yZXF1aXJlanMvcmVxdWlyZWpzL2lzc3Vlcy8xODdcclxuICAgICAgICAgICAgICAgICAgICAvL2lmIHdlIGNhbiBOT1QgZmluZCBbbmF0aXZlIGNvZGVdIHRoZW4gaXQgbXVzdCBOT1QgbmF0aXZlbHkgc3VwcG9ydGVkLlxyXG4gICAgICAgICAgICAgICAgICAgIC8vaW4gSUU4LCBub2RlLmF0dGFjaEV2ZW50IGRvZXMgbm90IGhhdmUgdG9TdHJpbmcoKVxyXG4gICAgICAgICAgICAgICAgICAgIC8vTm90ZSB0aGUgdGVzdCBmb3IgXCJbbmF0aXZlIGNvZGVcIiB3aXRoIG5vIGNsb3NpbmcgYnJhY2UsIHNlZTpcclxuICAgICAgICAgICAgICAgICAgICAvL2h0dHBzOi8vZ2l0aHViLmNvbS9yZXF1aXJlanMvcmVxdWlyZWpzL2lzc3Vlcy8yNzNcclxuICAgICAgICAgICAgICAgICAgICAhKG5vZGUuYXR0YWNoRXZlbnQudG9TdHJpbmcgJiYgbm9kZS5hdHRhY2hFdmVudC50b1N0cmluZygpLmluZGV4T2YoJ1tuYXRpdmUgY29kZScpIDwgMCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAhaXNPcGVyYSkge1xyXG4gICAgICAgICAgICAgICAgLy9Qcm9iYWJseSBJRS4gSUUgKGF0IGxlYXN0IDYtOCkgZG8gbm90IGZpcmVcclxuICAgICAgICAgICAgICAgIC8vc2NyaXB0IG9ubG9hZCByaWdodCBhZnRlciBleGVjdXRpbmcgdGhlIHNjcmlwdCwgc29cclxuICAgICAgICAgICAgICAgIC8vd2UgY2Fubm90IHRpZSB0aGUgYW5vbnltb3VzIGRlZmluZSBjYWxsIHRvIGEgbmFtZS5cclxuICAgICAgICAgICAgICAgIC8vSG93ZXZlciwgSUUgcmVwb3J0cyB0aGUgc2NyaXB0IGFzIGJlaW5nIGluICdpbnRlcmFjdGl2ZSdcclxuICAgICAgICAgICAgICAgIC8vcmVhZHlTdGF0ZSBhdCB0aGUgdGltZSBvZiB0aGUgZGVmaW5lIGNhbGwuXHJcbiAgICAgICAgICAgICAgICB1c2VJbnRlcmFjdGl2ZSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgbm9kZS5hdHRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgY29udGV4dC5vblNjcmlwdExvYWQpO1xyXG4gICAgICAgICAgICAgICAgLy9JdCB3b3VsZCBiZSBncmVhdCB0byBhZGQgYW4gZXJyb3IgaGFuZGxlciBoZXJlIHRvIGNhdGNoXHJcbiAgICAgICAgICAgICAgICAvLzQwNHMgaW4gSUU5Ky4gSG93ZXZlciwgb25yZWFkeXN0YXRlY2hhbmdlIHdpbGwgZmlyZSBiZWZvcmVcclxuICAgICAgICAgICAgICAgIC8vdGhlIGVycm9yIGhhbmRsZXIsIHNvIHRoYXQgZG9lcyBub3QgaGVscC4gSWYgYWRkRXZlbnRMaXN0ZW5lclxyXG4gICAgICAgICAgICAgICAgLy9pcyB1c2VkLCB0aGVuIElFIHdpbGwgZmlyZSBlcnJvciBiZWZvcmUgbG9hZCwgYnV0IHdlIGNhbm5vdFxyXG4gICAgICAgICAgICAgICAgLy91c2UgdGhhdCBwYXRod2F5IGdpdmVuIHRoZSBjb25uZWN0Lm1pY3Jvc29mdC5jb20gaXNzdWVcclxuICAgICAgICAgICAgICAgIC8vbWVudGlvbmVkIGFib3ZlIGFib3V0IG5vdCBkb2luZyB0aGUgJ3NjcmlwdCBleGVjdXRlLFxyXG4gICAgICAgICAgICAgICAgLy90aGVuIGZpcmUgdGhlIHNjcmlwdCBsb2FkIGV2ZW50IGxpc3RlbmVyIGJlZm9yZSBleGVjdXRlXHJcbiAgICAgICAgICAgICAgICAvL25leHQgc2NyaXB0JyB0aGF0IG90aGVyIGJyb3dzZXJzIGRvLlxyXG4gICAgICAgICAgICAgICAgLy9CZXN0IGhvcGU6IElFMTAgZml4ZXMgdGhlIGlzc3VlcyxcclxuICAgICAgICAgICAgICAgIC8vYW5kIHRoZW4gZGVzdHJveXMgYWxsIGluc3RhbGxzIG9mIElFIDYtOS5cclxuICAgICAgICAgICAgICAgIC8vbm9kZS5hdHRhY2hFdmVudCgnb25lcnJvcicsIGNvbnRleHQub25TY3JpcHRFcnJvcik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBjb250ZXh0Lm9uU2NyaXB0TG9hZCwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGNvbnRleHQub25TY3JpcHRFcnJvciwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5vZGUuc3JjID0gdXJsO1xyXG5cclxuICAgICAgICAgICAgLy9DYWxsaW5nIG9uTm9kZUNyZWF0ZWQgYWZ0ZXIgYWxsIHByb3BlcnRpZXMgb24gdGhlIG5vZGUgaGF2ZSBiZWVuXHJcbiAgICAgICAgICAgIC8vc2V0LCBidXQgYmVmb3JlIGl0IGlzIHBsYWNlZCBpbiB0aGUgRE9NLlxyXG4gICAgICAgICAgICBpZiAoY29uZmlnLm9uTm9kZUNyZWF0ZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZy5vbk5vZGVDcmVhdGVkKG5vZGUsIGNvbmZpZywgbW9kdWxlTmFtZSwgdXJsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9Gb3Igc29tZSBjYWNoZSBjYXNlcyBpbiBJRSA2LTgsIHRoZSBzY3JpcHQgZXhlY3V0ZXMgYmVmb3JlIHRoZSBlbmRcclxuICAgICAgICAgICAgLy9vZiB0aGUgYXBwZW5kQ2hpbGQgZXhlY3V0aW9uLCBzbyB0byB0aWUgYW4gYW5vbnltb3VzIGRlZmluZVxyXG4gICAgICAgICAgICAvL2NhbGwgdG8gdGhlIG1vZHVsZSBuYW1lICh3aGljaCBpcyBzdG9yZWQgb24gdGhlIG5vZGUpLCBob2xkIG9uXHJcbiAgICAgICAgICAgIC8vdG8gYSByZWZlcmVuY2UgdG8gdGhpcyBub2RlLCBidXQgY2xlYXIgYWZ0ZXIgdGhlIERPTSBpbnNlcnRpb24uXHJcbiAgICAgICAgICAgIGN1cnJlbnRseUFkZGluZ1NjcmlwdCA9IG5vZGU7XHJcbiAgICAgICAgICAgIGlmIChiYXNlRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgaGVhZC5pbnNlcnRCZWZvcmUobm9kZSwgYmFzZUVsZW1lbnQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaGVhZC5hcHBlbmRDaGlsZChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjdXJyZW50bHlBZGRpbmdTY3JpcHQgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpc1dlYldvcmtlcikge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgLy9JbiBhIHdlYiB3b3JrZXIsIHVzZSBpbXBvcnRTY3JpcHRzLiBUaGlzIGlzIG5vdCBhIHZlcnlcclxuICAgICAgICAgICAgICAgIC8vZWZmaWNpZW50IHVzZSBvZiBpbXBvcnRTY3JpcHRzLCBpbXBvcnRTY3JpcHRzIHdpbGwgYmxvY2sgdW50aWxcclxuICAgICAgICAgICAgICAgIC8vaXRzIHNjcmlwdCBpcyBkb3dubG9hZGVkIGFuZCBldmFsdWF0ZWQuIEhvd2V2ZXIsIGlmIHdlYiB3b3JrZXJzXHJcbiAgICAgICAgICAgICAgICAvL2FyZSBpbiBwbGF5LCB0aGUgZXhwZWN0YXRpb24gaXMgdGhhdCBhIGJ1aWxkIGhhcyBiZWVuIGRvbmUgc29cclxuICAgICAgICAgICAgICAgIC8vdGhhdCBvbmx5IG9uZSBzY3JpcHQgbmVlZHMgdG8gYmUgbG9hZGVkIGFueXdheS4gVGhpcyBtYXkgbmVlZFxyXG4gICAgICAgICAgICAgICAgLy90byBiZSByZWV2YWx1YXRlZCBpZiBvdGhlciB1c2UgY2FzZXMgYmVjb21lIGNvbW1vbi5cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQb3N0IGEgdGFzayB0byB0aGUgZXZlbnQgbG9vcCB0byB3b3JrIGFyb3VuZCBhIGJ1ZyBpbiBXZWJLaXRcclxuICAgICAgICAgICAgICAgIC8vIHdoZXJlIHRoZSB3b3JrZXIgZ2V0cyBnYXJiYWdlLWNvbGxlY3RlZCBhZnRlciBjYWxsaW5nXHJcbiAgICAgICAgICAgICAgICAvLyBpbXBvcnRTY3JpcHRzKCk6IGh0dHBzOi8vd2Via2l0Lm9yZy9iLzE1MzMxN1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHt9LCAwKTtcclxuICAgICAgICAgICAgICAgIGltcG9ydFNjcmlwdHModXJsKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL0FjY291bnQgZm9yIGFub255bW91cyBtb2R1bGVzXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmNvbXBsZXRlTG9hZChtb2R1bGVOYW1lKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dC5vbkVycm9yKG1ha2VFcnJvcignaW1wb3J0c2NyaXB0cycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2ltcG9ydFNjcmlwdHMgZmFpbGVkIGZvciAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSArICcgYXQgJyArIHVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFttb2R1bGVOYW1lXSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRJbnRlcmFjdGl2ZVNjcmlwdCgpIHtcclxuICAgICAgICBpZiAoaW50ZXJhY3RpdmVTY3JpcHQgJiYgaW50ZXJhY3RpdmVTY3JpcHQucmVhZHlTdGF0ZSA9PT0gJ2ludGVyYWN0aXZlJykge1xyXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3RpdmVTY3JpcHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlYWNoUmV2ZXJzZShzY3JpcHRzKCksIGZ1bmN0aW9uIChzY3JpcHQpIHtcclxuICAgICAgICAgICAgaWYgKHNjcmlwdC5yZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKGludGVyYWN0aXZlU2NyaXB0ID0gc2NyaXB0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBpbnRlcmFjdGl2ZVNjcmlwdDtcclxuICAgIH1cclxuXHJcbiAgICAvL0xvb2sgZm9yIGEgZGF0YS1tYWluIHNjcmlwdCBhdHRyaWJ1dGUsIHdoaWNoIGNvdWxkIGFsc28gYWRqdXN0IHRoZSBiYXNlVXJsLlxyXG4gICAgaWYgKGlzQnJvd3NlciAmJiAhY2ZnLnNraXBEYXRhTWFpbikge1xyXG4gICAgICAgIC8vRmlndXJlIG91dCBiYXNlVXJsLiBHZXQgaXQgZnJvbSB0aGUgc2NyaXB0IHRhZyB3aXRoIHJlcXVpcmUuanMgaW4gaXQuXHJcbiAgICAgICAgZWFjaFJldmVyc2Uoc2NyaXB0cygpLCBmdW5jdGlvbiAoc2NyaXB0KSB7XHJcbiAgICAgICAgICAgIC8vU2V0IHRoZSAnaGVhZCcgd2hlcmUgd2UgY2FuIGFwcGVuZCBjaGlsZHJlbiBieVxyXG4gICAgICAgICAgICAvL3VzaW5nIHRoZSBzY3JpcHQncyBwYXJlbnQuXHJcbiAgICAgICAgICAgIGlmICghaGVhZCkge1xyXG4gICAgICAgICAgICAgICAgaGVhZCA9IHNjcmlwdC5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL0xvb2sgZm9yIGEgZGF0YS1tYWluIGF0dHJpYnV0ZSB0byBzZXQgbWFpbiBzY3JpcHQgZm9yIHRoZSBwYWdlXHJcbiAgICAgICAgICAgIC8vdG8gbG9hZC4gSWYgaXQgaXMgdGhlcmUsIHRoZSBwYXRoIHRvIGRhdGEgbWFpbiBiZWNvbWVzIHRoZVxyXG4gICAgICAgICAgICAvL2Jhc2VVcmwsIGlmIGl0IGlzIG5vdCBhbHJlYWR5IHNldC5cclxuICAgICAgICAgICAgZGF0YU1haW4gPSBzY3JpcHQuZ2V0QXR0cmlidXRlKCdkYXRhLW1haW4nKTtcclxuICAgICAgICAgICAgaWYgKGRhdGFNYWluKSB7XHJcbiAgICAgICAgICAgICAgICAvL1ByZXNlcnZlIGRhdGFNYWluIGluIGNhc2UgaXQgaXMgYSBwYXRoIChpLmUuIGNvbnRhaW5zICc/JylcclxuICAgICAgICAgICAgICAgIG1haW5TY3JpcHQgPSBkYXRhTWFpbjtcclxuXHJcbiAgICAgICAgICAgICAgICAvL1NldCBmaW5hbCBiYXNlVXJsIGlmIHRoZXJlIGlzIG5vdCBhbHJlYWR5IGFuIGV4cGxpY2l0IG9uZSxcclxuICAgICAgICAgICAgICAgIC8vYnV0IG9ubHkgZG8gc28gaWYgdGhlIGRhdGEtbWFpbiB2YWx1ZSBpcyBub3QgYSBsb2FkZXIgcGx1Z2luXHJcbiAgICAgICAgICAgICAgICAvL21vZHVsZSBJRC5cclxuICAgICAgICAgICAgICAgIGlmICghY2ZnLmJhc2VVcmwgJiYgbWFpblNjcmlwdC5pbmRleE9mKCchJykgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9QdWxsIG9mZiB0aGUgZGlyZWN0b3J5IG9mIGRhdGEtbWFpbiBmb3IgdXNlIGFzIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vYmFzZVVybC5cclxuICAgICAgICAgICAgICAgICAgICBzcmMgPSBtYWluU2NyaXB0LnNwbGl0KCcvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFpblNjcmlwdCA9IHNyYy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBzdWJQYXRoID0gc3JjLmxlbmd0aCA/IHNyYy5qb2luKCcvJykgICsgJy8nIDogJy4vJztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2ZnLmJhc2VVcmwgPSBzdWJQYXRoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vU3RyaXAgb2ZmIGFueSB0cmFpbGluZyAuanMgc2luY2UgbWFpblNjcmlwdCBpcyBub3dcclxuICAgICAgICAgICAgICAgIC8vbGlrZSBhIG1vZHVsZSBuYW1lLlxyXG4gICAgICAgICAgICAgICAgbWFpblNjcmlwdCA9IG1haW5TY3JpcHQucmVwbGFjZShqc1N1ZmZpeFJlZ0V4cCwgJycpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vSWYgbWFpblNjcmlwdCBpcyBzdGlsbCBhIHBhdGgsIGZhbGwgYmFjayB0byBkYXRhTWFpblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlcS5qc0V4dFJlZ0V4cC50ZXN0KG1haW5TY3JpcHQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFpblNjcmlwdCA9IGRhdGFNYWluO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vUHV0IHRoZSBkYXRhLW1haW4gc2NyaXB0IGluIHRoZSBmaWxlcyB0byBsb2FkLlxyXG4gICAgICAgICAgICAgICAgY2ZnLmRlcHMgPSBjZmcuZGVwcyA/IGNmZy5kZXBzLmNvbmNhdChtYWluU2NyaXB0KSA6IFttYWluU2NyaXB0XTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyBkZWZpbml0aW9ucyBvZiBtb2R1bGVzLiBEaWZmZXJzIGZyb21cclxuICAgICAqIHJlcXVpcmUoKSBpbiB0aGF0IGEgc3RyaW5nIGZvciB0aGUgbW9kdWxlIHNob3VsZCBiZSB0aGUgZmlyc3QgYXJndW1lbnQsXHJcbiAgICAgKiBhbmQgdGhlIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgYWZ0ZXIgZGVwZW5kZW5jaWVzIGFyZSBsb2FkZWQgc2hvdWxkXHJcbiAgICAgKiByZXR1cm4gYSB2YWx1ZSB0byBkZWZpbmUgdGhlIG1vZHVsZSBjb3JyZXNwb25kaW5nIHRvIHRoZSBmaXJzdCBhcmd1bWVudCdzXHJcbiAgICAgKiBuYW1lLlxyXG4gICAgICovXHJcbiAgICBkZWZpbmUgPSBmdW5jdGlvbiAobmFtZSwgZGVwcywgY2FsbGJhY2spIHtcclxuICAgICAgICB2YXIgbm9kZSwgY29udGV4dDtcclxuXHJcbiAgICAgICAgLy9BbGxvdyBmb3IgYW5vbnltb3VzIG1vZHVsZXNcclxuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIC8vQWRqdXN0IGFyZ3MgYXBwcm9wcmlhdGVseVxyXG4gICAgICAgICAgICBjYWxsYmFjayA9IGRlcHM7XHJcbiAgICAgICAgICAgIGRlcHMgPSBuYW1lO1xyXG4gICAgICAgICAgICBuYW1lID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vVGhpcyBtb2R1bGUgbWF5IG5vdCBoYXZlIGRlcGVuZGVuY2llc1xyXG4gICAgICAgIGlmICghaXNBcnJheShkZXBzKSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayA9IGRlcHM7XHJcbiAgICAgICAgICAgIGRlcHMgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9JZiBubyBuYW1lLCBhbmQgY2FsbGJhY2sgaXMgYSBmdW5jdGlvbiwgdGhlbiBmaWd1cmUgb3V0IGlmIGl0IGFcclxuICAgICAgICAvL0NvbW1vbkpTIHRoaW5nIHdpdGggZGVwZW5kZW5jaWVzLlxyXG4gICAgICAgIGlmICghZGVwcyAmJiBpc0Z1bmN0aW9uKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICBkZXBzID0gW107XHJcbiAgICAgICAgICAgIC8vUmVtb3ZlIGNvbW1lbnRzIGZyb20gdGhlIGNhbGxiYWNrIHN0cmluZyxcclxuICAgICAgICAgICAgLy9sb29rIGZvciByZXF1aXJlIGNhbGxzLCBhbmQgcHVsbCB0aGVtIGludG8gdGhlIGRlcGVuZGVuY2llcyxcclxuICAgICAgICAgICAgLy9idXQgb25seSBpZiB0aGVyZSBhcmUgZnVuY3Rpb24gYXJncy5cclxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tcclxuICAgICAgICAgICAgICAgICAgICAudG9TdHJpbmcoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKGNvbW1lbnRSZWdFeHAsIGNvbW1lbnRSZXBsYWNlKVxyXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKGNqc1JlcXVpcmVSZWdFeHAsIGZ1bmN0aW9uIChtYXRjaCwgZGVwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcHMucHVzaChkZXApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vTWF5IGJlIGEgQ29tbW9uSlMgdGhpbmcgZXZlbiB3aXRob3V0IHJlcXVpcmUgY2FsbHMsIGJ1dCBzdGlsbFxyXG4gICAgICAgICAgICAgICAgLy9jb3VsZCB1c2UgZXhwb3J0cywgYW5kIG1vZHVsZS4gQXZvaWQgZG9pbmcgZXhwb3J0cyBhbmQgbW9kdWxlXHJcbiAgICAgICAgICAgICAgICAvL3dvcmsgdGhvdWdoIGlmIGl0IGp1c3QgbmVlZHMgcmVxdWlyZS5cclxuICAgICAgICAgICAgICAgIC8vUkVRVUlSRVMgdGhlIGZ1bmN0aW9uIHRvIGV4cGVjdCB0aGUgQ29tbW9uSlMgdmFyaWFibGVzIGluIHRoZVxyXG4gICAgICAgICAgICAgICAgLy9vcmRlciBsaXN0ZWQgYmVsb3cuXHJcbiAgICAgICAgICAgICAgICBkZXBzID0gKGNhbGxiYWNrLmxlbmd0aCA9PT0gMSA/IFsncmVxdWlyZSddIDogWydyZXF1aXJlJywgJ2V4cG9ydHMnLCAnbW9kdWxlJ10pLmNvbmNhdChkZXBzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9JZiBpbiBJRSA2LTggYW5kIGhpdCBhbiBhbm9ueW1vdXMgZGVmaW5lKCkgY2FsbCwgZG8gdGhlIGludGVyYWN0aXZlXHJcbiAgICAgICAgLy93b3JrLlxyXG4gICAgICAgIGlmICh1c2VJbnRlcmFjdGl2ZSkge1xyXG4gICAgICAgICAgICBub2RlID0gY3VycmVudGx5QWRkaW5nU2NyaXB0IHx8IGdldEludGVyYWN0aXZlU2NyaXB0KCk7XHJcbiAgICAgICAgICAgIGlmIChub2RlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtcmVxdWlyZW1vZHVsZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29udGV4dCA9IGNvbnRleHRzW25vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLXJlcXVpcmVjb250ZXh0JyldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL0Fsd2F5cyBzYXZlIG9mZiBldmFsdWF0aW5nIHRoZSBkZWYgY2FsbCB1bnRpbCB0aGUgc2NyaXB0IG9ubG9hZCBoYW5kbGVyLlxyXG4gICAgICAgIC8vVGhpcyBhbGxvd3MgbXVsdGlwbGUgbW9kdWxlcyB0byBiZSBpbiBhIGZpbGUgd2l0aG91dCBwcmVtYXR1cmVseVxyXG4gICAgICAgIC8vdHJhY2luZyBkZXBlbmRlbmNpZXMsIGFuZCBhbGxvd3MgZm9yIGFub255bW91cyBtb2R1bGUgc3VwcG9ydCxcclxuICAgICAgICAvL3doZXJlIHRoZSBtb2R1bGUgbmFtZSBpcyBub3Qga25vd24gdW50aWwgdGhlIHNjcmlwdCBvbmxvYWQgZXZlbnRcclxuICAgICAgICAvL29jY3Vycy4gSWYgbm8gY29udGV4dCwgdXNlIHRoZSBnbG9iYWwgcXVldWUsIGFuZCBnZXQgaXQgcHJvY2Vzc2VkXHJcbiAgICAgICAgLy9pbiB0aGUgb25zY3JpcHQgbG9hZCBjYWxsYmFjay5cclxuICAgICAgICBpZiAoY29udGV4dCkge1xyXG4gICAgICAgICAgICBjb250ZXh0LmRlZlF1ZXVlLnB1c2goW25hbWUsIGRlcHMsIGNhbGxiYWNrXSk7XHJcbiAgICAgICAgICAgIGNvbnRleHQuZGVmUXVldWVNYXBbbmFtZV0gPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGdsb2JhbERlZlF1ZXVlLnB1c2goW25hbWUsIGRlcHMsIGNhbGxiYWNrXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBkZWZpbmUuYW1kID0ge1xyXG4gICAgICAgIGpRdWVyeTogdHJ1ZVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEV4ZWN1dGVzIHRoZSB0ZXh0LiBOb3JtYWxseSBqdXN0IHVzZXMgZXZhbCwgYnV0IGNhbiBiZSBtb2RpZmllZFxyXG4gICAgICogdG8gdXNlIGEgYmV0dGVyLCBlbnZpcm9ubWVudC1zcGVjaWZpYyBjYWxsLiBPbmx5IHVzZWQgZm9yIHRyYW5zcGlsaW5nXHJcbiAgICAgKiBsb2FkZXIgcGx1Z2lucywgbm90IGZvciBwbGFpbiBKUyBtb2R1bGVzLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRleHQgdGhlIHRleHQgdG8gZXhlY3V0ZS9ldmFsdWF0ZS5cclxuICAgICAqL1xyXG4gICAgcmVxLmV4ZWMgPSBmdW5jdGlvbiAodGV4dCkge1xyXG4gICAgICAgIC8qanNsaW50IGV2aWw6IHRydWUgKi9cclxuICAgICAgICByZXR1cm4gZXZhbCh0ZXh0KTtcclxuICAgIH07XHJcblxyXG4gICAgLy9TZXQgdXAgd2l0aCBjb25maWcgaW5mby5cclxuICAgIHJlcShjZmcpO1xyXG59KHRoaXMpKTtcclxuIl0sImZpbGUiOiJqcy9saWIvcmVxdWlyZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
