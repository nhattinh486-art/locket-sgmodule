/***********************************************
> deleteHeader_Firebase by anhtu4n
> Hỗ trợ: Shadowrocket, Loon, Surge, Quantumult X
***********************************************/

const headersToStrip = [
  'x-goog-if-none-match',
  'if-none-match',
  'if-modified-since',
  'x-revenuecat-etag'
];

let modifiedHeaders = (typeof $request !== "undefined" && $request && $request.headers) ? Object.assign({}, $request.headers) : {};

for (let key of Object.keys(modifiedHeaders)) {
  if (headersToStrip.includes(key.toLowerCase())) {
    delete modifiedHeaders[key];
  }
}

$done({ headers: modifiedHeaders });