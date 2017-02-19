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
}
