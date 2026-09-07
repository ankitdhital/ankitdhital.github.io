(function () {
  // Single source of truth for the top nav — edit this list to add/remove/
  // reorder nav items site-wide instead of editing every page's HTML.
  var NAV_ITEMS = [
    { label: "Home", href: "index.html" },
    { label: "Projects", href: "projects.html" },
    { label: "Profile", href: "about.html" },
    { label: "Studies", href: "studies.html" },
    { label: "Resume", href: "resume.html" },
    { label: "Contact", href: "contact.html" }
  ];
  document.querySelectorAll("[data-site-menu]").forEach(function (nav) {
    var current = location.pathname.split("/").pop() || "index.html";
    var trailing = nav.querySelector(".atlas-open");
    var frag = document.createDocumentFragment();
    NAV_ITEMS.forEach(function (item) {
      var a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      var isActive =
        item.href === current ||
        (item.href === "projects.html" && /^project-/.test(current)) ||
        (item.href === "studies.html" && /^study-/.test(current));
      if (isActive) a.className = "active";
      frag.appendChild(a);
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.remove();
    });
    nav.insertBefore(frag, trailing || null);
  });

  // "How I work" section: pin the stage and iris-wipe between steps as the
  // user scrolls through the tall .method-scroller wrapper (desktop only —
  // CSS falls back to a plain stacked list below 980px).
  var scroller = document.querySelector("[data-method-scroller]");
  if (scroller) {
    var steps = scroller.querySelectorAll(".method-step");
    var dots = scroller.querySelectorAll("[data-method-dots] span");
    var lastIndex = 0;
    var updateStep = function () {
      if (window.innerWidth <= 980) return;
      var rect = scroller.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      var index = Math.min(steps.length - 1, Math.floor(progress * steps.length));
      if (index !== lastIndex) {
        steps.forEach(function (s, i) {
          s.classList.toggle("is-active", i === index);
        });
        dots.forEach(function (d, i) {
          d.classList.toggle("is-active", i === index);
        });
        lastIndex = index;
      }
    };
    var ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          requestAnimationFrame(function () {
            updateStep();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", updateStep);
    updateStep();
  }

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
