var jsdom     = require('jsdom');
var request   = require('request');
var _         = require('underscore');
var xpath     = require('./helpers').xpath.xpath;
var typecheck = require('./helpers').typecheck;

// Expects a definition including a nodes attribute. Returns the same, but with
// those nodes replaced with strings, depending on the contents of each
// column's 'attr'.
function attr(task, callback) {
  _.each(task.cols, function(column) {
    var attr = column.attr;
    column.nodes = _.map(column.nodes, function(node) {
      return (_.isUndefined(attr) ? node.innerText : node.getAttribute(attr));
    });
  });
  callback(task);
}

function get(url, callback) {
  request.get(url, callback);
}

// Expects a normalised definition -- one with a string URL property. Returns
// the same, but with a nodes attr. appended to each column (DOM `Node`s.)
function scrape(task, callback) {
  get(task.url, function(err, resp, body) {
    // TODO: error handling ;-)
    var window = jsdom.jsdom(body).parentWindow;
    task.cols = _.map(task.cols, function(column) {
      var nodes = xpath(column.sel, window.document);
      return _.extend(column, { nodes: nodes });
    });
    callback(task);
  });
}

// Expects a definition with string node-attribute columns.
function fneval(task, callback) {
  _.each(task.cols, function(col) {
    if (typecheck.isFunction(col.fn)) {
      col.nodes = _.map(col.nodes, col.fn);
    }
  });
  callback(task);
}

function cols(definition, callback) {
  scrape(definition, function(t0) {
    attr(t0, function(t1) {
      fneval(t1, callback);
    }); 
  });
}

module.exports = { cols: cols, get: get };