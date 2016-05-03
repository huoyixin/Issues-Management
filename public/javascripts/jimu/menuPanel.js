define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/html',
    "dojo/dom-class",
    'dojo/on',
    'dojo/Evented'
  ],
  function(declare, _WidgetBase, array, lang, html, domClass, on, Evented) {
    var count = 0;
    return declare([_WidgetBase, Evented], {
      // summary:
      //    the params format:
      //    items: [{
      //      value:
      //      label: <as innerHTML set to UI>
      //    }]
      //    box: String|DomNode.
      //      if not set, use the menu's parent node to calculate the menu's position.

      baseClass: 'jimu-menupanel',
      declaredClass: 'MenuPanel',
      multipleChoice: true, //Whether you can select more than one item
      label: '', //the sering display in jimu-icon-btn
      defaSelItem: false, //Whether the default selected the first item == make sure one item should be selected al least
      constructor: function() {
        this.state = 'closed';
        this.selValue = [];
        this.selLabel = [];
        this.preSpan = null;
        this.initSel = []; // the default selected items
        this.items = [];
      },
      postCreate: function() {
        this.inherited(arguments);

        this.btnNode = html.create('div', {
          'class': 'jimu-icon-btn',
          innerHTML: this.label
        }, this.domNode);

        this.own(on(this.btnNode, 'click', lang.hitch(this, this._onBtnClick)));

        if (!this.box) {
          this.box = this.domNode.parentNode;
        }

        this.own(on(this.box, 'click', lang.hitch(this, function() {
          if (this.dropMenuNode) {
            this.closeDropMenu();
          }
        })));

        if (!this.dropMenuNode) {
          this._createDropMenuNode();
        }
      },
      _createDropMenuNode: function() {
        this.dropMenuNode = html.create('div', {
          'class': 'drop-menu',
          style: {
            display: 'none'
          }
        }, this.domNode);
        var defaIndex = 0;
        array.forEach(this.items, function(item) {
          defaIndex++;
          var node;
          if (item.value) {
            node = html.create('div', {
              'class': 'menu-item',
              'itemId': item.value
            }, this.dropMenuNode);

            var selIcon = html.create('span', {
              'class': 'octicon selIcon'
            }, node);

            //default select the first item
            if (this.defaSelItem && defaIndex == 1) {
              this._defaultSelItem(selIcon, item);
              if (!this.multipleChoice) {
                this.btnNode.innerHTML = this.label + ": " + item.label;
              }
            }
            //init selected items
            if (this.initSel.length != 0) {
              lang.hitch(this, this._initSelItems(selIcon, item));
            }

            node.innerHTML += item.label;

            this.own(on(node, 'click', lang.hitch(this, function(evt) {
              //make sure click node
              var clickNode = evt.target;
              if (!clickNode.firstChild || !domClass.contains(clickNode.firstChild, 'octicon')) {
                clickNode = clickNode.parentNode;
              }
              //onItemClick selectItem
              this.onItemClick(item, clickNode);
              this.selectItem(item);
            })));

          }
        }, this);
        // increase z-index
        this._increaseZIndex();
      },
      onItemClick: function(item, clickNode) {
        var span = clickNode.firstChild;
        if (!this.multipleChoice) {
          //clear selected
          this.selLabel = [];
          this.selValue = [];
          //get all items
          var menuItems = this.domNode.childNodes[1].childNodes;
          // if not has default selected item
          if (!this.defaSelItem) {
            //if now span not same as preSpan
            if (this.preSpan != span) {
              this._remveSelItem(menuItems);
            }
          } else {
            this._remveSelItem(menuItems);
          }
        }
        if (!domClass.contains(span, 'octicon-check')) {
          domClass.add(span, 'octicon-check');
          //if not multipleChoice,display the selected item in the btn
          if (!this.multipleChoice) {
            this.btnNode.innerHTML = this.label + ": " + item.label;
          }

          this.selValue.push(item.value);
          this.selLabel.push(item.label);
        } else {

          domClass.remove(span, 'octicon-check');
          if (!this.multipleChoice) {
            this.btnNode.innerHTML = this.label;
          }
          //remove item.* form selected
          this.selValue = array.filter(this.selValue, function(e) {
            return e != item.value;
          });
          this.selLabel = array.filter(this.selLabel, function(e) {
            return e != item.label;
          });
        }
        this.preSpan = span;
      },
      openDropMenu: function() {
        //calculate the position of dropMenu
        var style = {
          bottom: 'auto',
          maxHeight: '500px',
          minWidth: '250px',
          width: 'auto',
          height: 'auto',
          padding: 0
        };
        var itLeft = this.btnNode.offsetLeft;
        var itTop = this.btnNode.offsetTop;
        var itHeight = this.btnNode.offsetHeight;
        style.left = itLeft + 'px';
        style.top = itTop + itHeight * 1.3 + 'px';

        this.state = 'opened';
        html.setStyle(this.dropMenuNode, 'display', '');
        html.setStyle(this.dropMenuNode, style);
        this.emit('onOpenMenu');
      },
      closeDropMenu: function() {
        this.state = 'closed';
        html.setStyle(this.dropMenuNode, 'display', 'none');
        this.emit('onCloseMenu');
      },
      selectItem: function(item) {
        this.closeDropMenu();
        this.emit('onMenuClick', item);
      },
      //get & set
      getSelValue: function() {
        return this.selValue;
      },
      getSelLabel: function() {
        return this.selLabel;
      },
      setItems: function(item) {
        this.selValue = [];
        this.selLabel = [];
        this.items = item;
        if (this.dropMenuNode) {
          html.destroy(this.dropMenuNode);
        }
        this._createDropMenuNode();

      },
      getItems: function() {
        return this.items;
      },
      //default select the first item
      _defaultSelItem: function(selIcon, item) {
        domClass.add(selIcon, 'octicon-check');
        this.preSpan = selIcon;
        this.selValue = [];
        this.selValue.push(item.value);
        this.selLabel = [];
        this.selLabel.push(item.value);

      },
      //init selected items
      _initSelItems: function(selIcon, item) {
        array.forEach(this.initSel, lang.hitch(this, function(selItem) {
          if (item.label == selItem) {
            domClass.add(selIcon, 'octicon-check');
            this.selValue.push(item.value);
            this.selLabel.push(item.label);
          }
        }));
      },
      //remove item.* form selected
      _remveSelItem: function(menuItems) {
        array.forEach(menuItems, function(menuItem) {
          if (domClass.contains(menuItem.firstChild, 'octicon-check')) {
            domClass.remove(menuItem.firstChild, 'octicon-check');
          }
        });
      },
      _onBtnClick: function(evt) {
        evt.stopPropagation();

        if (this.state === 'closed') {
          this.openDropMenu();
        } else {
          this.closeDropMenu();
        }
      },
      _increaseZIndex: function() {
        var baseIndex = 100;
        html.setStyle(this.domNode, 'zIndex', count + baseIndex);
        html.setStyle(this.dropMenuNode, 'zIndex', count + baseIndex + 1);
        count++;
      }
    });
  });