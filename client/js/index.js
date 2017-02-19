function ClientController($scope) {
    var socket = io.connect();
    
    $scope.plan_text = '';

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
      $scope.text = '';
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
      $scope.text = '';
    };
    $scope.getplan = function getplan(){
      socket.emit('req_info', '');
    }
    
    $scope.sendmsg = function sendmsg() {
      console.log('Sending message:', $scope.msg_text);
      socket.emit('newmsg', $scope.msg_text);
      $scope.text = '';
    };
}
