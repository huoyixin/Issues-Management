/* jshint unused: false */
var apiUrl = 'arcgis-js-api/';
var dojoConfig = {
  parseOnLoad: false,
  async: true,
  tlmSiblingOfDojo: false,
  has: {
    'extend-esri': 1
  },
  locale: 'en',
  baseUrl: '/stemapp',
  packages: [{
    name: "dojo",
    location: apiUrl + "dojo"
  }, {
    name: "dijit",
    location: apiUrl + "dijit"
  }, {
    name: "dojox",
    location: apiUrl + "dojox"
  }, {
    name: "put-selector",
    location: apiUrl + "put-selector"
  }, {
    name: "xstyle",
    location: apiUrl + "xstyle"
  }, {
    name: "dgrid",
    location: apiUrl + "dgrid"
  }, {
    name: "esri",
    location: apiUrl + "esri"
  }, {
    name: "moment",
    location: apiUrl + "moment"
  }, {
    name: "widgets",
    location: "widgets"
  }, {
    name: "jimu",
    location: "jimu.js"
  }, {
    name: "themes",
    location: "themes"
  }, {
    name: "libs",
    location: "libs"
  }, {
    name: "dynamic-modules",
    location: "dynamic-modules"
  }, {
    name: "javascripts",
    location: "../javascripts"
  }]
};