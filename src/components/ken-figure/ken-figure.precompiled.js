/**
 * Precompiled Nunjucks template: ken-figure.njk
 */
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["ken-figure"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "<figure\n";
output += "\n";
if(runtime.contextOrFrameLookup(context, frame, "id")) {
output += " id=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "id"), env.opts.autoescape);
output += "\"";
;
}
output += "class=\"vf-figure";
if(runtime.contextOrFrameLookup(context, frame, "override_class")) {
output += " | ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "override_class"), env.opts.autoescape);
;
}
output += "\">\n";
if(runtime.contextOrFrameLookup(context, frame, "href")) {
output += "<a href=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "href"), env.opts.autoescape);
output += "\">";
;
}
output += "  <img class=\"vf-figure__image\" src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "imageUrl"), env.opts.autoescape);
output += "\" alt=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "alttext"), env.opts.autoescape);
output += "\">\n";
if(runtime.contextOrFrameLookup(context, frame, "href")) {
output += "</a>";
;
}
output += "  <figcaption class=\"vf-figure__caption\">";
output += runtime.suppressValue((runtime.contextOrFrameLookup(context, frame, "html")?env.getFilter("safe").call(context, runtime.contextOrFrameLookup(context, frame, "html")):runtime.contextOrFrameLookup(context, frame, "text")), env.opts.autoescape);
output += "</figcaption>\n</figure>";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
