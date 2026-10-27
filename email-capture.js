/* FurTrouble email-capture popup. Single <script> injected on every page.
   - Shows once per visitor per frequencyDays (localStorage), on content pages only.
   - Triggers after delaySec OR scrollTrigger fraction of the page — whichever first.
   - Dismissible, mobile-responsive, no heavy library.
   To go live: set CONFIG.provider endpoint (Buttondown / Kit / MailerLite). Until
   then the form shows a friendly "not connected yet" state instead of failing. */
(function () {
  // ==================== CONFIG ====================
  var CONFIG = {
    enabled: true,
    // Provider = Kit (ConvertKit), free plan = 10,000 subscribers.
    // Get values from Kit dashboard:
    //   form id  = the form's id shown in the form editor URL
    //              (https://app.convertkit.com/forms/<THIS ID>)  or 0 for the main form
    //   api key  = Kit -> Settings (gear) -> API Keys (ck_ed25519:...)
    // Then set:
    //   actionUrl: "https://api.convertkit.com/v3/forms/<FORM ID>/subscribe"
    //   apiKey:    "<your Kit API key>"
    // Leave actionUrl empty until then: submissions are stored locally in
    // localStorage (ft_pending_subs) and nothing is lost.
    provider: "kit",
    actionUrl: "https://api.convertkit.com/v3/forms/10006358/subscribe",
    apiKey: "AzF0wzJIV0s6ddIK6pCU8w",
    formId: "10006358",

    frequencyDays: 3,      // re-offer to the same visitor after N days
    delaySec: 20,          // show after N seconds on a content page
    scrollTrigger: 0.55,   // or when N fraction of page scrolled (whichever first)
    storageKey: "ft_popup_v1",
    // pages that should NOT get the popup (compliance pages stay clean)
    skipPaths: ["/privacy-policy", "/disclaimer", "/affiliate-disclosure",
                "/cookie-policy", "/contact"]
  };
  // ==================== END CONFIG ====================

  if (!CONFIG.enabled) return;

  function onSkipPage() {
    var p = location.pathname.toLowerCase();
    return CONFIG.skipPaths.some(function (s) { return p.indexOf(s) === 1; });
  }
  function shownRecently() {
    try {
      var t = localStorage.getItem(CONFIG.storageKey);
      if (!t) return false;
      return (Date.now() - parseInt(t, 10)) < CONFIG.frequencyDays * 86400000;
    } catch (e) {}
    return false;
  }
  function markShown() {
    try { localStorage.setItem(CONFIG.storageKey, String(Date.now())); } catch (e) {}
  }

  if (onSkipPage()) return;
  if (shownRecently()) return;
  if (document.querySelector("[data-ft-popup]")) return;

  // ---- inject styles + markup (self-contained, no page edits needed) ----
  var style = document.createElement("style");
  style.textContent = [
    ".ft-wrap{position:fixed;inset:0;z-index:9998;display:none}",
    ".ft-wrap.on{display:block}",
    ".ft-bg{position:absolute;inset:0;background:rgba(28,24,18,.55)}",
    ".ft-card{position:absolute;left:50%;bottom:0;top:auto;transform:translateX(-50%);",
    "  width:100%;max-width:520px;background:#fff;border-radius:16px 16px 0 0;",
    "  box-shadow:0 -6px 28px rgba(0,0,0,.22);padding:22px 22px 26px;box-sizing:border-box}",
    "@media(min-width:600px){.ft-card{bottom:28px;left:50%;transform:translateX(-50%);",
    "  border-radius:16px;width:420px}}",
    ".ft-x{position:absolute;top:12px;right:14px;border:0;background:transparent;font-size:22px;",
    "  color:#999;cursor:pointer;line-height:1;padding:4px}",
    ".ft-x:hover{color:#3d2f00}",
    ".ft-logo{height:34px;margin-bottom:10px}",
    ".ft-h{font-family:Georgia,serif;font-size:1.25rem;color:#1c1c1c;margin:0 0 6px;line-height:1.3}",
    ".ft-sub{font-family:Arial,sans-serif;font-size:.9rem;color:#6b655c;margin:0 0 14px;line-height:1.5}",
    ".ft-in{font-family:Arial,sans-serif;font-size:1rem;padding:11px 14px;border:1px solid #d8d2c8;",
    "  border-radius:8px;width:100%;box-sizing:border-box;margin-bottom:10px;color:#1c1c1c}",
    ".ft-btn{font-family:Arial,sans-serif;font-weight:700;font-size:.95rem;background:#3d2f00;",
    "  color:#fff;border:0;border-radius:8px;padding:12px 16px;width:100%;cursor:pointer}",
    ".ft-btn:hover{opacity:.92}",
    ".ft-btn:disabled{opacity:.6;cursor:default}",
    ".ft-trust{font-family:Arial,sans-serif;font-size:.72rem;color:#a29a8e;margin-top:10px;text-align:center}",
    ".ft-trust a{color:#a29a8e}",
    ".ft-msg{font-family:Arial,sans-serif;font-size:.85rem;text-align:center;margin-top:10px;min-height:16px}"
  ].join("");
  document.head.appendChild(style);

  var el = document.createElement("div");
  el.className = "ft-wrap";
  el.setAttribute("data-ft-popup", "");
  el.innerHTML =
    '<div class="ft-bg"></div>' +
    '<div class="ft-card" role="dialog" aria-modal="true" aria-label="Sign up for pet product deals">' +
      '<button class="ft-x" aria-label="Close">&times;</button>' +
      '<img class="ft-logo" src="furtrouble-logo.png" alt="FurTrouble" onerror="this.style.display=\'none\'">' +
      '<h2 class="ft-h">The deal you\'ll actually want, once a week</h2>' +
      '<p class="ft-sub">One short email: the best pet-product sales, real price drops &amp; new "what actually fixed it" reviews. Free. Unsubscribe in one click.</p>' +
      '<form class="ft-form" novalidate>' +
        '<input class="ft-in" type="email" name="email" placeholder="you@email.com" required autocomplete="email" aria-label="Email address">' +
        '<button class="ft-btn" type="submit">Get the deals list &rarr;</button>' +
        '<p class="ft-msg" role="status"></p>' +
      '</form>' +
      '<p class="ft-trust">No spam. See our <a href="privacy-policy.html">Privacy Policy</a> &mdash; you can unsubscribe anytime.</p>' +
    '</div>';
  document.body.appendChild(el);

  var msg = el.querySelector(".ft-msg");
  var form = el.querySelector(".ft-form");
  var btn = el.querySelector(".ft-btn");

  function open() {
    if (el.classList.contains("on")) return;
    el.classList.add("on");
    markShown();
    el.querySelector(".ft-in").focus();
  }
  function close() { el.classList.remove("on"); }
  el.querySelector(".ft-x").addEventListener("click", close);
  el.querySelector(".ft-bg").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

  // trigger: delay OR scroll
  var fired = false;
  function fire() { if (!fired) { fired = true; open(); } }
  var t = setTimeout(fire, CONFIG.delaySec * 1000);
  function onScroll() {
    var frac = (window.scrollY || document.documentElement.scrollTop) /
               Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (frac >= CONFIG.scrollTrigger) { fire(); clearTimeout(t); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // submit
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = form.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      msg.style.color = "#b3261e"; msg.textContent = "Please enter a valid email."; return;
    }
    if (!CONFIG.actionUrl) {
      // ESP not connected yet: save locally so the data isn't lost + tell user
      try {
        var q = JSON.parse(localStorage.getItem("ft_pending_subs") || "[]");
        q.push({ email: email, ts: Date.now(), page: location.pathname });
        localStorage.setItem("ft_pending_subs", JSON.stringify(q));
      } catch (err) {}
      msg.style.color = "#b3261e";
      msg.textContent = "Captured locally. Connect your email service to start sending.";
      btn.disabled = true;
      return;
    }
    btn.disabled = true; msg.style.color = "#3d2f00"; msg.textContent = "Signing you up…";
    var body;
    if (CONFIG.provider === "kit") {
      // Kit v3: url already targets the form; body needs email + api_key.
      // (id is optional; 0 = main list. We keep the url-bound form.)
      body = JSON.stringify({ email: email, api_key: CONFIG.apiKey });
    } else if (CONFIG.provider === "mailerlite") {
      body = JSON.stringify({ api_key: CONFIG.apiKey, email: email,
        groups: [parseInt(CONFIG.formId, 10) || 0] });
    } else { // buttondown default
      body = JSON.stringify({ email: email, api_key: CONFIG.apiKey });
    }
    fetch(CONFIG.actionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body
    }).then(function (r) {
      if (r.ok) {
        msg.style.color = "#1a7f37";
        msg.textContent = "You're in. Watch your inbox for the next drop.";
        btn.textContent = "Subscribed";
        setTimeout(close, 2600);
      } else {
        msg.style.color = "#b3261e"; msg.textContent = "Something went wrong — try again.";
        btn.disabled = false;
      }
    }).catch(function () {
      msg.style.color = "#b3261e"; msg.textContent = "Network error — try again.";
      btn.disabled = false;
    });
  });
})();
