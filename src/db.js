/**
 * Database Service for AngularJS
 * @version v0.0.1.0
 * @link http://www.ambersive.com
 * @licence MIT License, http://www.opensource.org/licenses/MIT
 */

(function(window, document, undefined) {

    var AmbersiveDBRegisterStack                = [];
    var AmbersiveDBRegisterStackIds             = [];
    var AmbersiveDBRegisterstackRegister        = [];
    var AmbersiveDBRegisterstackRegisterDb      = [];
    var AmbersiveDBRegisterstackRegisterDbIds   = [];

    var AmbersiveDBRegisterSrv                  = {

        /***
         * $http config to string
         * @param config
         * @returns {string}
         */

        toId:       function(config){

            var params          = [];

            var req_params      = [];
            var req_param       = null;

            if(angular.isDefined(config) === false || config === null){
              return;
            }

            params.push(config.method);
            params.push(config.url);

            if(angular.isDefined(config.params)){

                // Add the params

                for(req_param in config.params){

                    req_params.push(req_param + '=' + config.params[req_param]);

                }

                params.push('?' + req_params.join('&'));

            }

            if(angular.isDefined(config.data)){

                if(angular.isObject(config.data)) {

                    try {

                        params.push(JSON.stringify(config.data));

                    } catch(err){

                        console.error(err);

                    }

                }

            }

            return params.join('::');

        },

        /***
         * Generate a unique id
         * @param length
         * @param prefix
         * @returns {string}
         */

        getUnique:   function(length,prefix){

            if(prefix === undefined){
                prefix = '';
            }

            if(length === undefined){
                length = 16;
            }

            return prefix + (Math.random().toString(length).slice(2));

        },

        /***
         * Returns if all calls from the api are done
         * @returns {boolean}
         */

        finished: function(){

            if(AmbersiveDBRegisterStack.length === 0){
                return true;
            }

            return false;

        }

    };

    angular.module('ambersive.db',[]);

    angular.module('ambersive.db').factory('DBRegister',[
        function(){

            return AmbersiveDBRegisterSrv;

        }
    ]);

    angular.module('ambersive.db').factory('DBHelper', ['$http', '$q','$rootScope','$dbSettings',
        function ($http, $q, $rootScope,$dbSettings) {

            var DBHelper            = {};
            var DBHelperRegister    = [];
            var DBHelperRegisterIds = [];

            DBHelper.isOnline   = function(){

                if(angular.isDefined(navigator)  === true && angular.isDefined(navigator.onLine) === true){

                    return navigator.onLine;

                }

                return true;

            };

            /***
             * Execute the $http call with extra functionality (like last call detection and http stop)
             * @param httpObj
             * @returns {Promise}
             */

            DBHelper.execute    =         function(httpObj,offlineSettings){

                var id          = AmbersiveDBRegisterSrv.toId(httpObj);
                var index       = DBHelperRegisterIds.indexOf(id);

                var deferred    = $q.defer();

                var callFn      = function(httpParams){

                    var defer           = $q.defer();
                    var regElement      = null;

                    // Check if the application is int the internet

                    if(DBHelper.isOnline() === false){

                        // Run custom offline logic here

                        if(angular.isDefined(offlineSettings) === true){

                           // Run the custom logic

                           if(angular.isDefined(offlineSettings.fn) === true && angular.isFunction(offlineSettings.fn) === true){

                                offlineSettings.fn(defer,index,DBHelperRegister);

                           }

                           // Check if the call should stop here

                            if(angular.isDefined(offlineSettings.stop) && offlineSettings.stop === true){

                                return defer.promise;

                            }

                        }

                    }

                    // Standard api call action

                    if(angular.isDefined(httpParams) && httpParams !== null){

                      httpParams.timeout  = defer.promise;

                    }

                    regElement          = $http(httpParams)
                        .success(function(data,status,headers,config){

                            if(data !== null) {
                                defer.resolve(data, config.isLastCall);
                            }

                        })
                        .error(function(data,status,headers,config){

                            var stopResponse = false;

                            if(angular.isDefined(httpObj.catchAllErrorResult) && angular.isBoolean(httpObj.catchAllErrorResult)){

                                stopResponse = httpObj.catchAllErrorResult;

                            }
                            else {

                                stopResponse = $dbSettings.catchAllErrorResult;

                            }

                            if(status!== 200){

                                switch(status){

                                    case 401:
                                      if($dbSettings.catch401Result === true){

                                          stopResponse = true;

                                          $rootScope.$broadcast('DBHelperCatched401',{data:data,config:config, headers:headers, defer:defer});

                                      }
                                      else {

                                          // To catch the error on a single spot

                                          $rootScope.$broadcast('DBHelperCatchedError',{status:status,data:data,config:config, headers:headers, defer:defer});

                                      }
                                      break;

                                    default:

                                      // To catch the error on a single spot

                                      $rootScope.$broadcast('DBHelperCatchedError',{status:status,data:data,config:config, headers:headers, defer:defer});

                                      break;

                                }

                            }

                            if(data !== null && stopResponse === false){
                                defer.reject(data, config.isLast);
                            }

                        });

                    regElement.abort = function(){
                        defer.resolve(null,regElement);
                    };

                    /***
                     * Abort a previous api call if the same api call is made now
                     */

                    if(index > -1){

                        // Abort

                        DBHelperRegister[index].abort();

                        DBHelperRegister[index]     = regElement;
                        DBHelperRegisterIds[index]  = id;

                    }
                    else {

                        DBHelperRegister.push(regElement);
                        DBHelperRegisterIds.push(id);

                    }

                    return defer.promise;

                };

                /***
                 * Call the api in a seperat promise
                 * to provide the possiblity to abort previous api calls
                 */

                callFn(httpObj).then(
                    function(result){
                        if(result !== null){
                            deferred.resolve(result);
                        }
                    },
                    function(errorResult){
                        if(errorResult !== null){
                            deferred.reject(errorResult);
                        }
                    }
                );

                return deferred.promise;

            };

            return DBHelper;

        }
    ]);


    angular.module('ambersive.db').factory('authenticationInjector', ['$injector', '$q','$log','$dbSettings','$timeout',
        function ($injector, $q,$log,$dbSettings,$timeout) {
            var authenticationInjector = {
                'request':  function (config) {

                    var deferred    = $q.defer(),
                        storageName = $dbSettings.storageName,
                        storageLang = $dbSettings.storageLang,
                        tokenName   = $dbSettings.tokenName,
                        tokenType   = $dbSettings.tokenType,
                        tokenData   = null,
                        langData    = null,
                        langName    = $dbSettings.langName,
                        fn          = function(config){
                            deferred.resolve(config);
                        };

                    if(storageName === undefined || storageName === '' || storageName.length === 0){
                        $log.warn('ambersive.db: LocalStorage name is not set');
                    }

                    if(typeof(Storage) !== "undefined") {
                        tokenData = localStorage.getItem(storageName);
                        langData  = localStorage.getItem(storageLang);
                    } else {
                        $log.warn('ambersive.db: this browser doesn\'t support localStorage');
                    }

                    config.headers[tokenName]   = tokenType+' '+tokenData;

                    if(langData !== null) {

                        config.headers['Accept-Language']        = langData;
                        config.headers[langName]                 = langData;

                    }

                    fn(config);

                    return deferred.promise;
                },
                'response': function(response) {

                    var headers = response.headers(),
                        storageName = $dbSettings.storageName;

                    var read = function(name){
                        if(headers[name] !== undefined && headers[name] !== ''){
                            if(typeof(Storage) !== "undefined") {
                                localStorage.setItem(storageName,headers[name]);
                                return headers[name];
                            } else {
                                $log.warn('ambersive.db: this browser doesn\'t support localStorage');
                            }
                        }
                    };

                    var value = read(storageName);

                    if(value === undefined || value === ''){
                        value = read(storageName.toLocaleLowerCase());
                    }

                    return response;
                }
            };
            return authenticationInjector;
        }
    ]);

    angular.module('ambersive.db').factory('ambersiveDbInjector', ['$injector', '$q','$log','DBRegister','$rootScope',
        function ($injector, $q,$log,DBRegister,$rootScope) {

            var ambersiveDbInjector = {
                'request':  function (config) {

                    var deferred            = $q.defer();
                    var status              = false;

                    var id                  = AmbersiveDBRegisterSrv.toId(config);
                    var index               = null;

                    var reqId               = DBRegister.getUnique(32);
                    var reqEle              = {};

                    var defResolve          = null;

                    var headerIdentifier1   = 'X-Req-ID';
                    var headerIdentifier2   = 'Req-ID';

                    var fn                  = function(config){
                        deferred.resolve(config);
                    };

                    index                   = AmbersiveDBRegisterStack.indexOf(id);

                    config.headers[headerIdentifier1]    = reqId;
                    config.headers[headerIdentifier2]    = reqId;

                    config.reqID                         = reqId;

                    reqEle = {
                        config:     config,
                        deferred:   deferred,
                        reqId:      reqId,
                        id:         id
                    };

                    if(index > -1){

                        // Found stack

                        AmbersiveDBRegisterStackIds[index]      = reqId;
                        AmbersiveDBRegisterstackRegister[index] = reqEle;

                    } else {

                        AmbersiveDBRegisterStack.push(id);
                        AmbersiveDBRegisterStackIds.push(reqId);
                        AmbersiveDBRegisterstackRegister.push(reqEle);

                    }

                    if(angular.isDefined(status) === true){

                        fn(config);

                    }

                    return deferred.promise;
                },
                'response': function(response) {

                    var index           = AmbersiveDBRegisterStackIds.indexOf(response.config.reqID);

                    response.config.isLastCall = false;

                    if(index > -1){

                        AmbersiveDBRegisterStackIds.splice(index,1);
                        AmbersiveDBRegisterstackRegister.splice(index,1);

                        response.config.isLastCall = true;

                    }

                    return response;

                }
            };
            return ambersiveDbInjector;
        }
    ]);

    angular.module('ambersive.db').config(['$httpProvider','$dbSettingsProvider',
        function($httpProvider,$dbSettingsProvider) {

            var langData    = null;
            var langName    = $dbSettingsProvider.$get().langName;
            var storageLang = $dbSettingsProvider.$get().storageLang;

            $httpProvider.interceptors.push('authenticationInjector');
            $httpProvider.interceptors.push('ambersiveDbInjector');

            if(typeof(Storage) !== "undefined") {

                langData = localStorage.getItem(storageLang);

                if(langData !== null) {

                    $httpProvider.defaults.headers.common["Accept-Language"] = langData;
                    $httpProvider.defaults.headers.common[langName]          = langData;

                }

            }

        }
    ]);

    angular.module('ambersive.db').provider('$dbSettings',[
        function(){

            var baseUrl             = '',
                contentType         = 'application/json; charset=utf-8;',
                storageName         = 'accessToken',
                storageLang         = 'language',
                tokenType           = 'Bearer',
                tokenName           = 'Authorization',
                langName            = 'Language',
                databaseName        = 'AMBERSIVE.DB',
                routes              = {},
                catch401Result      = true,
                catchAllErrorResult = false;

            // Setter

            var registerRoute = function(name,settings){
                routes[name] = settings;

                return routes;
            };

            var getRoute = function(name){
                return routes[name];
            };

            var setBaseUrl = function(url){
                baseUrl = url;
                return baseUrl;
            };

            var setContentType = function(type){
                contentType = type;
                return contentType;
            };

            var setTokenAttribute = function(name,value){
                if(name === undefined || value === undefined){ return; }
                switch(name){
                    case 'tokenType':
                        tokenType = value;
                        break;
                    default:
                        tokenName = value;
                        break;
                }
                return value;
            };

            var setStorageName = function(value){
                storageName = value;
                return storageName;
            };

            var setStorageLang = function(value){
                storageLang = value;
                return storageLang;
            };

            var setDatabaseName = function(name){
                databaseName = name;
                return databaseName;
            };

            var setCatch401Response = function(val){
               catch401Result = val;
               return catch401Result;
            };

            var setCatchAllErrorResult = function(val){
                catchAllErrorResult = val;
                return catchAllErrorResult;
            };

            // Getter

            return {
                register:               registerRoute,
                setBaseUrl:             setBaseUrl,
                setContentType:         setContentType,
                setTokenAttribute:      setTokenAttribute,
                setStorageName:         setStorageName,
                setStorageLang:         setStorageLang,
                setDatabaseName:        setDatabaseName,
                setAllow401Catcher:     catch401Result,
                $get:                   function () {
                    return {
                        baseUrl:              baseUrl,
                        contentType:          contentType,
                        routes:               routes,
                        route:                getRoute,
                        storageName:          storageName,
                        storageLang:          storageLang,
                        tokenName:            tokenName,
                        tokenType:            tokenType,
                        langName:             langName,
                        databaseName:         databaseName,
                        catch401Result:       catch401Result,
                        catchAllErrorResult:  catchAllErrorResult
                    };
                }
            };
        }
    ]);

    angular.module('ambersive.db').factory('DB',['$q','$log','$http','$dbSettings','DBRegister','DBHelper',
        function($q,$log,$http,$dbSettings,DBRegister,DBHelper){

            var callerName  = '';

            var tempParams  = null;

            var routes      = {},
                getParams   = function(method,obj){

                    var params = {
                        method:method.toUpperCase()
                    };

                    var baseUrl     = $dbSettings.baseUrl,
                        seperator   = '/',
                        url         = '';

                    if(obj !== undefined && obj.baseUrl !== undefined && obj.baseUrl.length > 0){
                        baseUrl = obj.baseUrl;
                    }

                    if(obj !== undefined && obj.url !== undefined){
                        url = obj.url;
                    }

                    if(baseUrl !== undefined && baseUrl.endsWith(seperator)){
                        seperator = '';
                    } else {
                        baseUrl += seperator;
                    }

                    switch(method){
                        default:
                            params.url = baseUrl + seperator+url;
                            break;
                    }

                    // Headers

                    params.headers = {};

                    params.headers['Content-Type'] = $dbSettings.contentType;

                    if(obj !== undefined && obj.contentType !== undefined){
                        params.headers['Content-Type'] = obj.contentType;
                    }

                    return params;

                };

            /***
             * Route informations
             * @param settingsObj
             * @returns {{$has: DB.$has, get: DB.get, getById: DB.getById, update: DB.update, create: DB.create, delete: DB.delete}}
             * @constructor
             */

            var Route = function(settingsObj){
                return {

                    /***
                     * Helper method for checking if a DB API has a method
                     * @param name
                     * @returns {Promise}
                     */

                    $has:function(name){

                        var deferred = $q.defer();

                        if(routes[callerName] === undefined || routes[callerName][name] === undefined){
                            deferred.resolve(false);
                        } else {
                            deferred.resolve(true);
                        }

                        return deferred.promise;

                    },

                    /***
                     * Get api request
                     * @param query
                     * @returns {Promise}
                     */

                    get:function(query){

                        var deferred    = $q.defer();
                        tempParams      = getParams('get',settingsObj);

                        if(angular.isDefined(query)){

                            tempParams.params = query;

                        }

                        DBHelper.execute(tempParams).then(
                            function(result){
                                deferred.resolve(result);
                            },
                            function(errorResult){
                                deferred.reject(errorResult);
                            }
                        );

                        return deferred.promise;
                    },

                    /***
                     * Get a single entry
                     * @param id
                     * @param query
                     * @returns {Promise}
                     */

                    getById:function(id,query){

                        var deferred    = $q.defer();

                        tempParams      = getParams('get',settingsObj);
                        tempParams.url += '/'+id;

                        if(angular.isDefined(query)){

                            tempParams.params = query;

                        }

                        DBHelper.execute(tempParams).then(
                            function(result){
                                deferred.resolve(result);
                            },
                            function(errorResult){
                                deferred.reject(errorResult);
                            }
                        );

                        return deferred.promise;

                    },

                    /***
                     * Update a single entry
                     * @param id
                     * @param data
                     * @param query
                     * @returns {Promise}
                     */

                    update:function(id,data,query){

                        var deferred    = $q.defer(),
                            params      = getParams('put',settingsObj);

                        params.url      += '/'+id;
                        params.data     = data;

                        if(angular.isDefined(query)){

                            params.params = query;

                        }

                        DBHelper.execute(params).then(
                            function(result){
                                deferred.resolve(result);
                            },
                            function(errorResult){
                                deferred.reject(errorResult);
                            }
                        );

                        return deferred.promise;

                    },

                    /***
                     * Create a new entry
                     * @param data
                     * @param query
                     * @returns {Promise}
                     */

                    create:function(data,query){

                        var deferred    = $q.defer(),
                            params      = getParams('post',settingsObj);

                        params.data     = data;

                        if(angular.isDefined(query)){

                            params.params = query;

                        }

                        DBHelper.execute(params).then(
                            function(result){
                                deferred.resolve(result);
                            },
                            function(errorResult){
                                deferred.reject(errorResult);
                            }
                        );

                        return deferred.promise;

                    },

                    /***
                     * Delete an entry
                     * @param id
                     * @param query
                     * @returns {Promise}
                     */

                    'delete':function(id,query){

                        var deferred = $q.defer(),
                            params = getParams('delete',settingsObj);

                        params.url += '/'+id;

                        if(angular.isDefined(query)){

                            params.params = query;

                        }

                        DBHelper.execute(params).then(
                            function(result){
                                deferred.resolve(result);
                            },
                            function(errorResult){
                                deferred.reject(errorResult);
                            }
                        );

                        return deferred.promise;
                    }
                };
            };

            /***
             * Main DB - API function
             * @returns {*}
             * @constructor
             */

            var DBSrv = function(){

                var fn      = null,
                    name    = null,
                    except  = [],
                    data,
                    settingsObject;

                var addParam = false;

                if(arguments.length > 0){

                    // First parameter should be the name

                    if(angular.isObject(arguments[0]) && arguments[0].name !== undefined){
                        name = arguments[0].name;

                        if(arguments[1] !== undefined){
                            addParam = arguments[1];
                        }

                    }

                    if(angular.isString(arguments[0])){
                        name = arguments[0];
                    }

                    if(name === '$'){

                        // Methods about the system

                        fn = {

                            /***
                             * Returns the "classes" available
                             * @returns {Promise}
                             */

                            classes: function(){

                                var deferred = $q.defer();

                                var keys     = Object.keys(routes);
                                var result   = [];

                                var i        = 0;
                                var l        = 0;

                                if(angular.isDefined(keys) === true) {

                                    l = keys.length;

                                }

                                for(i = 0; i < l; i += 1){

                                    result.push({key:keys[i]});

                                }

                                if(angular.isDefined(result)){
                                    deferred.resolve(result);
                                }

                                return deferred.promise;
                            },

                            /***
                             * Returns the methods for the given "class"
                             * @param name
                             * @returns {Promise}
                             */

                            methods: function(name){

                                var deferred = $q.defer();
                                var route    = null;
                                var keys     = [];
                                var result   = [];

                                var i        = 0;
                                var l        = 0;

                                if(angular.isDefined(routes[name])){

                                    route = routes[name];
                                    keys  = Object.keys(route);

                                    if(angular.isDefined(keys) === true) {

                                        l = keys.length;

                                    }

                                    for(i = 0; i < l; i += 1){

                                        if(keys[i].substr(0,1) === '$'){
                                            result.push({key:keys[i]});
                                        }

                                    }

                                    deferred.resolve(result);

                                } else {

                                    deferred.reject(result);

                                }

                                return deferred.promise;

                            }

                        };

                    }
                    else {

                        if (routes[name] === undefined && addParam === false) {

                            /**
                             * If the first argument is an object the settings-object will be it
                             */

                            settingsObject = $dbSettings.route(name);
                            if (settingsObject === undefined || angular.isObject(arguments[0])) {
                                settingsObject = arguments[0];
                            }

                            routes[name] = new Route(settingsObject);

                            except  = [];
                            data    = $dbSettings.route(name);

                            if (data === undefined && angular.isObject(arguments[0])) {
                                data = settingsObject;
                            }

                            if (data !== undefined && data.except !== undefined) {
                                except = data.except;
                            }

                            if (except.length > 0) {
                                except.forEach(function (value, index) {
                                    if (routes[name][value] !== undefined) {
                                        delete routes[name][value];
                                    }
                                });
                            }

                        } else if (addParam === true) {

                            settingsObject = $dbSettings.route(name);
                            if (settingsObject === undefined || angular.isObject(arguments[0])) {
                                settingsObject = arguments[0];
                            }

                            except  = [];
                            data    = $dbSettings.route(name);

                            if (data === undefined && angular.isObject(arguments[0])) {
                                data = settingsObject;
                            }

                            if (routes[name] === undefined) {

                                routes[name] = new Route(data);

                                if (data !== undefined && data.except !== undefined) {
                                    except = data.except;
                                }

                                if (except.length > 0) {
                                    except.forEach(function (value, index) {
                                        if (routes[name][value] !== undefined) {
                                            delete routes[name][value];
                                        }
                                    });
                                }

                            }

                        }

                        if (angular.isObject(arguments[0]) && arguments[0].name !== undefined && arguments[0].fnName !== undefined) {
                            routes[name][arguments[0].fnName] = arguments[0].fn;
                        }

                        // return the route

                        callerName = name;
                        fn         = routes[name];

                    }

                } else {
                    $log.warn('Please define a Service');
                }

                return fn;

            };

            return DBSrv;

        }
    ]);

    angular.module('ambersive.db').factory('REST',['$q','$log','$http','$dbSettings',
        function($q,$log,$http,$dbSettings){
            var REST = function(params){
                var deferred = $q.defer();

                $http(params)
                    .success(function(data,status,headers,config){
                        deferred.resolve(data,headers);
                    })
                    .error(function(data,status,headers,config){
                        deferred.reject(data,headers);
                    });

                return deferred.promise;
            };
            return REST;
        }
    ]);

})(window, document, undefined);
