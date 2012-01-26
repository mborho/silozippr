
(function($){$.fn.glow=function(){var clookup={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"00ffff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000000",blanchedalmond:"ffebcd",blue:"0000ff",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"00ffff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgrey:"a9a9a9",darkgreen:"006400",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"ff00ff",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",grey:"808080",green:"008000",greenyellow:"adff2f",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgrey:"d3d3d3",lightgreen:"90ee90",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"778899",lightslategrey:"778899",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"00ff00",limegreen:"32cd32",linen:"faf0e6",magenta:"ff00ff",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370d8",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"d87093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",red:"ff0000",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"ffffff",whitesmoke:"f5f5f5",yellow:"ffff00",yellowgreen:"9acd32"};function nameToColor(n){return clookup[(""+n).toLowerCase()]||null;}
function re_rgba()
{return new RegExp('rgba\\s*\\(\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*\\,\\s*([0-9]{1,3})\\s*\\)');}
function re_rgb()
{return new RegExp('rgb\\s*\\(\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*,\\s*([0-9]{1,3})\\s*\\)');}
function parseColor(c){var r;var e=new RegExp('#([A-F0-9]{2})([a-fA-F0-9]{2})([A-F0-9]{2})','i');if(r=e.exec(c)){return[parseInt(r[1],16),parseInt(r[2],16),parseInt(r[3],16)];}
e=new RegExp('#([A-F0-9]{1})([A-F0-9]{1})([A-F0-9]{1})','i');if(r=e.exec(c)){return[parseInt(r[1]+r[1],16),parseInt(r[2]+r[2],16),parseInt(r[3]+r[3],16)];}
e=re_rgb();if(r=e.exec(c)){return[parseInt(r[1],10),parseInt(r[2],10),parseInt(r[3],10)];}
e=re_rgba();if(r=e.exec(c)){return[parseInt(r[1],10),parseInt(r[2],10),parseInt(r[3],10),parseInt(r[4],10)];}
if(r=nameToColor(c)){return parseColor('#'+r);}
if(window.console){console.log('can not parse color '+c);}else{}
return false;}
function colorMatters(c){if(c=="inherit"||c=="transparent"){return false;}
var e=re_rgba();var r=e.exec(c);if(r&&parseInt(r[4],10)==0){return false;}
return true;}
function printColor(r){return'#'+(0x1000000+parseInt(r[0],10)*0x10000+parseInt(r[1],10)*0x100+parseInt(r[2],10)).toString(16).slice(-6);}
function finalBackgroundColor(e){var bg;do{bg=e.css('background-color');if(colorMatters(bg)){return bg;}
bg=e[0].bgColor;if(bg){return bg;}
e=e.parent();}while(e.length>0&&e.get(0).tagName);return arguments[1]||'#FFF';}
function glowItem(duration,steps)
{function glowFunction(){if(step<steps){var c=[0,0,0];for(var i=0;i<3;i++){c[i]=parseInt(srcc[i])+(((parseInt(dstc[i])-parseInt(srcc[i]))/steps)*step);}
elem.css('background-color',printColor(c));step=step+1;setTimeout(glowFunction,timeoutstep);}else{elem.css('background-color',ocol);elem.attr('glowing',0);}}
var elem=$(this);if(elem.attr('glowing')==1){return;}
elem.attr('glowing',1);var ocol=$(elem).css('background-color');var dstc=parseColor(finalBackgroundColor(elem));if(!dstc){return;}
var step=0;var timeoutstep=parseInt(duration/steps,10);glowFunction.call(elem);}
var srcc=parseColor(arguments[0]||'#FFFF99');if(!srcc){return false;}
var duration=arguments[1]||1000;var steps=arguments[2]||50;if(duration<0||!duration){duration=1000;}
if(steps<0||!steps){steps=1;}
$(this).each(function(i,x){glowItem.call(x,duration,steps);});};})(jQuery);