/* Cash 4 Gold — analytics layer (GA4-ready, no backend)
 *
 * Activation: paste your GA4 Measurement ID below (format "G-XXXXXXXXXX").
 * Until then all events are pushed to window.dataLayer only (harmless,
 * ready for GTM or GA4 the moment an ID is set).
 *
 * Conversions to mark in GA4 Admin (Admin > Events > toggle "Mark as conversion"):
 *   whatsapp_click, phone_call_click, contact_form_submit
 */
(function () {
  "use strict";

  var GA4_ID = ""; // ← paste GA4 Measurement ID here, e.g. "G-ABC1234567"

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.c4gTrack = track;

  if (GA4_ID) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA4_ID, { anonymize_ip: true });
  }

  function track(name, params) {
    params = params || {};
    params.page_path = location.pathname;
    if (GA4_ID) gtag("event", name, params);
    window.dataLayer.push(Object.assign({ event: name }, params));
  }

  function locationOf(el) {
    if (el.closest("header")) return "header";
    if (el.closest("footer")) return "footer";
    var sec = el.closest("section[id], main[id]");
    if (sec) return sec.id;
    if (el.closest(".floating-cta, .whatsapp-float")) return "floating";
    return "body";
  }

  /* Outbound contact links: WhatsApp / tel / mailto */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute("href");
    var loc = locationOf(a);
    if (href.indexOf("wa.me") !== -1 || href.indexOf("whatsapp") !== -1) {
      track("whatsapp_click", { location: loc });
    } else if (href.indexOf("tel:") === 0) {
      track("phone_call_click", { location: loc });
    } else if (href.indexOf("mailto:") === 0) {
      track("email_click", { location: loc });
    }
  });
})();
