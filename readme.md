# RESTful (Version 2) - AngularJS Service

An AngularJS (1.5+) service for using simple useage of RESTful Webservices with an build-in auto-mechanism for detecting access tokens.
With this module you can access the RESTful API in a readable way.

This module also includes also an automation for canceling previous api requests if a new api call with the same data is triggered before the old request is resolved.
For this feature you need to use the DBHelper Service (wrapper with extra functions for $http) included in this package.

Otherwise the request will be made but the older related promise won't be resolved cause every request will get an request-ID. If the request ID does not belong to the latest call the promise will not be resolved at all (even errors).

Please be aware that the standard declarations for get/post/put/delete are based an this DBHelper.execute method.

This module will be maintained by www.ambersive.com

### Version
1.0.0.4

### Installation

#### Step 1

```sh
$ bower install ambersive-db
```
#### Step 2
You first have to declare the 'ambersive.db' module dependency inside your app module (perhaps inside your app main module).

```sh
angular.module('app', ['ambersive.db']);
```

### Configuration

First you need to register an api-route. You can do that via config:

```sh
 angular.module('app', ['ambersive.db','ngRoute'])
        .config(['$dbSettingsProvider',
            function ($dbSettingsProvider) {

                $dbSettingsProvider.setBaseUrl('API-BASE-URL');

                $dbSettingsProvider.register('NAME',{'url':'api/v1/pages',except:[]});

            }
        ]);

```
or you can define a route "on-the-fly" by passing an object:

```sh
 angular.module('app').controller('DemoController',
    function($scope,DB,$q,$timeout){

        DB({name:'GITHUB',fnName:custom,fn:function(){
            var deferred = $q.defer();

            // deferred.resolve(data);

            return deferred.promise;
        }).custom().then(successFN,errorFN);

    }
 ]);

```

You can check if a function exists with the $has(name)

```sh
 angular.module('app').controller('DemoController',
    function($scope,DB,$q,$timeout){

        DB({name:'GITHUB',fnName:custom,fn:function(){
            var deferred = $q.defer();

            // deferred.resolve(data);

            return deferred.promise;
        }).$has(FUNCTIONNAME).then(function(booleanResult){

        });

    }
 ]);

```

### Definig an Api (with DBHelper)

This declaration also includes automatic api $http cancelation for api calls.

```sh
 angular.module('moduleName').run(['DB','$q','DBHelper',
     function(DB,$q,DBHelper){

         // Register the api call an run

         DB({
             name:'Github',
             fnName:'test',
             fn:function(params){

                 // Defining the actual action

                 var deferred = $q.defer(),
                     httpObj  = {method:'GET',url:'http://jsonplaceholder.typicode.com/posts',params:params};

                 DBHelper.execute(httpObj{
                   fn: function(){

                       console.error('we are currently offline');

                   },
                   stop:false
                 }).then(
                     function(data,status,headers,config){
                         deferred.resolve(data,headers);
                     },
                     function(data,status,headers,config){
                         deferred.reject(data,headers);
                     }
                 );

                 return deferred.promise;
             }
        }, true

    }
]);  
```

### Definig an Api (without DBHelper)

```sh

 angular.module('moduleName').run(['DB', '$http', '$q',
     function(DB, $http, $q){

         // Register the api call an run

         DB(
             {
                 name:'API NAME',
                 fnName:'METHODNAME',
                 fn:function(data){

                    // Defining the actual action

                     var deferred = $q.defer(),
                         params   = {method:'GET',url:'URL GOES HER'};

                     $http(params)
                         .success(function(data,status,headers,config){
                             deferred.resolve(data,headers);
                         })
                         .error(function(data,status,headers,config){
                             deferred.reject(data,headers);
                         });

                     return deferred.promise;
                 }
             }, true
         );

    }
]);         

```

### Useage

Please notice that the get function always offers the change to add an ID and/or querystring params (as object).

```sh
angular.module('app').controller('DemoController', function($scope, DB) {

    var failed = function(data){
       console.log(arguments);
    };

    var queryStringParams = {
        action:'copy'
    };

    DB('Github').$has('get').then(function(bResult){
            console.log(bResult);
        },failed);

    DB('Github').get(queryStringParams).then(function(result){
        console.log(result);
    },failed);

    DB('Github').get(10,queryStringParams).then(function(result){
        console.log(result);
    },failed);

    DB('Github').get({page:1}).then(function(result){
            console.log(result);
        },failed);

    DB('Github').getById(10).then(function(result){
        console.log(result);
    },failed);

    DB('Github').delete(10,queryStringParams).then(function(result){
        console.log(result);
    },failed);

    DB('Github').update(10,{},queryStringParams).then(function(result){
        console.log(result);
    },failed);

    DB('Github').create({},queryStringParams).then(function(result){
        console.log(result);
    },failed);

    // SYSTEM methods

    DB('$').classes().then(function(result){
       console.log(result);
    },failed);

    DB('$').methods('Github').then(function(result){
           console.log(result);
    },failed);

});
```

Please notice, that a stored access token will be added to every request. If available in the response header it will be stored in the localstorage.

### Options

Currently the module offers some possibilities to delete predefined functions.

The following example removes the get & getById function.

```sh
 angular.module('app', ['ambersive.db','ngRoute'])
        .config(['$dbSettingsProvider',
            function ($dbSettingsProvider) {

                $dbSettingsProvider.register('NAME',{'url':'api/v1/pages',except:['get','getById']});

            }
        ]);

```
### Settings

The following variables can be set:

```sh
 angular.module('app', ['ambersive.db','ngRoute'])
        .config(['$dbSettingsProvider',
            function ($dbSettingsProvider) {

                $dbSettingsProvider.register('NAME',{'url':'api/v1/pages',except:['get','getById']});
                $dbSettingsProvider.setBaseUrl(value);
                $dbSettingsProvider.setContentType(value);
                $dbSettingsProvider.setTokenAttribute(value);
                $dbSettingsProvider.setStorageName(value);

            }
        ]);

```

```sh
 angular.module('app', ['ambersive.db'])
        .controller('DemoController',function($scope,$dbSettings){

            var baseUrl         = $dbSettings.baseUrl,
                contentType     = $dbSettings.contentType,
                routes          = $dbSettings.routes,
                storageName     = $dbSettings.storageName,
                tokenName       = $dbSettings.tokenName,
                tokenType       = $dbSettings.tokenType;

        ]);

```

License
----
MIT

### Changelog

1.0.0: Add DBHelper.execute to reduce network requests and stop the problems of getting old results into the resolve
1.0.0.1 - 1.0.0.4: Bugfixing the DBHelper.execute. Create seperat promise to handle the api call. Add support for handling offline events
