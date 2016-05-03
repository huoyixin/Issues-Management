'use strict'
require(['jimu/dijit/Popup',
  'jimu/dijit/Message',
  'jimu/dijit/LoadingIndicator',
  './javascripts/jimu/menuPanel.js',
  'dojo/dom',
  'dojo/query',
  'dojo/dom-style',
  'dojo/dom-class',
  'dojo/dom-prop',
  'dojo/dom-construct',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/_base/array',
  'dojo/html',
  'dijit/form/Button',
  'dijit/form/Select',
  'dijit/form/TextBox',
  'jimu/dijit/SimpleTable',
  'dijit/form/DropDownButton',
  'dijit/TooltipDialog',
  'dijit/popup',
  'dijit/ColorPalette',
  'dojo/parser',
  'dijit/layout/BorderContainer',
  'dijit/layout/ContentPane',
  'dijit/TooltipDialog',
  'dijit/form/TextBox',
  'dijit/TitlePane',
  'dijit/InlineEditBox',
  'dijit/form/Textarea',
  'dojo/domReady!'
], function(Popup, Message, LoadingIndicator, menuPanel, dom, query, domStyle, domClass, domProp, domconstruct, lang, on, array,
  html, Button, Select, TextBox, SimpleTable, DropDownButton, TooltipDialog, dojopopup, ColorPalette, parser) {
  var username_Login = '';
  var password_Login = '';
  var MyTag;

  window.jimuNls = {
    simpleTable: {
      moveUp: 'Move up',
      moveDown: 'Move down',
      deleteRow: 'Delete',
      edit: 'Edit'
    }
  };

  window.jimuConfig = {};
  parser.parse();

  var LoadingIndicator = new LoadingIndicator({
    hidden: true
  });
  LoadingIndicator.placeAt(dom.byId('overlayer'));

  //Signin(yixi8524, LEI20130515hyx);
  new Select({
    name: "repos",
    options: []
  }, 'repos').startup();

  var milestone = new menuPanel({
    label: 'Milestone',
    box: dom.byId('Container'),
    multipleChoice: false,
    defaSelItem: true
  });
  milestone.placeAt(dom.byId('menu')).startup();

  var product = new menuPanel({
    label: 'product',
    box: dom.byId('Container'),
    multipleChoice: false
  });
  product.items = ['ALL'];
  product.placeAt(dom.byId('menu')).startup();

  var status = new menuPanel({
    label: 'Status',
    box: dom.byId('Container'),
    multipleChoice: false,
    defaSelItem: true
  });
  status.placeAt(dom.byId('menu')).startup();

  var lable = new menuPanel({
    label: 'lable',
    box: dom.byId('Container'),
    multipleChoice: true
  });
  lable.placeAt(dom.byId('menu')).startup();

  var outputsetting = new menuPanel({
    label: 'OutputSetting',
    box: dom.byId('Container'),
    multipleChoice: false,
    defaSelItem: true
  });
  outputsetting.placeAt(dom.byId('menu')).startup();

  var assignee = new menuPanel({
    label: 'Assignee',
    box: dom.byId('Container'),
    multipleChoice: false
  });
  assignee.placeAt(dom.byId('menu')).startup();

  on(dijit.byId('repos'), 'change', function(res) {
    LoadingIndicator.show();

    if (username_Login.length == 0 || password_Login.length == 0) {
      alert('Error');
    } else {
      getInformation(username_Login, password_Login, res);
      loadUserTag();
    }
  });

  on(dom.byId('ManageuserownTag'), 'click', function() {
    ManageTagPopup();
  });

  milestone.on('onMenuClick', function() {
    getAllSelect();
  });
  lable.on('onMenuClick', function() {
    getAllSelect();
  });
  assignee.on('onMenuClick', function() {
    getAllSelect();
  });
  product.on('onMenuClick', function() {
    getAllSelect();
  });
  outputsetting.on('onMenuClick', function() {
    getAllSelect();
  });
  status.on('onMenuClick', function() {
    getAllSelect();
  });

  function Signin(username, password) {

    var deferredResult = dojo.xhrPost({
      url: "/signin",
      postData: {
        username: username,
        password: password
      },
      timeout: 40000,
      handleAs: "json"
    });

    deferredResult.then(function(response) {

      dijit.byId('repos').addOption(response);

      username_Login = username;
      password_Login = password;

      if (dijit.byId('repos').value != "") {
        getInformation(username_Login, password_Login, dijit.byId('repos').value);
        var popuplogin = dijit.byId('loginpopup');
        loadUserImage();
        loadUserTag();
        popuplogin.close();
      } else {
        dom.byId('loginmessage').innerHTML = "";
        dom.byId('loginmessage').innerHTML = "Sorry, can not find any repo";
      }
      return response;
    }, function(error) {
      dom.byId('loginmessage').innerHTML = "";
      dom.byId('loginmessage').innerHTML = "Incorrect username or password.";
      return error;
    });

  }

  function getIssues(milestoneStr, productStr, statusStr, lableStr, outputsettingStr, assigneeStr) {
    LoadingIndicator.show();
    var username = username_Login;
    var password = password_Login;
    var repoStr = dijit.byId("repos").value;

    if (milestoneStr.length === 0) {
      milestoneStr = "ALL";
    }
    if (productStr.length === 0) {
      productStr = "ALL";
    }
    if (statusStr.length === 0) {
      statusStr = "ALL";
    }
    if (lableStr.length === 0) {
      lableStr = "ALL";
    }
    if (outputsettingStr.length === 0) {
      outputsettingStr = "ALL";
    }
    if (assigneeStr.length === 0) {
      assigneeStr = "ALL";
    }
    if (assigneeStr.length === 0) {
      assigneeStr = "ALL";
    }

    if (username == '' || password == '' || repoStr == '') {
      LoadingIndicator.hide();
      new Message({
        container: 'overlayer',
        message: 'Please Sign in First'
      });
      return;
    }

    var deferredResult = dojo.xhrPost({
      url: "/getissues",
      postData: {
        milestone: milestoneStr,
        product: productStr,
        lable: lableStr,
        status: statusStr,
        outputsetting: outputsettingStr,
        assignee: assigneeStr,
        username: username,
        password: password,
        repo: repoStr
      },
      handleAs: "text"
    });

    deferredResult.then(function(response) {
      _addissues(response);
      LoadingIndicator.hide();
      return response;
    }, function(error) {
      LoadingIndicator.hide();
      new Message({
        container: 'overlayer',
        message: 'Get Issues Error'
      });
    });

  };

  function getInformation(username_Login, password_Login, repoStr) {
    LoadingIndicator.show();

    var deferredResult = dojo.xhrPost({
      url: "/getrepo",
      postData: {
        username: username_Login,
        password: password_Login,
        repo: repoStr
      },
      timeout: 30000,
      handleAs: "json"
    });

    deferredResult.then(function(response) {
      getEvalInfos(response);
      addRepoInfo(response.info);
      getMyTag();
      LoadingIndicator.hide();
      return response;
    }, function(error) {
      LoadingIndicator.hide();
      new Message({
        container: 'overlayer',
        message: 'Get Repo Error'
      });
    });

  };

  function inputItem(milestonesJson, assigneesJson, labelsJson) {
    milestone.selValue = [];
    lable.selValue = [];
    assignee.selValue = [];
    product.selValue = [];
    status.selValue = [];
    outputsetting.selValue = [];
    milestone.setItems(milestonesJson);
    lable.setItems(labelsJson);
    assignee.setItems(assigneesJson);
    product.setItems([{
      label: "ArcGIS Online",
      value: "<b>Product:</b> ArcGIS Online"
    }, {
      label: "Portal for ArcGIS",
      value: "<b>Product:</b> Portal for ArcGIS"
    }, {
      label: "ArcGIS WAB for Developers",
      value: "<b>Product:</b> ArcGIS Web AppBuilder for Developers"
    }]);
    status.setItems([{
      label: "All",
      value: "all"
    }, {
      label: "Closed",
      value: "closed"
    }, {
      label: "Open",
      value: "open"
    }]);
    outputsetting.setItems([{
      label: "Default",
      value: "Default"
    }, {
      label: "Only Title",
      value: "Only Title"
    }]);
  }

  function getAllSelect() {
    var milestoneValue = milestone.getSelValue();
    var productValue = product.getSelValue();
    var statusValue = status.getSelValue();
    var lableValue = lable.getSelValue();
    var outputsettingValue = outputsetting.getSelValue();
    var assigneeValue = assignee.getSelValue();
    getIssues(milestoneValue, productValue, statusValue, lableValue, outputsettingValue, assigneeValue);
  }

  function loadUserImage() {
    var deferredResult = dojo.xhrPost({
      url: "/getuserimage",
      postData: {
        username: username_Login,
        password: password_Login
      },
      timeout: 15000,
      handleAs: "text"
    });
    deferredResult.then(function(response) {
      domProp.set("userpng", "src", response);
      return response;
    }, function(error) {
      console.log(error);
    });
  }

  /*For Tag Manager*/
  function loadUserTag() {

    var repoStr = dijit.byId("repos").value;

    var deferredResult = dojo.xhrPost({
      url: "/gettagwithinfo",
      postData: {
        username: username_Login,
        repo: repoStr
      },
      timeout: 30000,
      handleAs: "text"
    });
    deferredResult.then(function(response) {
      _addTag(response);
      return response;
    }, function(error) {
      new Message({
        container: 'overlayer',
        message: 'Get Tag Error'
      });
    });
  }

  /*For DropMenu*/
  function getMyTag() {

    var repoStr = dijit.byId("repos").value;

    var deferredResult = dojo.xhrPost({
      url: "/getmytag",
      postData: {
        username: username_Login,
        repo: repoStr
      },
      timeout: 30000,
      handleAs: "json"
    });
    deferredResult.then(function(response) {
      var tagsStr = "";
      array.forEach(response, function(item) {
        var label = '\'<span class=\"badge\" style=\"background-color:' + item.color + '\">\'' + '+"' + item.tagName + '"+' + '\'</span>\'';
        tagsStr += '{\'value\':\'' + false + '\',\'label\':' + label + '},';
      });

      var tagJson = eval('([' + tagsStr + '])');
      MyTag = tagJson;
      return response;
    }, function(error) {
      new Message({
        container: 'overlayer',
        message: 'Get Tag Error'
      });
    });
  }

  function addRepoInfo(data) {

    var repoStr = '<h1>Repo Name :<a href="' + data.url + '">' + data.name + '</a></h1>' +
      '<h3>Description: ' + data.description + '</h3>' +
      '<h3>Issues Count(Open) : ' + data.issuesCount + '</h3>';
    _addissues(repoStr);

  }

  function _addissues(data) {
    dom.byId('content').innerHTML = "";
    dom.byId('content').innerHTML = data;
    selectTag();
    parser.instantiate(query(".issuesBody"));
    parser.instantiate(query(".issuescomment"));
    parser.instantiate(query(".issuesdescription"));

    if (query('div.comment').length !== 0) {
      dom.byId('issuesCount').innerHTML = "";
      dom.byId('issuesCount').innerHTML = "Issues Count: " + query('div.comment').length;
    }
  }

  function _addTag(data) {
    dom.byId('userTagContent').innerHTML = "";
    dom.byId('userTagContent').innerHTML = data;
  }

  //SelectTag
  function selectTag() {
    //Declare variables for  the exist tags
    var spans, selectItems;
    //get the jimu-icon-btn box
    var issuePanelBoxs = query('.tagMenu');

    //Add the appropriate processing events for each issue's menupanel
    array.forEach(issuePanelBoxs, function(issuePanelBox) {
      //get issueId
      var meta = issuePanelBox.parentNode.previousElementSibling;
      var spanNode = query('.issue-meta', meta);
      spanNode = spanNode[0].firstElementChild;
      var texts = spanNode.firstChild.nodeValue;
      var issueId = texts.match(/\d+/);
      //get own tags
      spans = query('span.badge.usertag' + issueId, issuePanelBox.parentNode);
      selectItems = array.map(spans, function(span) {
        return span.outerHTML.replace(' ' + 'usertag' + issueId, '');
      });
      //declare menupanel of each issue
      var issuePanel = new menuPanel({
        label: '<span class="octicon octicon-plus"></span>',
        box: dom.byId('Container'),
        multipleChoice: true,
        initSel: selectItems
      });
      issuePanel.placeAt(issuePanelBox).startup();
      issuePanel.setItems(MyTag);
      //updata tags
      issuePanel.on('onOpenMenu', lang.hitch(this, function() {
        //Check if Mytag has changed.
        var items = this.getItems();
        var isChange = false;
        var itemsL = MyTag.length > items.length ? MyTag : items;
        for (var i = 0; i < itemsL.length; i++) {
          if (items[i] != MyTag[i]) {
            isChange = true;
          }
        }
        //update the exist tags of issuePanel
        spans = query('span.badge.usertag' + issueId, issuePanelBox.parentNode);
        selectItems = array.map(spans, function(span) {
          return span.outerHTML.replace(' ' + 'usertag' + issueId, '');
        });
        this.initSel = selectItems;

        //update the items of issuePanel
        if (items.length != MyTag.length || isChange) {
          this.setItems(MyTag);
          this.openDropMenu();
        }
      }));
      //get tagBox
      var tagBox = query('.tagBox.box' + issueId)[0];
      //set event of issuePanel
      issuePanel.on('onMenuClick', lang.hitch(this, function() {
        domconstruct.empty(tagBox);
        var selLabel = this.getSelLabel();
        //get all new selected tags and place at tagBox
        array.forEach(selLabel, function(label) {
          domconstruct.place(label, tagBox);
        });
        //get all tags of tagBox and add class to it
        array.forEach(tagBox.childNodes, function(MyTag) {
          domClass.add(MyTag, 'usertag' + issueId);
        });
        _saveIssuesinDB(issueId);
      }));
    });
  }

  function ManageTagPopup() {

    var tagPopupContainerStr =
      '<div id="tagTable"></div>' +
      '<div class="TagOverview"><span id = "TagDemo" class= "badge" style= "background-color:#999999">Input Tag Name</span></div>' +
      '<input id="tagManagerName" />' +
      '<div id="tagManagerdownmenu"></div>' +
      '<button id ="tagManagerAddTag" class = "tagPopupContainer" data-dojo-type="dijit/form/Button" type="button">Add a Tag</button>';

    var tagManagerPopup = new Popup({
      id: 'tagManagerPopup',
      content: tagPopupContainerStr,
      container: 'overlayer',
      titleLabel: '<span class="octicon octicon-paintcan"></span><span> Edit Tag</span>',
      autoHeight: true,
      width: 600,
      onClose: function() {
        loadUserTag();
      }
    });
    tagManagerPopup.placeAt(dom.byId('overlayer')).startup();
    parser.instantiate(query(".tagPopupContainer"));

    var fields = [{
      name: 'lablesName',
      title: 'Tag',
      type: 'text',
      editable: false
    }, {
      name: 'actions',
      title: 'Actions',
      type: 'actions',
      actions: ['delete'],
      width: '70px'
    }];

    var tagManagerTable = new SimpleTable({
      id: "tagManagerTable",
      fields: fields,
      selectable: 'true'
    }, "tagManagerTable");
    tagManagerTable.domNode.id = "tagManagerTable";
    tagManagerTable.placeAt("tagTable");
    tagManagerTable.startup();
    _setAllTagInTable(tagManagerTable);

    var myPalette = new ColorPalette({
      id: 'tagManagercolour',
      palette: "7x10",
      onChange: function(val) {
        domStyle.set("TagDemo", "backgroundColor", val);
      }
    });

    new DropDownButton({
      label: "Color",
      dropDown: myPalette
    }, 'tagManagerdownmenu').startup();

    new TextBox({
      name: "page",
      style: {
        width: '200px'
      },
      value: "Input Tag Name",
      placeHolder: "Input Tag Name",
      onKeyDown: function() {
        dom.byId('TagDemo').innerHTML = dom.byId('tagManagerName').value;
        if (dom.byId('TagDemo').innerHTML === "") {
          dom.byId('TagDemo').innerHTML = "Input Tag Name";
        }
      },
      onKeyUp: function() {
        dom.byId('TagDemo').innerHTML = dom.byId('tagManagerName').value;
        if (dom.byId('TagDemo').innerHTML === "") {
          dom.byId('TagDemo').innerHTML = "Input Tag Name";
        }
      }
    }, "tagManagerName");

    on(dom.byId('tagManagerAddTag'), 'click', function() {
      var tagname = dom.byId('tagManagerName').value;
      var tagcolour = dijit.byId('tagManagercolour').value;

      if (tagname === "" || tagcolour === "") {
        new Message({
          container: 'overlayer',
          message: 'Save Tag Error'
        });
        return;
      }
      var addLabelStr = '\'<span class=\"badge\" style=\"background-color:' + tagcolour + '\">\'' + '+"' + tagname + '"+' + '\'</span>\'';
      var RowsStr = '{\'lablesName\':' + addLabelStr + '}';
      tagManagerTable.addRows(eval('([' + RowsStr + '])'));
      _saveNewTag(tagname, tagcolour);

    });

    on(tagManagerTable, 'row-click', function(tr) {
      console.log('row-click');
    });

    on(tagManagerTable, 'row-delete', function(tr, rowData) {
      console.log('row-delete');
      _removeTags(rowData);
    });

  }

  function _removeTags(rowData) {

    var deferredResult = dojo.xhrPost({
      url: "/removeusertag",
      postData: {
        username: username_Login,
        tagName: rowData.lablesName.split('</span>')[0].split('>')[1]
      },
      timeout: 15000,
      handleAs: "text"
    });
    deferredResult.then(function(response) {
      getMyTag();
      return response;
    }, function(error) {
      new Message({
        container: 'overlayer',
        message: 'Remove Tag Error'
      });
    });
  }

  function _saveNewTag(name, colour) {

    var deferredResult = dojo.xhrPost({
      url: "/setusertag",
      postData: {
        username: username_Login,
        tagName: name,
        tagcolour: colour
      },
      timeout: 15000,
      handleAs: "text"
    });
    deferredResult.then(function(response) {
      getMyTag();
      return response;
    }, function(error) {
      new Message({
        container: 'overlayer',
        message: 'Save Tag Error'
      });
    });
  }

  function _setAllTagInTable(tagTable) {
    var deferredResult = dojo.xhrPost({
      url: "/getusertag",
      postData: {
        username: username_Login
      },
      timeout: 30000,
      handleAs: "json"
    });
    deferredResult.then(function(response) {
      var tagsStr = "";
      array.forEach(response, function(item) {
        var label = '\'<span class=\"badge\" style=\"background-color:' + item.color + '\">\'' + '+"' + item.tagName + '"+' + '\'</span>\'';
        tagsStr += '{\'lablesName\':' + label + '},';
      });
      var tag = eval("([" + tagsStr + "])");
      tagTable.addRows(tag);
      return response;
    }, function(error) {
      new Message({
        container: 'overlayer',
        message: 'Get Tag Error'
      });
    });

  }

  window.getComment = function(issuesNumber) {

    if (dom.byId('comment' + issuesNumber).innerHTML != "") {
      return;
    }

    var username = username_Login;
    var password = password_Login;
    var repoStr = dijit.byId("repos").value;

    var deferredResult = dojo.xhrPost({
      url: "/getcomment",
      postData: {
        username: username,
        password: password,
        repo: repoStr,
        number: issuesNumber
      },
      timeout: 15000,
      handleAs: "text"
    });

    deferredResult.then(function(response) {

      dom.byId('comment' + issuesNumber).innerHTML = "";
      dom.byId('comment' + issuesNumber).innerHTML = response;

      return response;
    }, function(error) {
      dom.byId('comment' + issuesNumber).innerHTML = "";
      dom.byId('comment' + issuesNumber).innerHTML = "Sorry, Get Comment Error";
    });

  };

  window.getContent = function(issuesNumber) {
    console.log(issuesNumber);
    if (dom.byId('Content' + issuesNumber).innerHTML != "") {
      return;
    }

    var username = username_Login;
    var password = password_Login;
    var repoStr = dijit.byId("repos").value;

    var deferredResult = dojo.xhrPost({
      url: "/getContent",
      postData: {
        username: username,
        password: password,
        repo: repoStr,
        number: issuesNumber
      },
      timeout: 15000,
      handleAs: "text"
    });

    deferredResult.then(function(response) {

      dom.byId('Content' + issuesNumber).innerHTML = "";
      dom.byId('Content' + issuesNumber).innerHTML = response;
      return response;
    }, function(error) {
      dom.byId('Content' + issuesNumber).innerHTML = "";
      dom.byId('Content' + issuesNumber).innerHTML = "Sorry, Get Content Error";
    });

  };

  window.saveDescription = function(number) {
    _saveIssuesinDB(number);
  };

  function _saveIssuesinDB(number) {
    LoadingIndicator.show();
    var username = username_Login;
    var issuesId = number;

    var usertagStr = "";
    var usertags = query('.usertag' + number);
    array.forEach(usertags, function(usertag) {
      var backgroundColor = domStyle.get(usertag, "backgroundColor");
      usertagStr += '{"tagname" : "' + usertag.innerHTML + '","tagcolour" : "' + _rgb2hex(backgroundColor) + '"},';
    });
    usertagStr = '[' + usertagStr + ']';
    var description = query('.description' + number)[0].innerHTML;
    var repoStr = dijit.byId("repos").value;

    var deferredResult = dojo.xhrPost({
      url: "/setdescription",
      postData: {
        username: username,
        issuesId: issuesId,
        repoStr: repoStr,
        usertagStr: usertagStr,
        description: description
      },
      timeout: 15000,
      handleAs: "text"
    });

    deferredResult.then(function(response) {
      loadUserTag();
      LoadingIndicator.hide();
      return response;
    }, function(error) {
      LoadingIndicator.hide();
      new Message({
        container: 'overlayer',
        message: 'Save issues Error'
      });
    });
  };

  window.getIssuesByTag = function(tagName) {

    var repoStr = dijit.byId("repos").value;
    var deferredResult = dojo.xhrPost({
      url: "/getissuesByTag",
      postData: {
        username: username_Login,
        password: password_Login,
        repoStr: repoStr,
        usertagStr: tagName
      },
      timeout: 15000,
      handleAs: "text"
    });

    deferredResult.then(function(response) {
      _addissues(response)
      LoadingIndicator.hide();
      return response;
    }, function(error) {
      LoadingIndicator.hide();
      new Message({
        container: 'overlayer',
        message: 'Get Issues Error'
      });
    });
  };

  function _zero_fill_hex(num, digits) {
    var s = num.toString(16);
    while (s.length < digits)
      s = "0" + s;
    return s;
  }

  function _rgb2hex(rgb) {

    if (rgb.charAt(0) == '#')
      return rgb;

    var ds = rgb.split(/\D+/);
    var decimal = Number(ds[1]) * 65536 + Number(ds[2]) * 256 + Number(ds[3]);
    return "#" + _zero_fill_hex(decimal, 6);
  }

  function getEvalInfos(response) {

    //milestones
    var MiloptionsStr = "";
    array.forEach(response.milestones, function(item) {

      var label = '<span class=\"badge ' + item.state + '\">' + item.state + '</span>' +
        '<span class=\"milestone_title\" >' + item.title + '</span>' + '<span class=\"milestone_count\" >' + item.count + '</span>';

      MiloptionsStr += '{\'value\':' + item.number + ',\'label\':\'' + label + '\'},';
    });
    var milestones = eval("([" + MiloptionsStr + "])");

    // var tagsStr = "";
    // array.forEach(response.tag, function (item) {
    //     var label = '\'<span class=\"badge\" style=\"background-color:' + item.color + '\">\'' + '+"' + item.tagName + '"+' + '\'</span>\'';
    //     tagsStr += '{\'Select\':\'' + false + '\',\'lablesName\':' + label + '},'
    // });
    // var tag = eval("([" + tagsStr + "])");

    //assignee
    var assigneeStr = "";
    array.forEach(response.assignee, function(item) {
      var label = '\'<div class=\"assignee_menu\"><img class=\"menu-png\" src="' + item.avatar_url + '">\'' + '+\'<span>\'' + '+\'' + item.name + '\'+' + '\'</span></div>\'';
      assigneeStr += '{\'value\':\'' + item.name + '\',\'label\':' + label + '},';
    })
    var assignees = eval("([" + assigneeStr + "])");

    //labels
    var labelsStr = "";
    array.forEach(response.labels, function(item) {
      var label = '\'<span class=\"badge labelcontent\" style=\"background-color:' + item.color + '\">\'' + '+' + '\' \'' + '+' + '\'</span>\'' + '+' + '\'<span class=\"label_name\">\'' + '+\'' + item.name + '\'+' + '\'</span>\'';
      labelsStr += '{\'value\':\'' + item.name + '\',\'label\':' + label + '},';
    });
    var labels = eval("([" + labelsStr + "])");
    inputItem(milestones, assignees, labels);

  };

});