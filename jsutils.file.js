_define_("jsutils.file", function(file) {
	
	var jQuery = _module_("jQuery");
	var jsonUtil = _module_("jsutils.json");
	var tmplUtil = _module_("jsutils.tmpl");

	file.getJSON = function(filePath,data){
		return jQuery.getJSON(filePath).then(function(resp){
			jsonUtil.parse(resp,data)
		});
	};
	
	file.getHTML = function(filePath,data){
		return jQuery.getJSON(filePath).then(function(resp){
			jsonUtil.parse(resp,data)
		});
	};

});