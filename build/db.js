/**
 * Database Service for AngularJS
 * @version v0.0.1.0
 * @link http://www.ambersive.com
 * @licence MIT License, http://www.opensource.org/licenses/MIT
 */

(function(window, document, undefined) {

    'use strict';

    angular.module('ambersive.db',[]);

    angular.module('ambersive.db').factory('authenticationInjector', ['$injector', '$q','$log','$dbSettings','$timeout',
        function ($injector, $q,$log,$dbSettings,$timeout) {
            var authenticationInjector = {
                request: function (config) {

                    var deferred = $q.defer();

                    $log.log(config);

                    $timeout(function(){
                        deferred.resolve(config);
                    },100);

                    return deferred.promise;
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
                tokenType       = 'Bearer',
                tokenName       = '',
                routes          = {};

            // Setter

            var registerRoute = function(name,settings){
                routes[name] = settings;
                return routes;
            };

            var getRoute = function(name){
                return routes[name];
            };

            var setBaseUrl = function(name){
                baseUrl = name;
            };

            var setContentType = function(type){
                contentType = type;
            };

            // Getter

            return {
                register:registerRoute,
                setBaseUrl:setBaseUrl,
                setContentType:setContentType,
                $get: function () {
                    return {
                        baseUrl:baseUrl,
                        contentType:contentType,
                        routes:routes,
                        route:getRoute
                    };
                }
            };
        }
    ]);

    angular.module('ambersive.db').factory('DB',['$q','$log','$http','$dbSettings',
        function($q,$log,$http,$dbSettings){

            var routes = {},
                getParams = function(method,obj){

                    var params = {
                      method:method.toUpperCase()
                    };

                    var baseUrl     = $dbSettings.baseUrl,
                        seperator   = '/',
                        url         = '';

                    if(obj !== undefined && obj.baseUrl !== undefined){
                        baseUrl = obj.baseUrl;
                    }

                    if(obj !== undefined && obj.url !== undefined){
                        url = obj.url;
                    }

                    if(baseUrl !== undefined && baseUrl.length > 0 && baseUrl.slice(-1) === seperator){
                        seperator = '';
                    } else {
                        baseUrl = '/';
                    }

                    switch(method){
                        default:
                            params.url = baseUrl+seperator+url;
                            break;
                    }

                    // Headers

                    params.headers = {};

                    params.headers['Content-Type'] = $dbSettings.contentType;

                    if(obj.contentType !== undefined){
                        params.headers['Content-Type'] = obj.contentType;
                    }

                    return params;

                };

            var Route = function(settingsObj){
                return {
                    get:function(){
                        var deferred = $q.defer(),
                            params = getParams('get',settingsObj);

                        $http(params)
                            .success(function(data,status,headers,config){
                                deferred.resolve(data);
                            })
                            .error(function(data,status,headers,config){
                                deferred.reject(data);
                            });

                        return deferred.promise;
                    },
                    getById:function(id){
                        var deferred = $q.defer(),
                            params = getParams('get',settingsObj);

                        params.url += '/'+id;

                        $http(params)
                            .success(function(data,status,headers,config){
                                deferred.resolve(data);
                            })
                            .error(function(data,status,headers,config){
                                deferred.reject(data);
                            });

                        return deferred.promise;
                    },
                    update:function(id,data){
                        var deferred = $q.defer(),
                            params = getParams('put',settingsObj);

                        params.url += '/'+id;

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

                var fn = null,
                    name = null;

                if(arguments.length > 0){

                    // First parameter should be the name

                    if(angular.isObject(arguments[0]) && arguments[0].name !== undefined){
                        name = arguments[0].name;
                    }

                    if(angular.isString(arguments[0])){
                        name = arguments[0];
                    }

                    if(routes[name] === undefined){
                        routes[name] = new Route($dbSettings.route(name));

                        var except = [],
                            data = $dbSettings.route(name);

                        if(data !== undefined && data.except !== undefined){ except = data.except; }

                        if(except.length > 0){
                            except.forEach(function(value,index){
                                if(routes[name][value] !== undefined) {
                                    delete routes[name][value];
                                }
                            });
                        }

                    }

                    if(angular.isObject(arguments[0]) && arguments[0].name !== undefined){
                        routes[name][arguments[0].fnName] = arguments[0].fn;
                    }

                    // return the route

                    fn = routes[name];

                } else {
                    $log.warn('Please define a Service');
                }

                return fn;

            };

            return DBSrv;

        }
    ]);


})(window, document, undefined);