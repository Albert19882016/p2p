function log(msg) {
  console.log(msg);
  document.getElementById("chat").appendChild(document.createTextNode(msg + "\n"));
}

var brokerSession = null;
var brokerUrl = 'http://webrtc-broker.herokuapp.com';
var hosting = true;
var options = {};

if(window.location.search) {
  var params = window.location.search.substring(1).split('&');
  for(var i = 0; i < params.length; ++ i) {
    if(params[i].match('^webrtc-session')) {
      brokerSession = params[i].split('=')[1];
      hosting = false;
    } else if(params[i].match('^webrtc-broker')) {
      brokerUrl = params[i].split('=')[1];
    }
  }
}

console.log('broker', brokerUrl);
var conn = undefined;

var Query = {
  parse: function parse(queryString) {
    var result = {};
    var parts = (undefined !== queryString) ? queryString.split('&') : [];
    parts.forEach(function(part) {
      var key = part.split('=')[0];
      if(!result.hasOwnProperty(key))
        result[key] = [];
      var value = part.split('=')[1];
      if(undefined !== value)
        result[key].push(value);
    });
    return result;
  },
  defined: function defined(params, key) {
    return (params.hasOwnProperty(key));
  },
  stringify: function stringify(params) {
    var result = [];
    Object.keys(params).forEach(function(param) {
      var key = param;
      var values = params[key];
      if(values.length > 0) {
        values.forEach(function(value) {
          result.push(key + '=' + value);
        });
      } else {
        result.push(key);
      }
    });
    return result.join('&');
  }
};

if(hosting) {  
  var host = new WebRTC.Host(brokerUrl, options);
  host.onready = function(sid) {
    console.log('ready');
  };
  host.onconnect = function() {
    log('connected');
    conn = host;
    conn.reliable.onmessage = function(msg) {
      log("<other> " + msg.data);
    };
  };
  host.onerror = function(error) {
    console.error(error);
  };  
} else {
  var peer = new WebRTC.Peer(brokerUrl, brokerSession, options);
  peer.onconnect = function() {
    log('connected');
    conn = peer;
    conn.reliable.onmessage = function(msg) {
      log("<other> " + msg.data);
    };
  };
  peer.onerror = function(error) {
    console.error(error);
  };
}

document.getElementById("chatinput").addEventListener("keyup", function(e) {
  if (conn && e.keyCode == 13 && conn.connected) {
    var ci = document.getElementById("chatinput");
    log("<self> " + ci.value);
    conn.reliable.channel.send(ci.value);
    ci.value = "";
  }
});
