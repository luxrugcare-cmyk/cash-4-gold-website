/* Cash 4 Gold — shared behaviour */
(function () {
  "use strict";

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("mainNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    if (!q) return;
    q.addEventListener("click", function () {
      var wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (o) {
        o.classList.remove("open");
        o.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("open");
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- Indicative gold rates (live spot, cached fallback) ---------- */
  var SPOT_24K_ZAR_G = 2181; // fallback ZAR/g 24ct — auto-replaced by live spot when the feed loads
  var spotState = { zarG24: SPOT_24K_ZAR_G, live: false, oz: 0, zar: 0, at: null };
  var runCalc = null;

  function perGram(karat) {
    return spotState.zarG24 * (karat / 24);
  }
  function fmtR(v) {
    return "R" + Math.round(v).toLocaleString("en-ZA");
  }
  function sastTime(d) {
    try {
      return new Intl.DateTimeFormat("en-ZA", {
        hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg"
      }).format(d);
    } catch (e) { return ""; }
  }

  function renderTicker() {
    var tickers = document.querySelectorAll("[data-karat]");
    if (!tickers.length) return;
    tickers.forEach(function (el) {
      var k = parseFloat(el.getAttribute("data-karat"));
      var v = el.querySelector(".ticker-value");
      var d = el.querySelector(".ticker-delta");
      if (v) v.innerHTML = fmtR(perGram(k)) + ' <small>/ g</small>';
      if (d) {
        if (spotState.live) {
          d.textContent = "live spot";
          d.className = "ticker-delta delta-live";
        } else {
          d.textContent = "indicative";
          d.className = "ticker-delta delta-static";
        }
      }
    });
    if (spotState.live) {
      var note = document.querySelector(".ticker-note");
      if (note) {
        note.textContent =
          "Spot $" + Math.round(spotState.oz).toLocaleString("en-US") + "/oz · USD/ZAR " +
          spotState.zar.toFixed(2) + " · updated " + sastTime(spotState.at) + " SAST. " +
          "Indicative rates per gram — final offers confirmed after testing and weighing in front of you.";
      }
    }
  }

  /* Live spot: gold USD/oz + USD/ZAR, both free and keyless; falls back silently. */
  (function refreshSpot() {
    function get(url) {
      return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    }
    Promise.all([
      get("https://api.gold-api.com/price/XAU"),
      get("https://open.er-api.com/v6/latest/USD")
    ]).then(function (res) {
      var oz = res[0] && res[0].price;
      var zar = res[1] && res[1].rates && res[1].rates.ZAR;
      if (!oz || !zar || oz <= 0 || zar <= 0) return;
      var zpg = (oz / 31.1034768) * zar;
      if (!isFinite(zpg) || zpg <= 0) return;
      spotState = { zarG24: zpg, live: true, oz: oz, zar: zar, at: new Date() };
      renderTicker();
      if (runCalc) runCalc(false);
    });
  })();

  renderTicker();

  /* ---------- Gold calculator ---------- */
  var calcForm = document.getElementById("calcForm");
  if (calcForm) {
    var karatSel = document.getElementById("calcKarat");
    var weightIn = document.getElementById("calcWeight");
    var amountEl = document.getElementById("calcAmount");
    var rangeEl = document.getElementById("calcRange");

    var calcTimer = null;
    function trackCalc(k, w) {
      if (calcTimer) clearTimeout(calcTimer);
      calcTimer = setTimeout(function () {
        if (window.c4gTrack) window.c4gTrack("calculator_used", { karat: k, grams: w });
      }, 1500);
    }
    runCalc = function (track) {
      var k = parseFloat(karatSel.value);
      var w = parseFloat(weightIn.value);
      if (!w || w <= 0) {
        amountEl.textContent = "R —";
        rangeEl.textContent = "Enter the weight to see an indicative offer.";
        return;
      }
      var est = perGram(k) * w;
      amountEl.textContent = fmtR(est);
      rangeEl.textContent =
        "Indicative range: " + fmtR(est * 0.92) + " – " + fmtR(est * 0.99);
      if (track !== false) trackCalc(k, w);
    };
    karatSel.addEventListener("change", function () { runCalc(true); });
    weightIn.addEventListener("input", function () { runCalc(true); });
    runCalc(false);
  }

  /* ---------- Enquiry form → WhatsApp ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#fName").value.trim();
      var phone = form.querySelector("#fPhone").value.trim();
      var service = form.querySelector("#fService").value;
      var message = form.querySelector("#fMessage").value.trim();
      var text =
        "Hi Cash 4 Gold, my name is " + name +
        " (" + phone + "). I'm interested in: " + service + ". " + message;
      var status = document.getElementById("formStatus");
      if (window.c4gTrack) window.c4gTrack("contact_form_submit", { service: service });
      window.open("https://wa.me/27727929452?text=" + encodeURIComponent(text), "_blank");
      if (status) {
        status.textContent =
          "Thanks " + name + " — WhatsApp is opening with your enquiry ready to send. " +
          "No WhatsApp? Call us on 010 023 6649 or email info@cash-4-gold.co.za.";
        status.classList.add("show");
      }
      form.reset();
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Footer year ---------- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
})();
