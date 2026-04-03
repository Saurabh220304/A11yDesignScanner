"use strict";
// ============================================================
// A11y Scanner — code.js  v5
// ES5-compatible. No async/await, no arrow functions,
// no optional chaining, no nullish coalescing, no padStart.
// Annotations drawn directly on Figma canvas.
// ============================================================

// ── HEX HELPER (no padStart) ─────────────────────────────────
function toHex2(v) {
  var s = Math.round(v * 255).toString(16);
  return s.length === 1 ? "0" + s : s;
}
function rgbToHex(c) { return "#" + toHex2(c.r) + toHex2(c.g) + toHex2(c.b); }

// ── LUMINANCE / CONTRAST ─────────────────────────────────────
function lin(c255) { var c=c255/255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); }
function lum(r,g,b){ return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b); }
function paintLum(paint) {
  if (!paint||paint.type!=="SOLID") return null;
  return lum(Math.round(paint.color.r*255), Math.round(paint.color.g*255), Math.round(paint.color.b*255));
}
function cr(l1,l2){ var hi=l1>l2?l1:l2,lo=l1>l2?l2:l1; return (hi+0.05)/(lo+0.05); }

// ── NODE HELPERS ─────────────────────────────────────────────
function hasKids(n){ return "children" in n && n.children && n.children.length>0; }
function isText(n){ return n.type==="TEXT"; }
function isFrame(n){ return n.type==="FRAME"; }
function isCompSet(n){ return n.type==="COMPONENT_SET"; }
function isVector(n){ return n.type==="VECTOR"||n.type==="BOOLEAN_OPERATION"; }

function solidFill(node) {
  if (!("fills" in node)) return null;
  var f = node.fills;
  if (!f||!f.length) return null;
  for (var i=0;i<f.length;i++) if (f[i].type==="SOLID"&&f[i].visible!==false) return f[i];
  return null;
}

function bgBehind(node) {
  var cur = node.parent;
  while (cur && cur.type!=="PAGE") {
    var f = solidFill(cur);
    if (f) return f;
    cur = cur.parent;
  }
  return {type:"SOLID",color:{r:1,g:1,b:1}};
}

function isLarge(node) {
  var sz = node.fontSize, w = node.fontWeight||400;
  return typeof sz==="number" && (sz>=18||(sz>=14&&w>=700));
}

// Returns object with keys instead of Object.values
function variantValues(compNode) {
  var vals = [];
  var props = compNode.variantProperties;
  if (!props) return vals;
  for (var k in props) {
    if (props.hasOwnProperty(k)) vals.push(String(props[k]).toLowerCase());
  }
  return vals;
}

var GENERIC = [/^frame\s*\d+$/i,/^group\s*\d+$/i,/^rectangle\s*\d+$/i,/^ellipse\s*\d+$/i,/^vector\s*\d+$/i,/^star\s*\d+$/i,/^line\s*\d+$/i,/^image\s*\d+$/i,/^\d+$/];
function isGeneric(name){ var t=name.trim(); for(var i=0;i<GENERIC.length;i++) if(GENERIC[i].test(t)) return true; return false; }

function isInteractive(node) {
  if (node.type!=="COMPONENT"&&node.type!=="INSTANCE"&&node.type!=="FRAME") return false;
  var n=node.name.toLowerCase().trim();
  var kws=["button","btn","cta","checkbox","radio","toggle","switch","tab item","chip"];
  for (var i=0;i<kws.length;i++) if(n===kws[i]||n.indexOf(kws[i]+"/")===0||n.indexOf(kws[i]+" ")===0||n.indexOf(" "+kws[i])!==-1) return true;
  return false;
}

// Iterative traversal
function walk(roots, cb) {
  var stack=[], total=0;
  for (var i=roots.length-1;i>=0;i--) stack.push(roots[i]);
  while (stack.length) {
    var node=stack.pop();
    if (node.visible===false) continue;
    if (typeof node.opacity==="number"&&node.opacity===0) continue;
    cb(node); total++;
    if (hasKids(node)) for (var j=node.children.length-1;j>=0;j--) stack.push(node.children[j]);
  }
  return total;
}

// ── ISSUE FACTORY ────────────────────────────────────────────
function issue(ruleId,wcagId,wcagLevel,sev,conf,node,desc,impact,rec,meta) {
  return {ruleId:ruleId,wcagId:wcagId,wcagLevel:wcagLevel,severity:sev,confidence:conf,
    nodeId:node.id,nodeName:node.name,description:desc,impact:impact,recommendation:rec,metadata:meta||{}};
}

// ── ISSUE MANAGER ────────────────────────────────────────────
function IssueManager(){ this.list=[]; this.seen={}; }
IssueManager.prototype.add=function(i){
  var k=i.ruleId+"::"+i.nodeId;
  if(this.seen[k]) return;
  this.seen[k]=true; this.list.push(i);
};
IssueManager.prototype.sorted=function(){
  var o={high:0,medium:1,low:2};
  return this.list.slice().sort(function(a,b){return o[a.severity]-o[b.severity];});
};

// ── RULES ────────────────────────────────────────────────────

function rContrast(node) {
  if (!isText(node)) return null;
  if (typeof node.opacity==="number"&&node.opacity<0.5) return null;
  if (!node.fills||!node.fills.length) return null;
  var fg=solidFill(node); if(!fg) return null;
  var bg=bgBehind(node);
  var fl=paintLum(fg),bl=paintLum(bg);
  if(fl===null||bl===null) return null;
  var ratio=cr(fl,bl),large=isLarge(node),req=large?3.0:4.5;
  if(ratio>=req-0.1) return null;
  if(fl>0.85&&bl>0.85) return null;
  return issue("contrast-text","1.4.3","AA","high","high",node,
    "Text contrast "+ratio.toFixed(2)+":1 — requires "+req+":1 ("+(large?"large":"normal")+" text).",
    "Low-vision users may be unable to read this text.",
    "Increase contrast. FG: "+rgbToHex(fg.color)+" / BG: "+rgbToHex(bg.color)+".",
    {contrastRatio:ratio,required:req,fg:rgbToHex(fg.color),bg:rgbToHex(bg.color)});
}

function rNonTextContrast(node) {
  if (!isVector(node)) return null;
  var n=node.name.toLowerCase();
  if (!["icon","border","divider","focus ring","checkbox","radio"].some(function(k){return n.indexOf(k)!==-1;})) return null;
  var strokes=("strokes"in node)?node.strokes:[], fills=("fills"in node)?node.fills:[];
  var paint=null;
  for(var i=0;i<strokes.length;i++){if(strokes[i].type==="SOLID"&&strokes[i].visible!==false){paint=strokes[i];break;}}
  if(!paint) for(var j=0;j<fills.length;j++){if(fills[j].type==="SOLID"&&fills[j].visible!==false){paint=fills[j];break;}}
  if(!paint) return null;
  var bg=bgBehind(node),fl=paintLum(paint),bl=paintLum(bg);
  if(fl===null||bl===null) return null;
  var ratio=cr(fl,bl);
  if(ratio>=2.9) return null;
  return issue("contrast-non-text","1.4.11","AA","high","medium",node,
    '"'+node.name+'" contrast '+ratio.toFixed(2)+':1 — requires 3:1.',
    "Users with low vision may not perceive this UI element.",
    "Increase stroke/fill contrast to at least 3:1.",
    {contrastRatio:ratio});
}

function rColorOnly(node) {
  if (!isText(node)) return null;
  if (!node.parent||(node.parent.type!=="FRAME"&&node.parent.type!=="COMPONENT"&&node.parent.type!=="INSTANCE")) return null;
  var f=solidFill(node); if(!f) return null;
  var r=Math.round(f.color.r*255),g=Math.round(f.color.g*255),b=Math.round(f.color.b*255);
  var red=(r>200&&g<80&&b<80),green=(g>160&&r<80&&b<80);
  if(!red&&!green) return null;
  var nm=node.name.toLowerCase();
  if(!["error","success","warning","valid","invalid","danger","required"].some(function(w){return nm.indexOf(w)!==-1;})) return null;
  if(hasKids(node.parent)){
    for(var i=0;i<node.parent.children.length;i++){
      var s=node.parent.children[i];
      if(s.id===node.id) continue;
      if(isVector(s)||s.name.toLowerCase().indexOf("icon")!==-1) return null;
    }
  }
  return issue("color-only","1.4.1","A","medium","medium",node,
    '"'+node.name+'" uses '+(red?"red":"green")+' with no icon — colour is the only indicator.',
    "Colour-blind users cannot perceive the status.",
    "Add an icon (✓ ✗ ⚠) alongside the colour.",
    {colorType:red?"red":"green"});
}

function rResizeText(node) {
  if(!isText(node)||node.textAutoResize!=="NONE") return null;
  var sz=node.fontSize;
  if(typeof sz!=="number"||sz<12||node.height<20||node.width<50) return null;
  return issue("resize-text","1.4.4","AA","medium","medium",node,
    '"'+node.name+'" has fixed size — text will clip at 200% zoom.',
    "Users increasing text size may lose content.",
    "Set text resizing to 'Auto Height'.",{});
}

function rTextSpacing(node) {
  if(!isText(node)) return null;
  var sz=node.fontSize; if(typeof sz!=="number") return null;
  var probs=[];
  var lh=node.lineHeight;
  if(lh&&typeof lh==="object"&&"value" in lh){
    if(lh.unit==="PIXELS"&&lh.value<sz) probs.push("line-height ("+lh.value+"px) below 1× font size");
    if(lh.unit==="PERCENT"&&lh.value<100) probs.push("line-height ("+lh.value+"%) below 100%");
  }
  var ls=node.letterSpacing;
  if(ls&&typeof ls==="object"&&"value" in ls&&ls.unit==="PIXELS"&&ls.value<-2) probs.push("letter-spacing ("+ls.value+"px) is very negative");
  if(!probs.length) return null;
  return issue("text-spacing","1.4.12","AA","medium","medium",node,
    "Text spacing: "+probs.join("; ")+".",
    "Users overriding spacing may lose content.",
    "Use line-height ≥ 1.5× font size.",{fontSize:sz});
}

function rReflow(node) {
  if(!isFrame(node)) return null;
  if(!node.parent||node.parent.type!=="PAGE") return null;
  if(node.layoutMode&&node.layoutMode!=="NONE") return null;
  if(node.width<=400) return null;
  if(!hasKids(node)||node.children.length<5) return null;
  return issue("reflow","1.4.10","AA","medium","medium",node,
    '"'+node.name+'" is '+Math.round(node.width)+'px wide with no auto-layout.',
    "Users at 400% zoom may need horizontal scrolling.",
    "Enable auto-layout with relative sizing.",{width:node.width});
}

function rTargetSize(node) {
  if(!isInteractive(node)) return null;
  var w=node.width,h=node.height;
  if(w>=24&&h>=24) return null;
  if(w>200||h>200) return null;
  var ax=(w<24&&h<24)?"width and height":(w<24?"width":"height");
  return issue("target-size","2.5.8","AA","high","high",node,
    '"'+node.name+'" is '+Math.round(w)+'×'+Math.round(h)+'px — '+ax+' below 24px minimum.',
    "Small targets are hard to activate for motor-impaired users.",
    "Increase "+ax+" to at least 24px.",{width:w,height:h});
}

function rFocusVisible(node) {
  if(!isCompSet(node)) return null;
  if(!hasKids(node)||node.children.length<2) return null;
  var nm=node.name.toLowerCase();
  if(!["button","input","checkbox","radio","toggle","switch","tab"].some(function(k){return nm.indexOf(k)!==-1;})) return null;
  var vals=[];
  for(var i=0;i<node.children.length;i++){
    var c=node.children[i];
    var pv=variantValues(c);
    for(var j=0;j<pv.length;j++) vals.push(pv[j]);
    vals.push(c.name.toLowerCase());
  }
  var hasDef=false,hasFoc=false;
  for(var d=0;d<vals.length;d++){if(vals[d]==="default")hasDef=true;if(vals[d].indexOf("focus")!==-1)hasFoc=true;}
  if(!hasDef||hasFoc) return null;
  return issue("focus-visible","2.4.7","AA","high","high",node,
    '"'+node.name+'" is missing a Focus variant.',
    "Keyboard users will see no focus indicator.",
    'Add a Focus variant with a visible focus ring.',{variantCount:node.children.length});
}

function rStateCoverage(node) {
  if(!isCompSet(node)) return null;
  if(!hasKids(node)||node.children.length<2) return null;
  var nm=node.name.toLowerCase();
  if(!["button","input","checkbox","radio","toggle","switch"].some(function(k){return nm.indexOf(k)!==-1;})) return null;
  var vals=[];
  for(var i=0;i<node.children.length;i++){
    var c=node.children[i];
    var pv=variantValues(c);
    for(var j=0;j<pv.length;j++) vals.push(pv[j]);
    vals.push(c.name.toLowerCase());
  }
  function has(s){for(var k=0;k<vals.length;k++) if(vals[k].indexOf(s)!==-1) return true; return false;}
  if(!has("default")) return null;
  if(has("hover")||has("focus")) return null;
  return issue("state-coverage","4.1.2","A","medium","medium",node,
    '"'+node.name+'" missing both Hover and Focus variants.',
    "Missing states may be skipped by developers.",
    "Add Hover and Focus variants.",{variantCount:node.children.length});
}

var RULES=[rContrast,rNonTextContrast,rColorOnly,rResizeText,rTextSpacing,rReflow,rTargetSize,rFocusVisible,rStateCoverage];

function calcScore(issues){var h=0,m=0,l=0;for(var i=0;i<issues.length;i++){if(issues[i].severity==="high")h++;else if(issues[i].severity==="medium")m++;else l++;}return Math.max(0,100-h*10-m*5-l*2);}
function grade(s){return s>=90?"A":s>=75?"B":s>=50?"C":s>=30?"D":"F";}
function risk(s){return s>=75?"low":s>=50?"moderate":s>=25?"high":"critical";}

function runScan(scope) {
  var roots=scope==="selection"?figma.currentPage.selection:figma.currentPage.children;
  var mgr=new IssueManager(), total=0;
  total=walk(roots,function(node){for(var r=0;r<RULES.length;r++){try{var iss=RULES[r](node);if(iss)mgr.add(iss);}catch(e){}}});
  var issues=mgr.sorted(),score=calcScore(issues);
  return{totalNodes:total,totalRulesRun:RULES.length,issues:issues,score:score,grade:grade(score),riskLevel:risk(score)};
}

// ══════════════════════════════════════════════════════════════
// ANNOTATION SCANNING (find candidates)
// ══════════════════════════════════════════════════════════════

function scanFocusCandidates(scope) {
  var roots=scope==="selection"?figma.currentPage.selection:figma.currentPage.children;
  var items=[];
  walk(roots,function(node){
    if(isInteractive(node)){
      var ab=node.absoluteBoundingBox;
      items.push({nodeId:node.id,nodeName:node.name,x:ab?ab.x:0,y:ab?ab.y:0,w:ab?ab.width:0,h:ab?ab.height:0});
    }
  });
  items.sort(function(a,b){return Math.abs(a.y-b.y)>12?(a.y-b.y):(a.x-b.x);});
  var selId=figma.currentPage.selection.length>0?figma.currentPage.selection[0].id:null;
  return{items:items,frameId:selId};
}

function scanLandmarkCandidates(scope) {
  var roots=scope==="selection"?figma.currentPage.selection:figma.currentPage.children;
  var LM=["header","nav","main","footer","sidebar","aside","search","section","article","form","hero","banner","dialog","modal"];
  var items=[];
  walk(roots,function(node){
    if(node.type!=="FRAME"&&node.type!=="COMPONENT"&&node.type!=="INSTANCE") return;
    var nm=node.name.toLowerCase();
    for(var i=0;i<LM.length;i++){
      if(nm.indexOf(LM[i])!==-1){
        var role=LM[i].charAt(0).toUpperCase()+LM[i].slice(1);
        items.push({nodeId:node.id,nodeName:node.name,suggestedRole:role});
        break;
      }
    }
  });
  return{items:items};
}

function scanImageCandidates(scope) {
  var roots=scope==="selection"?figma.currentPage.selection:figma.currentPage.children;
  var items=[];
  walk(roots,function(node){
    var isImg=false;
    if("fills" in node&&node.fills){for(var i=0;i<node.fills.length;i++){if(node.fills[i].type==="IMAGE"){isImg=true;break;}}}
    var nm=node.name.toLowerCase();
    var isIcon=isVector(node)||nm.indexOf("icon")!==-1||nm.indexOf("logo")!==-1||nm.indexOf("illustration")!==-1||nm.indexOf("photo")!==-1||nm.indexOf("img")!==-1;
    if(isImg||isIcon) items.push({nodeId:node.id,nodeName:node.name,isIcon:!isImg});
  });
  return{items:items};
}

function scanHeadingCandidates(scope) {
  var roots=scope==="selection"?figma.currentPage.selection:figma.currentPage.children;
  var items=[];
  walk(roots,function(node){
    if(!isText(node)) return;
    var styleName="";
    if(typeof node.textStyleId==="string"&&node.textStyleId!==""){
      var s=figma.getStyleById(node.textStyleId);
      if(s&&s.name) styleName=s.name;
    }
    var combined=styleName+" "+node.name;
    var m=combined.match(/\bh([1-6])\b|\bheading\s*([1-6])\b/i);
    if(m){
      items.push({nodeId:node.id,nodeName:node.name,level:parseInt(m[1]||m[2],10),styleName:styleName,heuristic:false});
    } else if(typeof node.fontSize==="number"&&node.fontSize>=20){
      items.push({nodeId:node.id,nodeName:node.name,level:2,styleName:styleName,heuristic:true});
    }
  });
  return{items:items};
}

// ══════════════════════════════════════════════════════════════
// CANVAS ANNOTATION DRAWING
// All drawing uses Promise chains (then/catch) instead of async/await
// ══════════════════════════════════════════════════════════════

var PALETTE = {
  indigo:  {r:0.31,g:0.27,b:0.90},
  teal:    {r:0.06,g:0.60,b:0.44},
  orange:  {r:0.85,g:0.33,b:0.10},
  white:   {r:1,g:1,b:1},
  black:   {r:0.1,g:0.1,b:0.1},
};

// Remove layers on current page whose name starts with prefix
function cleanByPrefix(prefix) {
  var page=figma.currentPage;
  var dead=[];
  for(var i=0;i<page.children.length;i++){
    var c=page.children[i];
    if(c.name&&c.name.indexOf(prefix)===0) dead.push(c);
  }
  for(var j=0;j<dead.length;j++){try{dead[j].remove();}catch(e){}}
}
function cleanAll(){
  ["fo_ann_","lm_ann_","alt_ann_","hdg_ann_","__a11y_hl__"].forEach(function(p){cleanByPrefix(p);});
}

// Create a text node (fonts must already be loaded)
function makeTxt(chars, size, weight, color) {
  var t=figma.createText();
  t.fontName={family:"Inter",style:weight||"Regular"};
  t.fontSize=size||12;
  t.characters=chars;
  t.fills=[{type:"SOLID",color:color||PALETTE.black}];
  t.textAutoResize="WIDTH_AND_HEIGHT";
  return t;
}

// Draw numbered focus badge
function drawFocusBadge(num, x, y) {
  var frame=figma.createFrame();
  frame.name="fo_badge";
  frame.resize(24,24);
  frame.x=x; frame.y=y;
  frame.cornerRadius=12;
  frame.fills=[{type:"SOLID",color:PALETTE.indigo}];
  frame.strokes=[{type:"SOLID",color:PALETTE.white}];
  frame.strokeWeight=2;
  var t=makeTxt(String(num),10,"Bold",PALETTE.white);
  t.textAlignHorizontal="CENTER";
  t.textAlignVertical="CENTER";
  t.resize(24,24);
  frame.appendChild(t);
  return frame;
}

// Draw dashed outline rect
function drawDash(x,y,w,h,color,dash) {
  var r=figma.createRectangle();
  r.x=x; r.y=y;
  r.resize(w,h);
  r.fills=[];
  r.strokes=[{type:"SOLID",color:color||PALETTE.indigo}];
  r.strokeWeight=2;
  r.dashPattern=dash||[6,4];
  return r;
}

// Draw a solid pill label
function drawPill(text, bgColor, x, y) {
  var frame=figma.createFrame();
  frame.name="pill";
  frame.cornerRadius=11;
  frame.fills=[{type:"SOLID",color:bgColor}];
  frame.strokes=[{type:"SOLID",color:PALETTE.white}];
  frame.strokeWeight=1.5;
  var t=makeTxt(text,10,"Bold",PALETTE.white);
  var tw=t.width;
  var pw=tw+16, ph=22;
  frame.resize(pw,ph);
  t.resize(pw,ph);
  t.textAlignHorizontal="CENTER";
  t.textAlignVertical="CENTER";
  frame.appendChild(t);
  frame.x=x; frame.y=y;
  return frame;
}

// ── ANNOTATE FOCUS ORDER ──────────────────────────────────────
function doAnnotateFocusOrder(frameId, items) {
  figma.loadFontAsync({family:"Inter",style:"Bold"}).then(function(){
    figma.loadFontAsync({family:"Inter",style:"Regular"}).then(function(){
      cleanByPrefix("fo_ann_");

      var targetFrame=figma.getNodeById(frameId);
      var fab=targetFrame?targetFrame.absoluteBoundingBox:null;
      var ox=fab?fab.x:0, oy=fab?fab.y:0;

      var group=figma.createFrame();
      group.name="fo_ann_"+frameId;
      group.fills=[];
      group.clipsContent=false;
      group.resize(1,1);
      group.x=0; group.y=0;
      figma.currentPage.appendChild(group);

      for(var i=0;i<items.length;i++){
        var item=items[i];
        var tnode=figma.getNodeById(item.nodeId);
        if(!tnode) continue;
        var ab=tnode.absoluteBoundingBox;
        if(!ab) continue;

        // Dashed outline
        var outline=drawDash(ab.x-2,ab.y-2,ab.width+4,ab.height+4,PALETTE.indigo,[5,3]);
        outline.name="fo_outline";
        figma.currentPage.appendChild(outline);
        group.appendChild(outline);

        // Numbered badge at top-right
        var badge=drawFocusBadge(i+1, ab.x+ab.width-10, ab.y-10);
        badge.name="fo_num";
        figma.currentPage.appendChild(badge);
        group.appendChild(badge);
      }

      figma.viewport.scrollAndZoomIntoView([group]);
      figma.ui.postMessage({type:"annotation-done",tool:"focus-order",count:items.length});
    }).catch(function(e){figma.ui.postMessage({type:"annotation-error",message:String(e)});});
  }).catch(function(e){figma.ui.postMessage({type:"annotation-error",message:String(e)});});
}

// ── ANNOTATE LANDMARKS ────────────────────────────────────────
function doAnnotateLandmarks(annotations) {
  figma.loadFontAsync({family:"Inter",style:"Bold"}).then(function(){
    figma.loadFontAsync({family:"Inter",style:"Regular"}).then(function(){
      cleanByPrefix("lm_ann_");

      for(var i=0;i<annotations.length;i++){
        var ann=annotations[i];
        var node=figma.getNodeById(ann.nodeId);
        if(!node) continue;
        var ab=node.absoluteBoundingBox;
        if(!ab) continue;

        // Dashed border
        var border=drawDash(ab.x-4,ab.y-4,ab.width+8,ab.height+8,PALETTE.indigo,[10,6]);
        border.name="lm_ann_"+ann.nodeId;
        border.fills=[{type:"SOLID",color:PALETTE.indigo,opacity:0.04}];
        figma.currentPage.appendChild(border);

        // Role pill above
        var pill=drawPill(ann.role,PALETTE.indigo,ab.x-4,ab.y-28);
        pill.name="lm_label_"+ann.nodeId;
        figma.currentPage.appendChild(pill);
      }

      figma.ui.postMessage({type:"annotation-done",tool:"landmarks",count:annotations.length});
    }).catch(function(e){figma.ui.postMessage({type:"annotation-error",message:String(e)});});
  }).catch(function(e){figma.ui.postMessage({type:"annotation-error",message:String(e)});});
}

// ── ANNOTATE ALT TEXT ─────────────────────────────────────────
function doAnnotateAltText(annotations) {
  figma.loadFontAsync({family:"Inter",style:"Bold"}).then(function(){
    figma.loadFontAsync({family:"Inter",style:"Regular"}).then(function(){
      for(var i=0;i<annotations.length;i++){
        var ann=annotations[i];
        var node=figma.getNodeById(ann.nodeId);
        if(!node) continue;
        var ab=node.absoluteBoundingBox;
        if(!ab) continue;

        // Remove existing for this node
        cleanByPrefix("alt_ann_"+ann.nodeId);

        // Container badge
        var container=figma.createFrame();
        container.name="alt_ann_"+ann.nodeId;
        container.fills=[{type:"SOLID",color:{r:0.93,g:0.99,b:0.96}}];
        container.strokes=[{type:"SOLID",color:PALETTE.teal}];
        container.strokeWeight=1.5;
        container.cornerRadius=6;

        // "ALT" mini tag
        var tag=figma.createFrame();
        tag.name="alt-tag";
        tag.resize(28,18);
        tag.cornerRadius=4;
        tag.fills=[{type:"SOLID",color:PALETTE.teal}];
        tag.x=6; tag.y=5;

        var tagTxt=makeTxt("ALT",9,"Bold",PALETTE.white);
        tagTxt.textAlignHorizontal="CENTER";
        tagTxt.textAlignVertical="CENTER";
        tagTxt.resize(28,18);
        tag.appendChild(tagTxt);
        container.appendChild(tag);

        // Alt text content
        var displayText=ann.decorative?"decorative":(ann.altText||"[missing alt text]");
        var altTxt=makeTxt(displayText,11,"Regular",ann.decorative?{r:0.5,g:0.5,b:0.5}:PALETTE.black);
        altTxt.x=40; altTxt.y=7;

        var tw=Math.min(altTxt.width,200);
        altTxt.resize(tw,altTxt.height);
        container.resize(tw+52,Math.max(28,altTxt.height+14));
        container.appendChild(altTxt);

        container.x=ab.x+ab.width+12;
        container.y=ab.y;
        figma.currentPage.appendChild(container);

        // Connector line
        var line=figma.createLine();
        line.name="alt_line_"+ann.nodeId;
        line.x=ab.x+ab.width; line.y=ab.y+ab.height/2;
        line.resize(14,0);
        line.strokes=[{type:"SOLID",color:PALETTE.teal}];
        line.strokeWeight=1.5;
        line.dashPattern=[3,2];
        figma.currentPage.appendChild(line);
      }

      figma.ui.postMessage({type:"annotation-done",tool:"alt-text",count:annotations.length});
    }).catch(function(e){figma.ui.postMessage({type:"annotation-error",message:String(e)});});
  }).catch(function(e){figma.ui.postMessage({type:"annotation-error",message:String(e)});});
}

// ── ANNOTATE HEADINGS ─────────────────────────────────────────
function doAnnotateHeadings(annotations) {
  figma.loadFontAsync({family:"Inter",style:"Bold"}).then(function(){
    figma.loadFontAsync({family:"Inter",style:"Regular"}).then(function(){
      for(var i=0;i<annotations.length;i++){
        var ann=annotations[i];
        var node=figma.getNodeById(ann.nodeId);
        if(!node) continue;
        var ab=node.absoluteBoundingBox;
        if(!ab) continue;

        cleanByPrefix("hdg_ann_"+ann.nodeId);

        var badge=figma.createFrame();
        badge.name="hdg_ann_"+ann.nodeId;
        badge.resize(30,20);
        badge.cornerRadius=4;
        badge.fills=[{type:"SOLID",color:PALETTE.orange}];

        var t=makeTxt("H"+ann.level,10,"Bold",PALETTE.white);
        t.textAlignHorizontal="CENTER";
        t.textAlignVertical="CENTER";
        t.resize(30,20);
        badge.appendChild(t);

        badge.x=ab.x-38;
        badge.y=ab.y+ab.height/2-10;
        figma.currentPage.appendChild(badge);

        // Faint horizontal line connecting badge to text
        var line=figma.createLine();
        line.name="hdg_line_"+ann.nodeId;
        line.x=ab.x-8; line.y=ab.y+ab.height/2;
        line.resize(10,0);
        line.strokes=[{type:"SOLID",color:PALETTE.orange}];
        line.strokeWeight=1;
        line.opacity=0.5;
        figma.currentPage.appendChild(line);
      }

      figma.ui.postMessage({type:"annotation-done",tool:"headings",count:annotations.length});
    }).catch(function(e){figma.ui.postMessage({type:"annotation-error",message:String(e)});});
  }).catch(function(e){figma.ui.postMessage({type:"annotation-error",message:String(e)});});
}

// ── HIGHLIGHT ─────────────────────────────────────────────────
var hlNode=null;
function removeHl(){if(hlNode&&hlNode.parent){try{hlNode.remove();}catch(e){}}hlNode=null;}
function highlightNode(nodeId){
  removeHl();
  var t=figma.getNodeById(nodeId);
  if(!t) return;
  figma.viewport.scrollAndZoomIntoView([t]);
  figma.currentPage.selection=[t];
  var ab=t.absoluteBoundingBox;
  if(!ab) return;
  var r=figma.createRectangle();
  r.name="__a11y_hl__";
  r.x=ab.x-3; r.y=ab.y-3;
  r.resize(ab.width+6,ab.height+6);
  r.fills=[];
  r.strokes=[{type:"SOLID",color:{r:1,g:0.2,b:0.2}}];
  r.strokeWeight=2;
  r.dashPattern=[6,4];
  r.opacity=0.9;
  figma.currentPage.appendChild(r);
  hlNode=r;
  setTimeout(removeHl,3000);
}

// ── EXPORT ────────────────────────────────────────────────────
function toJSON(r){return JSON.stringify(r,null,2);}
function toCSV(issues){
  function q(s){return'"'+String(s).replace(/"/g,'""')+'"';}
  var h=["Rule","WCAG","Level","Severity","Node","Description","Fix"];
  var rows=[];
  for(var i=0;i<issues.length;i++){
    var x=issues[i];
    rows.push([x.ruleId,x.wcagId,x.wcagLevel,x.severity,x.nodeName,x.description,x.recommendation].map(q).join(","));
  }
  return[h.join(",")].concat(rows).join("\n");
}
function toSummary(r){
  var h=0,m=0,l=0;
  for(var i=0;i<r.issues.length;i++){if(r.issues[i].severity==="high")h++;else if(r.issues[i].severity==="medium")m++;else l++;}
  var top=r.issues.slice(0,5).map(function(i,n){return"  "+(n+1)+". ["+i.severity.toUpperCase()+"] "+i.description;}).join("\n");
  return["Score: "+r.score+"/100 ("+r.grade+")","Risk: "+r.riskLevel.toUpperCase(),"Nodes: "+r.totalNodes,"Issues: "+r.issues.length+" (H:"+h+" M:"+m+" L:"+l+")","","Top issues:",top||"None"].join("\n");
}

// ══════════════════════════════════════════════════════════════
// PLUGIN ENTRY
// ══════════════════════════════════════════════════════════════
figma.showUI(__html__,{width:380,height:620,title:"A11y Scanner"});

var debTimer=null;

figma.ui.onmessage=function(msg){
  if(msg.type==="scan"){
    if(debTimer) clearTimeout(debTimer);
    debTimer=setTimeout(function(){
      try{
        var result=runScan(msg.scope||"page");
        figma.ui.postMessage({type:"scan-result",result:result,tool:msg.tool||"contrast"});
      }catch(e){
        figma.ui.postMessage({type:"scan-error",message:String(e)});
      }
    },300);
  }
  else if(msg.type==="scan-focus-candidates"){
    var fo=scanFocusCandidates(msg.scope||"page");
    figma.ui.postMessage({type:"focus-candidates",items:fo.items,frameId:fo.frameId});
  }
  else if(msg.type==="scan-landmark-candidates"){
    var lm=scanLandmarkCandidates(msg.scope||"page");
    figma.ui.postMessage({type:"landmark-candidates",items:lm.items});
  }
  else if(msg.type==="scan-image-candidates"){
    var im=scanImageCandidates(msg.scope||"page");
    figma.ui.postMessage({type:"image-candidates",items:im.items});
  }
  else if(msg.type==="scan-heading-candidates"){
    var hd=scanHeadingCandidates(msg.scope||"page");
    figma.ui.postMessage({type:"heading-candidates",items:hd.items});
  }
  else if(msg.type==="annotate-focus-order"){
    doAnnotateFocusOrder(msg.frameId,msg.items);
  }
  else if(msg.type==="annotate-landmarks"){
    doAnnotateLandmarks(msg.annotations);
  }
  else if(msg.type==="annotate-alt-text"){
    doAnnotateAltText(msg.annotations);
  }
  else if(msg.type==="annotate-headings"){
    doAnnotateHeadings(msg.annotations);
  }
  else if(msg.type==="clear-annotations"){
    if(msg.all) cleanAll();
    else if(msg.prefix) cleanByPrefix(msg.prefix);
    figma.ui.postMessage({type:"annotations-cleared"});
  }
  else if(msg.type==="highlight"){
    if(msg.nodeId) highlightNode(msg.nodeId);
  }
  else if(msg.type==="select-node"){
    var n=figma.getNodeById(msg.nodeId);
    if(n){figma.currentPage.selection=[n];figma.viewport.scrollAndZoomIntoView([n]);}
  }
  else if(msg.type==="export"){
    var r=msg.result,content="",fn="a11y-report";
    if(msg.format==="json"){content=toJSON(r);fn="a11y-report.json";}
    else if(msg.format==="csv"){content=toCSV(r.issues);fn="a11y-report.csv";}
    else{content=toSummary(r);fn="a11y-report.txt";}
    figma.ui.postMessage({type:"export-ready",content:content,filename:fn});
  }
  else if(msg.type==="close"){removeHl();figma.closePlugin();}
};

figma.on("selectionchange",function(){
  var sel=figma.currentPage.selection;
  figma.ui.postMessage({type:"selection-changed",count:sel.length,firstId:sel.length>0?sel[0].id:null,firstName:sel.length>0?sel[0].name:null});
});
