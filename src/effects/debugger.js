S2.FX.Debugger = Class.create({
  initialize: function() {
    this.buildQueueTimeline();
    this.spinnerPosition = 0;
    document.observe('effect:heartbeat', this.renderQueueTimeline.bind(this));
  },
  
  renderQueueTimeline: function() {
    var timestamp = s2.fx.getHeartbeat().getTimestamp();
    $('debug-timeline').innerHTML = 
      this.nextSpinner() + '<br/>' + 
      (new Date(timestamp)).toJSON().gsub(/"/,'') + '.' + (timestamp % 1000).toPaddedString(3) + '<br/>' +
      s2.fx.getQueues().length + ' queue(s), ' +
      s2.fx.getQueues().inject(0, function(memo, queue) {
        return memo + queue.getEffects().length
      }) + ' effect(s)' + '<br/>' +
      s2.fx.getQueues()[0].getEffects().map(function(effect){
        return effect.inspect().escapeHTML();
      }).join('<br/>');
  },
  
  buildQueueTimeline: function() {
    $$('body')[0].insert(
      new Element('div',{ id: 'debug-timeline' }).setStyle({
        position: 'fixed', bottom: '20px', left: '20px', zIndex: '100000', padding: '5px',
        background: '#000', opacity: '0.9', color: '#fff', font: '11px/13px sans-serif'
      })
    );
  },
  
  nextSpinner: function() {
    return $w('| / - \\')[this.spinnerPosition++ % 4];
  }
});

S2.FX.Heartbeat.Stepper = Class.create(S2.FX.Heartbeat, {
  initialize: function(stepSpeed) {
    this.stepSpeed = stepSpeed || 100;
    this.stepDirection = 1;
    this.timestamp = 0;
    
    document.observe('keypress', this.onKeypress.bind(this));
  },
  
  generateTimestamp: function() {
    return this.timestamp + (this.stepSpeed * this.stepDirection);
  },
  
  onKeypress: function(event) {
    if (event.keyCode == Event.KEY_LEFT)
      this.stepDirection = -1;
    else if (event.keyCode == Event.KEY_RIGHT)
      this.stepDirection = 1;
    else return;
    this.beat();
  },
  
  start: Prototype.emptyFunction,
  stop:  Prototype.emptyFunction
});
