const toggleClickIndex = {
  google: 0,
  dropbox: 0,
};

$.fn.toggleClick = function (provider) {
  const self = this;
  return function () {
    const methods = arguments;
    const count = methods.length;

    return self.each((i, item) => {
      $(item).on('click', function () {
        return methods[toggleClickIndex[provider]++ % count].apply(self, arguments);
      });
    });
  };
};

(function (window) {
  window.utils = {
    parseQueryString(str) {
      const ret = Object.create(null);

      if (typeof str !== 'string') {
        return ret;
      }

      str = str.trim().replace(/^(\?|#|&)/, '');

      if (!str) {
        return ret;
      }

      str.split('&').forEach((param) => {
        const parts = param.replace(/\+/g, ' ').split('=');
        // Firefox (pre 40) decodes `%3D` to `=`
        // https://github.com/sindresorhus/query-string/pull/37
        let key = parts.shift();
        let val = parts.length > 0 ? parts.join('=') : undefined;

        key = decodeURIComponent(key);

        // missing `=` should be `null`:
        // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
        val = val === undefined ? null : decodeURIComponent(val);

        if (ret[key] === undefined) {
          ret[key] = val;
        } else if (Array.isArray(ret[key])) {
          ret[key].push(val);
        } else {
          ret[key] = [ret[key], val];
        }
      });

      return ret;
    },
  };
}(window));

function popup(url) {
  return window.open(url, 'popUpWindow', 'height=500,width=500,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes');
}
