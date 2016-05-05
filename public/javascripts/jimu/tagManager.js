define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/Evented',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
  ],
  function(declare, _WidgetBase, _TemplatedMixin, Evented, array, lang, html, on) {

    return declare([_WidgetBase, _TemplatedMixin, Evented], {
    
      baseClass: 'jimu-tagmanager',
      declaredClass: 'tagManager',
      templateString: '<div>' +
        '<div class="head-section" data-dojo-attach-point="headDiv">' +
          '<div class="table-div" data-dojo-attach-point="headTableDiv">' +
            '<table class="table" cellspacing="0" onselectstart="return false;"' +
              ' data-dojo-attach-point="tableInHeadSection">' +
              '<colgroup data-dojo-attach-point="headColgroup"></colgroup>' +
              '<thead class="simple-table-thead simple-table-title" ' +
              ' data-dojo-attach-point="thead"></thead>' +
            '</table>' +
          '</div>' +
        '</div>' +
        '<div class="body-section" data-dojo-attach-point="bodyDiv">' +
          '<div class="table-div" data-dojo-attach-point="bodyTableDiv">' +
            '<table class="table" cellspacing="0" onselectstart="return false;"' +
             'data-dojo-attach-point="tableInBodySection">' +
              '<colgroup data-dojo-attach-point="bodyColgroup"></colgroup>' +
              '<tbody class="simple-table-tbody" data-dojo-attach-point="tbody"></tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</div>',

      postMixInProperties: function(){
        console.log('postMixInProperties');
      },
      constructor: function() {
        this.state = 'seslect';  //select edit
        this.items = [];
      },
      postCreate: function() {
        this.inherited(arguments);
        console.log('postCreate');
      },
      startup: function() {
        console.log('startup');
      }
    });
  });