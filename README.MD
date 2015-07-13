
##getJSON
load JSON file from server and applies _dummyJSON_ if data is passed. 

```javascript
//my_server/my_json_file.json
{
	"people": {
		"id" : "{{data.id}}"
	}
}

//Client Side Code
var fileUtil = _module_("jsutils.file");

fileUtil.getJSON("my_server/my_json_file.json",{ id : 100}).done(function(resp){
	//formatted json
});

//OUTPUT FORMATTED
{
	"people": {
		"id" : "100"
	}
}

```
 
##getHTML
load HTML file from server, applies _underscore_ templating on it.

```javascript
//my_server/my_html_file.html
<div>
		<strong>Hi, Data id is {{data.id}}</strong>
</div>

//Client Side Code
var fileUtil = _module_("jsutils.file");

fileUtil.getHTML("my_server/my_html_file.html",{ id : 100}).done(function(resp){
	//formatted html
});

//OUTPUT FORMATTED
<div>
		<strong>Hi, Data id is 100</strong>
</div>

```
#### Include Nested HTML
If template contains include tag, then nested HTML template is applied.  Data can be passed as you wish to nested template.

```javascript
//my_server/in_other_folder_my_other_html_file.html
<div>
	<strong>And My name is {{data.name}}</strong>
</div>

//my_server/my_html_file2.html
<div>
		<strong>Hi, Data id is {{data.id}}</strong>
		<include src="in_other_folder_my_other_html_file.html" data=data.user />
</div>


//Client Side Code
var fileUtil = _module_("jsutils.file");

fileUtil.getHTML("my_server/my_html_file2.html",{
	 	id : 100, 
	 	user : {
	 		name : "Lalit"
		}
	}).done(function(resp){
	//formatted html
});


//OUTPUT
<div>
		<strong>Hi, Data id is {{data.id}}</strong>
		<div>
			<strong>And My name is Lalit</strong>
		</div>
</div>




```
