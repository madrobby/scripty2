var Exploder = {
  initialize: function() {
    if (this.pieces)
      this.reset();
    this.picture = $('demo');
    this.container = $('wrapper');
    this.setup();
    this.welcome();
  },

  setup: function() {
    this.pieces = [];
    this.origins = [];
    this.positions = [];
    this.draggables = [];
    var w = this.picture.getWidth() / 3, h = this.picture.getHeight() / 3,
        p = { left: 52, top: 52 }, offset = 15, n = 0;
    (3).times(function(i) {
      (3).times(function(j) {
        var origin = { left: p.left + j*w, top: p.top + i*h };
        var piece = new Element('div', { className: 'piece', id: 'piece' + n }).setStyle({
          width: w + 'px',
          height: h + 'px',
          position: 'absolute',
          left: origin.left + 'px',
          top: origin.top + 'px',
          backgroundPosition: '-' + j*w + 'px' + ' -' + i*h + 'px',
          backgroundImage: 'url(' + this.picture.src + ')',
          cursor: 'move'
        });
        var x = p.left + j*w + (j-1) * offset, y = p.top + i*h + (i-1) * offset;
        this.positions.push({ left: x, top: y });
        this.origins.push(origin);
        this.pieces.push(piece);
        this.container.insert(piece);
        this.draggables.push(new Draggable(piece, { 
          onDrag: this.onDrag.bind(this),
          onEnd: this.onDrop.bind(this)
        }));
        n++;
      }, this);
    }, this);
    this.picture.setOpacity(0);
    if (this.overlay) this.overlay.remove();
    this.overlay = new Element('div', { id: 'youwin' }).setStyle({
      width: this.picture.getWidth() + 'px',
      height: this.picture.getHeight() + 'px',
      position: 'absolute',
      left: '50%',
      top: '50%',
      margin: '-198px 0 0 -198px'
    }).hide();
    this.picture.insert({ after: this.overlay });
  },

  renderPositions: function(pieces, options) {
    options = Object.extend({ 
      omitElement: null,
      after: Prototype.emptyFunction,
      positions: this.positions,
      duration: .4
    }, options || {});
    var fx = pieces.map(function(piece, i) {
      if (options.omitElement == piece) {
        return null;
      }
      return new S2.FX.Morph(piece, {
        style: { left: options.positions[i].left + 'px', top: options.positions[i].top + 'px' }
      });
    }, this).compact();
    this.fx = new S2.FX.Parallel(fx, options).play();
  },

  explode: function() {
    this.renderPositions(this.pieces, { 
      transition: 'explode', duration: .4, after: this.shuffle.bind(this)
    });
  },

  shuffle: function() {
    this.pieces = this.pieces.shuffle();
    this.renderPositions(this.pieces, {
      after: function() { this.startTime = new Date().getTime(); }.bind(this)
    });
  },

  reset: function() {
    if (!this.pieces) return;
    if (this.i) clearInterval(this.i);
    this.pieces.each(Element.remove);
    this.pieces = null;
    this.picture.setOpacity(1);
  },
  
  getDragTarget: function(event, draggable) {
    draggable.hide();
    var target = document.elementFromPoint(event.clientX, event.clientY);
    draggable.show();
    return target;
  },
  
  onDrag: function(draggable, event) {
    var target = this.getDragTarget(event, draggable.element);
    if (!target.hasClassName('piece'))
      return;

    if ((this.fx.state == 'finished') && this.reorderTo(target, draggable.element)) {
      this.renderPositions(this.pieces, {
        omitElement: draggable.element,
        duration: .2
      });
    }
  },

  onDrop: function(event, draggable) {
    this.renderPositions(this.pieces, {
      after: this.checkOrder.bind(this)
    });
  },

  reorderTo: function(target, draggable) {
    var sourceIndex = this.pieces.indexOf(draggable),
        targetIndex = this.pieces.indexOf(target),
        orig = this.pieces.clone();
    this.pieces.splice(sourceIndex, 1);
    this.pieces.splice(targetIndex, 0, draggable);
    return orig != this.pieces;
  },

  checkOrder: function() {
    var completed = this.pieces.all(function(piece, i) {
      return parseInt(piece.id.replace(/piece/, '')) == i;
    });
    if (completed) this.youWin();
  },
  
  welcome: function() {
    this.overlay.update(
      '<div id="results">Solve the puzzle by dragging the images!<span id="count_in">3</span></div>'
    ).show().setStyle('opacity:0').appear({ after: function() {
      var seconds = 2;
      Exploder.i = setInterval(function() {
        if (seconds == 0) {
          clearInterval(Exploder.i);
          Exploder.overlay.morph('opacity:0', { after: function() {
            Exploder.overlay.hide();
            Exploder.explode();
          }});
        }
        $('count_in').update(seconds--);
      }, 1000);
    }});
  },

  youWin: function() {
    var gameDuration = ((new Date().getTime() - this.startTime) / 1000).toFixed(1);

    var showResults = function() {
      this.overlay.update(
        '<div id="results">It took you: <span id="count">'+
        gameDuration+
        ' seconds</span> to complete this puzzle.</div>'
      ).insert(
        new Element('div', { id: 'retry' }).observe('click', this.retry.bind(this))
      ).appear();
    }.bind(this);

    this.renderPositions(this.pieces, { 
      positions: this.origins,
      duration: .2,
      after: showResults.bind(this)
    });
  },
  
  retry: function() {
    this.overlay.morph('opacity:0', { after: function() {
      this.overlay.hide();
      this.initialize();
    }.bind(this)});
  }
};

Object.extend(S2.FX.Transitions, {
  explode: function(pos) {
    return 1 - (Math.cos(pos * -5) * Math.exp(-pos * 1));
  }
});

Array.prototype.shuffle = function(){
  return this.sortBy(Math.random);
};

document.ondragstart = function() { return false; };
document.onselectstart = function() { return false; };

var Asset = {
  assets: [],
  
  load: function(url, load) {
    var image = new Image();
    image.src = url;
    this.assets.push({ image: image, load: load || Prototype.emptyFunction });
    this.wait();
  },
  
  wait: function() {
    if (this.interval) return;
    this.interval = setInterval(this.check.bind(this), 10);
  },
  
  check: function() {
    this.assets = this.assets.map(function(asset) {
      if (asset.image.complete) {
        if (asset.load) asset.load(asset.image.src);
        return null;
      } 
      else {
          return asset;
      }
    }).compact();
    
    if (this.assets.length == 0) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
};