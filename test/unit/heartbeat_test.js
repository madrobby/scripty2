new Test.Unit.Runner({
  setup: function(){
    frameCounter = 0;
  },
  
  testHeartbeat: function() { with(this) {
    var tmp = 0, tmp2 = 0;
    document.observe('effect:heartbeat', function(){
      tmp++;
    });
    assertEqual(0, tmp);
    wait(250, function(){
      assertEqual(0, tmp);
      new S2.FX.Morph('sandbox',{style:'font-size:20px',duration:.5}).play();
      wait(750, function(){
        assert(tmp > 0);
        tmp2 = tmp;
        wait(100, function(){
          assertEqual(tmp2, tmp, "heartbeats shouldn't continue when no fx running");
        });
      });
    });
  }},
  
  testHeartbeatFramerate: function(){ with(this) {
    var oldHeartbeat = S2.FX.getHeartbeat();
    oldHeartbeat.stop();
    delete oldHeartbeat;
    
    var heartbeat = new S2.FX.Heartbeat({framerate:2}), frameCounter = 0;
    S2.FX.setHeartbeat(heartbeat);
    var o = function(){ frameCounter++; };
    document.observe('effect:heartbeat', o);
    
    $('sandbox').morph('font-size:10px');
    wait(1100, function(){
      assertEqual(2, frameCounter);
      document.stopObserving('effect:heartbeat', o);
      heartbeat.stop();
      delete heartbeat;
    });
  }}
});