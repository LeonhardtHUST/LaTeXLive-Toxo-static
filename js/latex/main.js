/**
 * @Copyright Copyright © 2022
 * @Createdon 2022-6-12
 * @Author Panda_YueTao
 * @Version 1.6.4
 * @Title 妈叔出品-LaTeX公式编辑器脚本
 */

import "../../css/rem.css";
import "../../css/style.css";
import "../../css/navbar.css";
import "../../css/checkbox.css";
import "../../css/radiobutton.css";
import "../../css/latex.css";
import "../../css/abouttheme.css";
import "../../css/footer.css";

import { action } from "./action.js";
import { autocomplete } from "./autocomplete.js";
import { common } from "./common.js";
import { Eject } from "../common/eject.js";
import { element } from "./element.js";
import { flat } from "./flat.js";
import { highlight } from "./highlight.js";
import { immediate } from "./immediate.js";
import { input } from "./input.js";
import { mapjson } from "./mapjson.js";
import { mathjaxCore } from "./mathjaxCore.js";
import { mathpix } from "./mathpix.js";
import { texoOCR } from "./texo-ocr.js";
import { output } from "./output.js";
import { setting } from "./setting.js";
import { shareurl } from "./shareurl.js";
import { shortcut } from "./shortcut.js";
import { theme } from "./theme.js";
import { wechatimg } from "./wechatimg.js";
import { navbar } from "../common/navbar.js";
import { api } from "../common/api.js";
import { LoginVerify } from "../login/verify.js";
import { LoadComplete } from "../common/item.js";
import { notify } from "../common/notify.js";

class NavBarOption {
  constructor() {
    NavBarOption.prototype.obj_api = api;
    NavBarOption.prototype.pageType = "home";
  }
}

class ApiOption {
  constructor() {
    ApiOption.prototype.path_api = Config[Environment].WebAPI;
  }
}

class VerifyOption {
  constructor() {
    VerifyOption.prototype.obj_api = api;
  }
}

class GolbalOption {
  constructor() {
    GolbalOption.prototype.const_boot = Config[Environment].Boot_OSS;
    GolbalOption.prototype.const_hostName = Config[Environment].Hostname;
    GolbalOption.prototype.obj_autocomplete = autocomplete;
    GolbalOption.prototype.obj_common = common;
    GolbalOption.prototype.obj_eject = new Eject();
    GolbalOption.prototype.obj_element = element;
    GolbalOption.prototype.obj_flat = flat;
    GolbalOption.prototype.obj_highlight = highlight;
    GolbalOption.prototype.obj_input = input;
    GolbalOption.prototype.obj_mathjaxCore = mathjaxCore;
    GolbalOption.prototype.obj_mathpix = mathpix;
    GolbalOption.prototype.obj_output = output;
    GolbalOption.prototype.obj_setting = setting;
    GolbalOption.prototype.obj_theme = theme;
    GolbalOption.prototype.obj_api = api;
    GolbalOption.prototype.fn_refresh = function () {
      highlight.textareaToDiv();
      output.render();
      theme.setMathJax();
    };
  }
}

var navbar_opt = new NavBarOption();
var api_opt = new ApiOption();
var verify_opt = new VerifyOption();
var latex_opt = new GolbalOption();

var init_latex = function (opt) {
  mapjson.init(opt).then(function (data) {
    GolbalOption.prototype.map_all = data;
    setting.init(opt);
    theme.init(opt);
    input.init(opt);
    shortcut.init(opt);
    mathpix.init(opt);
    // Start loading the Texo OCR model with progress bar
    var boot = Config[Environment].Boot_OSS;
    var basePath = boot === '..' ? '' : boot;
    var fullBase = window.location.origin + basePath;

    // ── Create progress bar (fixed to viewport bottom) ──
    var ocrBar = document.createElement('div');
    ocrBar.id = 'ocr-download-bar';
    ocrBar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;height:28px;background:#e9ecef;z-index:9999;display:flex;align-items:center;box-shadow:0 -2px 8px rgba(0,0,0,0.15);';
    var ocrFill = document.createElement('div');
    ocrFill.style.cssText = 'height:100%;width:0;background:#007bff;transition:width 0.3s ease;position:absolute;left:0;top:0;';
    var ocrText = document.createElement('span');
    ocrText.style.cssText = 'position:relative;z-index:1;margin:0 auto;font-size:13px;color:#333;font-family:-apple-system,BlinkMacSystemFont,sans-serif;white-space:nowrap;';
    ocrText.textContent = '正在下载OCR模型... 0%';
    ocrBar.appendChild(ocrFill);
    ocrBar.appendChild(ocrText);
    document.body.appendChild(ocrBar);

    // ── Disable image recognition button ──
    var mathpixBtn = document.getElementById('a_shortcut_mathpix');
    if (mathpixBtn) {
      mathpixBtn.style.color = '#999';
      mathpixBtn.style.cursor = 'not-allowed';
      mathpixBtn.style.pointerEvents = 'none';
    }

    // ── Track download progress across all files ──
    var ocrFileStats = {};
    texoOCR.onProgress = function (data) {
      if (data.file) {
        ocrFileStats[data.file] = { loaded: data.loaded || 0, total: data.total || 0 };
      }
      var totalLoaded = 0, totalSize = 0;
      for (var k in ocrFileStats) {
        totalLoaded += ocrFileStats[k].loaded;
        totalSize += ocrFileStats[k].total;
      }
      var pct = totalSize > 0 ? Math.min(100, Math.round(totalLoaded / totalSize * 100)) : 0;
      ocrFill.style.width = pct + '%';
      ocrText.textContent = '正在下载OCR模型... ' + pct + '%' +
        (totalSize > 0 ? ' (' + (totalLoaded / 1048576).toFixed(1) + ' / ' + (totalSize / 1048576).toFixed(1) + ' MB)' : '');
    };

    texoOCR.init(fullBase).then(function () {
      // Success — flash green and fade out
      ocrFill.style.background = '#28a745';
      ocrText.textContent = 'OCR模型就绪';
      if (mathpixBtn) {
        mathpixBtn.style.color = '';
        mathpixBtn.style.cursor = '';
        mathpixBtn.style.pointerEvents = '';
      }
      setTimeout(function () {
        ocrBar.style.transition = 'opacity 0.5s ease';
        ocrBar.style.opacity = '0';
        setTimeout(function () {
          if (ocrBar.parentNode) ocrBar.parentNode.removeChild(ocrBar);
        }, 500);
      }, 3000);
    }).catch(function (err) {
      console.log('Texo OCR model init failed:', err);
      ocrFill.style.background = '#dc3545';
      ocrText.textContent = 'OCR模型下载失败，请刷新页面重试';
      if (mathpixBtn) {
        mathpixBtn.style.color = '';
        mathpixBtn.style.cursor = '';
        mathpixBtn.style.pointerEvents = '';
      }
    });
    immediate.init(opt);
    action.init(opt);
    wechatimg.init(opt);
    highlight.init(opt);
    autocomplete.init(opt);
    flat.init(opt);
    common.init(opt);
    notify.init();
    mathjaxCore.init(opt).then(function () {
      output.init(opt);
      shareurl.init(opt);
      LoadComplete.closeLoadingMask();
    });
  });
};

$(function () {
  api.init(api_opt);
  navbar.init(navbar_opt);
  LoginVerify.init(verify_opt);
  LoginVerify.isLogined(false).then(
    function () {
      init_latex(latex_opt);
    },
    function () {
      init_latex(latex_opt);
    }
  );
});
