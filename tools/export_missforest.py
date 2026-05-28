"""
Export light MissForest models (.joblib) to compact JSON for browser inference.
Run with Anaconda Python (sklearn >= 1.5):
  D:\Program File\anaconda\python.exe tools/export_missforest.py
"""

import json
import os
import warnings

warnings.filterwarnings("ignore")

import joblib
import numpy as np

MODELS_DIR = r"E:\program\CNNtest\data_interpolation\models_light"
OUTPUT_DIR = r"e:\program\vue\tectnoic_setting_discrimination_front_V2\public\model\missforest"

# Map from model filename stem to the tectonic label used by the CNN classifier
MODEL_FILE_TO_LABEL = {
    "BACK-ARC_BASIN_light_missforest": "BACK-ARC_BASIN",
    "Continental_arc_light_missforest": "Continental_arc",
    "CONTINENTAL_FLOOD_BASALT_light_missforest": "CONTINENTAL_FLOOD_BASALT",
    "CONTINENTAL_RIFT_light_missforest": "CONTINENTAL_RIFT",
    "Intra-oceanic_arc_light_missforest": "Intra-oceanic_arc",
    "Island_arc_light_missforest": "Island_arc",
    "OCEAN_ISLAND_light_missforest": "OCEAN_ISLAND",
    "OCEANIC_PLATEAU_light_missforest": "OCEANIC_PLATEAU",
    "SPREADING_CENTER_light_missforest": "SPREADING_CENTER",
}

os.makedirs(OUTPUT_DIR, exist_ok=True)


def export_tree(estimator):
    tree = estimator.tree_
    # Only store the 5 arrays needed for inference, rounded to float32 precision
    return {
        "f": tree.feature.tolist(),               # split feature index (-2 = leaf)
        "t": [round(float(v), 7) for v in tree.threshold],  # split threshold
        "l": tree.children_left.tolist(),          # left child (-1 = leaf)
        "r": tree.children_right.tolist(),         # right child (-1 = leaf)
        "v": [round(float(v[0][0]), 7) for v in tree.value],  # node value
    }


def export_model(joblib_path, out_path):
    model = joblib.load(joblib_path)
    column_order = model["column_order"]
    scaler = model["scaler"]

    imputers_json = []
    for col in column_order:
        rf = model["imputers"][col]
        trees = [export_tree(est) for est in rf.estimators_]
        imputers_json.append({"trees": trees})

    payload = {
        "column_order": column_order,
        "scaler_mean": [round(float(v), 7) for v in scaler.mean_],
        "scaler_scale": [round(float(v), 7) for v in scaler.scale_],
        "imputers": imputers_json,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        # compact separators to minimize file size
        json.dump(payload, f, separators=(",", ":"))

    size_mb = os.path.getsize(out_path) / 1024 / 1024
    print(f"  -> {out_path} ({size_mb:.2f} MB)")


def main():
    for fname in os.listdir(MODELS_DIR):
        if not fname.endswith(".joblib"):
            continue
        stem = fname[:-7]  # strip .joblib
        if stem not in MODEL_FILE_TO_LABEL:
            print(f"Skipping unknown: {fname}")
            continue
        label = MODEL_FILE_TO_LABEL[stem]
        src = os.path.join(MODELS_DIR, fname)
        dst = os.path.join(OUTPUT_DIR, label + ".json")
        print(f"Exporting {label} ...")
        export_model(src, dst)

    print("\nDone. All models exported to:", OUTPUT_DIR)


if __name__ == "__main__":
    main()
