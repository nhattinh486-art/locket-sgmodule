/***********************************************
> deleteHeader_RC by anhtu4n
> Hỗ trợ: Shadowrocket, Loon, Surge, Quantumult X
***********************************************/

const headersToStrip = [
  'x-revenuecat-etag',
  'if-none-match',
  'if-modified-since',
  'x-goog-if-none-match'
];

let modifiedHeaders = (typeof $request !== "undefined" && $request && $request.headers) ? Object.assign({}, $request.headers) : {};

for (let key of Object.keys(modifiedHeaders)) {
  if (headersToStrip.includes(key.toLowerCase())) {
    delete modifiedHeaders[key];
  }
}

$done({ headers: modifiedHeaders });