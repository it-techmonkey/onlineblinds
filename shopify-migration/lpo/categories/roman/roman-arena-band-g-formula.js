var D={"w":[20,24,37,51,65,79,87,98],"h":[20,39,47,55,63,71,79,87,94,102,106],"v":[273.27,273.27,315.98,341.6,442.38,476.54,512.4,597.8,298.9,298.9,341.6,367.23,478.24,512.4,538.03,640.5,324.52,324.52,367.23,392.84,512.4,538.03,563.64,683.2,350.14,350.14,392.84,418.46,538.03,563.64,589.26,717.36,375.76,375.76,418.46,444.08,563.64,589.26,614.88,768.6,401.38,401.38,444.08,469.7,589.26,614.88,640.5,819.84,427,427,469.7,495.33,614.88,640.5,681.49,854,452.63,452.63,495.33,520.94,640.5,666.13,708.83,905.24,478.24,478.24,520.94,546.56,666.13,691.74,734.44,939.4,478.24,478.24,520.94,546.56,666.13,691.74,734.44,939.4,478.24,478.24,520.94,546.56,666.13,691.74,734.44,939.4],"k":0,"m":[20,98,20,106],"z":[20,98,20,106],"r":0,"t":{"bottom-chain":{"black-weights":0.59,"grey-weights":0.59,"white-chainless":0.39,"pet-friendly":0.39},"chain-color":{"black-plastic":2.99,"chrome-metal":3.49,"grey-plastic":2.99},"colour-weight-chain":{"colour-weight-chain":[0,0,0,0,0,7.5,0,9.5]},"control-option":{"chrome-toggle":4.99},"fhw-metal-weights":{"fhw-metal-weights":[0,0,0,0,0,8.5,0,10.5]},"frame-color":{"anthracite-grey":10.65,"black":10.65,"brown":10.65,"beige":10.65,"mahogany":10.65,"golden-oak":10.65},"headrail-colour":{"vouge-white":9.53,"vouge-silver":11.43,"vouge-anthracite":10.95,"vouge-gold":11.43,"vouge-black":10.95,"vouge-brown":10.95},"lining-type":{"blackout":11,"thermal":11},"metal-bottom-chain":{"metal-bottom-chain":[0,0,0,0,0,6,0,7.6]},"motorization":{"1ch-remote":10.98,"2ch-remote":10.98,"6ch-remote":12.56,"16ch-remote":12.56},"opening-direction":{"split":25},"perfect-fit-metal-frame-color":{"anthracite":7.13,"brown":7.13,"golden-oak":7.13},"roman-chain-color":{"chrome-metal":4.99},"vogue-system":{"blk-anth-brwn":[0,0,0,0,0,25,0,29],"champgn-gld":[0,0,0,0,0,28,0,32],"white":[0,0,0,0,0,8.5,0,10.5]},"wrapped-cassette":{"yes":15.75},"chrome-upgrade":{"yes":3.99},"fabric-insert-cassette":{"yes":8.99},"bottom-bar":{"grey-round-bar":3.99,"white-round-bar":3.99,"full-fabric-cover-premium-bar":6.99},"matching-fabric-cassette":{"yes":5.99},"cassette-bar":{"black":7.99,"grey":7.99,"matching-fabric":18.89}},"b":75},M=["Please enter a valid size","Selected measurements are outside the allowed range for this product","We cannot make this blind in that width and drop combination. Please adjust your measurements.","The pricing list could not be verified. Please try again."],Q="_";
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