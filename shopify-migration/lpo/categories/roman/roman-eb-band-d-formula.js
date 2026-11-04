var D={"w":[24,35,47,59,71,83,98,118],"h":[24,31,39,47,55,63,71,79,87,94,102,110,118],"v":[149.82,166.95,187.78,239.14,308.19,321.27,342.98,415.08,160.95,178.71,200.18,262.01,331.7,345.44,367.99,448.46,170.79,188.56,210.03,281.71,351.4,365.13,387.69,475.48,181.91,200.33,222.43,304.59,374.93,389.29,412.7,508.88,191.76,210.16,232.26,324.29,394.61,408.98,432.39,535.88,202.89,221.93,244.66,347.18,418.14,433.14,457.4,569.28,265.79,284.83,307.56,419.91,437.83,452.84,477.1,596.29,276.91,296.59,319.96,442.8,461.35,477,502.11,629.67,286.75,306.44,329.81,462.49,481.04,496.69,521.8,656.69,297.88,318.2,342.21,485.38,504.56,520.85,546.81,690.09,334.23,354.55,378.56,531.58,550.76,567.05,593.01,717.09,345.35,366.31,390.96,554.46,574.29,591.21,618.03,750.49,356.48,378.08,403.36,577.34,597.81,615.38,643.04,783.89],"k":0,"m":[24,118,24,118],"z":[24,118,24,118],"r":0,"t":{"bottom-chain":{"black-weights":0.59,"grey-weights":0.59,"white-chainless":0.39,"pet-friendly":0.39},"chain-color":{"black-plastic":2.99,"chrome-metal":3.49,"grey-plastic":2.99},"colour-weight-chain":{"colour-weight-chain":[0,0,0,5.5,0,0,9.5,11.5]},"control-option":{"chrome-toggle":4.99},"fhw-metal-weights":{"fhw-metal-weights":[0,0,0,6.5,0,0,10.5,12.5]},"frame-color":{"anthracite-grey":10.65,"black":10.65,"brown":10.65,"beige":10.65,"mahogany":10.65,"golden-oak":10.65},"headrail-colour":{"vouge-white":9.53,"vouge-silver":11.43,"vouge-anthracite":10.95,"vouge-gold":11.43,"vouge-black":10.95,"vouge-brown":10.95},"lining-type":{"blackout":11,"thermal":11},"metal-bottom-chain":{"metal-bottom-chain":[0,0,0,4.2,0,0,7.6,9]},"motorization":{"1ch-remote":10.98,"2ch-remote":10.98,"6ch-remote":12.56,"16ch-remote":12.56},"opening-direction":{"split":25},"perfect-fit-metal-frame-color":{"anthracite":7.13,"brown":7.13,"golden-oak":7.13},"roman-chain-color":{"chrome-metal":4.99},"vogue-system":{"blk-anth-brwn":[0,0,0,20,0,0,29,32],"champgn-gld":[0,0,0,22,0,0,32,36],"white":[0,0,0,6.5,0,0,10.5,12.5]},"wrapped-cassette":{"yes":15.75},"chrome-upgrade":{"yes":3.99},"fabric-insert-cassette":{"yes":8.99},"bottom-bar":{"grey-round-bar":3.99,"white-round-bar":3.99,"full-fabric-cover-premium-bar":6.99},"matching-fabric-cassette":{"yes":5.99},"cassette-bar":{"black":7.99,"grey":7.99,"matching-fabric":18.89}},"b":75},M=["Please enter a valid size","Selected measurements are outside the allowed range for this product","We cannot make this blind in that width and drop combination. Please adjust your measurements.","The pricing list could not be verified. Please try again."],Q="_";
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