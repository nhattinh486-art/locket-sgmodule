/***********************************************
> Locket Profile & User VIP Override by anhtu4n
> Tác giả: anhtu4n
***********************************************/

const WORKER_HOST = "https://locket.anhtu4nn.workers.dev";
const VIP_STORE_KEY = "LOCKET_VIP_COMMUNITY";
const SELF_UID_KEY = "LOCKET_SELF_UID";
const SELF_USERNAME_KEY = "LOCKET_SELF_USERNAME";

const BASE_VIP_USERS = ["anhtu4nn"];

function applyGoldBadge(target) {
    if (!target || typeof target !== "object") return;
    target.badge = "locket_gold";
    target.badge_tier = "gold";
    target.show_badge = true;
    target.is_gold = true;
    target.has_gold = true;
    target.gold = true;
    target.gold_badge = true;
    target.gold_subscription = true;
    target.has_gold_subscription = true;
    target.tier = "gold";
    target.subscription_status = "active";
    if (Array.isArray(target.badges)) {
        if (!target.badges.includes("locket_gold")) target.badges.push("locket_gold");
    } else if (target.badges === undefined || target.badges === null) {
        target.badges = ["locket_gold"];
    }
    if (target.user && typeof target.user === "object" && target.user !== target) {
        applyGoldBadge(target.user);
    }
    if (target.friend && typeof target.friend === "object" && target.friend !== target) {
        applyGoldBadge(target.friend);
    }
    if (target.profile && typeof target.profile === "object" && target.profile !== target) {
        applyGoldBadge(target.profile);
    }
}

function isNodeVip(target, vSet) {
    if (!target || typeof target !== "object") return false;
    const uid = String(target.uid || target.user_id || target.id || target.friend_uid || target.friend_id || target.friendId || target.userId || "").toLowerCase().trim();
    if (uid && vSet.has(uid)) return true;

    const uname = String(target.username || target.friend_username || "").toLowerCase().trim().replace(/^@/, "");
    if (uname && vSet.has(uname)) return true;

    if (target.user && typeof target.user === "object") {
        const uUid = String(target.user.uid || target.user.id || target.user.user_id || "").toLowerCase().trim();
        if (uUid && vSet.has(uUid)) return true;
        const uUname = String(target.user.username || target.user.friend_username || "").toLowerCase().trim().replace(/^@/, "");
        if (uUname && vSet.has(uUname)) return true;
    }

    if (target.friend && typeof target.friend === "object") {
        const fUid = String(target.friend.uid || target.friend.id || "").toLowerCase().trim();
        if (fUid && vSet.has(fUid)) return true;
        const fUname = String(target.friend.username || "").toLowerCase().trim().replace(/^@/, "");
        if (fUname && vSet.has(fUname)) return true;
    }
    return false;
}

// 1. CHIỀU REQUEST
if (typeof $response === "undefined") {
    const reqUrl = (typeof $request !== "undefined" && $request.url) ? $request.url : "";
    if (reqUrl.includes("changeProfileInfo")) {
        $done({
            response: {
                status: 200,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({
                    data: { badge: "locket_gold", badge_tier: "gold", is_gold: true, success: true },
                    result: { badge: "locket_gold", badge_tier: "gold", is_gold: true, success: true }
                })
            }
        });
        return;
    }

    let headers = Object.assign({}, ($request && $request.headers) || {});
    for (let k of Object.keys(headers)) {
        if (['if-none-match', 'if-modified-since', 'x-revenuecat-etag'].includes(k.toLowerCase())) {
            delete headers[k];
        }
    }
    $done({ headers: headers });
}

// 2. CHIỀU RESPONSE
else {
    const reqUrl = (typeof $request !== "undefined" && $request.url) ? $request.url : "";
    let body = $response.body;
    let status = $response.status || $response.statusCode || 200;

    const customArg = (typeof $argument === "string" && $argument.trim()) ? $argument.trim().toLowerCase() : "";
    const unlockAllFriends = customArg.includes("all_friends=true") || customArg.includes("gold_all=true");

    let vipSet = new Set(BASE_VIP_USERS.map(u => String(u).toLowerCase().trim()));

    function extractSelfUidFromHeaders(headers) {
        if (!headers || typeof headers !== "object") return null;
        const auth = headers["authorization"] || headers["Authorization"] || headers["AUTHORIZATION"] || "";
        if (!auth || typeof auth !== "string") return null;
        const token = auth.replace(/^Bearer\s+/i, "").trim();
        const parts = token.split(".");
        if (parts.length >= 2) {
            try {
                let base64Url = parts[1].replace(/-/g, "+").replace(/_/g, "/");
                while (base64Url.length % 4) base64Url += "=";
                let output = "";
                let str = String(base64Url).replace(/=+$/, "");
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
                for (let bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
                    buffer = chars.indexOf(buffer);
                }
                if (output) {
                    const payload = JSON.parse(output);
                    return payload.user_id || payload.sub || payload.uid || null;
                }
            } catch (e) {}
        }
        return null;
    }

    const reqHeaders = (typeof $request !== "undefined" && $request && $request.headers) ? $request.headers : {};
    const jwtSelfUid = extractSelfUidFromHeaders(reqHeaders);
    let myUid = (typeof $persistentStore !== "undefined") ? $persistentStore.read(SELF_UID_KEY) : null;
    if (jwtSelfUid) {
        myUid = jwtSelfUid;
        if (typeof $persistentStore !== "undefined") {
            $persistentStore.write(myUid, SELF_UID_KEY);
        }
    }
    if (myUid) vipSet.add(String(myUid).toLowerCase().trim());
    const myUname = (typeof $persistentStore !== "undefined") ? $persistentStore.read(SELF_USERNAME_KEY) : null;
    if (myUname) vipSet.add(String(myUname).toLowerCase().trim());

    if (typeof $persistentStore !== "undefined") {
        try {
            const rawVip = $persistentStore.read(VIP_STORE_KEY);
            if (rawVip) {
                const list = JSON.parse(rawVip);
                if (Array.isArray(list)) {
                    for (let id of list) {
                        if (id) vipSet.add(String(id).toLowerCase().trim());
                    }
                }
            }
        } catch (e) {}
    }

    if (body && typeof body === "string") {
        try {
            let obj = JSON.parse(body);

            function unlockSelfUser(userNode) {
                if (!userNode || typeof userNode !== "object") return;
                applyGoldBadge(userNode);
                userNode.can_use_filters = true;
                userNode.can_use_gold_features = true;
                userNode.can_generate_filtered_image = true;
                userNode.can_create_filtered_image = true;
                userNode.has_ai_access = true;
                userNode.filter_access = true;

                const actual = (userNode.user && typeof userNode.user === "object") ? userNode.user : userNode;
                const uid = String(actual.uid || actual.user_id || actual.id || userNode.uid || userNode.user_id || userNode.id || myUid || "").toLowerCase().trim();
                const username = String(actual.username || userNode.username || "").toLowerCase().trim().replace(/^@/, "");

                if (typeof $persistentStore !== "undefined") {
                    if (uid) $persistentStore.write(uid, SELF_UID_KEY);
                    if (username) $persistentStore.write(username, SELF_USERNAME_KEY);
                }
                if (uid) vipSet.add(uid);
                if (username) vipSet.add(username);

                if ((uid || username) && typeof $httpClient !== "undefined") {
                    try {
                        $httpClient.get(`${WORKER_HOST}/api/register-vip?uid=${encodeURIComponent(uid)}&username=${encodeURIComponent(username)}`, function() {});
                    } catch (e) {}
                }
            }

            function transformNode(node) {
                if (!node || typeof node !== "object") return;
                if (Array.isArray(node)) {
                    for (let i = 0; i < node.length; i++) transformNode(node[i]);
                    return;
                }

                const actualUser = (node.user && typeof node.user === "object") ? node.user : node;
                const nodeUid = String(actualUser.uid || actualUser.user_id || actualUser.id || node.uid || node.user_id || node.id || "").toLowerCase().trim();

                const isSelf = Boolean(
                    (myUid && nodeUid && nodeUid === myUid.toLowerCase()) ||
                    ("email" in node && node.email && typeof node.email === "string" && node.email.includes("@")) ||
                    ("push_token" in node && node.push_token) ||
                    ("fcm_token" in node && node.fcm_token)
                );

                if (isSelf) {
                    unlockSelfUser(node);
                } else if (unlockAllFriends || isNodeVip(node, vipSet)) {
                    applyGoldBadge(node);
                    if (node.user && typeof node.user === "object") applyGoldBadge(node.user);
                    if (node.friend && typeof node.friend === "object") applyGoldBadge(node.friend);
                }

                for (let k of Object.keys(node)) {
                    if (k !== "badge" && k !== "is_gold" && k !== "has_gold" && k !== "tier" && k !== "gold") {
                        if (vipSet.has(k.toLowerCase().trim()) && node[k] && typeof node[k] === "object") {
                            applyGoldBadge(node[k]);
                        }
                        transformNode(node[k]);
                    }
                }
            }

            transformNode(obj);
            body = JSON.stringify(obj);
        } catch (e) {}
    }

    let respHeaders = Object.assign({}, ($response && $response.headers) || {});
    delete respHeaders["Content-Encoding"];
    delete respHeaders["content-encoding"];
    delete respHeaders["Content-Length"];
    delete respHeaders["content-length"];
    respHeaders["content-type"] = "application/json; charset=utf-8";

    $done({
        status: status,
        headers: respHeaders,
        body: body
    });
}