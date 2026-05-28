# 玄武岩构造环境判别系统 V2

这是一个纯前端 Vue 3 + Element Plus 项目，推理部分改为浏览器端 ONNX Runtime Web，不再依赖后端服务。

## 运行

```bash
npm install
npm run dev
```

## 部署到 GitHub Pages

1. 先把 PyTorch 权重 `Full_Model_(ViT+Transformer)_best_seed.pth` 导出成 ONNX。
2. 把导出的模型放到 `public/model/model.onnx`。
3. 确认 `public/model/saved_quantiles.json` 仍然存在。
4. 执行：

```bash
npm run build
```

5. 将 `dist` 目录发布到 GitHub Pages。

## 说明

- 上传支持 CSV / XLSX。
- 前端会先做特征提取和分位数归一化。
- 推理在浏览器中完成，不需要 FastAPI 或 PyTorch 后端。
- 如果 `model.onnx` 缺失，页面仍可打开，但预测会提示模型未加载。
