s2.fx.Heartbeat.SlowMotion = Class.create(s2.fx.Heartbeat, {
  initialize: function($super, options) {
    $super(options);
    this.timebase = new Date().getTime();
    this.factor = 1;
    
    document.observe('keydown', this.onKeypress.bind(this));
    document.observe('keyup', this.onKeypress.bind(this));
  },
  
  generateTimestamp: function() {
    return (this.timebase + (new Date().getTime() - this.timebase) / this.factor).floor();
  },
  
  onKeypress: function(event) {
    if(event.shiftKey){
      if(this.factor == 5) return;
      this.timebase = new Date().getTime();
      this.factor = 5;
    } else {
      if(this.factor == 1) return;
      this.timebase = new Date().getTime();
      this.factor = 1;
    }
  }
});