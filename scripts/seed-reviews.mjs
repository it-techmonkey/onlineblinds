// Judge.me review seeder — optimised for large catalogue (1800+ products)
// Run: node scripts/seed-reviews.mjs

const API_TOKEN = 'LQvWC0nOzdlNFjXo4yQ3Voa9jVg';
const SHOP_DOMAIN = 'online-blinds-express.myshopify.com';
const JUDGEME_API = 'https://judge.me/api/v1';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomDate() {
  const start = new Date('2025-10-01').getTime();
  const end   = new Date('2026-06-14').getTime();
  return new Date(start + Math.random() * (end - start)).toISOString();
}
function weightedRating() {
  const r = Math.random();
  if (r < 0.50) return 5;
  if (r < 0.76) return 4;
  if (r < 0.89) return 3;
  if (r < 0.96) return 2;
  return 1;
}
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// ─── Name pools ───────────────────────────────────────────────────────────────

const FIRST = [
  'Sarah','James','Emma','Daniel','Lucy','Thomas','Olivia','Michael','Charlotte','David',
  'Sophie','Mark','Hannah','Andrew','Claire','Paul','Jessica','Robert','Amy','Richard',
  'Laura','Chris','Rachel','Stephen','Kate','Simon','Nicola','John','Helen','Matthew',
  'Victoria','Peter','Gemma','Kevin','Megan','Ian','Fiona','Neil','Natalie','Graham',
  'Leanne','Philip','Tracey','Craig','Donna','Stuart','Joanne','Lisa','Barry','Sharon',
  'Gary','Diane','Alan','Alison','Brian','Susan','Colin','Karen','Janet','Patricia',
  'Sean','Brendan','Siobhan','Aoife','Ciaran','Niamh','Declan','Sinead','Caitlin','Ryan',
  'Ellie','Jake','Amber','Joshua','Chloe','Liam','Ava','Noah','Isla','Freya',
  'Poppy','Archie','Harry','Evie','Rosie','Jack','Lily','Alfie','Millie','George',
];
const LAST = [
  'Smith','Jones','Williams','Taylor','Brown','Davies','Evans','Wilson','Thomas','Roberts',
  'Johnson','Lewis','Walker','Robinson','Wood','Thompson','White','Watson','Jackson','Harris',
  'Martin','Clarke','Clark','Turner','Hill','Scott','Moore','Green','Adams','Baker',
  'Hall','Nelson','Carter','Mitchell','Campbell','Anderson','Murphy','O\'Brien','Kelly',
  'O\'Connor','Walsh','Byrne','Ryan','O\'Sullivan','Doyle','McCarthy','Gallagher','Kennedy','Lynch',
  'Murray','Quinn','Doherty','Dunne','Brennan','Burke','Collins','O\'Neill','Carroll','Connelly',
  'Hughes','Price','Wright','Richardson','Ward','Griffin','Foster','Morrison','Henderson','Bryant',
];

function randomName() {
  return `${randomItem(FIRST)} ${randomItem(LAST)}`;
}
function randomEmail(name) {
  const parts = name.toLowerCase().replace(/'/g, '').split(' ');
  const domains = ['gmail.com','hotmail.co.uk','outlook.com','yahoo.co.uk','icloud.com','btinternet.com','sky.com','virginmedia.com'];
  const sep = randomItem(['.','_','']);
  const num = Math.random() > 0.55 ? randomInt(1, 99) : '';
  return `${parts[0]}${sep}${parts[1]}${num}@${randomItem(domains)}`;
}

// ─── Review content ───────────────────────────────────────────────────────────

function getReview(title, productType, rating) {
  const t  = (productType || '').toLowerCase();
  const ti = title.toLowerCase();
  const cm = title.match(/\b(white|cream|grey|gray|black|silver|charcoal|beige|navy|ivory|linen|frost|platinum|ice|blue|green|teal|brass|copper|oak|walnut|ash|elm|maple|cherry|blush|rose|peacock|smoke|stone|vanilla|calico|brown|midnight|gold|dawn|dusk|natural|sand|mocha|espresso|sage|slate|pearl|birch)\b/i);
  const colour = cm ? cm[1] : null;

  if (t.includes('motorised') || ti.includes('electrical')) return motorised(colour, rating);
  if (t.includes('skylight')  || ti.includes('skylight'))   return skylight(colour, rating);
  if (t.includes('day')       || ti.includes('day and night') || ti.includes('zebra')) return dayNight(colour, rating);
  if (ti.includes('honeycomb')) return honeycomb(colour, rating);
  if (t.includes('roman'))     return roman(colour, rating);
  if (t.includes('wooden') || t.includes('faux') || t.includes('venetian')) return venetian(colour, rating, ti);
  if (t.includes('vertical')  || ti.includes('vertical')) return vertical(colour, rating);
  if (t.includes('perfect fit') || ti.includes('perfect fit') || ti.includes('no drill')) return perfectFit(colour, rating);
  if (t.includes('easy stick') || ti.includes('easy stick')) return easyStick(colour, rating);
  if (t.includes('replacement') || ti.includes('slat'))      return slat(colour, rating);
  return roller(colour, rating);
}

function roller(c, r) {
  const col = c ? `The ${c} colour` : 'The colour';
  const p5 = [
    { title: 'Exactly what I was looking for',  body: `Ordered this for our living room and couldn't be happier. ${col} is exactly as shown online — no surprises. Arrived well packaged and went up in about 15 minutes. Blackout is excellent, not a sliver of light coming through. Would order again without hesitation.` },
    { title: 'Brilliant quality for the price', body: `Really impressed. The fabric feels substantial and the mechanism rolls smoothly. ${col} matches our décor perfectly. Delivery was quick too — arrived within the week. Already talking about ordering more for the other rooms.` },
    { title: 'Great blackout blind',            body: `Needed proper blackout for the bedroom as streetlights were waking us up. This does the job completely. ${col} looks smart and fitting was straightforward. Very happy overall.` },
    { title: 'Smooth operation, looks lovely',  body: `The roller mechanism is very smooth — far better than the cheap one we replaced. ${col} is a nice neutral that works with most things. Sizing was spot on for our window. Highly recommend.` },
    { title: 'Fast delivery, great product',    body: `Ordered on Monday, arrived Thursday — no complaints. The blind is excellent. Sturdy brackets, nice fabric, easy to fit. Will definitely be back for the other windows.` },
    { title: 'Perfect fit and finish',          body: `Measured carefully and it fits like it was made for the window. ${col} is elegant and the mechanism glides smoothly. Blackout is complete. Very pleased with this purchase.` },
    { title: 'Transforms the room',            body: `Replaced an old curtain with this roller blind and the room looks so much more modern. ${col} works brilliantly with our paintwork. Really happy with the quality.` },
  ];
  const p4 = [
    { title: 'Very pleased overall',    body: `Happy with this. ${col} is slightly lighter than on screen but still works well. Fitting took a bit longer than expected but the end result is great. Would recommend.` },
    { title: 'Good quality blind',      body: `Solid roller blind at a fair price. Fabric is good quality and the mechanism works well. Took off one star only because the instructions weren't the clearest, but once up it looks great.` },
    { title: 'Does what it says',       body: `Good blackout blind. ${col} is exactly as described. Rolls up and down without any issues. Delivery was prompt. Only minor gripe is the chain is a touch on the short side for a tall window.` },
    { title: 'Nice blind, easy to fit', body: `Fitting was easier than I expected. Looks good and the fabric is nicely weighted so it hangs straight. ${col} is a perfect match for our renovation. Would buy again.` },
  ];
  const p3 = [
    { title: 'Decent, a few niggles', body: `Looks fine and does the job. ${col} is as expected. Fitting was a bit fiddly and one bracket seemed slightly off but it's sorted now. Average experience but it works.` },
    { title: 'Good but not perfect',   body: `Happy enough. Blackout is decent — not 100% at the edges but acceptable. ${col} is nice. The chain feels a bit cheap. For the price it's fine.` },
  ];
  const p2 = [{ title: 'A bit disappointed', body: `${col} was quite different to what was shown online. The mechanism works fine but more light seeps round the sides than I expected. Might try a different product next time.` }];
  const p1 = [{ title: 'Not what I expected', body: `Unfortunately not happy. The colour was way off and fitting instructions were confusing. Had to call a friend to help. Not great for the money.` }];

  if (r === 5) return randomItem(p5);
  if (r === 4) return randomItem(p4);
  if (r === 3) return randomItem(p3);
  if (r === 2) return randomItem(p2);
  return randomItem(p1);
}

function motorised(c, r) {
  const col = c ? `The ${c} fabric` : 'The fabric';
  const p5 = [
    { title: 'Absolute game changer',       body: `The motorised version has completely changed how we use the room. One press on the remote and it's up or down — the kids love it too. Motor is whisper quiet and the blind is great quality. ${col} looks really smart. Well worth the investment.` },
    { title: 'Worth every penny',           body: `Hesitated over the motorised option because of the price but so glad I went for it. The remote works perfectly and the blind moves smoothly. Fitted in about 30 minutes. Looks fantastic and the blackout is superb.` },
    { title: 'Seamless and silent',         body: `This motorised blind is brilliant. The motor is silent, movement is smooth and even, and the remote has good range from across the room. ${col} is exactly as shown. Delivery was faster than expected. Five stars.` },
    { title: 'Amazing quality motor blind', body: `Top quality product. The mechanism is solid, the remote is responsive, and the blind looks fantastic on our floor-to-ceiling windows. Fitting was a bit of effort due to size but totally worth it.` },
  ];
  const p4 = [
    { title: 'Really impressed',  body: `Great motorised blind. Motor is quiet and the remote works well. ${col} looks good. Slight faff with the pairing process but the manual explains it. Once set up it's brilliant. Would recommend.` },
    { title: 'Very convenient',   body: `The convenience of not pulling a chain is brilliant. Motor runs quietly. ${col} is a nice quality. Only small niggle is the remote feels a bit plasticky but it works fine.` },
  ];
  const p3 = [{ title: 'Good but setup was a faff', body: `The blind itself is good quality and the motor works fine once set up. Pairing instructions weren't the clearest and I spent ages getting it to work. Once running it's smooth and quiet though.` }];
  if (r === 5) return randomItem(p5);
  if (r === 4) return randomItem(p4);
  return randomItem(p3);
}

function dayNight(c, r) {
  const col = c ? `The ${c} colour` : 'The shade';
  const p5 = [
    { title: 'Perfect for the living room', body: `These day and night blinds are exactly what we needed. During the day the striped semi-sheer effect lets light in but maintains privacy, in the evening you can fully close them. ${col} looks wonderful. Really well made and fitted in no time.` },
    { title: 'Stunning blinds',             body: `Put these in our bedroom and lounge and they look absolutely stunning. Quality is far better than I expected at this price. The alternating sheer and blackout panels work perfectly. ${col} is exactly as advertised. Fast delivery too.` },
    { title: 'Brilliant privacy blind',     body: `Great product. The zebra effect gives brilliant daytime privacy without losing all the light. At night fully closed they block out well. ${col} is lovely. Mechanism is smooth and fabric feels premium.` },
    { title: 'Love these blinds',           body: `Replaced old curtains with these and I wish I'd done it years ago. They look modern and stylish, operation is simple, and you get proper control over light levels. ${col} is a perfect neutral.` },
  ];
  const p4 = [
    { title: 'Really nice blinds',       body: `Happy with these day and night blinds. They look smart and the dual-layer system works well. ${col} is slightly different to the website photo but still very nice. Fitting was easy. Would recommend.` },
    { title: 'Good quality, great look', body: `These blinds look great in our living room. Day/night function works as described and fabric is good quality. ${col} works really well with our décor.` },
  ];
  const p3 = [{ title: 'Nice blind, slight light gap', body: `The blind looks lovely and the day/night function is great. Only issue is a slight gap of light at the sides in the blackout position. May be my fitting but worth mentioning.` }];
  if (r === 5) return randomItem(p5);
  if (r === 4) return randomItem(p4);
  return randomItem(p3);
}

function honeycomb(c, r) {
  const col = c ? `The ${c} shade` : 'The shade';
  const p5 = [
    { title: 'Incredible insulation difference', body: `Fitted these in our north-facing bedroom and the difference to room temperature is noticeable. The cellular structure genuinely traps heat. Blackout is complete — not a sliver of light. ${col} looks clean and modern. Very impressed.` },
    { title: "Best blinds I've ever bought",     body: `Tried several blackout blinds over the years and these honeycomb ones are by far the best. Fit is perfect, blackout is total, and the insulating effect means our room is warmer. Brilliant product.` },
    { title: 'Perfect blackout, great quality',  body: `These blinds are brilliant for a bedroom. Complete blackout, the honeycomb fabric looks premium, and they're very easy to operate. Fitting was straightforward. ${col} is elegant. Five stars without hesitation.` },
    { title: 'Total blackout achieved',          body: `Finally found a blind that delivers true blackout. The honeycomb structure is visually interesting up close but looks clean from a distance. Great for shift workers. The thermal benefit is a bonus. Highly recommend.` },
    { title: 'Lives up to the hype',            body: `Saw these recommended online and decided to give them a go. They genuinely live up to it. Blackout is complete, the fitting is clever and neat, and the insulation is real — our room is definitely warmer.` },
  ];
  const p4 = [
    { title: 'Very impressed',             body: `Really good honeycomb blind. Blackout is excellent and fabric quality is clearly high. ${col} looks smart. Fitting was a little tricky on a wide window but manageable. Would recommend.` },
    { title: 'Great product, minor issue', body: `Love the look and performance. Blackout is superb and the thermal insulation is a real benefit. Only issue was mine arrived very slightly uneven — may be a one-off. Still ordering another for the spare room.` },
  ];
  const p3 = [{ title: 'Good blind, tricky to fit', body: `The blackout is good and the insulation seems to work. The fitting instructions were a bit confusing though and it took a while to work out. Final result looks smart.` }];
  if (r === 5) return randomItem(p5);
  if (r === 4) return randomItem(p4);
  return randomItem(p3);
}

function roman(c, r) {
  const col = c ? `The ${c} fabric` : 'The fabric';
  const p5 = [
    { title: 'Absolutely beautiful',              body: `This roman blind is stunning. ${col} is thick and luxurious and the folds hang beautifully. Fitting was easy and the mechanism operates smoothly. Proper quality product.` },
    { title: 'Elegant and well made',             body: `Ordered these for our sitting room and they've transformed the space. ${col} is substantial and the colour is exactly as shown on the website. Delivery was well packaged. Highly recommend.` },
    { title: "Looks like it cost twice as much",  body: `These roman blinds look incredibly high-end. The folds are even and neat, the lining is good, and the mechanism works perfectly. ${col} is beautiful in natural light.` },
    { title: 'Perfect finish',                    body: `Brilliant roman blind. ${col} is heavy enough to hang in crisp folds without looking limp. Great quality for the price and delivery was swift.` },
  ];
  const p4 = [
    { title: 'Very pleased',      body: `Nice roman blind. ${col} is good quality and the colour is lovely. Fitting took a bit of time but the result is great. Cord mechanism feels slightly stiff initially but loosens after a few uses. Would recommend.` },
    { title: 'Good quality look', body: `Happy with this. ${col} hangs well and the folds are even. Colour is as described. Arrived quickly and well packaged. Would order again.` },
  ];
  const p3 = [{ title: 'Nice but sizing ran small', body: `The blind looks nice and the fabric quality is good. I found the sizing ran slightly small compared to what I ordered — double check your measurements. Mechanism works fine though.` }];
  if (r === 5) return randomItem(p5);
  if (r === 4) return randomItem(p4);
  return randomItem(p3);
}

function venetian(c, r, ti) {
  const wood = ti.includes('wooden') || ti.includes('faux') || ti.includes('wood');
  const type = wood ? 'wooden' : 'metal venetian';
  const col  = c ? `The ${c} finish` : 'The finish';
  const p5 = [
    { title: 'Looks brilliant',             body: `These ${type} blinds look fantastic. ${col} is clean and exactly as shown online. The slats tilt smoothly and the cord mechanism is sturdy. Fitted perfectly. Have already ordered a second set.` },
    { title: 'Excellent quality',           body: `Brilliant ${type} blind. Slats feel solid and the tilt wand works smoothly. ${col} is a perfect match for our kitchen. Easy to wipe clean too — big bonus. Very happy.` },
    { title: 'Smart looking and well made', body: `Really pleased with these. They look very smart and the mechanism is smooth. ${col} is exactly right for our room. Delivery was well packaged. Highly recommend.` },
    { title: 'Perfect for the kitchen',     body: `Exactly what we needed — easy to wipe clean, looks great, and the slats filter light beautifully. ${col} is versatile and elegant. Fitting was straightforward.` },
  ];
  const p4 = [
    { title: 'Very good blind',  body: `Happy with these ${type} blinds. ${col} looks nice and mechanism is smooth. A few slats had very minor marks but nothing noticeable once hung. Good value.` },
    { title: 'Looks the part',   body: `Nice ${type} blind. ${col} is clean and it looks very smart. Only minor thing is the cord is slightly longer than needed but I've tucked it away. Would recommend.` },
  ];
  const p3 = [{ title: 'Decent blind', body: `Looks fine and slats tilt well enough. ${col} is nice. The mechanism feels a tiny bit stiff but perhaps it'll loosen. Delivery was fine. Does the job.` }];
  if (r === 5) return randomItem(p5);
  if (r === 4) return randomItem(p4);
  return randomItem(p3);
}

function vertical(c, r) {
  const col = c ? `The ${c} colour` : 'The colour';
  const p5 = [
    { title: 'Perfect for a large window',    body: `We have a large patio door and these vertical blinds are perfect. Slats hang straight and turn smoothly. ${col} is exactly as shown. Fitting was straightforward. They look very smart. Very happy.` },
    { title: 'Great quality vertical blinds', body: `Really pleased. The fabric is heavier than expected and the mechanism works perfectly. Slats all hang at the same level which looks very neat. ${col} suits our room beautifully.` },
    { title: 'Excellent, would recommend',    body: `Top quality vertical blinds. ${col} is spot on and the slats are a good weight — hang straight without curling. The track operates smoothly. Fitted to our patio door and they're brilliant.` },
  ];
  const p4 = [
    { title: 'Good quality vertical blind', body: `Happy with these. ${col} is nice and slats hang well. Mechanism is smooth. Fitting took a while on a wide window but looks great once done. Would recommend.` },
    { title: 'Does the job well',           body: `Good vertical blind. ${col} is as described. Slats hang straight and operation is smooth. One slat had a slight crease from packaging but it dropped out after a day. Solid product.` },
  ];
  const p3 = [{ title: 'Decent but some slats curled', body: `The vertical blind looks nice but a couple of slats have a slight curl I can't get out. May be a storage issue. The mechanism itself works fine. ${col} is nice.` }];
  if (r === 5) return randomItem(p5);
  if (r === 4) return randomItem(p4);
  return randomItem(p3);
}

function perfectFit(c, r) {
  const col = c ? `The ${c} finish` : 'The finish';
  const p5 = [
    { title: 'No drilling — brilliant idea', body: `The perfect fit system is genius. Clips straight into the window frame without a single drill hole. Takes about 10 minutes and looks completely built-in. ${col} is smart and neat. Cannot believe I didn't get these sooner.` },
    { title: 'Looks totally built-in',       body: `These blinds look like they came with the house — so neat and professional. No drill, no mess. ${col} is lovely. The slats tilt smoothly and it's easy to remove for cleaning. Brilliant product.` },
    { title: 'Perfect for uPVC windows',     body: `Fantastic product. Clips straight onto our uPVC frames without any drilling. ${col} looks very smart. We've fitted six windows now and every one looks brilliant. Very highly recommended.` },
    { title: 'Perfect fit — literally',      body: `Ordered for our conservatory. They clip in perfectly and look very smart against the white frames. No fixings required, no holes. ${col} gives just the right amount of privacy. Very impressed.` },
  ];
  const p4 = [
    { title: 'Great no-drill blind', body: `Really pleased with the perfect fit system. ${col} is nice and the fit is neat. One of the clips took a bit of persuading to engage but once done it's very secure. Good product.` },
    { title: 'Looks very smart',     body: `Nice perfect fit blind. ${col} is clean. Clips into the frame without any drilling — exactly what we needed for our rented property. Solid product.` },
  ];
  const p3 = [{ title: 'Good concept, okay execution', body: `The perfect fit concept is great but one of the clips on mine doesn't quite align with my frame. May be a window size thing. The blind itself looks fine though.` }];
  if (r === 5) return randomItem(p5);
  if (r === 4) return randomItem(p4);
  return randomItem(p3);
}

function easyStick(c, r) {
  const col = c ? `The ${c} colour` : 'The colour';
  const p5 = [
    { title: 'Incredible — no drilling at all', body: `These easy stick blinds are exactly what I needed for my rental flat. The adhesive sticks perfectly to the window frame without any damage. ${col} looks great and the honeycomb fabric is a lovely texture. Absolutely brilliant.` },
    { title: 'Perfect for renters',            body: `As a tenant I can't drill anything. These easy stick blinds are the answer. They look professional, the adhesive holds firm, and the blackout is impressive. Will be ordering for every window in the flat.` },
    { title: 'So easy, great result',          body: `Stuck these up in under 10 minutes per window. No drilling, no mess, no fuss. They look absolutely fantastic and the blackout is great. ${col} is clean and modern. Brilliant product.` },
  ];
  const p4 = [
    { title: 'Really clever product',   body: `Love the concept and the execution is good. The adhesive is very strong and the blind looks smart. ${col} is as described. Only giving 4 stars as the alignment took a couple of attempts. Would recommend.` },
    { title: 'Great no-drill solution', body: `Brilliant solution for awkward windows or rental properties. The adhesive holds well and the blind looks neat and tidy. Good quality fabric. Would order again.` },
  ];
  const p3 = [{ title: 'Good idea, take care with adhesive', body: `The blind itself is nice quality. The adhesive took some care to get straight — once it's on it's on. Make sure your frame is clean and dry first. Good product once fitted correctly.` }];
  if (r === 5) return randomItem(p5);
  if (r === 4) return randomItem(p4);
  return randomItem(p3);
}

function skylight(c, r) {
  const col = c ? `The ${c} colour` : 'The colour';
  const p5 = [
    { title: 'Perfect for our roof window', body: `Finally found a blind that fits our skylight properly. Blackout is complete — our bedroom loft conversion is now dark even in midsummer. ${col} is lovely. Fitting was a bit fiddly but the instructions were clear. Brilliant product.` },
    { title: 'Brilliant skylight blind',    body: `Struggled for years with makeshift solutions for our roof window. This blind is brilliant — clips in securely, blackout is total, and it operates smoothly. ${col} is clean and modern.` },
    { title: 'No more early mornings',      body: `This skylight blackout blind has genuinely changed our sleep. Our bedroom had a roof window we couldn't cover properly — now it's completely dark. ${col} looks great too. Highly recommend.` },
  ];
  const p4 = [
    { title: 'Good skylight blind', body: `Happy with this skylight blind. Blackout is very good — not 100% at the very edges but very close. ${col} is nice. Fitting guide could be clearer but I got there. Solid product.` },
    { title: 'Does the job well',   body: `Works well on our Velux window. ${col} is as described and the blackout is good. The spring mechanism holds it in position well. Worth buying.` },
  ];
  const p3 = [{ title: 'Decent skylight blind', body: `The blind is okay. Fitting was a challenge and there are small light gaps at the sides. For our needs it's acceptable but I expected better blackout. ${col} is fine.` }];
  if (r === 5) return randomItem(p5);
  if (r === 4) return randomItem(p4);
  return randomItem(p3);
}

function slat(c, r) {
  const col = c ? `The ${c} colour` : 'The colour';
  const p5 = [
    { title: 'Perfect match',   body: `Ordered these replacement slats and they matched the existing blind exactly. ${col} is spot on. Great that you can replace individual slats rather than the whole blind. Good value and fast delivery.` },
    { title: 'Saved the blind', body: `Had a couple of damaged slats and these replacements are perfect. ${col} matches exactly. Very well priced and good quality. Arrived quickly. Really pleased.` },
  ];
  const p4 = [{ title: 'Good replacement slats', body: `These slats fit well and the colour is a good match. ${col} finish is clean. Delivery was fast. Would order again if needed.` }];
  const p3 = [{ title: 'Close but not exact', body: `${col} is close to my existing blind but not a perfect match — may be due to fading over time. Quality is fine and they fit well. Worth knowing if you're matching older blinds.` }];
  if (r === 5) return randomItem(p5);
  if (r === 4) return randomItem(p4);
  return randomItem(p3);
}

// ─── Sampling strategy ────────────────────────────────────────────────────────

const HERO_HANDLES = new Set([
  'absolute-white-real-wood','adina-blush','adina-elephant',
  'alabama-linen-vertical-blind','aqualush-white-vertical-blind',
  'alpine','american-elm','amira-mineral','amira-silver','amora-charcoal',
  'alta-blackout-frost','alta-blackout-platinum','alta-ice','alta-silver',
  'aquawood-white-smooth-venetian-blind','aquawood-grey-smooth-venetian-blind',
  'atlantex-asc-white','atlantex-asc-grey','atlantex-asc-cream',
  'atlantex-white','atlantex-grey','atlantex-cream',
  'banlight-duo-fr-white','banlight-duo-fr-cream','banlight-duo-fr-charcoal',
  'blackout-pitch-charcoal-grey-day-and-night-blinds',
  'blackout-pitch-grey-day-and-night-blinds',
  'blackout-plain-soft-cream-day-and-night-blinds',
  'blackout-pitch-white','blackout-plain-white',
  'arundel-ivory','arundel-charcoal',
  'anastasia-blackout-peacock','anastasia-smoke',
  'amora-teal','amora-twilight',
]);

function shouldSkip(handle, productType) {
  const t = (productType || '').toLowerCase();
  const h = handle.toLowerCase();

  // Always skip replacement slat products
  if (t.includes('replacement') || h.includes('-slat')) return true;

  // Very sparse coverage for motorised/electrical variants
  if (h.includes('-electrical') || t.includes('motorised')) {
    return Math.random() > 0.12;
  }

  // Hero products never skipped
  if (HERO_HANDLES.has(handle)) return false;

  // Skip ~60% of remaining (natural distribution — not every colour gets reviews)
  return Math.random() < 0.60;
}

function reviewCount(handle, productType) {
  if (HERO_HANDLES.has(handle)) return randomInt(25, 40);
  const t = (productType || '').toLowerCase();
  if (t.includes('motorised') || handle.includes('-electrical')) return randomInt(4, 9);
  return randomInt(8, 14);
}

// ─── Fetch products ───────────────────────────────────────────────────────────

async function fetchAllProducts() {
  const all = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${JUDGEME_API}/products?api_token=${API_TOKEN}&shop_domain=${SHOP_DOMAIN}&per_page=100&page=${page}`
    );
    const data = await res.json();
    const prods = data.products || [];
    if (prods.length === 0) break;
    all.push(...prods);
    if (prods.length < 100) break;
    page++;
    await sleep(300);
  }
  return all;
}

// ─── Post review ─────────────────────────────────────────────────────────────

async function postReview(externalId, payload) {
  try {
    const res = await fetch(`${JUDGEME_API}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_token: API_TOKEN,
        shop_domain: SHOP_DOMAIN,
        platform: 'shopify',
        id: externalId,
        picture_urls: [],
        ...payload,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching all products from Judge.me...');
  const products = await fetchAllProducts();
  console.log(`Found ${products.length} products total.\n`);

  let totalPosted = 0;
  let totalSkipped = 0;
  let productsDone = 0;

  for (const product of products) {
    if (shouldSkip(product.handle, product.product_type)) {
      totalSkipped++;
      continue;
    }

    const count = reviewCount(product.handle, product.product_type);
    productsDone++;
    process.stdout.write(`→ [${productsDone}] ${product.handle} — ${count} reviews `);

    for (let i = 0; i < count; i++) {
      const rating = weightedRating();
      const { title, body } = getReview(product.title, product.product_type, rating);
      const name = randomName();

      const ok = await postReview(product.external_id, {
        email: randomEmail(name),
        name,
        rating,
        title,
        body,
        created_at: randomDate(),
      });

      totalPosted += ok ? 1 : 0;
      process.stdout.write(ok ? '.' : 'x');

      await sleep(310);
    }
    console.log();
  }

  console.log(`\n✓ Done. ${totalPosted} reviews posted across ${productsDone} products (${totalSkipped} skipped).`);
}

main().catch(console.error);
