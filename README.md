# LaTeXLive - 在线 LaTeX 公式编辑器

## 原作者

本项目基于 [PandaHero（熊猫大侠）](https://github.com/PandaHero) 开发的「[妈叔出品 - 在线 LaTeX 公式编辑器](https://www.latexlive.com)」，原版权归属 **妈咪说（北京）科技传媒有限公司**。

> 作者邮箱：yuetao_1011@outlook.com  
> 原版本号：1.6.5

## 项目简介

一个功能丰富的在线 LaTeX 公式编辑器，基于 MathJax 实现即时渲染。

主要功能：
- 图像公式识别（Mathpix / ONNX 本地识别）
- 支持导出 SVG、PNG、JPG、MathML、SVGCode
- 支持 physics、mhchem、unicode 等常用扩展宏包
- 所见即所得的实时编辑体验

## 我们的更新

- 适配本地化部署，调整了资源路径和构建配置
- 集成 ONNX 本地公式识别模型，减少对第三方 API 的依赖
- 优化前端构建流程，产出可直接部署的静态资源

## 关于本仓库

本仓库（`static` 分支）存放的是 **构建后的静态文件**，可直接部署到任意静态文件服务器或 CDN。源码构建流程请参考主仓库。

目录结构：
- `index.html` — 编辑器页面
- `readme.html` — 帮助文档页面
- `publish/` — Webpack 打包后的 bundle 文件
- `css/` — 样式文件
- `js/` — 未打包的公共脚本及模块源码（仅供参考）
- `img/` — 图片资源
- `models/` — ONNX 公式识别模型文件（Git LFS 管理）
- `lib/` — 第三方库
