// $Id$

/**
 * @file
 * Contains the DropOutLeft and DropInLeft effects and the methods they depend
 * on. Taken from Interface Elements for jQuery. (http://interface.eyecon.ro)
 */


/**
 * Validates elements that can be animated
 */
jQuery.fxCheckTag = function(e)
{
	if (/^tr$|^td$|^tbody$|^caption$|^thead$|^tfoot$|^col$|^colgroup$|^th$|^body$|^header$|^script$|^frame$|^frameset$|^option$|^optgroup$|^meta$/i.test(e.nodeName) )
		return false;
	else 
		return true;
};

/**
 * CSS rules that can be animated
 */
jQuery.fx.cssProps = {
    borderBottomWidth:1,
    borderLeftWidth:1,
    borderRightWidth:1,
    borderTopWidth:1,
    bottom:1,
    fontSize:1,
    height:1,
    left:1,
    letterSpacing:1,
    lineHeight:1,
    marginBottom:1,
    marginLeft:1,
    marginRight:1,
    marginTop:1,
    maxHeight:1,
    maxWidth:1,
    minHeight:1,
    minWidth:1,
    opacity:1,
    outlineOffset:1,
    outlineWidth:1,
    paddingBottom:1,
    paddingLeft:1,
    paddingRight:1,
    paddingTop:1,
    right:1,
    textIndent:1,
    top:1,
    width:1,
    zIndex:1
};

/**
 * Overwrite animation to use new FX function
 */
jQuery.fn.extend({
	
	animate: function( prop, speed, easing, callback ) {
		return this.queue(function(){
			var opt = jQuery.speed(speed, easing, callback);
			var e = new jQuery.fxe( this, opt, prop );
			
		});
	},
	pause: function(speed, callback) {
		return this.queue(function(){
			var opt = jQuery.speed(speed, callback);
			var e = new jQuery.pause( this, opt );
		});
	},
	stop : function(step) {
		return this.each(function(){
			if (this.animationHandler)
				jQuery.stopAnim(this, step);
			
		});
	},
	stopAll : function(step) {
		return this.each(function(){
			if (this.animationHandler)
				jQuery.stopAnim(this, step);
			if ( this.queue && this.queue['fx'] )
				this.queue.fx = [];
		});
	}
});
/**
 * Improved FXC function that aniamtes collection of properties per timer. Accepts inline styles and class names to animate
 */
jQuery.extend({
	pause: function(elem, options)
	{
		var z = this, values;
		z.step = function()
		{
			if ( jQuery.isFunction( options.complete ) )
				options.complete.apply( elem );
		};
		z.timer=setInterval(function(){z.step();},options.duration);
		elem.animationHandler = z;
	},
	easing :  {
		linear: function(p, n, firstNum, delta, duration) {
			return ((-Math.cos(p*Math.PI)/2) + 0.5) * delta + firstNum;
		}
	},
	fxe: function( elem, options, prop ){
		var z = this, values;

		// The styles
		var y = elem.style;
		var oldOverflow = jQuery.css(elem, "overflow");
		var oldDisplay= jQuery.css(elem, "display");
		var props = {};
		z.startTime = (new Date()).getTime();
		options.easing = options.easing && jQuery.easing[options.easing] ? options.easing : 'linear';
		
		z.getValues = function(tp, vp)
		{
			if (jQuery.fx.cssProps[tp]) {
				if (vp == 'show' || vp == 'hide' || vp == 'toggle') {
					if ( !elem.orig ) elem.orig = {};
					var r = parseFloat( jQuery.curCSS(elem, tp) );
					elem.orig[tp] = r && r > -10000 ? r : (parseFloat( jQuery.css(elem,tp) )||0);
					vp = vp == 'toggle' ? ( oldDisplay == 'none' ? 'show' : 'hide') : vp;
					options[vp] = true;
					props[tp] = vp == 'show' ? [0, elem.orig[tp]] : [elem.orig[tp], 0];
					if (tp != 'opacity')
						y[tp] = props[tp][0] + (tp != 'zIndex' && tp != 'fontWeight' ? 'px':'');
					else
						jQuery.attr(y, "opacity", props[tp][0]);
				} else {
					props[tp] = [parseFloat( jQuery.curCSS(elem, tp) ), parseFloat(vp)||0];
				}
			} else if (jQuery.fx.colorCssProps[tp])
				props[tp] = [jQuery.fx.parseColor(jQuery.curCSS(elem, tp)), jQuery.fx.parseColor(vp)];
			else if(/^margin$|padding$|border$|borderColor$|borderWidth$/i.test(tp)) {
				var m = vp.replace(/\s+/g, ' ').replace(/rgb\s*\(\s*/g,'rgb(').replace(/\s*,\s*/g,',').replace(/\s*\)/g,')').match(/([^\s]+)/g);
				switch(tp){
					case 'margin':
					case 'padding':
					case 'borderWidth':
					case 'borderColor':
						m[3] = m[3]||m[1]||m[0];
						m[2] = m[2]||m[0];
						m[1] = m[1]||m[0];
						for(var i = 0; i < jQuery.fx.cssSides.length; i++) {
							var nmp = jQuery.fx.cssSidesEnd[tp][0] + jQuery.fx.cssSides[i] + jQuery.fx.cssSidesEnd[tp][1];
							props[nmp] = tp == 'borderColor' ?
								[jQuery.fx.parseColor(jQuery.curCSS(elem, nmp)), jQuery.fx.parseColor(m[i])]
								: [parseFloat( jQuery.curCSS(elem, nmp) ), parseFloat(m[i])];
						}
						break;
					case 'border':
						for(var i = 0; i< m.length; i++) {
							var floatVal = parseFloat(m[i]);
							var sideEnd = !isNaN(floatVal) ? 'Width' : (!/transparent|none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset/i.test(m[i]) ? 'Color' : false);
							if (sideEnd) {
								for(var j = 0; j < jQuery.fx.cssSides.length; j++) {
									nmp = 'border' + jQuery.fx.cssSides[j] + sideEnd;
									props[nmp] = sideEnd == 'Color' ?
								[jQuery.fx.parseColor(jQuery.curCSS(elem, nmp)), jQuery.fx.parseColor(m[i])]
								: [parseFloat( jQuery.curCSS(elem, nmp) ), floatVal];
								}
							} else {
								y['borderStyle'] = m[i];
							}
						}
						break;
				}
			} else {
				y[tp] = vp;
			}
			return false;
		};
		
		for(p in prop) {
			if (p == 'style') {
				var newStyles = jQuery.parseStyle(prop[p]);
				for (np in newStyles) {
					this.getValues(np, newStyles[np]);
				}
			} else if (p == 'className') {
				if (document.styleSheets)
					for (var i=0; i<document.styleSheets.length; i++){
						var cssRules = document.styleSheets[i].cssRules||document.styleSheets[i].rules||null;
						if (cssRules) {
							for (var j=0; j<cssRules.length; j++) {
								if(cssRules[j].selectorText == '.' + prop[p]) {
									var rule = new RegExp('\.' + prop[p] + ' {');
									var styles = cssRules[j].style.cssText;
									var newStyles = jQuery.parseStyle(styles.replace(rule, '').replace(/}/g, ''));
									for (np in newStyles) {
										this.getValues(np, newStyles[np]);
									}
								}
							}
						}
					}
			} else {
				this.getValues(p, prop[p]);
			}
		}
		y.display = oldDisplay == 'none' ? 'block' : oldDisplay;
		y.overflow = 'hidden';
		
		/*if (options.show)
			y.display = "";*/
		
		z.step = function(){
			var t = (new Date()).getTime();
			if (t > options.duration + z.startTime) {
				clearInterval(z.timer);
				z.timer = null;
				for (p in props) {
					if ( p == "opacity" )
						jQuery.attr(y, "opacity", props[p][1]);
					else if (typeof props[p][1] == 'object')
						y[p] = 'rgb(' + props[p][1].r +',' + props[p][1].g +',' + props[p][1].b +')';
					else 
						y[p] = props[p][1] + (p != 'zIndex' && p != 'fontWeight' ? 'px':'');
				}
				if ( options.hide || options.show )
					for ( var p in elem.orig )
						if (p == "opacity")
							jQuery.attr(y, p, elem.orig[p]);
						else
							y[p] = "";
				y.display = options.hide ? 'none' : (oldDisplay !='none' ? oldDisplay : 'block');
				y.overflow = oldOverflow;
				elem.animationHandler = null;
				if ( jQuery.isFunction( options.complete ) )
					options.complete.apply( elem );
			} else {
				var n = t - this.startTime;
				var pr = n / options.duration;
				for (p in props) {
					if (typeof props[p][1] == 'object') {
						y[p] = 'rgb('
						+ parseInt(jQuery.easing[options.easing](pr, n,  props[p][0].r, (props[p][1].r-props[p][0].r), options.duration))
						+ ','
						+ parseInt(jQuery.easing[options.easing](pr, n,  props[p][0].g, (props[p][1].g-props[p][0].g), options.duration))
						+ ','
						+ parseInt(jQuery.easing[options.easing](pr, n,  props[p][0].b, (props[p][1].b-props[p][0].b), options.duration))
						+')';
					} else {
						var pValue = jQuery.easing[options.easing](pr, n,  props[p][0], (props[p][1]-props[p][0]), options.duration);
						if ( p == "opacity" )
							jQuery.attr(y, "opacity", pValue);
						else 
							y[p] = pValue + (p != 'zIndex' && p != 'fontWeight' ? 'px':'');
					}
				}

			}
		};
	z.timer=setInterval(function(){z.step();},13);
	elem.animationHandler = z;
	},
	stopAnim: function(elem, step)
	{
		if (step)
			elem.animationHandler.startTime -= 100000000;
		else {
			window.clearInterval(elem.animationHandler.timer);
			elem.animationHandler = null;
			jQuery.dequeue(elem, "fx");
		}
	}
}
);


jQuery.fx.DropOutDirectiont = function (e, speed, callback, direction, type, easing)
{
        if (!jQuery.fxCheckTag(e)) {
                jQuery.dequeue(e, 'interfaceFX');
                return false;
        }
        var z = this;
        z.el = jQuery(e);
        z.easing = typeof callback == 'string' ? callback : easing||null;
        z.oldStyle = {};
        z.oldStyle.position = z.el.css('position');
        z.oldStyle.top = z.el.css('top');
        z.oldStyle.left = z.el.css('left');
        if (!e.ifxFirstDisplay)
                e.ifxFirstDisplay = z.el.css('display');
        if ( type == 'toggle') {
                type = z.el.css('display') == 'none' ? 'in' : 'out';
        }
        z.el.show();
        
        if (z.oldStyle.position != 'relative' && z.oldStyle.position != 'absolute') {
                z.el.css('position', 'relative');
        }
        z.type = type;
        callback = typeof callback == 'function' ? callback : null;
        
        directionIncrement = 1;
        switch (direction){
                case 'up':
                        z.e = new jQuery.fx(z.el.get(0), jQuery.speed(speed - 15, z.easing,callback), 'top');
                        z.point = parseFloat(z.oldStyle.top)||0;
                        z.unit = z.topUnit;
                        directionIncrement = -1;
                break;
                case 'down':
                        z.e = new jQuery.fx(z.el.get(0), jQuery.speed(speed - 15, z.easing,callback), 'top');
                        z.point = parseFloat(z.oldStyle.top)||0;
                        z.unit = z.topUnit;
                break;
                case 'right':
                        z.e = new jQuery.fx(z.el.get(0), jQuery.speed(speed - 15, z.easing,callback), 'left');
                        z.point = parseFloat(z.oldStyle.left)||0;
                        z.unit = z.leftUnit;
                break;
                case 'left':
                        z.e = new jQuery.fx(z.el.get(0), jQuery.speed(speed - 15, z.easing,callback), 'left');
                        z.point = parseFloat(z.oldStyle.left)||0;
                        z.unit = z.leftUnit;
                        directionIncrement = -1;
                break;
        }
        z.e2 = new jQuery.fx(
                z.el.get(0),
                jQuery.speed
                (
                        speed, z.easing,
                        function()
                        {
                                z.el.css(z.oldStyle);
                                if (z.type == 'out') {
                                        z.el.css('display', 'none');
                                } else 
                                        z.el.css('display', z.el.get(0).ifxFirstDisplay == 'none' ? 'block' : z.el.get(0).ifxFirstDisplay);
                                
                                jQuery.dequeue(z.el.get(0), 'interfaceFX');
                        }
                 ),
                'opacity'
        );
        if (type == 'in') {
                z.e.custom(z.point+ 100*directionIncrement, z.point);
                z.e2.custom(0,1);
        } else {
                z.e.custom(z.point, z.point + 100*directionIncrement);
                z.e2.custom(1,0);
        }
};

jQuery.fn.extend({
           DropOutLeft : function (speed, callback, easing) {
                   return this.queue('interfaceFX',function(){
                           new jQuery.fx.DropOutDirectiont(this, speed, callback, 'left', 'out', easing);
                   });
           },
           
           DropInLeft : function (speed, callback, easing) {
                   return this.queue('interfaceFX',function(){
                           new jQuery.fx.DropOutDirectiont(this,  speed, callback, 'left', 'in', easing);
                   });
           }
});
