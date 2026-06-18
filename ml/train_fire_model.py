#!/usr/bin/env python3
"""
Train a forest-fire-risk classifier on the Algerian Forest Fires Dataset
(as featured on Kaggle; ODC Public Domain). Predicts fire / not-fire from
weather. Pure-Python logistic regression — no external dependencies — exporting
weights to JSON for in-browser inference (TensorFlow.js-free, tiny payload).

Usage:
    python3 ml/train_fire_model.py /path/to/algerian.csv

Writes: public/model/fire_model.json
"""
import csv, json, math, random, sys, os

random.seed(42)

FEATURES = ["Temperature", "RH", "Ws", "Rain"]  # intuitive inputs for UI sliders
FEATURE_IDX = [3, 4, 5, 6]                        # columns in the source CSV


def load(path):
    X, y = [], []
    with open(path, newline="", encoding="utf-8", errors="ignore") as f:
        for row in csv.reader(f):
            if len(row) != 14:
                continue
            try:
                feats = [float(row[i]) for i in FEATURE_IDX]
            except ValueError:
                continue  # header / region-title / malformed lines
            label = 0 if "not" in row[13].strip().lower() else 1
            X.append(feats)
            y.append(label)
    return X, y


def standardize(X, mean, std):
    return [[(v - mean[j]) / std[j] for j, v in enumerate(row)] for row in X]


def sigmoid(z):
    if z < -60: return 0.0
    if z > 60: return 1.0
    return 1.0 / (1.0 + math.exp(-z))


def train(X, y, epochs=4000, lr=0.1, l2=1e-3):
    n, d = len(X), len(X[0])
    w = [0.0] * d
    b = 0.0
    for _ in range(epochs):
        gw = [0.0] * d
        gb = 0.0
        for i in range(n):
            p = sigmoid(sum(w[j] * X[i][j] for j in range(d)) + b)
            err = p - y[i]
            for j in range(d):
                gw[j] += err * X[i][j]
            gb += err
        for j in range(d):
            w[j] -= lr * (gw[j] / n + l2 * w[j])
        b -= lr * (gb / n)
    return w, b


def accuracy(X, y, w, b):
    correct = 0
    for i in range(len(X)):
        p = sigmoid(sum(w[j] * X[i][j] for j in range(len(w))) + b)
        if (1 if p >= 0.5 else 0) == y[i]:
            correct += 1
    return correct / len(X)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "/tmp/algerian.csv"
    X, y = load(src)
    print(f"Loaded {len(X)} rows | fire={sum(y)} not-fire={len(y)-sum(y)}")

    # column mean/std for standardization (computed on all data)
    d = len(FEATURES)
    mean = [sum(r[j] for r in X) / len(X) for j in range(d)]
    std = [max(1e-6, (sum((r[j] - mean[j]) ** 2 for r in X) / len(X)) ** 0.5) for j in range(d)]

    # 80/20 split for honest accuracy
    idx = list(range(len(X)))
    random.shuffle(idx)
    cut = int(0.8 * len(idx))
    tr, te = idx[:cut], idx[cut:]
    Xs = standardize(X, mean, std)
    Xtr, ytr = [Xs[i] for i in tr], [y[i] for i in tr]
    Xte, yte = [Xs[i] for i in te], [y[i] for i in te]
    w, b = train(Xtr, ytr)
    test_acc = accuracy(Xte, yte, w, b)
    print(f"Held-out test accuracy: {test_acc:.3f}")

    # final model trained on ALL data for shipping
    wf, bf = train(Xs, y)
    train_acc = accuracy(Xs, y, wf, bf)
    print(f"Full-data accuracy: {train_acc:.3f}")

    model = {
        "name": "Algerian Forest Fires — fire-risk logistic regression",
        "source": "Algerian Forest Fires Dataset (Kaggle / UCI, ODC Public Domain)",
        "features": FEATURES,
        "units": ["°C", "% RH", "km/h", "mm"],
        "mean": [round(m, 4) for m in mean],
        "std": [round(s, 4) for s in std],
        "weights": [round(v, 4) for v in wf],
        "bias": round(bf, 4),
        "test_accuracy": round(test_acc, 3),
        "n_samples": len(X),
    }
    out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "model")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, "fire_model.json")
    with open(out, "w") as f:
        json.dump(model, f, indent=2)
    print("Wrote", os.path.normpath(out))


if __name__ == "__main__":
    main()
