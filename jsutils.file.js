_define_("jsutils.file", function (file) {

  var jQuery = _module_("jQuery");
  var jsonUtil = _module_("jsutils.json");
  var tmplUtil = _module_("jsutils.tmpl");
  var remoteSrcDir = null;

  file.getVersionData = function (data) {
    return data || {
      _: bootloader ? bootloader.config().version : ""
    };
  };

  var getOneHtmlFile = function (html_path) {
    if(bootloader && bootloader.config && !bootloader.config().debug){
      if(!remoteSrcDir){
        var uri = URI.info(bootloader.config().resourceUrl + bootloader.config().resourceDir+"/");
        remoteSrcDir = uri.origin + URI.clean(uri.pathname);
      }
      var bundles = bootloader.config().resource.bundles;
      var rel_html_path = html_path.replace(remoteSrcDir,"");
      for(var pack in bundles){
        var bundle = bundles[pack];
        if(bundle.html && bundle.html.indexOf(rel_html_path)>-1 && bundle.bundled_html && bundle.bundled_html.length>0){
          return remoteSrcDir + bundle.bundled_html;
        }
      }
    }
    return null
  };

  file.getJSON = function (filePath, data) {
    return jQuery.getJSON(filePath, file.getVersionData(data)).then(function (resp) {
      return jsonUtil.parse(resp, data);
    });
  };

  file.get = function (filePath, data) {
    return jQuery.get(filePath, file.getVersionData(data));
  };

  var TEMPLATES = {};

  var __undescore_template_resolver_ = function (file_name, data) {
    if (TEMPLATES[file_name]) {
      return TEMPLATES[file_name].render(data);
    } else if (file_name) {
      return "NO TEMPLATE FOUND:" + file_name;
    } else
      return "";
  };

  file.getHTML = function (filePath, data) {
    return file.load_template(filePath).then(function () {
      if(TEMPLATES[filePath]){
        return jQuery.when(
          (data === undefined)
            ? TEMPLATES[filePath].template
            : TEMPLATES[filePath].render(data),
          TEMPLATES[filePath].render
        );
      } else {
          console.error("Template ",filePath,"was not loaded");
      }
    });
  };

  var REQUESTS = {};
  file.load_template = function (html_path) {
    var info = URI.info(html_path);
    if (!TEMPLATES[info.href]) {
      var full_html = getOneHtmlFile(info.href);
      var REQ ;
      if(full_html) {
        REQ = REQUESTS[full_html] || file.get(full_html);
        REQUESTS[full_html] = REQ;
      } else {
        REQ = REQUESTS[info.href] ||  file.get(info.href);
        REQUESTS[info.href] = REQ;
      }
      TEMPLATES[info.href] = {};
      TEMPLATES[info.href].promise = REQ.then(function (raw_html_full) {
        var raw_html = raw_html_full;
        if(full_html){
          var div = document.createElement("div");
          div.innerHTML = raw_html_full;
          raw_html = jQuery(div).find("[src='./" + html_path.replace(remoteSrcDir,"") +"']").text();
        }
        var P = [];
        raw_html = raw_html.replace(/><\/include>/g,"\/>");

        var mathces = raw_html.match(/<include\s*(.*?)\s*data=(.*?)\/>/g);
        if (mathces !== null) {
          var paths = mathces.map(function (x) {
            /*
             * To allow all the combinations for attribute assignments
             */
            return ((/src="?([^"\s]+)"?\s*/).exec(x)[1]).replace(/(^\')|(\'$)/g, "");
          });

          for (var i in paths) {
            var newFilePath = URI(paths[i], info.origin + info.dir);
            raw_html = raw_html.replace(
              /<include\s*(.*?)\s*data=(.*?)\s*\/>/,
              paths[i] ? '<!-- print(__.render("' + newFilePath + '",$2)); -->'
                : ""
            );
            if (paths[i]) {
              P.push(file.load_template(newFilePath));
            }
          }
        }
        TEMPLATES[info.href].template = raw_html;
        TEMPLATES[info.href].render = tmplUtil.compile(raw_html, { render: __undescore_template_resolver_ });
        return jQuery.when.apply(jQuery, P);
      });
    }
    return TEMPLATES[info.href].promise;
  };

  file.loadView = function (htmlSrc, dataSrc,dummyData) {
    var $viewDff = jQuery.Deferred();
    var OBJ = {};
    if (is.Object(htmlSrc) && typeof is.Function(htmlSrc.done)) {
      OBJ = htmlSrc;
    } else {
      OBJ.src = htmlSrc;
      OBJ.data = dataSrc;
    }

    var htmlView = "", htmlUrl, render;
    var dff = [];

    if (is.Function(OBJ.src)) {
      OBJ.src = OBJ.src();
    } else if (is.Function(OBJ.html)) {
      OBJ.html = OBJ.html();
      if (is.Object(OBJ.html) && is.Function(OBJ.html.done)) {
        OBJ.src = OBJ.html;
      }
    }

    if (is.String(OBJ.src)) {
      htmlUrl = OBJ.src;
      dff.push(file.getHTML(htmlUrl).done(function (respHTML, respRender) {
        render = respRender;
        OBJ.rawHtml = respHTML;
        $viewDff.notify(OBJ);
      }));
    } else if (is.Object(OBJ.src) && is.Function(OBJ.src.done)) {
      dff.push(OBJ.src.done(function (resp) {
        htmlView = resp;
      }));
    } else if (OBJ.html) {
      render = tmplUtil.compile(OBJ.html, { render: __undescore_template_resolver_ });
    }

    if (is.String(OBJ.data)) {
      dff.push(file.getJSON(OBJ.data).done(function (resp) {
        OBJ.data = resp;
      }));
    } else if (is.Object(OBJ.data) && is.Function(OBJ.data.done)) {
      dff.push(OBJ.data.done(function (resp) {
        OBJ.data = resp;
      }));
    }
    var $viewDffPromise = $viewDff.promise();
    jQuery.when.apply(jQuery, dff).done(function () {
      if (render) {
        OBJ.html = render(OBJ.data);
      }
    }).then(function () {
      $viewDff.resolve(OBJ);
      return $viewDffPromise;
    });
    return $viewDffPromise;
  };

  var loadTemp = function (htmlSrc, dataSrc, dummyData) {
    var elem = this;
    var dff = jQuery.Deferred();
    elem.addClass("__template__loading__").append('<div class="__template__loader__"></div>');
    file.loadView(htmlSrc, dataSrc, dummyData).then(function (OBJ) {
      elem.html(OBJ.html);
      elem.removeClass("__template__loading__");
      return dff.resolveWith(elem, arguments);
    }).progress(function(OBJ){
      if(dummyData){
        elem.html(
          tmplUtil.compile(OBJ.html, { render: __undescore_template_resolver_ })(dummyData)
        );
      }
      dff.notify(OBJ);
    });
    return dff.promise();
  };

  jQuery.fn.loadTemplate = jQuery.fn.loadTemplate || loadTemp;
  jQuery.fn.loadTemp = jQuery.fn.loadTemp || loadTemp;
  jQuery.fn.loadView = jQuery.fn.loadView || loadTemp;
  jQuery.fn.tmpl = jQuery.fn.tmpl || loadTemp;


});