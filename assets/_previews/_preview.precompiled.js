/**
 * Precompiled Nunjucks template: _preview.njk
 */
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["_preview"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n";
output += runtime.suppressValue(env.getFilter("safe").call(context, runtime.contextOrFrameLookup(context, frame, "yield")), env.opts.autoescape);
output += "\n\n<!-- The component library does not load the project-wide styles, but uses only the current compoenent's css -->\n<link media=\"all\" rel=\"stylesheet\" href=\"../raw/";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "_target")),"baseHandle"), env.opts.autoescape);
output += "/";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "_target")),"baseHandle"), env.opts.autoescape);
output += ".css\">\n";
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
