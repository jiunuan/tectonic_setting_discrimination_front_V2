from __future__ import annotations

import json
import warnings
from pathlib import Path

import joblib
import numpy as np


MODEL_DIR = Path(r"E:\program\CNNtest\data_interpolation\models_light")
OUTPUT_DIR = Path(r"e:\program\vue\tectnoic_setting_discrimination_front_V2\public\model\light_missforest")


MODEL_FILES = [
    ("BACK-ARC_BASIN", Path(r"E:\program\CNNtest\data_interpolation\models_light\BACK-ARC_BASIN_light_missforest.joblib")),
    ("Continental_arc", Path(r"E:\program\CNNtest\data_interpolation\models_light\Continental_arc_light_missforest.joblib")),
    ("CONTINENTAL_FLOOD_BASALT", Path(r"E:\program\CNNtest\data_interpolation\models_light\CONTINENTAL_FLOOD_BASALT_light_missforest.joblib")),
    ("CONTINENTAL_RIFT", Path(r"E:\program\CNNtest\data_interpolation\models_light\CONTINENTAL_RIFT_light_missforest.joblib")),
    ("Intra-oceanic_arc", Path(r"E:\program\CNNtest\data_interpolation\models_light\Intra-oceanic_arc_light_missforest.joblib")),
    ("Island_arc", Path(r"E:\program\CNNtest\data_interpolation\models_light\Island_arc_light_missforest.joblib")),
    ("OCEAN_ISLAND", Path(r"E:\program\CNNtest\data_interpolation\models_light\OCEAN_ISLAND_light_missforest.joblib")),
    ("OCEANIC_PLATEAU", Path(r"E:\program\CNNtest\data_interpolation\models_light\OCEANIC_PLATEAU_light_missforest.joblib")),
    ("SPREADING_CENTER", Path(r"E:\program\CNNtest\data_interpolation\models_light\SPREADING_CENTER_light_missforest.joblib")),
]


def normalize_setting_key(label: str) -> str:
    return label.strip().replace(" ", "_").replace("-", "_").lower()


def round_list(values: np.ndarray) -> list[float]:
    return [round(float(value), 8) for value in values.tolist()]


def export_tree(tree) -> dict[str, list]:
    # 中文注释：只导出前端推理必须字段，减少浏览器加载体积。
    return {
        "children_left": tree.children_left.astype(int).tolist(),
        "children_right": tree.children_right.astype(int).tolist(),
        "feature": tree.feature.astype(int).tolist(),
        "threshold": round_list(tree.threshold),
        "value": round_list(tree.value.reshape(-1)),
    }


def export_forest_bundle(label: str, model_path: Path) -> dict:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        bundle = joblib.load(model_path)

    column_order = list(bundle["column_order"])
    scaler = bundle["scaler"]
    targets = {}

    for target_column, forest in bundle["imputers"].items():
        feature_columns = [column for column in column_order if column != target_column]
        targets[target_column] = {
            "feature_columns": feature_columns,
            "trees": [export_tree(estimator.tree_) for estimator in forest.estimators_],
        }

    return {
        "version": 1,
        "method": "light_missforest_by_setting_tree_json",
        "label": label,
        "key": normalize_setting_key(label),
        "source": str(model_path),
        "column_order": column_order,
        "scaler": {
            "mean": round_list(scaler.mean_),
            "scale": round_list(scaler.scale_),
        },
        "targets": targets,
    }


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {
        "version": 1,
        "method": "light_missforest_by_setting_tree_json",
        "source_dir": str(MODEL_DIR),
        "models": [],
    }

    for label, model_path in MODEL_FILES:
        output_name = f"{normalize_setting_key(label)}.json"
        output_path = OUTPUT_DIR / output_name
        print(f"[导出] {label} -> {output_path}")

        exported = export_forest_bundle(label, model_path)
        output_path.write_text(
            json.dumps(exported, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        manifest["models"].append({
            "label": label,
            "key": normalize_setting_key(label),
            "path": f"model/light_missforest/{output_name}",
            "size_bytes": output_path.stat().st_size,
        })

    manifest_path = OUTPUT_DIR / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"[完成] {manifest_path}")


if __name__ == "__main__":
    main()
