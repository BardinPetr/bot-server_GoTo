function ClientController($scope) {
    var socket = io.connect();
    
    $scope.plan_text = '';
    $scope.achiev = ['test1: trrr', 'fdfef: ref'];
    socket.on('connect', function () {
    });
    
    
    socket.on('r_dayplan', function (msg) {
      $scope.plan_text = msg;
      $scope.$apply();
      document.getElementById('plan_input').value = $scope.plan_text;
    });

    $scope.newplan = function newplan() {
      console.log('Sending plan for day:', $scope.plan_text);
      socket.emit('dayplan', $scope.plan_text);
    };
    $scope.getplan = function getplan(){
      socket.emit('req_dayplan', '');
    }    
    
    
    socket.on('r_info', function (msg) {
      $scope.info_text = msg;
      $scope.$apply();
      document.getElementById('info_input').value = $scope.info_text;
    });
    $scope.setinfo = function setinfo() {
      console.log('Sending new info:', $scope.info_text);
      socket.emit('newinfo', $scope.info_text);
    };
    $scope.getinfo = function getinfo(){
      socket.emit('req_info', '');
    }
    
    ////
    socket.on('r_ach', function (msg) {
      $scope.achiev = msg.split('\n');
      $scope.$apply();
    });
    $scope.addach = function addach() {
      console.log('Sending new achievement:', $scope.ach_text);
      socket.emit('newach', $scope.ach_text);
    };
    $scope.getach = function getach(){
      socket.emit('req_ach', '');
    }
    
    ////
    $scope.sendmsg = function sendmsg() {
      console.log('Sending message:', $scope.msg_text);
      socket.emit('newmsg', $scope.msg_text);
    };
    
    ////
    socket.on('time', function (msg) {
      $scope.time_text = msg;
      document.getElementById('time').innerHTML = $scope.time_text;
      $scope.$apply();
    });
}
