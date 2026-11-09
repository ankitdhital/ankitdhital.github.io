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

  // Lists behind the Projects / Studies dropdowns and the strips at the bottom of each
  // project and study page. Edit these when something is added, moved or renamed.
  // Item: [href, name, subtitle, image (assets/webp/<name>.webp) or "" for none].
  // Names follow the site naming table; subtitles reuse each card's existing line.
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
  var NAV_STUDIES = [
    ["Studies", [
      ["study-waste-heat.html", "Waste Heat Recovery from Industry", "ME-113 · Thermodynamics", ""],
      ["study-fluid-dynamics.html", "Fluid Dynamics Experiment: Water Flow from Jar to Straw", "ME 111 · Fluid Dynamics", ""],
      ["study-cpr-pulsemate.html", "CPR PulseMate Device Proposal", "ME 380 · Product Design", ""],
      ["study-electronic-fin.html", "Electronic Fin Design", "Mechanical Design", ""],
      ["study-elastic-behaviour.html", "Beam Deflection: Model and Measurement", "ME 370 · Machine Design", ""]
    ]]
  ];

  var current = location.pathname.split("/").pop() || "index.html";
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }

  document.querySelectorAll("[data-site-menu]").forEach(function (nav) {
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
    buildDropdown(nav, "projects.html", "nav-projects", NAV_PROJECTS, "View all projects →");
    buildDropdown(nav, "studies.html", "nav-studies", NAV_STUDIES, "View engineering studies →");
  });

  // Dropdown under a top-menu link (desktop): hover or Tab to open, Escape to close.
  function buildDropdown(nav, href, id, groups, allLabel) {
    var link = nav.querySelector('a[href="' + href + '"]');
    if (!link) return;
    var drop = el("div", "nav-drop");
    link.parentNode.insertBefore(drop, link);
    drop.appendChild(link);
    var panel = el("div", "nav-drop__panel" + (groups.length === 1 ? " nav-drop__panel--single" : ""));
    panel.id = id;
    link.setAttribute("aria-haspopup", "true");
    link.setAttribute("aria-expanded", "false");
    link.setAttribute("aria-controls", panel.id);
    groups.forEach(function (group) {
      var col = el("div", "nav-drop__col");
      col.appendChild(el("p", "nav-drop__label", group[0]));
      group[1].forEach(function (p) {
        var a = el("a", "nav-drop__item");
        a.href = p[0];
        if (p[0] === current) a.setAttribute("aria-current", "page");
        if (p[3]) {
          var img = el("img");
          img.alt = ""; img.width = 44; img.height = 44;
          img.setAttribute("data-src", "assets/webp/" + p[3] + ".webp");
          a.appendChild(img);
        }
        var txt = el("span");
        txt.appendChild(el("b", "", p[1]));
        txt.appendChild(el("small", "", p[2]));
        a.appendChild(txt);
        col.appendChild(a);
      });
      panel.appendChild(col);
    });
    var all = el("a", "nav-drop__all", allLabel);
    all.href = href;
    panel.appendChild(all);
    drop.appendChild(panel);

    // Thumbnails load the first time the panel opens, not with every page.
    var loaded = false, timer = 0, quiet = false;
    function open() {
      if (!loaded) {
        panel.querySelectorAll("img[data-src]").forEach(function (i) { i.src = i.getAttribute("data-src"); });
        loaded = true;
      }
      // Centre under the link, but keep a 16 px margin from both edges of the window.
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
    // Escape returns focus to the link without reopening the panel.
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

  // Strip of cards for every project (or study) at the bottom of each project / study page,
  // current one highlighted and scrolled into view. Projects get image cards; studies have
  // no images, so they get text cards (course line + title).
  function buildStrip(groups, label, place) {
    var strip = el("nav", "wrap proj-strip reveal is-visible");
    strip.setAttribute("aria-label", label);
    var track = el("div", "proj-strip__track");
    var here = null;
    groups.forEach(function (group) {
      group[1].forEach(function (p) {
        var a = el("a", "proj-strip__item" + (p[3] ? "" : " proj-strip__item--text"));
        a.href = p[0];
        if (p[0] === current) { a.setAttribute("aria-current", "page"); here = a; }
        if (p[3]) {
          var img = el("img");
          img.src = "assets/webp/" + p[3] + ".webp"; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
          a.appendChild(img);
        } else {
          a.appendChild(el("small", "", p[2]));
        }
        a.appendChild(el("span", "", p[1]));
        track.appendChild(a);
      });
    });
    function arrow(dir) {
      var b = el("button", "proj-strip__arrow proj-strip__arrow--" + dir, dir === "prev" ? "‹" : "›");
      b.type = "button";
      b.setAttribute("aria-label", "Scroll " + (dir === "prev" ? "left" : "right"));
      b.addEventListener("click", function () { track.scrollBy({ left: (dir === "prev" ? -1 : 1) * track.clientWidth * 0.8, behavior: "smooth" }); });
      return b;
    }
    strip.appendChild(arrow("prev"));
    strip.appendChild(track);
    strip.appendChild(arrow("next"));
    place(strip);
    if (here) track.scrollLeft = Math.max(0, here.offsetLeft - track.offsetLeft - track.clientWidth / 2 + here.offsetWidth / 2);
  }

  var nextGrid = document.querySelector(".next-grid");
  if (/^project-/.test(current) && nextGrid) {
    // Projects: directly under Previous / Next.
    buildStrip(NAV_PROJECTS, "All projects", function (strip) { nextGrid.parentNode.insertBefore(strip, nextGrid.nextSibling); });
  }
  var main = document.querySelector("main");
  if (/^study-/.test(current) && main) {
    // Studies have no Previous / Next: the strip closes the page content.
    buildStrip(NAV_STUDIES, "All studies", function (strip) {
      var sec = el("section", "section pt-0 proj-strip-section");
      strip.classList.add("proj-strip--studies");
      sec.appendChild(strip);
      main.appendChild(sec);
    });
  }
})();
