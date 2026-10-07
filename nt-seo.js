/*! New Taraneh SEO+Schema v6 – Google Music standards */
(function(){
"use strict";
function abs(u){try{return new URL(u,location.href).href}catch(e){return u}}
function clean(o){Object.keys(o).forEach(function(k){if(o[k]===void 0)delete o[k];else if(Array.isArray(o[k])){o[k]=o[k].filter(Boolean);if(!o[k].length)delete o[k]}else if(o[k]&&typeof o[k]==="object")clean(o[k])});return o}
function text(el){var d=document.createElement("div");d.innerHTML=el;return (d.textContent||"").trim()}
var months=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
function toEnDigits(s){return String(s).replace(/[۰-۹]/g,function(d){return"۰۱۲۳۴۵۶۷۸۹".indexOf(d)}).replace(/[٠-٩]/g,function(d){return"٠١٢٣٤٥٦٧٨٩".indexOf(d)})}
function jalaliToGreg(jy,jm,jd){jy-=979;jm--;var r=365*jy+Math.floor(jy/33)*8+Math.floor((jy%33+3)/4),u=[31,31,31,31,31,31,30,30,30,30,30,29];for(var i=0;i<jm;i++)r+=u[i];r+=jd-1;var g=r+79,y=1600+400*Math.floor(g/146097);g%=146097;var leap=true;if(g>=36525){g--;y+=100*Math.floor(g/36524);g%=36524;if(g>=365)g++;else leap=false}y+=4*Math.floor(g/1461);g%=1461;if(g>=366){leap=false;g--;y+=Math.floor(g/365);g%=365}var md=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31],m=0;while(m<12&&g>=md[m]){g-=md[m];m++}return[y,m+1,g+1]}
function parseDate(ds,ts){if(!ds)return;var a=toEnDigits(ds).trim(),y,m,d,i=a.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);if(i){y=+i[1];m=+i[2];d=+i[3]}else{for(var k=0;k<months.length;k++)if(a.indexOf(months[k])>-1){var dd=a.match(/(\d{1,2})/),yy=a.match(/(\d{4})/);if(dd&&yy){d=+dd[1];m=k+1;y=+yy[1]}break}}if(!y||!m||!d)return;try{var g=jalaliToGreg(y,m,d);var p=function(n){return n<10?"0"+n:""+n};var t="00:00:00";if(ts){var tm=toEnDigits(ts).match(/(\d{1,2}):(\d{2})/);if(tm)t=p(+tm[1])+":"+tm[2]+":00"}return g[0]+"-"+p(g[1])+"-"+p(g[2])+"T"+t+"+03:30"}catch(e){}}
function dur(sec){sec=Math.round(+sec||0);if(sec<=0)return;var h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return"PT"+(h?h+"H":"")+(m?m+"M":"")+(s||(!h&&!m)?s+"S":"")}
function parseTitle(title){var m=title.match(/(?:دانلود\s+(?:آهنگ|موزیک\s*ویدیو)\s+(?:جدید\s+)?)?(.+?)\s+به\s+نام\s+(.+?)(?:\s+بهمراه|\s+با\s+متن|\s+و\s+پخش|\s*$)/i);if(m)return{artist:m[1].replace(/^(دانلود\s+(آهنگ|موزیک\s*ویدیو)\s+(جدید\s+)?|آهنگ\s+جدید\s+)/i,"").trim(),title:m[2].trim()};var seps=[" - "," – "," — "," | "];for(var i=0;i<seps.length;i++)if(title.indexOf(seps[i])>-1){var p=title.split(seps[i]);return{artist:p.shift().trim(),title:p.join(seps[i]).trim()}}return{artist:"",title:title}}
function buildSchema(art){
var body=art.querySelector("[data-webloog-article-content]");if(!body)return null;
var url=abs(art.getAttribute("data-post-url")||location.href);
var title=(art.getAttribute("data-post-title")||document.title||"").trim();
var author=(art.getAttribute("data-post-author")||"").trim();
var date=parseDate((art.getAttribute("data-post-date")||"").trim(),(art.getAttribute("data-post-time")||"").trim());
var imgs=[].map.call(body.querySelectorAll("img"),function(im){return abs(im.src||im.getAttribute("data-src")||"")}).filter(Boolean);
var videos=[].slice.call(body.querySelectorAll("video,iframe[src*='aparat'],iframe[src*='youtube'],iframe[src*='youtu.be']"));
var audios=[].slice.call(body.querySelectorAll("audio,[data-ez-player]"));
var desc=text(body.innerHTML).replace(/\s+/g," ").trim();if(desc.length>280)desc=desc.slice(0,280)+"…";
var tags=[].map.call(art.querySelectorAll(".tag-chip"),function(t){return t.textContent.trim()}).filter(Boolean);
var genre=(body.textContent.match(/سبک\s*[:：]\s*([^\n\r|:：،]{2,40})/)||[])[1];
var lyricsEl=body.querySelector(".lyrics-box-text,[data-lyrics]");
var lyrics=lyricsEl?lyricsEl.textContent.trim():"";
var ogImg=document.querySelector('meta[property="og:image"]');
var thumb=imgs[0]||(ogImg?abs(ogImg.content):void 0);
var publisher=clean({"@type":"Organization","name":(document.querySelector('meta[property="og:site_name"]')||{}).content||"نیو ترانه","url":location.origin,"logo":{"@type":"ImageObject","url":(document.querySelector('link[rel="icon"]')||{}).href}});
var person=author?{"@type":"Person","name":author}:{"@type":"Person","name":"عرفان زارع"};
var items=[];
var pt=parseTitle(title);
audios.forEach(function(el){
var isAudio=el.tagName.toLowerCase()==="audio";
var srcEl=isAudio?el:el.querySelector("audio");
var src=srcEl?(srcEl.currentSrc||srcEl.src||(srcEl.querySelector("source")||{}).src||""):(el.getAttribute("data-src")||el.getAttribute("src")||"");
if(!src)return;
src=abs(src);
var d=srcEl&&srcEl.readyState>=1&&isFinite(srcEl.duration)?srcEl.duration:void 0;
var songName=pt.title||title;
var artistName=pt.artist;
var audioObj=clean({"@context":"https://schema.org","@type":"AudioObject","name":songName,"description":desc||title,"contentUrl":src,"encodingFormat":/\.m4a/i.test(src)?"audio/mp4":"audio/mpeg","inLanguage":"fa","uploadDate":date,"duration":d?dur(d):void 0,"thumbnailUrl":thumb,"author":artistName?{"@type":"MusicGroup","name":artistName}:person,"publisher":publisher,"mainEntityOfPage":{"@type":"WebPage","@id":url}});
items.push(audioObj);
if(artistName&&songName){
var mr=clean({"@context":"https://schema.org","@type":"MusicRecording","name":songName,"byArtist":{"@type":"MusicGroup","name":artistName},"duration":d?dur(d):void 0,"url":url,"image":thumb,"datePublished":date,"genre":genre&&genre.trim(),"inLanguage":"fa","audio":{"@type":"AudioObject","contentUrl":src},"isFamilyFriendly":true,"publisher":publisher});
if(lyrics)mr.lyrics={"@type":"CreativeWork","text":lyrics.slice(0,5000),"inLanguage":"fa"};
items.push(mr);
}
if(srcEl&&!d)srcEl.addEventListener("loadedmetadata",function(){if(isFinite(srcEl.duration)&&srcEl.duration>0){audioObj.duration=dur(srcEl.duration)}},{once:true});
});
videos.forEach(function(el){
var isIframe=el.tagName.toLowerCase()==="iframe";
var src=isIframe?(el.src||""):(el.currentSrc||(el.querySelector("source")||{}).src||el.src||"");
if(!src)return;
src=abs(src);
var d=!isIframe&&el.readyState>=1&&isFinite(el.duration)?el.duration:void 0;
var vo=clean({"@context":"https://schema.org","@type":"MusicVideoObject","name":title,"description":desc||title,"thumbnailUrl":el.getAttribute("poster")?[abs(el.getAttribute("poster"))]:(thumb?[thumb]:void 0),"uploadDate":date,"contentUrl":isIframe?void 0:src,"embedUrl":isIframe?src:void 0,"encodingFormat":isIframe?void 0:/\.webm/i.test(src)?"video/webm":"video/mp4","inLanguage":"fa","duration":d?dur(d):void 0,"isFamilyFriendly":true,"author":person,"publisher":publisher,"mainEntityOfPage":{"@type":"WebPage","@id":url},"musicBy":pt.artist?{"@type":"MusicGroup","name":pt.artist}:void 0});
items.push(vo);
if(!isIframe&&!d)el.addEventListener("loadedmetadata",function(){if(isFinite(el.duration)&&el.duration>0){vo.duration=dur(el.duration)}},{once:true});
});
var bp=clean({"@context":"https://schema.org","@type":"BlogPosting","headline":title,"description":desc||title,"url":url,"datePublished":date,"dateModified":date,"image":imgs.length?imgs:(thumb?[thumb]:void 0),"author":person,"publisher":publisher,"inLanguage":"fa","keywords":tags.length?tags.join(", "):void 0,"isAccessibleForFree":true,"mainEntityOfPage":{"@type":"WebPage","@id":url},"articleSection":genre||void 0});
if(items.filter(function(x){return x["@type"]==="MusicVideoObject"}).length)bp.video=items.filter(function(x){return x["@type"]==="MusicVideoObject"});
items.unshift(bp);
return items.filter(Boolean);
}
function inject(){
var isPost=document.documentElement.classList.contains("post");
var arts=document.querySelectorAll("[data-post-schema]");
if(!isPost&&arts.length>1)return;
arts.forEach(function(art){
if(art.dataset.schemaOk==="1")return;
var list=buildSchema(art);
if(!list||!list.length)return;
list.forEach(function(obj,i){
var s=document.createElement("script");s.type="application/ld+json";s.setAttribute("data-schema-idx",i);s.textContent=JSON.stringify(obj);art.appendChild(s);
});
if(isPost){
var first=list[0];
if(first.datePublished){var m=document.createElement("meta");m.setAttribute("property","article:published_time");m.content=first.datePublished;document.head.appendChild(m)}
if(first.description){var d=first.description.replace(/…$/,"");if(d.length>155)d=d.slice(0,155).replace(/\s+\S*$/,"")+"…";["meta[name=description]","meta[property='og:description']","meta[name='twitter:description']"].forEach(function(sel){var el=document.querySelector(sel);if(el)el.setAttribute("content",d)})}
var bc=document.getElementById("schema-breadcrumb");
if(bc){try{var bj=JSON.parse(bc.textContent);if(bj.itemListElement&&bj.itemListElement.length<2){bj.itemListElement.push({"@type":"ListItem","position":2,"name":art.getAttribute("data-post-title"),"item":abs(art.getAttribute("data-post-url"))});bc.textContent=JSON.stringify(bj)}}catch(e){}}
}
art.dataset.schemaOk="1";
});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inject);else inject();
var t;new MutationObserver(function(){clearTimeout(t);t=setTimeout(inject,350)}).observe(document.body,{childList:true,subtree:true});
})();
