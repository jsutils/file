_define_("jsutils.file", function(file) {

  var jQuery = _module_("jQuery");
  var jsonUtil = _module_("jsutils.json");
  var tmplUtil = _module_("jsutils.tmpl");

  file.getVersionData = function(data){
    return data || {
      _ : bootloader ? bootloader.config().version : ""
    };
  };

  file.getJSON = function(filePath,data){
    return jQuery.getJSON(filePath,file.getVersionData(data)).then(function(resp){
      return jsonUtil.parse(resp,data);
    });
  };

  file.get = function(filePath,data){
    return jQuery.get(filePath,file.getVersionData(data));
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
      return jQuery.when(
        (data === undefined)
          ? TEMPLATES[filePath].template
          : TEMPLATES[filePath].render(data),
        TEMPLATES[filePath].render
      );
    });
  };

  file.load_template = function(html_path){
    var info = URI.info(html_path);
    if(!TEMPLATES[info.href]){
      TEMPLATES[info.href] ={
        promise :  file.get(info.href).then(function(raw_html){
          var P = [];
          var mathces = raw_html.match(/<include\s*(.*?)\s*data=(.*?)\/>/g);
          if(mathces!==null){
            var paths = mathces.map(function(x){
              /*
               * To allow all the combinations for attribute assignments
               */
              return ((/src="?([^"\s]+)"?\s*/).exec(x)[1]).replace(/(^\')|(\'$)/g, "") ;
            });

            for(var i in paths){
              var newFilePath = URI(paths[i],info.origin+info.dir);
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
          TEMPLATES[info.href].template = raw_html;
          TEMPLATES[info.href].render = tmplUtil.compile(raw_html,{ render : __undescore_template_resolver_ });
          return jQuery.when.apply(jQuery,P);
        })
      };
    }
    return TEMPLATES[info.href].promise;
  };

  file.loadView = function(htmlSrc,dataSrc){
    var OBJ = {};
    if(is.Object(htmlSrc) && typeof is.Function(htmlSrc.done)){
      OBJ = htmlSrc;
    } else {
      OBJ.src = htmlSrc;
      OBJ.data = dataSrc;
    }

    var htmlView = "",htmlUrl,render;
    var dff = [];

    if(is.Function(OBJ.src)){
      OBJ.src = OBJ.src();
    } else if(is.Function(OBJ.html)){
      OBJ.html = OBJ.html();
      if(is.Object(OBJ.html) && is.Function(OBJ.html.done)){
        OBJ.src = OBJ.html;
      }
    }

    if(is.String(OBJ.src)){
      htmlUrl = OBJ.src;
      dff.push(file.getHTML(htmlUrl).done(function(respHTML,respRender){
        render = respRender;
      }));
    } else if(is.Object(OBJ.src) && is.Function(OBJ.src.done)){
      dff.push(OBJ.src.done(function(resp){
        htmlView = resp;
      }));
    } else if(OBJ.html){
      render = tmplUtil.compile(OBJ.html,{ render : __undescore_template_resolver_ });
    }

    if(is.String(OBJ.data)){
      dff.push(file.getJSON(OBJ.data).done(function(resp){
        OBJ.data = resp;
      }));
    } else if(is.Object(OBJ.data) && is.Function(OBJ.data.done)){
      dff.push(OBJ.data.done(function(resp){
        OBJ.data = resp;
      }));
    }
    return jQuery.when.apply(jQuery,dff).done(function(){
      if(render){
        OBJ.html = render(OBJ.data);
      }
    }).then(function(){
      return jQuery.when(OBJ);
    });
  };

  var loadTemp = function(htmlSrc,dataSrc){
    var elem = this;
    var dff = jQuery.Deferred();
    file.loadView(htmlSrc,dataSrc).then(function(OBJ){
      elem.html(OBJ.html);
      return dff.resolveWith(elem,arguments);
    });
    return dff.promise();
  };

  jQuery.fn.loadTemplate = jQuery.fn.loadTemplate || loadTemp;
  jQuery.fn.loadTemp = jQuery.fn.loadTemp || loadTemp;
  jQuery.fn.loadView = jQuery.fn.loadView || loadTemp;
  jQuery.fn.tmpl = jQuery.fn.tmpl || loadTemp;


});