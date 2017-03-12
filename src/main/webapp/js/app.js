angular.module('exampleApp', ['ngRoute', 'ngCookies', 'exampleApp.services'])
	.config(
		[ '$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
			
			$routeProvider.when('/news/create', {
				templateUrl: 'partials/news/create.html',
				controller: NewsCreateController
			});
			
			$routeProvider.when('/news/edit/:id', {
				templateUrl: 'partials/news/edit.html',
				controller: NewsEditController
			});
			
			$routeProvider.when('/user/create', {
				templateUrl: 'partials/user/create.html',
				controller: UserCreateController
			});
			
			$routeProvider.when('/user/edit/:id', {
				templateUrl: 'partials/user/edit.html',
				controller: UserEditController
			});
			
			$routeProvider.when('/user', {
				templateUrl: 'partials/user/index.html',
				controller: UserIndexController
			});

			$routeProvider.when('/login', {
				templateUrl: 'partials/login.html',
				controller: LoginController
			});
			
			$routeProvider.otherwise({
				templateUrl: 'partials/news/index.html',
				controller: NewsIndexController
			});
			
			$locationProvider.hashPrefix('!');
			
			/* Register error provider that shows message on failed requests or redirects to login page on
			 * unauthenticated requests */
		    $httpProvider.interceptors.push(function ($q, $rootScope, $location) {
			        return {
			        	'responseError': function(rejection) {
			        		var status = rejection.status;
			        		var config = rejection.config;
			        		var method = config.method;
			        		var url = config.url;
			      
			        		if (status == 401) {
			        			$location.path( "/login" );
			        		} else {
			        			$rootScope.error = method + " on " + url + " failed with status " + status;
			        		}
			              
			        		return $q.reject(rejection);
			        	}
			        };
			    }
		    );
		    
		    /* Registers auth token interceptor, auth token is either passed by header or by query parameter
		     * as soon as there is an authenticated user */
		    $httpProvider.interceptors.push(function ($q, $rootScope, $location) {
		        return {
		        	'request': function(config) {
		        		var isRestCall = config.url.indexOf('rest') == 0;
		        		if (isRestCall && angular.isDefined($rootScope.accessToken)) {
		        			var accessToken = $rootScope.accessToken;
		        			if (exampleAppConfig.useAccessTokenHeader) {
		        				config.headers['X-Access-Token'] = accessToken;
		        			} else {
		        				config.url = config.url + "?token=" + accessToken;
		        			}
		        		}
		        		return config || $q.when(config);
		        	}
		        };
		    }
	    );
		   
		} ]
		
	).run(function($rootScope, $location, $cookieStore, UserService) {
		
		/* Reset error when a new view is loaded */
		$rootScope.$on('$viewContentLoaded', function() {
			delete $rootScope.error;
		});
		
		$rootScope.hasRole = function(role) {
			
			if ($rootScope.user === undefined) {
				return false;
			}
			
			if ($rootScope.user.roles[role] === undefined) {
				return false;
			}
			
			return $rootScope.user.roles[role];
		};
		
		$rootScope.logout = function() {
			delete $rootScope.user;
			delete $rootScope.accessToken;
			$cookieStore.remove('accessToken');
			$location.path("/login");
		};
		
		 /* Try getting valid user from cookie or go to login page */
		var originalPath = $location.path();
		$location.path("/login");
		var accessToken = $cookieStore.get('accessToken');
		if (accessToken !== undefined) {
			$rootScope.accessToken = accessToken;
			UserService.currentUser(function(user) {
				$rootScope.user = user;
				$location.path(originalPath);
			});
		}
		
		$rootScope.initialized = true;
	});


function NewsIndexController($scope, NewsService) {
	
	$scope.newsEntries = NewsService.query();
	
	$scope.deleteEntry = function(newsEntry) {
		newsEntry.$remove(function() {
			$scope.newsEntries = NewsService.query();
		});
	};
};


function NewsEditController($scope, $routeParams, $location, NewsService) {

	$scope.newsEntry = NewsService.get({id: $routeParams.id});
	
	$scope.save = function() {
		$scope.newsEntry.$save(function() {
			$location.path('/');
		});
	};
};


function NewsCreateController($scope, $location, NewsService) {
	
	$scope.newsEntry = new NewsService();
	
	$scope.save = function() {
		$scope.newsEntry.$save(function() {
			$location.path('/');
		});
	};
};


function UserIndexController($scope, UserService) {
	
	$scope.users = UserService.query();
	$scope.getUserRoles = function(user) {
		return user.roles.join(", ");
	}
	
	$scope.deleteUser = function(user) {
		user.$remove(function() {
			$scope.users = UserService.query();
		});
	};
};


function UserEditController($scope, $routeParams, $location, UserService) {

	$scope.user = UserService.get({id: $routeParams.id});
	
	$scope.save = function() {
		$scope.user.$save(function() {
			$location.path('/user');
		});
	};
};


function UserCreateController($scope, $location, UserService) {
	
	$scope.user = new UserService();
	
	$scope.save = function() {
		$scope.user.$save(function() {
			$location.path('/user');
		});
	};
};



function LoginController($scope, $rootScope, $location, $cookieStore, UserService) {
	
	$scope.rememberMe = false;
	
	$scope.login = function() {
		UserService.authenticate($.param({username: $scope.username, password: $scope.password}), function(authenticationResult) {
			var accessToken = authenticationResult.token;
			$rootScope.accessToken = accessToken;
			if ($scope.rememberMe) {
				$cookieStore.put('accessToken', accessToken);
			}
			UserService.currentUser(function(user) {
				$rootScope.user = user;
				$location.path("/");
			});
		});
	};
};


var services = angular.module('exampleApp.services', ['ngResource']);

services.factory('UserService', function($resource) {
	
	return $resource('rest/user/:action:id', {id: '@id'},
			{
				authenticate: {
					method: 'POST',
					params: {'action' : 'authenticate'},
					headers : {'Content-Type': 'application/x-www-form-urlencoded'}
				},
				currentUser: {
					method: 'GET',
					params: {'action' : 'currentUser'},
					headers : {'Content-Type': 'application/x-www-form-urlencoded'}
				},
			}
		);
});

services.factory('NewsService', function($resource) {
	
	return $resource('rest/news/:id', {id: '@id'});
});
