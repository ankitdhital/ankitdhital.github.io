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
  // Projects dropdown (desktop): every project one hover away from any page.
  // Names follow the site naming table; subtitles reuse each card's existing line.
  // Edit this list when a project is added, moved or renamed.
  var NAV_PROJECTS = [
    ["Projects", [
      ["project-inl-hydropower.html", "INL Hydropower-Battery Display", "In progress · ME 490 capstone", "inl-prototype-1"],
      ["project-rotomesh.html", "RotoMesh Vent Packing", "Ongoing · ME 490 special problem", "rotomesh-test-bench"],
      ["project-thermogate.html", "Thermogate — Closed-Loop Thermal Control System", "Arduino-controlled vent prototype", "thermogate-front"],
      ["project-planetary-gear.html", "4:1 Planetary Gearbox", "4:1 gear reduction", "planetary-gear-assembly"],
      ["project-rat-trap.html", "Briefcase Rat Trap — Electromechanical Rodent Trap", "15-part assembly, 40% under budget", "rat-trap-interior"],
      ["project-hanger.html", "Hanger — CAD to Part", "0.001 in tolerance", "hanger-cad"],
      ["project-mailbox.html", "Sheet-Metal Mailbox", "±1/32 in fabrication", "mailbox-final"],
      ["project-fsae-wheel.html", "FSAE Wheel & Suspension", "6 months, wheel + suspension corner", "fsae-wheel"]
    ]],
    ["On the bench", [
      ["project-mechanical-envelope.html", "Mechanical Envelope", "PETG · 5 parts · 3 letter-size slots", "envelope-final-front"],
      ["project-laser-cut-pattern.html", "Laser-Cut Steel Tiger", "0.25 in steel, hand-finished", "tiger-snow"],
      ["projects.html#on-the-bench", "Mirror Stand", "0.13 in wood · 9 parts", "mirror-stand"],
      ["projects.html#on-the-bench", "EZclockn", "25+ users · 200+ hours logged", "ezclockn"]
    ]]
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
    buildProjectsDropdown(nav, current);
  });

  function buildProjectsDropdown(nav, current) {
    var link = nav.querySelector('a[href="projects.html"]');
    if (!link) return;
    function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
    var drop = el("div", "nav-drop");
    link.parentNode.insertBefore(drop, link);
    drop.appendChild(link);
    var panel = el("div", "nav-drop__panel");
    panel.id = "nav-projects";
    link.setAttribute("aria-haspopup", "true");
    link.setAttribute("aria-expanded", "false");
    link.setAttribute("aria-controls", panel.id);
    NAV_PROJECTS.forEach(function (group) {
      var col = el("div", "nav-drop__col");
      col.appendChild(el("p", "nav-drop__label", group[0]));
      group[1].forEach(function (p) {
        var a = el("a", "nav-drop__item");
        a.href = p[0];
        if (p[0] === current) a.setAttribute("aria-current", "page");
        var img = el("img");
        img.alt = ""; img.width = 44; img.height = 44;
        img.setAttribute("data-src", "assets/webp/" + p[3] + ".webp");
        var txt = el("span");
        txt.appendChild(el("b", "", p[1]));
        txt.appendChild(el("small", "", p[2]));
        a.appendChild(img); a.appendChild(txt);
        col.appendChild(a);
      });
      panel.appendChild(col);
    });
    var all = el("a", "nav-drop__all", "View all projects →");
    all.href = "projects.html";
    panel.appendChild(all);
    drop.appendChild(panel);

    // Thumbnails load the first time the panel opens, not with every page.
    var loaded = false, timer = 0, quiet = false;
    function open() {
      if (!loaded) {
        panel.querySelectorAll("img[data-src]").forEach(function (i) { i.src = i.getAttribute("data-src"); });
        loaded = true;
      }
      // Centre under "Projects", but keep a 16 px margin from both edges of the window.
      var d = drop.getBoundingClientRect(), w = panel.offsetWidth;
      var x = Math.min(Math.max(d.left + d.width / 2 - w / 2, 16), window.innerWidth - 16 - w);
      panel.style.left = Math.round(x - d.left) + "px";
      drop.classList.add("is-open");
      link.setAttribute("aria-expanded", "true");
    }
    function close() {
      drop.classList.remove("is-open");
      link.setAttribute("aria-expanded", "false");
    }
    drop.addEventListener("mouseenter", function () { clearTimeout(timer); open(); });
    drop.addEventListener("mouseleave", function () { clearTimeout(timer); timer = setTimeout(close, 160); });
    // Escape returns focus to "Projects" without reopening the panel.
    drop.addEventListener("focusin", function () { if (!quiet) open(); });
    drop.addEventListener("focusout", function (e) { if (!drop.contains(e.relatedTarget)) close(); });
    drop.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drop.classList.contains("is-open")) { close(); quiet = true; link.focus(); quiet = false; }
    });
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

  // All-projects strip under Previous / Next on every project page: a horizontal row of image
  // cards built from NAV_PROJECTS, current project highlighted and scrolled into view.
  (function () {
    var current = location.pathname.split("/").pop() || "index.html";
    var next = document.querySelector(".next-grid");
    if (!/^project-/.test(current) || !next) return;
    var strip = document.createElement("nav");
    strip.className = "wrap proj-strip reveal is-visible";
    strip.setAttribute("aria-label", "All projects");
    var track = document.createElement("div");
    track.className = "proj-strip__track";
    var here = null;
    NAV_PROJECTS.forEach(function (group) {
      group[1].forEach(function (p) {
        var a = document.createElement("a");
        a.className = "proj-strip__item";
        a.href = p[0];
        if (p[0] === current) { a.setAttribute("aria-current", "page"); here = a; }
        var img = document.createElement("img");
        img.src = "assets/webp/" + p[3] + ".webp"; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
        var name = document.createElement("span");
        name.textContent = p[1];
        a.appendChild(img); a.appendChild(name);
        track.appendChild(a);
      });
    });
    function arrow(dir, label) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "proj-strip__arrow proj-strip__arrow--" + dir;
      b.setAttribute("aria-label", label); b.textContent = dir === "prev" ? "‹" : "›";
      b.addEventListener("click", function () { track.scrollBy({ left: (dir === "prev" ? -1 : 1) * track.clientWidth * 0.8, behavior: "smooth" }); });
      return b;
    }
    strip.appendChild(arrow("prev", "Scroll projects left"));
    strip.appendChild(track);
    strip.appendChild(arrow("next", "Scroll projects right"));
    next.parentNode.insertBefore(strip, next.nextSibling);
    if (here) track.scrollLeft = Math.max(0, here.offsetLeft - track.offsetLeft - track.clientWidth / 2 + here.offsetWidth / 2);
  })();
})();
