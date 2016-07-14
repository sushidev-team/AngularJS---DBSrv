/**
 * Database Service for AngularJS
 * @version v0.0.1.0
 * @link http://www.ambersive.com
 * @licence MIT License, http://www.opensource.org/licenses/MIT
 */

(function(window, document, undefined) {

    'use strict';

    angular.module('ambersive.db',[]);

    angular.module('ambersive.db', []).config(function ($provide) {
        $provide.decorator("$exceptionHandler", function ($delegate, $injector) {
            return function (exception, cause) {

                $delegate(exception,cause);

            };
        });
    });

    angular.module('ambersive.db').factory('authenticationInjector', ['$injector', '$q','$log','$dbSettings','$timeout',
        function ($injector, $q,$log,$dbSettings,$timeout) {
            var authenticationInjector = {
                request: function (config) {

                    var deferred    = $q.defer(),
                        storageName = $dbSettings.storageName,
                        storageLang = $dbSettings.storageLang,
                        tokenName   = $dbSettings.tokenName,
                        tokenType   = $dbSettings.tokenType,
                        tokenData   = null,
                        langData    = null,
                        fn          = function(config){
                            deferred.resolve(config);
                        };

                    if(storageName === undefined || storageName === '' || storageName.length === 0){
                        $log.warn('ambersive.db: LocalStorage name is not set');
                    }

                    if(typeof(Storage) !== "undefined") {
                        tokenData = localStorage.getItem(storageName);
                        langData = localStorage.getItem(storageLang);
                    } else {
                        $log.warn('ambersive.db: this browser doesn\'t support localStorage');
                    }

                    config.headers[tokenName]   = tokenType+' '+tokenData;

                    if(langData !== null) {

                        config.headers['Accept-Language'] = langData;

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

    angular.module('ambersive.db').config(['$httpProvider',
        function($httpProvider) {
            $httpProvider.interceptors.push('authenticationInjector');
        }
    ]);

    angular.module('ambersive.db').provider('$dbSettings',[
        function(){

            var baseUrl         = '',
                contentType     = 'application/json; charset=utf-8;',
                storageName     = 'accessToken',
                storageLang     = 'language',
                tokenType       = 'Bearer',
                tokenName       = 'Authorization',
                databaseName    = 'AMBERSIVE.DB',
                routes          = {};

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

            // Getter

            return {
                register:registerRoute,
                setBaseUrl:setBaseUrl,
                setContentType:setContentType,
                setTokenAttribute:setTokenAttribute,
                setStorageName:setStorageName,
                setStorageLang:setStorageLang,
                setDatabaseName:setDatabaseName,
                $get: function () {
                    return {
                        baseUrl:baseUrl,
                        contentType:contentType,
                        routes:routes,
                        route:getRoute,
                        storageName:storageName,
                        storageLang:storageLang,
                        tokenName:tokenName,
                        tokenType:tokenType,
                        databaseName:databaseName
                    };
                }
            };
        }
    ]);

    angular.module('ambersive.db').factory('DB',['$q','$log','$http','$dbSettings',
        function($q,$log,$http,$dbSettings){

            var callerName = '';

            var routes = {},
                getParams = function(method,obj){

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
                            params.url = baseUrl+seperator+url;
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

            var Route = function(settingsObj){
                return {
                    $has:function(name){

                        var deferred = $q.defer();

                        if(routes[callerName] === undefined || routes[callerName][name] === undefined){
                            deferred.resolve(false);
                        } else {
                            deferred.resolve(true);
                        }

                        return deferred.promise;
                        
                    },
                    get:function(){
                        var deferred = $q.defer(),
                            params = getParams('get',settingsObj);

                        var argumentsData   = arguments,
                            argumentsLength = argumentsData.length;

                        if(argumentsLength > 0){
                            for(var i=0;i<argumentsLength;i++){

                                if(angular.isNumber(arguments[i])){
                                    params.url += '/'+arguments[i];
                                }
                                else if(angular.isObject(arguments[i])){

                                    var counter = 0;

                                    for(var param in arguments[i]){

                                        var seperator = '&';

                                        if(counter === 0){
                                            seperator = '?';
                                        }

                                        params.url += seperator+param+'='+arguments[i][param];
                                        counter++;

                                    }

                                } else {
                                    continue;
                                }

                            }
                        }

                        $http(params)
                            .success(function(data,status,headers,config){
                                deferred.resolve(data,headers);
                            })
                            .error(function(data,status,headers,config){
                                deferred.reject(data,headers);
                            });

                        return deferred.promise;
                    },
                    getById:function(id){
                        var deferred = $q.defer(),
                            params = getParams('get',settingsObj);

                        params.url += '/'+id;

                        $http(params)
                            .success(function(data,status,headers,config){
                                deferred.resolve(data,headers);
                            })
                            .error(function(data,status,headers,config){
                                deferred.reject(data,headers);
                            });

                        return deferred.promise;
                    },
                    update:function(id,data){
                        var deferred = $q.defer(),
                            params = getParams('put',settingsObj);

                        params.url  += '/'+id;
                        params.data = data;

                        $http(params)
                            .success(function(data,status,headers,config){
                                deferred.resolve(data);
                            })
                            .error(function(data,status,headers,config){
                                deferred.reject(data);
                            });

                        return deferred.promise;
                    },
                    create:function(data){
                        var deferred = $q.defer(),
                            params = getParams('post',settingsObj);

                        params.data = data;

                        $http(params)
                            .success(function(data,status,headers,config){
                                deferred.resolve(data);
                            })
                            .error(function(data,status,headers,config){
                                deferred.reject(data);
                            });

                        return deferred.promise;
                    },
                    delete:function(id){
                        var deferred = $q.defer(),
                            params = getParams('delete',settingsObj);

                        params.url += '/'+id;

                        $http(params)
                            .success(function(data,status,headers,config){
                                deferred.resolve(data);
                            })
                            .error(function(data,status,headers,config){
                                deferred.reject(data);
                            });

                        return deferred.promise;
                    }
                };
            };

            var DBSrv = function(){

                var fn      = null,
                    name    = null,
                    except  = [],
                    data,
                    settingsObject;

                if(arguments.length > 0){
 
                    var addParam = false;

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

                    if(routes[name] === undefined && addParam === false){
 
                        /**
                         * If the first argument is an object the settings-object will be it
                         */

                        settingsObject = $dbSettings.route(name);
                        if(settingsObject === undefined || angular.isObject(arguments[0])){
                            settingsObject = arguments[0];
                        }

                        routes[name] = new Route(settingsObject);

                        except  = [];
                        data    = $dbSettings.route(name);

                        if(data === undefined && angular.isObject(arguments[0])){
                            data = settingsObject;
                        }

                        if(data !== undefined && data.except !== undefined){ except = data.except; }

                        if(except.length > 0){
                            except.forEach(function(value,index){
                                if(routes[name][value] !== undefined) {
                                    delete routes[name][value];
                                }
                            });
                        }

                    } else if (addParam === true){

                        settingsObject = $dbSettings.route(name);
                        if(settingsObject === undefined || angular.isObject(arguments[0])){
                            settingsObject = arguments[0];
                        }

                        except = [];
                        data = $dbSettings.route(name);


                        if(data === undefined && angular.isObject(arguments[0])){
                            data = settingsObject;
                        }

                        if(routes[name] === undefined){

                            routes[name] = new Route(data);

                            if(data !== undefined && data.except !== undefined){ except = data.except; }

                            if(except.length > 0){
                                except.forEach(function(value,index){
                                    if(routes[name][value] !== undefined) {
                                        delete routes[name][value];
                                    }
                                });
                            }

                        }

                    }

                    if(angular.isObject(arguments[0]) && arguments[0].name !== undefined && arguments[0].fnName !== undefined){
                        routes[name][arguments[0].fnName] = arguments[0].fn;
                    }

                    // return the route

                    callerName = name;

                    fn = routes[name];

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