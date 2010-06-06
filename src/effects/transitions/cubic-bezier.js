/*!
 *  Copyright (c) 2006 Apple Computer, Inc. All rights reserved.
 *  
 *  Redistribution and use in source and binary forms, with or without 
 *  modification, are permitted provided that the following conditions are met:
 *  
 *  1. Redistributions of source code must retain the above copyright notice, 
 *  this list of conditions and the following disclaimer.
 *  
 *  2. Redistributions in binary form must reproduce the above copyright notice, 
 *  this list of conditions and the following disclaimer in the documentation 
 *  and/or other materials provided with the distribution.
 *  
 *  3. Neither the name of the copyright holder(s) nor the names of any 
 *  contributors may be used to endorse or promote products derived from 
 *  this software without specific prior written permission.
 *  
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 
 *  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, 
 *  THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE 
 *  FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES 
 *  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; 
 *  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON 
 *  ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT 
 *  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS 
 *  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function(){
  // port of webkit cubic bezier handling by http://www.netzgesta.de/dev/
  function CubicBezierAtTime(t,p1x,p1y,p2x,p2y,duration) {
    var ax=0,bx=0,cx=0,ay=0,by=0,cy=0;
    function sampleCurveX(t) {return ((ax*t+bx)*t+cx)*t;};
    function sampleCurveY(t) {return ((ay*t+by)*t+cy)*t;};
    function sampleCurveDerivativeX(t) {return (3.0*ax*t+2.0*bx)*t+cx;};
    function solveEpsilon(duration) {return 1.0/(200.0*duration);};
    function solve(x,epsilon) {return sampleCurveY(solveCurveX(x,epsilon));};
    function fabs(n) {if(n>=0) {return n;}else {return 0-n;}};
    function solveCurveX(x,epsilon) {
      var t0,t1,t2,x2,d2,i;
      for(t2=x, i=0; i<8; i++) {x2=sampleCurveX(t2)-x; if(fabs(x2)<epsilon) {return t2;} d2=sampleCurveDerivativeX(t2); if(fabs(d2)<1e-6) {break;} t2=t2-x2/d2;}
      t0=0.0; t1=1.0; t2=x; if(t2<t0) {return t0;} if(t2>t1) {return t1;}
      while(t0<t1) {x2=sampleCurveX(t2); if(fabs(x2-x)<epsilon) {return t2;} if(x>x2) {t0=t2;}else {t1=t2;} t2=(t1-t0)*.5+t0;}
      return t2; // Failure.
    };
    cx=3.0*p1x; bx=3.0*(p2x-p1x)-cx; ax=1.0-cx-bx; cy=3.0*p1y; by=3.0*(p2y-p1y)-cy; ay=1.0-cy-by;
    return solve(t, solveEpsilon(duration));
  }
  /**
   *  S2.FX.cubicBezierTransition(x1, y1, x2, y2) -> Function
   *
   *  Generates a transition easing function that is compatible
   *  with WebKit's CSS transitions `-webkit-transition-timing-function`
   *  CSS property.
   *
   *  The W3C has more information about 
   *  <a href="http://www.w3.org/TR/css3-transitions/#transition-timing-function_tag">
   *  CSS3 transition timing functions</a>.
  **/
  S2.FX.cubicBezierTransition = function(x1, y1, x2, y2){
    return (function(pos){
      return CubicBezierAtTime(pos,x1,y1,x2,y2,1);
    });
  }
})();

/**
 *  S2.FX.Transitions.webkitCubic(pos) -> Number
 *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
 *
 *  The default WebKit CSS transition easing function.
 * 
 *  <div class="transition"></div>
**/
S2.FX.Transitions.webkitCubic = 
  S2.FX.cubicBezierTransition(0.25,0.1,0.25,1);
/**
 *  S2.FX.Transitions.webkitEaseInOut(pos) -> Number
 *  - pos (Number): position between 0 (start of effect) and 1 (end of effect)
 *
 *  The WebKit CSS transition "ease-in-out" easing function.
 * 
 *  <div class="transition"></div>
**/
S2.FX.Transitions.webkitEaseInOut =
  S2.FX.cubicBezierTransition(0.42,0.0,0.58,1.0);