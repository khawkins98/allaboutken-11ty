/**
 * Precompiled Nunjucks template: vf-search-client-side.njk
 */
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["vf-search-client-side"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
if(runtime.contextOrFrameLookup(context, frame, "context")) {
var t_1;
t_1 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "context")),"search_client_prompt");
frame.set("search_client_prompt", t_1, true);
if(frame.topLevel) {
context.setVariable("search_client_prompt", t_1);
}
if(frame.topLevel) {
context.addExport("search_client_prompt", t_1);
}
var t_2;
t_2 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "context")),"search_client_action");
frame.set("search_client_action", t_2, true);
if(frame.topLevel) {
context.setVariable("search_client_action", t_2);
}
if(frame.topLevel) {
context.addExport("search_client_action", t_2);
}
var t_3;
t_3 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "context")),"search_client_results");
frame.set("search_client_results", t_3, true);
if(frame.topLevel) {
context.setVariable("search_client_results", t_3);
}
if(frame.topLevel) {
context.addExport("search_client_results", t_3);
}
var t_4;
t_4 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "context")),"search_client_autofocus");
frame.set("search_client_autofocus", t_4, true);
if(frame.topLevel) {
context.setVariable("search_client_autofocus", t_4);
}
if(frame.topLevel) {
context.addExport("search_client_autofocus", t_4);
}
var t_5;
t_5 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "context")),"search_client_button");
frame.set("search_client_button", t_5, true);
if(frame.topLevel) {
context.setVariable("search_client_button", t_5);
}
if(frame.topLevel) {
context.addExport("search_client_button", t_5);
}
var t_6;
t_6 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "context")),"search_client_button_text");
frame.set("search_client_button_text", t_6, true);
if(frame.topLevel) {
context.setVariable("search_client_button_text", t_6);
}
if(frame.topLevel) {
context.addExport("search_client_button_text", t_6);
}
var t_7;
t_7 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "context")),"search_client_script");
frame.set("search_client_script", t_7, true);
if(frame.topLevel) {
context.setVariable("search_client_script", t_7);
}
if(frame.topLevel) {
context.addExport("search_client_script", t_7);
}
var t_8;
t_8 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "context")),"search_client_id");
frame.set("search_client_id", t_8, true);
if(frame.topLevel) {
context.setVariable("search_client_id", t_8);
}
if(frame.topLevel) {
context.addExport("search_client_id", t_8);
}
var t_9;
t_9 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "context")),"search_client_destination_prefix");
frame.set("search_client_destination_prefix", t_9, true);
if(frame.topLevel) {
context.setVariable("search_client_destination_prefix", t_9);
}
if(frame.topLevel) {
context.addExport("search_client_destination_prefix", t_9);
}
output += "\n";
var t_10;
t_10 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "context")),"id");
frame.set("id", t_10, true);
if(frame.topLevel) {
context.setVariable("id", t_10);
}
if(frame.topLevel) {
context.addExport("id", t_10);
}
var t_11;
t_11 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "context")),"modifiers");
frame.set("modifiers", t_11, true);
if(frame.topLevel) {
context.setVariable("modifiers", t_11);
}
if(frame.topLevel) {
context.addExport("modifiers", t_11);
}
var t_12;
t_12 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "context")),"override_class");
frame.set("override_class", t_12, true);
if(frame.topLevel) {
context.setVariable("override_class", t_12);
}
if(frame.topLevel) {
context.addExport("override_class", t_12);
}
;
}
output += "<form action=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "search_client_action"), env.opts.autoescape);
output += "\" method=\"GET\" class=\"vf-form vf-form--search vf-form--search--responsive | vf-sidebar vf-sidebar--end\">\n  <div class=\"vf-sidebar__inner\">\n    <div class=\"vf-form__item | vf-search__item\">\n      <label class=\"vf-form__label vf-u-sr-only | vf-search__label\" for=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "search_client_id"), env.opts.autoescape);
output += "\">";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "search_label"), env.opts.autoescape);
output += "</label>\n      <input type=\"search\" id=\"search\" placeholder=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "search_client_prompt"), env.opts.autoescape);
output += "\" name=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "search_client_id"), env.opts.autoescape);
output += "\" class=\"vf-search__input | vf-form__input\"";
if(runtime.contextOrFrameLookup(context, frame, "search_client_autofocus")) {
output += " autofocus";
;
}
output += " data-vf-search-client-side-input data-vf-search-client-side-destination-prefix=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "search_client_destination_prefix"), env.opts.autoescape);
output += "\">\n    </div>";
if(runtime.contextOrFrameLookup(context, frame, "search_client_button")) {
output += "<button type=\"submit\" class=\"vf-search__button | vf-button vf-button--primary\">\n      <span class=\"vf-button__text\">";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "search_client_button_text"), env.opts.autoescape);
output += "</span>\n\n      <svg class=\"vf-icon vf-icon--search-btn | vf-button__icon\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:svgjs=\"http://svgjs.com/svgjs\" viewBox=\"0 0 140 140\" width=\"140\" height=\"140\"><g transform=\"matrix(5.833333333333333,0,0,5.833333333333333,0,0)\"><path d=\"M23.414,20.591l-4.645-4.645a10.256,10.256,0,1,0-2.828,2.829l4.645,4.644a2.025,2.025,0,0,0,2.828,0A2,2,0,0,0,23.414,20.591ZM10.25,3.005A7.25,7.25,0,1,1,3,10.255,7.258,7.258,0,0,1,10.25,3.005Z\" fill=\"#FFFFFF\" stroke=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"0\"></path></g></svg>\n    </button>";
;
}
output += "</div>\n</form>";
if(runtime.contextOrFrameLookup(context, frame, "search_client_results")) {
output += "<script src=\"https://cdnjs.cloudflare.com/ajax/libs/lunr.js/2.3.8/lunr.js\"></script>";
output += "<script src=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "search_client_script"), env.opts.autoescape);
output += "\"></script>\n<div class=\"vf-search-client-side vf-grid | vf-content\">\n  <div class=\"results-container\" data-vf-search-client-side-results>\n    Loading...\n  </div>\n</div>\n\n<script type=\"text/javascript\">\n  window.onload = function () {\n    vfSearchClientSide();\n  };\n</script>\n";
;
}
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
