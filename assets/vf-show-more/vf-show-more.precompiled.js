/**
 * Precompiled Nunjucks template: vf-show-more.njk
 */
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["vf-show-more"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n";
if(runtime.contextOrFrameLookup(context, frame, "context")) {
output += "  ";
output += "\n";
;
}
output += "\n<section data-vf-js-show-more data-vf-js-show-more-pager-size=\"3\" class=\"vf-show-more\">\n";
env.getExtension("render")["run"](context,"@vf-section-header--default",{"section_title": "Show more demo"}, function(t_2,t_1) {
if(t_2) { cb(t_2); return; }
output += runtime.suppressValue(t_1, true && env.opts.autoescape);
output += "\n  <div class=\"vf-grid vf-grid__col-3\">\n";
var t_3;
t_3 = [{"title": "foo","id": 1},{"title": "foo","id": 2},{"title": "foo","id": 3},{"title": "foo","id": 4},{"title": "foo","id": 5},{"title": "foo","id": 6},{"title": "foo","id": 7},{"title": "foo","id": 8},{"title": "foo","id": 9}];
frame.set("items", t_3, true);
if(frame.topLevel) {
context.setVariable("items", t_3);
}
if(frame.topLevel) {
context.addExport("items", t_3);
}
frame = frame.push();
var t_6 = runtime.fromIterator(runtime.contextOrFrameLookup(context, frame, "items"));
runtime.asyncEach(t_6, 1, function(item, t_4, t_5,next) {
frame.set("item", item);
frame.set("loop.index", t_4 + 1);
frame.set("loop.index0", t_4);
frame.set("loop.revindex", t_5 - t_4);
frame.set("loop.revindex0", t_5 - t_4 - 1);
frame.set("loop.first", t_4 === 0);
frame.set("loop.last", t_4 === t_5 - 1);
frame.set("loop.length", t_5);
env.getExtension("render")["run"](context,"@vf-box",{"box_heading": runtime.memberLookup((item),"title"),"box_text": "I'm item number " + runtime.memberLookup((item),"id"),"variant": "easy","override_class": "vf-show-more__item"}, function(t_8,t_7) {
if(t_8) { cb(t_8); return; }
output += runtime.suppressValue(t_7, true && env.opts.autoescape);
next(t_4);
});
}, function(t_10,t_9) {
if(t_10) { cb(t_10); return; }
frame = frame.pop();
output += "  </div>\n\n  <button class=\"vf-button vf-button--primary vf-button--sm | vf-show-more__button\" data-vf-js-show-more-button>Show more</button>\n  <button class=\"vf-button vf-button--primary vf-button--sm | vf-show-more__button--less\" data-vf-js-show-more-button--less>Show less</button>\n</section>\n\n\n";
output += "\n\n<section data-vf-js-show-more data-vf-js-show-more-pager-size=\"2\" class=\"vf-show-more\">\n";
env.getExtension("render")["run"](context,"@vf-section-header--default",{"section_title": "Show more demo part 2"}, function(t_12,t_11) {
if(t_12) { cb(t_12); return; }
output += runtime.suppressValue(t_11, true && env.opts.autoescape);
output += "\n  <ul class=\"vf-list vf-list--ordered\">\n    <li class=\"vf-list__item | vf-show-more__item\">a list item</li>\n    <li class=\"vf-list__item | vf-show-more__item\">another list item</li>\n    <li class=\"vf-list__item | vf-show-more__item\">and another list item</li>\n    <li class=\"vf-list__item | vf-show-more__item\">yet another list item</li>\n  </ul>\n\n  <button class=\"vf-button vf-button--primary vf-button--sm | vf-show-more__button\" data-vf-js-show-more-button>Show more list items</button>\n  <button class=\"vf-button vf-button--primary vf-button--sm | vf-show-more__button--less\" data-vf-js-show-more-button--less>Show less</button>\n</section>\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
})})});
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
