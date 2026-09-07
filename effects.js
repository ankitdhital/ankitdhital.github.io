(function () {
  var canHover = window.matchMedia("(hover:hover) and (pointer:fine)").matches;

  if (canHover) {
    var glow = document.createElement("div");
    glow.id = "cursor-glow";
    document.body.appendChild(glow);
    var raf = null, tx = 0, ty = 0;
    document.addEventListener(
      "mousemove",
      function (e) {
        tx = e.clientX;
        ty = e.clientY;
        if (!raf) {
          raf = requestAnimationFrame(function () {
            glow.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";
            glow.style.opacity = "1";
            raf = null;
          });
        }
      },
      { passive: true }
    );
    document.addEventListener("mouseleave", function () {
      glow.style.opacity = "0";
    });

    var spotlightSel =
      ".project-row,.atlas-card,.method-card,.study-ticket,.study-card,.contact-card,.workbench-card,.case-note,.resume-panel,.study-detail";
    document.addEventListener(
      "mousemove",
      function (e) {
        var el = e.target.closest && e.target.closest(spotlightSel);
        if (!el) return;
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 100) + "%");
        el.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 100) + "%");
      },
      { passive: true }
    );
  }

  function addMeteors(el, count) {
    if (!el || el.dataset.meteorsAdded) return;
    el.dataset.meteorsAdded = "1";
    if (!el.style.position) el.style.position = "relative";
    el.style.overflow = "hidden";
    var field = document.createElement("div");
    field.className = "meteor-field";
    for (var i = 0; i < count; i++) {
      var m = document.createElement("span");
      m.className = "meteor";
      m.style.top = Math.random() * 30 + "%";
      m.style.left = Math.random() * 100 + "%";
      m.style.animationDelay = Math.random() * 6 + "s";
      m.style.animationDuration = 3 + Math.random() * 3 + "s";
      field.appendChild(m);
    }
    el.insertBefore(field, el.firstChild);
  }
  document.querySelectorAll(".footer").forEach(function (el) {
    addMeteors(el, 14);
  });
  document.querySelectorAll("section.bg-graphite-text.text-on-primary").forEach(function (el) {
    addMeteors(el, 10);
  });

  document.querySelectorAll("[data-flip-words]").forEach(function (el) {
    var words;
    try {
      words = JSON.parse(el.getAttribute("data-flip-words"));
    } catch (e) {
      return;
    }
    if (!words || words.length < 2) return;
    var i = 0;
    setInterval(function () {
      i = (i + 1) % words.length;
      el.style.opacity = "0";
      setTimeout(function () {
        el.textContent = words[i];
        el.style.opacity = "1";
      }, 220);
    }, 2600);
  });
})();
