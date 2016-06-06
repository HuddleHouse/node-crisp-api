/*
 * Bundle: Crisp
 * Project: Crisp - Node API
 * Author: Baptiste Jamin http://jamin.me/
 * Copyright: 2016, Crisp IM
 */

"use strict";

var EventEmitter = require('fbemitter').EventEmitter;

//Rest default configuration
Crisp.DEFAULT_REST_HOST = "https://api.crisp.im";
Crisp.DEFAULT_REST_BASE_PATH = "/v1/";

//Realtime default configuration
Crisp.DEFAULT_REALTIME_HOST = "https://relay-app.crisp.im";

var resources = {
  UserSession           : require("./resources/UserSession"),
  UserAccount           : require("./resources/UserAccount"),
  UserNotification      : require("./resources/UserNotification"),
  UserWebsites          : require("./resources/UserWebsites"),
  UserSchedule          : require("./resources/UserSchedule"),
  UserProfile           : require("./resources/UserProfile"),
  Website               : require("./resources/Website"),
  WebsiteOperators      : require("./resources/WebsiteOperators"),
  WebsiteStats          : require("./resources/WebsiteStats"),
  WebsiteSettings       : require("./resources/WebsiteSettings"),
  WebsiteConversations  : require("./resources/WebsiteConversations"),
};

/**
 * Crisp API Library
 * @class
 * @classdesc This is the Crisp Library. Handles REST and Realtime operatios
 */

function Crisp() {

  this.auth = {};

  this._rest = {
    host: Crisp.DEFAULT_REST_HOST,
    basePath: Crisp.DEFAULT_REST_BASE_PATH
  };

  this._realtime = {
    host : Crisp.DEFAULT_REALTIME_HOST
  };

  this._socket = null;

  this._emitter = new EventEmitter();

  this._bindedEvents = [];

  this._prepResources();
}

Crisp.prototype = {

  /**
   * Set the Rest Endpoint host
   * @memberof Crisp
   * @method setRestHost
   * @param {string} host - Hostname
   */
  setRestHost : function(host) {
    if (typeof host === "string") {
      this._rest.host = host;
    } else {
      throw new Error("Crisp, setRestHost: parameter host should be a String");
    }
  },

  /**
   * Prepare a URI based from params
   * @memberof prepareRestUrl
   * @method _prepareRestUrl
   * @param {Array} paths - List of paths ['session', 'login']
   */

  _prepareRestUrl : function(paths) {
    if (Array.isArray(paths)) {
      var output = this._rest.host + this._rest.basePath;
      output += paths.join("/");
      return output;

    } else {
      throw new Error("Crisp, prepareRestUrl: parameter host should be an Array");
    }
  },

  /**
   * Binds ressources to the main object
   * @memberof Crisp
   * @method _prepResources
   */
  _prepResources : function() {
    for (var name in resources) {
      this[
        name[0].toLowerCase() + name.substring(1)
      ] = new resources[name](this);
    }
  },

  /**
   * Binds socket to the main object
   * @memberof Crisp
   * @method _prepareSocket
   */
  _prepareSocket : function() {
    var realTimehost = this._realtime.host;

    if (!this._socket) {
      this._socket = require('socket.io-client')(realTimehost);
    }
    this._authenticate();

    var self = this;
    this._socket.on("reconnect", function() {
      self._authenticate();
    });
  },


  /**
   * Authenticate client
   * @memberof Crisp
   * @method _authenticate
   */
  _authenticate : function() {
    var auth = this.auth;
    this._socket.emit("authentication", {
      username : auth.identifier,
      password : auth.key
    });
  },

  /**
   * Check if the socket exists
   * @memberof Crisp
   * @method _assertSocket
   */
  _assertSocket : function() {
    if (!this._socket) {
      throw new Error("Crisp, you should be connected");
    }
  },

  /**
   * Check if the socket exists
   * @memberof Crisp
   * @method _assertSocket
   * @param {string} event
   * @param {Function} callback
   */
  on : function(event, callback) {
    if (typeof event !== "string") {
      throw new Error("Crisp, on: parameter event should be a function");
    }

    if (typeof callback !== "function") {
      throw new Error("Crisp, on: parameter callback should be a function");
    }
    this._emitter.addListener(event, callback);

    //If no already subscribed, we subscribe it
    if (this._bindedEvents.indexOf(event) === -1) {
      var _emitter = this._emitter;
      this._bindedEvents.push(event);
      this._socket.on(event, function(data) {
        _emitter.emit(event, data);
      });
    }
  }

};

module.exports = Crisp;
module.exports.Crisp = Crisp;