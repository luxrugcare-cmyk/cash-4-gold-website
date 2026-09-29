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

  /* ---------- Indicative gold rates (linked to daily spot) ---------- */
  var SPOT_24K_ZAR_G = 1235; // updated with the daily gold spot price (ZAR per gram, 24ct)

  function perGram(karat) {
    return SPOT_24K_ZAR_G * (karat / 24);
  }
  function fmtR(v) {
    return "R" + Math.round(v).toLocaleString("en-ZA");
  }

  /* deterministic pseudo-delta so the strip is stable within a day */
  var day = Math.floor(Date.now() / 86400000);
  function delta(karat) {
    var s = Math.sin(day * (karat + 3)) * 10000;
    var f = s - Math.floor(s);
    return ((f - 0.45) * 2.4).toFixed(1);
  }

  var tickers = document.querySelectorAll("[data-karat]");
  if (tickers.length) {
    tickers.forEach(function (el) {
      var k = parseFloat(el.getAttribute("data-karat"));
      var v = el.querySelector(".ticker-value");
      var d = el.querySelector(".ticker-delta");
      if (v) v.innerHTML = fmtR(perGram(k)) + ' <small>/ g</small>';
      if (d) {
        var num = parseFloat(delta(k));
        d.textContent = (num >= 0 ? "+" : "") + num.toFixed(1) + "% today";
        d.className = "ticker-delta " + (num >= 0 ? "delta-up" : "delta-down");
      }
    });
  }

  /* ---------- Gold calculator ---------- */
  var calcForm = document.getElementById("calcForm");
  if (calcForm) {
    var karatSel = document.getElementById("calcKarat");
    var weightIn = document.getElementById("calcWeight");
    var amountEl = document.getElementById("calcAmount");
    var rangeEl = document.getElementById("calcRange");

    function runCalc() {
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
      trackCalc(k, w);
    }
    var calcTimer = null;
    function trackCalc(k, w) {
      if (calcTimer) clearTimeout(calcTimer);
      calcTimer = setTimeout(function () {
        if (window.c4gTrack) window.c4gTrack("calculator_used", { karat: k, grams: w });
      }, 1500);
    }
    karatSel.addEventListener("change", runCalc);
    weightIn.addEventListener("input", runCalc);
    runCalc();
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
