import pandas as pd
import numpy as np
import os
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

# Import Models
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression

# CONFIGURATION
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, "../features/dataset.csv")
MODEL_FILE = os.path.join(SCRIPT_DIR, "../features/taal_model.pkl")
VIS_DIR = os.path.join(SCRIPT_DIR, "../visualizations")

# Create visualizations folder if it doesn't exist
os.makedirs(VIS_DIR, exist_ok=True)

def main():
    if not os.path.exists(DATA_FILE):
        print(f"Error: Dataset not found at {DATA_FILE}")
        return

    print("Loading dataset...")
    df = pd.read_csv(DATA_FILE, encoding='utf-8')

    X = df.drop(["label", "filename"], axis=1)
    y = df["label"]
    feature_names = X.columns

    print(f"Training with {len(df)} samples...")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 1. Define the Models (Using class_weight='balanced' where possible)
    models = {
        "Random Forest": RandomForestClassifier(n_estimators=300, class_weight='balanced', random_state=42),
        "SVM": SVC(kernel='linear', probability=True, class_weight='balanced', random_state=42),
        "k-NN": KNeighborsClassifier(n_neighbors=5),
        "Gradient Boosting": GradientBoostingClassifier(random_state=42),
        "Logistic Regression": LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42)
    }

    results = []
    best_model_name = ""
    best_score = 0
    best_model = None

    print(f"\n{'MODEL NAME':<25} | {'ACCURACY':<10} | {'F1-SCORE':<10}")
    print("-" * 50)

    # 2. Train and Evaluate All Models
    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        
        acc = accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds, average='weighted')
        
        results.append({"Model": name, "F1-Score": f1, "Accuracy": acc})
        print(f"{name:<25} | {acc:.4f}     | {f1:.4f}")

        if f1 > best_score:
            best_score = f1
            best_model_name = name
            best_model = model

    print("-" * 50)
    print(f"🏆 WINNER: {best_model_name} (F1: {best_score:.4f})")

    # 3. Save the Best Model
    joblib.dump(best_model, MODEL_FILE)
    print(f"✅ Saved {best_model_name} to: {MODEL_FILE}")

    # ==========================================
    # VISUALIZATIONS
    # ==========================================
    print("\nGenerating visual reports...")
    sns.set_theme(style="whitegrid")

    # Plot 1: Model Comparison
    results_df = pd.DataFrame(results).sort_values(by="F1-Score", ascending=False)
    plt.figure(figsize=(10, 6))
    sns.barplot(x="F1-Score", y="Model", data=results_df, palette="viridis")
    plt.title("Model Comparison (F1-Score)", fontsize=16)
    plt.xlim(0, 1)
    plt.tight_layout()
    plt.savefig(os.path.join(VIS_DIR, "model_comparison.png"))
    plt.close()

    # Plot 2: Confusion Matrix for the Winner
    final_preds = best_model.predict(X_test)
    cm = confusion_matrix(y_test, final_preds, labels=best_model.classes_)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=best_model.classes_, 
                yticklabels=best_model.classes_)
    plt.title(f"Confusion Matrix ({best_model_name})", fontsize=16)
    plt.ylabel('Actual Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(os.path.join(VIS_DIR, "confusion_matrix.png"))
    plt.close()

    # Plot 3: Feature Importance (If the winner is a tree-based model)
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
        feat_df = pd.DataFrame({"Feature": feature_names, "Importance": importances})
        feat_df = feat_df.sort_values(by="Importance", ascending=False).head(10) # Top 10

        plt.figure(figsize=(10, 6))
        sns.barplot(x="Importance", y="Feature", data=feat_df, palette="magma")
        plt.title(f"Top 10 Feature Importances ({best_model_name})", fontsize=16)
        plt.tight_layout()
        plt.savefig(os.path.join(VIS_DIR, "feature_importance.png"))
        plt.close()

    print(f"📊 Visualizations saved to the '{VIS_DIR}' folder!")

if __name__ == "__main__":
    main()