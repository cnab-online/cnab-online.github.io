/* */ 
(function(process) {
  module.exports = which;
  which.sync = whichSync;
  var isWindows = process.platform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys';
  var path = require('path');
  var COLON = isWindows ? ';' : ':';
  var isexe = require('isexe');
  var fs = require('fs');
  var isAbsolute = require('is-absolute');
  function getPathInfo(cmd, opt) {
    var colon = opt.colon || COLON;
    var pathEnv = opt.path || process.env.Path || process.env.PATH || '';
    var pathExt = [''];
    pathEnv = pathEnv.split(colon);
    var pathExtExe = '';
    if (isWindows) {
      pathEnv.unshift(process.cwd());
      pathExtExe = (opt.pathExt || process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM');
      pathExt = pathExtExe.split(colon);
      if (cmd.indexOf('.') !== -1 && pathExt[0] !== '')
        pathExt.unshift('');
    }
    if (isAbsolute(cmd))
      pathEnv = [''];
    return {
      env: pathEnv,
      ext: pathExt,
      extExe: pathExtExe
    };
  }
  function which(cmd, opt, cb) {
    if (typeof opt === 'function') {
      cb = opt;
      opt = {};
    }
    var info = getPathInfo(cmd, opt);
    var pathEnv = info.env;
    var pathExt = info.ext;
    var pathExtExe = info.extExe;
    var found = [];
    ;
    (function F(i, l) {
      if (i === l) {
        if (opt.all && found.length)
          return cb(null, found);
        else
          return cb(new Error('not found: ' + cmd));
      }
      var pathPart = pathEnv[i];
      if (pathPart.charAt(0) === '"' && pathPart.slice(-1) === '"')
        pathPart = pathPart.slice(1, -1);
      var p = path.resolve(pathPart, cmd);
      ;
      (function E(ii, ll) {
        if (ii === ll)
          return F(i + 1, l);
        var ext = pathExt[ii];
        isexe(p + ext, {pathExt: pathExtExe}, function(er, is) {
          if (!er && is) {
            if (opt.all)
              found.push(p + ext);
            else
              return cb(null, p + ext);
          }
          return E(ii + 1, ll);
        });
      })(0, pathExt.length);
    })(0, pathEnv.length);
  }
  function whichSync(cmd, opt) {
    opt = opt || {};
    var info = getPathInfo(cmd, opt);
    var pathEnv = info.env;
    var pathExt = info.ext;
    var pathExtExe = info.extExe;
    var found = [];
    for (var i = 0,
        l = pathEnv.length; i < l; i++) {
      var pathPart = pathEnv[i];
      if (pathPart.charAt(0) === '"' && pathPart.slice(-1) === '"')
        pathPart = pathPart.slice(1, -1);
      var p = path.join(pathPart, cmd);
      for (var j = 0,
          ll = pathExt.length; j < ll; j++) {
        var cur = p + pathExt[j];
        var is;
        try {
          is = isexe.sync(cur, {pathExt: pathExtExe});
          if (is) {
            if (opt.all)
              found.push(cur);
            else
              return cur;
          }
        } catch (ex) {}
      }
    }
    if (opt.all && found.length)
      return found;
    throw new Error('not found: ' + cmd);
  }
})(require('process'));
