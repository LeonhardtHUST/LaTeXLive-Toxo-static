export var theme = {
  obj_highlight: {},
  currentTheme: "default",
  map_theme: {},
  isOpenCodeHighLight: true,
  init: function (opt) {
    theme.map_theme = opt.map_all[1].root;
    theme.obj_highlight = opt.obj_highlight;
    theme.isOpenCodeHighLight = opt.obj_highlight.isOpenCodeHighLight;
    var seen = {};
    theme.allSelectors = [];
    for (var tname in theme.map_theme) {
      var elements = theme.map_theme[tname].element;
      for (var i = 0; i < elements.length; i++) {
        var sel = elements[i].selecter;
        if (!seen[sel]) {
          seen[sel] = true;
          theme.allSelectors.push(sel);
        }
      }
    }
    theme.reinit();
  },
  reinit: function () {
    theme.setSingle();
    theme.setInput(theme.isOpenCodeHighLight);
    theme.setScroll();
    theme.setButton();
    theme.setMathJax();
  },
  setSingle: function () {
    for (var i = 0; i < theme.allSelectors.length; i++) {
      $(theme.allSelectors[i]).removeAttr("style");
    }
    var root = theme.map_theme[theme.currentTheme].element;
    for (var i = 0; i < root.length; i++) {
      var slc = root[i].selecter;
      var stl = root[i].style;
      for (var m = 0; m < stl.length; m++) {
        $(slc).css(stl[m].key, stl[m].val);
      }
    }
  },
  setInput: function (ishl) {
    let root = theme.map_theme[theme.currentTheme].special;
    if (ishl) {
      let slc_input = root.input.selecter;
      let stl_input = root.input.hl;
      stl_input.forEach((element) => {
        $(slc_input).css(element.key, element.val);
      });
      let slc_copy = root.copyinput.selecter;
      let stl_copy = root.copyinput.hl;
      stl_copy.forEach((element) => {
        $(slc_copy).css(element.key, element.val);
      });
    } else {
      let slc = root.input.selecter;
      let stl = root.input.nohl;
      stl.forEach((element) => {
        $(slc).css(element.key, element.val);
      });
    }
  },
  setScroll: function () {
    var allScrollClasses = ["theme-dark-scroll", "theme-blue-scroll", "theme-pink-scroll", "theme-simple-scroll"];
    for (var i = 0; i < allScrollClasses.length; i++) {
      $("body").removeClass(allScrollClasses[i]);
      $("#wrap_output").removeClass(allScrollClasses[i]);
      $(".twins").removeClass(allScrollClasses[i]);
    }
    if (theme.currentTheme != "default") {
      var cls = "theme-" + theme.currentTheme + "-scroll";
      $("body").addClass(cls);
      $("#wrap_output").addClass(cls);
      $(".twins").addClass(cls);
    }
  },
  setButton: function () {
    var allFillCls = ["theme-dark-button", "theme-blue-button", "theme-pink-button", "theme-simple-button"];
    var allOutlineCls = ["theme-dark-outline-button", "theme-blue-outline-button", "theme-pink-outline-button", "theme-simple-outline-button"];
    for (var i = 0; i < allFillCls.length; i++) {
      $(".theme-fill").removeClass(allFillCls[i]);
      $(".theme-block").removeClass(allFillCls[i]);
      $(".theme-outline").removeClass(allOutlineCls[i]);
    }
    if (theme.currentTheme != "default") {
      var cls1 = "theme-" + theme.currentTheme + "-button";
      $(".theme-fill").addClass(cls1).removeClass("btn-light");
      var cls2 = "theme-" + theme.currentTheme + "-outline-button";
      $(".theme-outline").addClass(cls2).removeClass("btn-outline-primary");
      $(".theme-block").addClass(cls1).removeClass("btn-light");
    } else {
      $(".theme-fill").addClass("btn-light");
      $(".theme-outline").addClass("btn-outline-primary");
      $(".theme-block").addClass("btn-light");
    }
  },
  setMathJax: function () {
    let root = theme.map_theme[theme.currentTheme].special.mathjax;
    let slctr = root.selecter;
    let stl = root.style[0];
    setTimeout(function () {
      $(slctr).css(stl.key, stl.val);
    }, 0);
  },
};
