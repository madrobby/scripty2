Element.addMethods({
  redraw: function(element){
    var n = document.createTextNode(' ');
    element.appendChild(n);
    (function(){n.parentNode.removeChild(n)}).defer();
  }
});

Ahhh = {  
  rays: function(style, radius, colorFrom, colorTo, opacityFrom, opacityTo, rotate){
    var element = new Element('div',{ className: 'ahhh', style:'z-index:-2;position:absolute;left:55%;top:52%;margin-left:-245px;margin-top:-245px' }).hide(), d = 0;
    $(document.body).insert(element.setOpacity(0).show());
    
    
    element.morph('opacity:1', 5);
  
    setInterval(function(){
      d += 0.001; element.transform({ rotation: d });
    }, 10);
  }
};

Number.prototype.fuzzy = function(value){
  return this+(Math.random()*value)-value/2;
};

Array.prototype.random = function(){
  return this.sortBy(Math.random).first();
};

(function(){
  var t = $w('spring swingTo swingFromTo bounce bouncePast easeOutBounce'),
    nav = $('navigation');
    
  function shuffle(){
    nav.select('li').each(function(box, i){
      box.morph('top:0px;left:'+(i*200)+'px', {
        duration: 2+(Math.random()*2), delay: i/4,
        propertyTransitions: { top: t.random(), left: t.random() }});
    });
  }
  
  nav.select('li').each(function(box,i){
    //var c = Math.cos((0).fuzzy(10)/(180/Math.PI)).toFixed(3), s = Math.sin((0).fuzzy(10)/(180/Math.PI)).toFixed(3),
    //  filter = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand',M11="+c+",M12="+(-s)+",M21="+s+",M22="+c+")";
    //
    //box.setStyle('left:'+(i*200).fuzzy(150)+'px;'+
    //  '-moz-transform:rotate('+(0).fuzzy(10)+'deg);'+
    //  '-webkit-transform:rotate('+(0).fuzzy(10)+'deg);'+
    //  '-webkit-transform:rotate('+(0).fuzzy(10)+'deg);'+
    //  'filter:'+filter);
    //
    //(function(){ box.setStyle('z-index:1'); }).defer();  
  });
  shuffle();
  
  var zIndex = 0;  
  nav.select('li').each(function(n){
    n.observe('mouseenter', function(){
      n.setStyle('z-index:'+(zIndex++)).morph('width:180px;height:180px;margin-top:-10px;margin-left:-10px');
    });
    n.observe('mouseleave', function(){
      n.morph('width:160px;height:160px;margin-top:0px;margin-left:0px');
    });
  });
  
  if(Prototype.Browser.IE) return;
  (function(){
    Ahhh.rays('left:50%;margin-left:-300px;top:40%;margin-top:-220px;width:700px;height:700px;overflow:hidden', 700, "#9ed356", "#97be63", 1, 0, 2.5);
  }).delay(4);
})();

var Shelf = {
  initialize: function() {
    $('footer').morph('bottom:0', { delay: 2, duration: 1, transition: 'easeInQuint' });
    $('breadcrumb').select('li').each(function(li, i) {
      li.observe('mouseenter', this.enter.bind(this)).observe('mouseleave', this.leave.bind(this))
        .morph('margin-top:-60px', { duration: .3+Math.random()*.2, delay: 3, transition: 'easeOutQuint' })
        .morph('margin-top:0', { transition: 'bounce', duration: .5 });
    }, this);
  },
  enter: function(event) {
    event.findElement('li').down('.bubble').appear();
  },
  leave: function(event) {
    var bubble = event.findElement('li').down('.bubble');
    bubble.morph('opacity:0', Element.hide.curry(bubble));
  }
}

Shelf.initialize();