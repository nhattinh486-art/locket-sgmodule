// PTB307_RELEASE_20261110A - add self-owned Worker bridge header to redirected POST.
// Runs only on https://locket.anhtu4nn.workers.dev/generateFilteredImage.
// Do not log secrets, photo URLs, account IDs, or request bodies.
(function () {
  try {
    var requestUrl = String(($request && $request.url) || '');
    if (!/^https:\/\/locket\.anhtu4nn\.workers\.dev\/generateFilteredImage(?:\?.*)?$/.test(requestUrl)) {
      console.log('[ANHTU4NN-PTB307] SKIP_UNEXPECTED_TARGET');
      $done({}); return;
    }
    var key = typeof $argument === 'string' ? $argument.trim() : '';
    if (!key || key.indexOf('{{{') !== -1 || /^ptbKey=/.test(key)) {
      console.log('[ANHTU4NN-PTB307] MISSING_TARGET_KEY');
      $done({});
      return;
    }
    var headers = {};
    var old = ($request && $request.headers) || {};
    Object.keys(old).forEach(function (name) {
      // A redirected request must not forward credentials meant for Locket's API.
      if (!/^(authorization|proxy-authorization|cookie|host)$/i.test(name)) {
        headers[name] = old[name];
      }
    });
    headers['X-PTB-Access'] = key;
    console.log('[ANHTU4NN-PTB307] TARGET_HEADER_READY');
    $done({ headers: headers });
  } catch (_) {
    console.log('[ANHTU4NN-PTB307] TARGET_HEADER_ERROR');
    $done({});
  }
})();
