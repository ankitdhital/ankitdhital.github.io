(function () {
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
