var D={"w":[12,16,20,24,28,31,35,41,47],"h":[24,30,36,42,48,54,60,66,72,78,84,87],"v":[76.6,88.99,91.3,98.96,104.26,106.58,110.24,116.86,123.51,86.88,91.65,94.04,101.91,107.39,109.79,113.54,120.38,127.24,88.6,93.49,95.94,103.95,109.53,111.96,115.81,122.78,129.77,90.38,95.36,97.85,106.05,111.73,114.21,118.14,125.25,132.38,93.09,98.85,104.98,111.11,113.1,117.65,135.85,144.3,153.1,97.28,103.3,109.7,116.09,121.33,126.78,141.96,150.8,159.99,101.65,107.95,114.65,121.34,126.81,132.51,148.35,157.59,167.19,106.23,112.79,119.79,126.81,132.49,138.46,155.03,164.69,174.7,111,123.49,132.74,142.03,148.41,155.09,159.85,173.45,185.79,117.13,132.65,142.46,152.35,160.69,169.56,175.4,187.48,199.18,123.56,141.8,152.24,162.64,171.58,181.02,191,201.48,212.58,130.36,148.99,158.9,168.83,178.13,187.9,198.25,209.15,220.65],"k":0,"m":[12,47,24,87],"z":[12,47,24,87],"r":0,"t":{"bottom-chain":{"black-weights":0.59,"grey-weights":0.59,"white-chainless":0.39,"pet-friendly":0.39},"chain-color":{"black-plastic":2.99,"chrome-metal":3.49,"grey-plastic":2.99},"control-option":{"chrome-toggle":4.99},"frame-color":{"anthracite-grey":10.65,"black":10.65,"brown":10.65,"beige":10.65,"mahogany":10.65,"golden-oak":10.65},"headrail-colour":{"vouge-white":9.53,"vouge-silver":11.43,"vouge-anthracite":10.95,"vouge-gold":11.43,"vouge-black":10.95,"vouge-brown":10.95},"lining-type":{"blackout":11,"thermal":11},"motorization":{"1ch-remote":10.98,"2ch-remote":10.98,"6ch-remote":12.56,"16ch-remote":12.56},"opening-direction":{"split":25},"perfect-fit-metal-frame-color":{"anthracite":7.13,"brown":7.13,"golden-oak":7.13},"roman-chain-color":{"chrome-metal":4.99},"wrapped-cassette":{"yes":15.75},"chrome-upgrade":{"yes":3.99},"fabric-insert-cassette":{"yes":8.99},"bottom-bar":{"grey-round-bar":3.99,"white-round-bar":3.99,"full-fabric-cover-premium-bar":6.99},"matching-fabric-cassette":{"yes":5.99},"cassette-bar":{"black":7.99,"grey":7.99,"matching-fabric":18.89}},"b":75},M=["Please enter a valid size","Selected measurements are outside the allowed range for this product","We cannot make this blind in that width and drop combination. Please adjust your measurements.","The pricing list could not be verified. Please try again."],Q="_";
function V(n){return options.value(Q+n);}
var wo=options.option&&options.option(Q+'width');
if(wo&&Array.isArray(wo.errors))wo.errors=wo.errors.filter(function(m){return m&&M.indexOf(m)<0;});
var C=String(V('customizations')||'').split('|').filter(function(s){return s;}).map(function(s){var i=s.indexOf(':');return [s.slice(0,i),s.slice(i+1)];});
function extras(x){var s=0;C.forEach(function(c){var cat=c[0];if(cat==='cassette-bar'||cat==='roller-cassette')cat=D.r?'roller-cassette':'cassette-bar';var p=D.t[cat]&&D.t[cat][c[1]];if(p==null)return;if(typeof p==='object')p=p[x]||0;s+=p;});return s;}
var unit=V('measurementUnit'),wv=V('width'),hv=V('height');
if(wv==null||hv==null||String(wv).trim()===''||String(hv).trim()===''||(unit!=='cm'&&unit!=='mm'))return 0;
var w=Number(wv),h=Number(hv);
if(!isFinite(w)||!isFinite(h)){options.error(Q+'width',M[0]);return 0;}
if(unit==='cm'){w+=Number(V('widthFraction')||0)/10;h+=Number(V('heightFraction')||0)/10;}
var u=unit==='cm'?2.54:25.4;w/=u;h/=u;
var mot=C.some(function(c){return c[0]==='motorization'&&c[1]!=='none';}),L=mot?D.z:D.m;
function fail(i){options.error(Q+'width',M[i]);return 0;}
if(w<L[0]||w>L[1]||h<L[2]||h>L[3])return fail(1);
function band(a,v){if(v<a[0])return D.k?0:-1;if(v>a[a.length-1])return D.k?a.length-1:-1;var c=Math.ceil(v);for(var i=0;i<a.length;i++)if(a[i]>=c)return i;return D.k?a.length-1:-1;}
var x=band(D.w,w),y=band(D.h,h);
if(x<0||y<0)return fail(1);
var t=D.v[y*D.w.length+x];
if(!t)return fail(2);
t+=extras(x);
if(C.some(function(c){return c[0]==='motorization';}))t+=D.b;
return Math.round(t*100)/100;