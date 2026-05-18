/**
 * @Copyright Copyright © 2021
 * @Createdon 2022-5-26
 * @Author Panda_YueTao
 * @Version 1.6.4
 * @Title 妈叔出品-LaTeX公式编辑器配置
 */

const Environment = (function() {
  var host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'development';
  }
  return 'release';
})();

const Config = {
  development: {
    Version: "" + new Date().getTime(),
    MainJS: {
      latex: "/publish/latex.bundle.min.js",
      readme: "/publish/readme.bundle.min.js",
    },
    Boot_OSS: "..",
    WebAPI: {
      Root: "",
      Controller: {
        GetLaTexFromMathPix: "Mathpix/GetLaTexFromMathPix",
        LoginByMyToken: "Client/LoginByMyToken",
        LoginByAccount: "Client/LoginByAccount",
        RegByAccount: "Client/RegByAccount",
        UpdateUser: "Client/UpdateUser",
        DeleteUser: "Client/DeleteUser",
        LoginByWX: "Client/LoginByWX",
        WXBind: "Client/WXBind",
        LoginByMessage: "Client/LoginByMessage",
        SendMessageCode_Identity: "Client/SendMessageCode_Identity",
        SendMessageCode_Login: "Client/SendMessageCode_Login",
        GetRemainTime: "Client/GetRemainTime",
      },
    },
    Hostname: "",
    WXLogin: {
      AppID: "",
      RedirectURL: "",
    },
  },

  debug: {
    Version: "" + new Date().getTime(),
    MainJS: {
      latex: "/publish/latex.bundle.min.js",
      readme: "/publish/readme.bundle.min.js",
    },
    Boot_OSS: "",
    WebAPI: {
      Root: "",
      Controller: {
        GetLaTexFromMathPix: "Mathpix/GetLaTexFromMathPix",
        LoginByMyToken: "Client/LoginByMyToken",
        LoginByAccount: "Client/LoginByAccount",
        RegByAccount: "Client/RegByAccount",
        UpdateUser: "Client/UpdateUser",
        DeleteUser: "Client/DeleteUser",
        LoginByWX: "Client/LoginByWX",
        WXBind: "Client/WXBind",
        LoginByMessage: "Client/LoginByMessage",
        SendMessageCode_Identity: "Client/SendMessageCode_Identity",
        SendMessageCode_Login: "Client/SendMessageCode_Login",
        GetRemainTime: "Client/GetRemainTime",
      },
    },
    Hostname: "",
    WXLogin: {
      AppID: "",
      RedirectURL: "",
    },
  },
  
  release: {
    Version: "1.6.5",
    MainJS: {
      latex: "/publish/latex.bundle.min.js",
      readme: "/publish/readme.bundle.min.js",
    },
    Boot_OSS: "/LaTeXLive",
    WebAPI: {
      Root: "",
      Controller: {
        GetLaTexFromMathPix: "Mathpix/GetLaTexFromMathPix",
        LoginByMyToken: "Client/LoginByMyToken",
        LoginByAccount: "Client/LoginByAccount",
        RegByAccount: "Client/RegByAccount",
        UpdateUser: "Client/UpdateUser",
        DeleteUser: "Client/DeleteUser",
        LoginByWX: "Client/LoginByWX",
        WXBind: "Client/WXBind",
        LoginByMessage: "Client/LoginByMessage",
        SendMessageCode_Identity: "Client/SendMessageCode_Identity",
        SendMessageCode_Login: "Client/SendMessageCode_Login",
        GetRemainTime: "Client/GetRemainTime",
      },
    },
    Hostname: "",
    WXLogin: {
      AppID: "",
      RedirectURL: "",
    },
  },
};
