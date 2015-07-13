_require_(
	"webmodules/jQuery",
	"jsutils/json", "jsutils/tmpl",
);
_define_("jsutils.file", function(file) {
	
	var jQuery = _module_("jQuery");
	var jsonUtil = _module_("jsutils.json");
	var tmplUtil = _module_("jsutils.tmpl");
	
	file.getJSON = function(filePath,data){
		return jQuery.getJSON(filePath).then(function(resp){
			return jsonUtil.parse(resp,data);
		});
	};
	
	var TEMPLATES = {};
	
	var __undescore_template_resolver_ = function(file_name, data) {
		if (TEMPLATES[file_name]) {
			return TEMPLATES[file_name].render(data);
		} else if (file_name) {
			return "NO TEMPLATE FOUND:" + file_name;
		} else
			return "";
	};
	
	file.getHTML = function(filePath,data){
		return file.load_template(filePath).then(function(){
			return TEMPLATES[filePath].render(data);
		});
	};
	
	file.load_template = function(html_path){
		if(!TEMPLATES[html_path]){
			TEMPLATES[html_path] ={
				promise :  jQuery.get(html_path).then(function(raw_html){
					var P = [];
					var mathces = raw_html.match(/<include\s*(.*?)\s*data=(.*?)\/>/g);
					if(mathces!==null){
						var info = URI.info(html_path);
						var newDir = info.dir;
						var paths = mathces.map(function(x){
							/*
							 * To allow all the combinations for attribute assignments
							 */ 
							  return ((/src="?([^"\s]+)"?\s*/).exec(x)[1]).replace(/(^\')|(\'$)/g, "") ;
						});

						for(var i in paths){
							var newFilePath = URI(paths[i],newDir);
							raw_html = raw_html.replace(
							        /<include\s*(.*?)\s*data=(.*?)\s*\/>/,
							        paths[i] ? '<!-- print(__.render("'+newFilePath+'",$2)); -->'
							        		: ""
							);
							if(paths[i]){
								P.push(file.load_template(newFilePath));
							}
						}
					}
					TEMPLATES[html_path].render = tmplUtil.compile(raw_html,{ render : __undescore_template_resolver_ });
					return jQuery.when.apply(jQuery,P);
				})
			};
		}
		return TEMPLATES[html_path].promise;
	};

});