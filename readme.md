# RESTful (Version 2) - AngularJS Service

An AngularJS (1.5) service for using simple useage of RESTful Webservices with an build-in auto-mechanism for detecting access tokens.
With this module you can access the RESTful API in a readable way.

Please notice this module is still under construction.

This module will be maintained by www.ambersive.com

### Version
0.0.2.7

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
        }).custom

    }
 ]);

```

### Useage

```sh
angular.module('app').controller('DemoController', function($scope, DB) {

    var failed = function(data){
       console.log(arguments);
    };

    DB('Github').get().then(function(result){
        console.log(result);
    },failed);

    DB('Github').getById(10).then(function(result){
        console.log(result);
    },failed);

    DB('Github').delete(10).then(function(result){
        console.log(result);
    },failed);

    DB('Github').update(10,{}).then(function(result){
        console.log(result);
    },failed);

    DB('Github').create({}).then(function(result){
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