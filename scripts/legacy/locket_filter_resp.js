/***********************************************
> Locket Filter Response Override by anhtu4n
> Tác giả: anhtu4n
> Chức năng: Gỡ lỗi 402/403/422, unblur ảnh, gỡ cờ khóa Gold trên filter
***********************************************/

let body = ($response && $response.body) ? $response.body : "";
let status = ($response && ($response.status || $response.statusCode)) || 200;

if (body && typeof body === "string") {
    try {
        let obj = JSON.parse(body);

        // Chuyển mọi mã lỗi upstream (400, 402, 403, 422) thành 200 OK thành công
        if (status >= 400 || (obj && (obj.error || obj.errors))) {
            status = 200;
            delete obj.error;
            delete obj.errors;
            if (obj.result) {
                delete obj.result.error;
                delete obj.result.errors;
            }
        }

        function unlockFilterNode(node) {
            if (!node || typeof node !== "object") return;
            if (Array.isArray(node)) {
                for (let i = 0; i < node.length; i++) unlockFilterNode(node[i]);
                return;
            }

            // Gỡ bỏ toàn bộ các cờ khóa tiền, yêu cầu Gold
            const falseFlags = [
                "is_locked", "locked", "requires_gold", "require_gold",
                "gold_only", "is_gold_only", "paywall", "show_paywall",
                "show_upsell", "upsell", "blurred", "is_blurred", "needs_gold"
            ];
            for (let f of falseFlags) {
                if (f in node) node[f] = false;
            }

            // Kích hoạt cờ cho phép xem và sử dụng
            const trueFlags = [
                "can_view", "unlocked", "is_unlocked", "is_free", "free",
                "can_use_filter", "allowed", "can_use_filters", "is_gold"
            ];
            for (let t of trueFlags) {
                if (t in node) node[t] = true;
            }

            // Gỡ che mờ ảnh (thay link ảnh nét thành phẩm vào các trường mờ)
            const clearUrl = node.unblurred_url || node.unlocked_url || node.result_url || node.outputUrl || node.output_url || node.imageUrl || node.image_url || node.transformed_image_url || node.url;
            if (clearUrl && typeof clearUrl === "string" && clearUrl.startsWith("http")) {
                if ("blurred_url" in node) node.blurred_url = clearUrl;
                if ("blurred_image_url" in node) node.blurred_image_url = clearUrl;
                if ("preview_url" in node) node.preview_url = clearUrl;
            }

            for (let k of Object.keys(node)) {
                if (node[k] && typeof node[k] === "object") {
                    unlockFilterNode(node[k]);
                }
            }
        }

        unlockFilterNode(obj);

        if (obj.result && typeof obj.result === "object") {
            obj.result.status = 200;
            obj.result.is_unlocked = true;
            obj.result.requires_gold = false;
        }

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
    status: 200,
    headers: respHeaders,
    body: body
});