$(document).ready(function() {
    Plivo.onWebrtcNotSupported = webrtcNotSupportedAlert;
    Plivo.onReady = onReady;
    Plivo.init();
    Plivo.setDebug(true);

    function webrtcNotSupportedAlert() {
        console.log("NOT SUPPORTED");
    }

    function onReady() {
        console.log("READY");
    }

});

var scotchApp = angular.module('RringoApp', ['ngRoute', 'ngAnimate']);
scotchApp.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $routeProvider
            .when('/login', {
                templateUrl: '/static/login.html',
                controller: 'loginCtrl'
            })
            .when('/online', {
                templateUrl: '/static/take_call.html',
                controller: 'callCtrl'
            })
            .otherwise({
                redirectTo: '/login'
            });
        $locationProvider.html5Mode(true);
    }
]);

scotchApp.controller('mainCtrl', ['$scope', '$route', '$routeParams', '$location', '$interval', '$http',
    function($scope, $route, $routeParams, $location, $interval, $http) {
        this.$route = $route;
        this.$routeParams = $routeParams;
        this.$location = $location;
        $scope.no_calls_waiting = 0;
        $interval(function() {
            $http.get("/calls_waiting/count/").success(function(data) {
                $scope.no_calls_waiting = data;
            });
        }, 5000);
    }
]);

scotchApp.controller('loginCtrl', ['$scope', '$routeParams', '$location',
    function($scope, $routeParams, $location) {
        this.params = $routeParams;
        $scope.hello = "ZXC";
        $scope.login_failed = false;
        $scope.agentId;
        Plivo.onLogin = function() {
            $scope.$apply(function() {
                Plivo["connected"] = true;
                Plivo["agentId"] = $scope.agentId;
                $location.path('/online');
            });
        }
        Plivo.onLoginFailed = function() {
            $scope.$apply(function() {
                $scope.login_failed = true;
            });
        }
        $scope.sipLogin = function() {
            $scope.agentId = $scope.sip;
            Plivo.conn.login($scope.sip, $scope.pass);
        }
    }
]);

scotchApp.controller('callCtrl', ['$scope', '$routeParams', '$http', '$location', '$timeout',
    function($scope, $routeParams, $http, $location, $timeout) {
        this.name = "callCtrl";
        this.params = $routeParams;
        $scope.answerButtonEnabled = false;
        $scope.readyToTakeCall = false;
        $scope.agentBusy = false;
        $scope.isPlivoConnected = function() {
            return Plivo.connected;
        }
        $scope.agentReady = function() {
            $scope.message = "Registering with server";
            $http.get("/agent/" + Plivo.agentId).success(function(data) {
                $scope.readyToTakeCall = true;
                $scope.message = "Registerd. Waiting for Call."
            });
        }
        Plivo.onIncomingCall = function() {
            $scope.$apply(function() {
                $scope.message = "Incoming call... Attend."
                $scope.answerButtonEnabled = true;
                $scope.readyToTakeCall = false;
            });

        }
        $scope.answerCall = function() {
            $scope.agentBusy = true;
            Plivo.conn.answer();
            $scope.answerButtonEnabled = false;
            $scope.message = "Wait for message";
        }
        Plivo.onIncomingCallFailed = function() {
            $scope.$apply(function() {
                console.log("KICK");
                $scope.agentBusy = false;
                $scope.message = "Call over. Press Ready button to get more calls."
                $scope.answerButtonEnabled = false;
            });
        }
        $scope.hangUP = function() {
            $timeout(function() {
                Plivo.conn.hangup();
            }, 0);
        }
        Plivo.onCallTerminated = Plivo.onIncomingCallFailed;
        Plivo.onCallEnded = Plivo.onIncomingCallFailed;
        $scope.logout = function() {
            Plivo.conn.hangup();
            Plivo.conn.logout();
            Plivo["connected"] = false;
            $location.path("/login");
        }
    }
]);
