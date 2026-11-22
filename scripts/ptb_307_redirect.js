// PTB307_RELEASE_20261110B - conditional 307 redirect for self-hosted Photobooth only.
// Never log photo URLs, credentials, analytics IDs, or request/response bodies.
(function () {
  var finished = false;
  function done(value) { if (!finished) { finished = true; $done(value || {}); } }
  function note(code) { try { console.log('[ANHTU4NN-PTB307] ' + code); } catch (_) {} }
  try {
    var requestUrl = String(($request && $request.url) || '');
    if (!/^https?:\/\/(?:api\.locketcamera\.com|us-central1-locket-4252a\.cloudfunctions\.net)\/generateFilteredImage(?:\?.*)?$/.test(requestUrl)) {
      note('SKIP_UNEXPECTED_URL'); return done({});
    }
    var body = $request && $request.body;
    if (typeof body !== 'string' || !body) { note('SKIP_NO_BODY'); return done({}); }
    var packet = JSON.parse(body);
    var data = packet && packet.data;
    if (!data || typeof data !== 'object') { note('SKIP_NO_DATA'); return done({}); }
    var id = String(data.filter_id || '').toLowerCase();
    var prompt = String(data.prompt || '').toLowerCase();
    // Self-hosted custom frames (prefix: my_*) -> redirect to user's own Vercel backend
    var CUSTOM_BACKEND_URL = 'https://locket-sgmodule.vercel.app/api/generateFilteredImage';
    if (/^my_[a-z0-9_-]{1,60}$/i.test(id) || /^my_[a-z0-9_-]{1,60}$/i.test(prompt)) {
      if (typeof data.image_url !== 'string' || !data.image_url.trim()) {
        note('SKIP_CUSTOM_NO_IMAGE'); return done({});
      }
      note('RETURN_307_CUSTOM_BACKEND');
      return done({
        response: {
          status: 307,
          headers: {
            'Location': CUSTOM_BACKEND_URL,
            'Cache-Control': 'no-store',
            'Content-Length': '0'
          },
          body: ''
        }
      });
    }
    // Single-shot IDs have valid transparent overlays in LocketStudio (47 builtin registry entries (3 external overlays require import)).
    // Unsupported native/AI filters remain untouched. Existing 4-shot classification stays the same.
    var OWNED_SINGLE_IDS = new Set(["stk_rose_flower", "stk_shrek_ogre", "stk_superhero_cape", "stk_spooky_ghost", "stk_pirate_hat", "stk_volcano_lava", "stk_rain_storm", "stk_fortnite_llama", "stk_watercolor_art", "stk_golden_hour", "stk_jungle_leaf", "stk_cute_zombie", "stk_fireworks", "stk_new_year_2026", "stk_harry_potter", "stk_minecraft", "stk_fire_flame", "stk_giant_spider", "stk_ocean_underwater", "stk_ufo_alien", "frame_classic_pb", "sticker_b_nh_lu_n_minh_tu", "cmt_locket", "khung_nh_hoa_pastel_vi_n_xanh_m_nh", "khung_nh_vu_ng_m_ng_nh_n_b_c", "khung_kh_ng_gian_xanh_pastel", "khung_vu_ng_ng_i_sao_h_ng_pastel", "khung_nh_pastel_vi_n_s_h_i_c_u", "khung_nh_shin_chan_vi_n_m_nh", "khung_anh_o_kitty_v_sao", "khung_xanh_v_tay_sao_v_ng", "sinh_nh_t_hello_kitty_ho_i_c", "pb_single_y2k_silver_holo", "pb_single_denim_ripped", "pb_single_film_nostalgia", "khung hero", "khung shin", "khung chú thuật hồi chiến"]);
    var isStudioMulti = /^(?:pb_3_horizontal|pb_2_horizontal|pb_2_vertical|pb_3_vertical)$/.test(id) || /^(?:pb_3_horizontal|pb_2_horizontal|pb_2_vertical|pb_3_vertical)$/.test(prompt);
    var isSingle = OWNED_SINGLE_IDS.has(id) || OWNED_SINGLE_IDS.has(prompt) || /^custom_[a-f0-9]{20}$/.test(id);
    if (!isSingle && (/^(?:stk_|sticker_|pb_single_)/.test(id) || /^(?:stk_|sticker_|pb_single_)/.test(prompt) || id === 'frame_classic_pb' || prompt === 'photoboot')) { note('SKIP_UNSUPPORTED_SINGLE'); return done({}); }
    var known = /(?:^photobooth(?:_4cut|_cute)?$|^pb_[a-z0-9_]+(?:_4cut|_2x2)$|^frame_(?:berry_days|happy_snap|sky_diary)$)/i;
    var promptKnown = /^(photobooth_4cut|photobooth_cute|pb_(holo_4cut|scrapbook_ripped_4cut|ripped_paper_4cut|denim_ripped_2x2|strawberry|vintage|galaxy))$/i;
    if (!isSingle && !isStudioMulti && !known.test(id) && !promptKnown.test(prompt)) { note('SKIP_NOT_MANAGED'); return done({}); }
    var key = typeof $argument === 'string' ? $argument.trim() : '';
    if (!key || key.indexOf('{{{') !== -1 || /^ptbKey=/.test(key)) {
      note('NO_PTB_KEY'); return done({});
    }
    if (typeof data.image_url !== 'string' || !data.image_url.trim()) {
      note('SKIP_NO_IMAGE'); return done({});
    }
    note(isStudioMulti ? 'RETURN_307_MULTI' : isSingle ? 'RETURN_307_SINGLE' : 'RETURN_307_PTB');
    return done({
      response: {
        status: 307,
        headers: {
          'Location': 'https://locket.anhtu4nn.workers.dev/generateFilteredImage',
          'Cache-Control': 'no-store',
          'Content-Length': '0'
        },
        body: ''
      }
    });
  } catch (_) { note('SKIP_PARSE_ERROR'); return done({}); }
})();
