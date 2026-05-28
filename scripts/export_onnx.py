import os
from pathlib import Path

import onnx
import torch
import torch.nn as nn

os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['PYTHONUTF8'] = '1'


MODEL_PATH = Path(r"E:\program\vue\tectnoic_setting_discrimination_front_V2\Full_Model_(ViT+Transformer)_best_seed.pth")
OUTPUT_PATH = Path(r"E:\program\vue\tectnoic_setting_discrimination_front_V2\public\model\model.onnx")

NUM_CLASSES = 9
INPUT_SIZE = 6
PATCH_SIZE = 2
EMBED_DIM = 96
NUM_HEADS = 8
TRANSFORMER_LAYERS = 2
FF_DIM = 192
DROPOUT = 0.1


class PatchEmbedding(nn.Module):
    def __init__(self, in_channels: int, patch_size: int, embed_dim: int, num_patches: int) -> None:
        super().__init__()
        self.proj = nn.Conv2d(in_channels, embed_dim, kernel_size=patch_size, stride=patch_size)
        self.pos_embed = nn.Parameter(torch.randn(1, num_patches, embed_dim) * 0.02)

    def forward(self, x):
        x = self.proj(x)
        x = x.flatten(2).transpose(1, 2)
        return x + self.pos_embed


class TransformerBlock(nn.Module):
    def __init__(self, embed_dim: int, num_heads: int, ff_dim: int, dropout: float = 0.1) -> None:
        super().__init__()
        self.attention = nn.MultiheadAttention(embed_dim, num_heads, dropout=dropout, batch_first=True)
        self.ffn = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ff_dim, embed_dim),
            nn.Dropout(dropout),
        )
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        attn_out, _ = self.attention(x, x, x)
        x = self.norm1(x + self.dropout(attn_out))
        x = self.norm2(x + self.ffn(x))
        return x


class ViTTransformerDualStream(nn.Module):
    def __init__(
        self,
        num_classes: int,
        input_size: int = 6,
        patch_size: int = 2,
        embed_dim: int = 96,
        num_heads: int = 8,
        transformer_layers: int = 2,
        ff_dim: int = 192,
        dropout: float = 0.1,
    ) -> None:
        super().__init__()
        self.num_patches = (input_size // patch_size) ** 2
        self.seq_len = input_size * input_size

        # 中文注释：图像分支
        self.patch_embed = PatchEmbedding(1, patch_size, embed_dim, self.num_patches)
        self.vit_cls = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.vit_cls_pos = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.vit_blocks = nn.ModuleList([
            TransformerBlock(embed_dim, num_heads, ff_dim, dropout)
            for _ in range(transformer_layers)
        ])
        self.vit_norm = nn.LayerNorm(embed_dim)

        # 中文注释：序列分支
        self.seq_proj = nn.Linear(1, embed_dim)
        self.seq_norm = nn.LayerNorm(embed_dim)
        self.seq_cls = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.seq_pos_embed = nn.Parameter(torch.randn(1, self.seq_len + 1, embed_dim) * 0.02)
        self.seq_blocks = nn.ModuleList([
            TransformerBlock(embed_dim, num_heads, ff_dim, dropout)
            for _ in range(transformer_layers)
        ])
        self.seq_final_norm = nn.LayerNorm(embed_dim)

        # 中文注释：融合分类头
        self.fusion = nn.Sequential(
            nn.Linear(embed_dim * 4, 192),
            nn.LayerNorm(192),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(192, 96),
            nn.LayerNorm(96),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(96, num_classes),
        )

        self._init_weights()

    def _init_weights(self) -> None:
        nn.init.trunc_normal_(self.vit_cls, std=0.02)
        nn.init.trunc_normal_(self.seq_cls, std=0.02)
        nn.init.trunc_normal_(self.vit_cls_pos, std=0.02)
        for module in self.modules():
            if isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight)
                if module.bias is not None:
                    nn.init.zeros_(module.bias)

    def forward(self, x, x_seq):
        batch_size = x.size(0)

        vit_tokens = self.patch_embed(x)
        vit_cls = self.vit_cls.expand(batch_size, -1, -1) + self.vit_cls_pos
        vit_tokens = torch.cat([vit_cls, vit_tokens], dim=1)
        for block in self.vit_blocks:
            vit_tokens = block(vit_tokens)
        vit_tokens = self.vit_norm(vit_tokens)
        vit_cls_out = vit_tokens[:, 0]
        vit_gap_out = vit_tokens[:, 1:].mean(dim=1)

        seq_tokens = self.seq_norm(self.seq_proj(x_seq))
        seq_cls = self.seq_cls.expand(batch_size, -1, -1)
        seq_tokens = torch.cat([seq_cls, seq_tokens], dim=1)
        seq_tokens = seq_tokens + self.seq_pos_embed
        for block in self.seq_blocks:
            seq_tokens = block(seq_tokens)
        seq_tokens = self.seq_final_norm(seq_tokens)
        seq_cls_out = seq_tokens[:, 0]
        seq_gap_out = seq_tokens[:, 1:].mean(dim=1)

        fused = torch.cat([vit_cls_out, vit_gap_out, seq_cls_out, seq_gap_out], dim=1)
        return self.fusion(fused)


def main() -> None:
    if not MODEL_PATH.exists():
      raise FileNotFoundError(f"找不到权重文件: {MODEL_PATH}")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # 中文注释：先按原始训练结构初始化模型，再加载 pth 权重
    model = ViTTransformerDualStream(
        num_classes=NUM_CLASSES,
        input_size=INPUT_SIZE,
        patch_size=PATCH_SIZE,
        embed_dim=EMBED_DIM,
        num_heads=NUM_HEADS,
        transformer_layers=TRANSFORMER_LAYERS,
        ff_dim=FF_DIM,
        dropout=DROPOUT,
    )

    state_dict = torch.load(MODEL_PATH, map_location='cpu')
    if isinstance(state_dict, dict) and 'state_dict' in state_dict:
        state_dict = state_dict['state_dict']
    if isinstance(state_dict, dict) and 'model_state_dict' in state_dict:
        state_dict = state_dict['model_state_dict']
    state_dict = {key.replace('module.', ''): value for key, value in state_dict.items()}

    model.load_state_dict(state_dict, strict=True)
    model.eval()

    # 中文注释：导出时使用和前端一致的双输入形状
    image_input = torch.randn(1, 1, 6, 6)
    sequence_input = torch.randn(1, 36, 1)

    torch.onnx.export(
        model,
        (image_input, sequence_input),
        OUTPUT_PATH,
        input_names=['image', 'sequence'],
        output_names=['logits'],
        opset_version=17,
        dynamo=False,
        dynamic_axes={
            'image': {0: 'batch'},
            'sequence': {0: 'batch'},
            'logits': {0: 'batch'},
        },
        do_constant_folding=True,
    )

    onnx_model = onnx.load(OUTPUT_PATH)
    onnx.checker.check_model(onnx_model)
    print(f'ONNX 导出成功: {OUTPUT_PATH}')


if __name__ == '__main__':
    main()
