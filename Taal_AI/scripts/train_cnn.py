import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "../cnn_data")
MODEL_FILE = os.path.join(SCRIPT_DIR, "../cnn_data/taal_cnn_model.keras")

def main():
    print("Loading Data...")
    X = np.load(os.path.join(DATA_DIR, 'X_data.npy'))
    y = np.load(os.path.join(DATA_DIR, 'y_labels.npy'))
    classes = np.load(os.path.join(DATA_DIR, 'classes.npy'), allow_pickle=True)

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Training: {len(X_train)} | Validation: {len(X_val)}")

    # THE BULLETPROOF ARCHITECTURE
    model = models.Sequential([
        layers.Input(shape=(X.shape[1], X.shape[2], 1)),
        
        layers.Conv2D(32, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 3)), # Shrinks height by 2, time by 3

        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 3)),

        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 3)),

        # Flatten perfectly preserves the sequence of the timeline
        layers.Flatten(),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.5), 
        layers.Dense(len(classes), activation='softmax')
    ])

    # Slow down the learning rate so it doesn't panic
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.0005)
    model.compile(optimizer=optimizer, loss='sparse_categorical_crossentropy', metrics=['accuracy'])

    class_weights = compute_class_weight(class_weight='balanced', classes=np.unique(y_train), y=y_train)
    class_weight_dict = dict(enumerate(class_weights))
    
    early_stop = callbacks.EarlyStopping(monitor='val_accuracy', patience=6, restore_best_weights=True)
    
    print("\nTraining...")
    model.fit(
        X_train, y_train,
        epochs=30,
        batch_size=16,
        validation_data=(X_val, y_val),
        callbacks=[early_stop],
        class_weight=class_weight_dict
    )

    model.save(MODEL_FILE)
    print(f"\n✅ Model Saved to: {MODEL_FILE}")

if __name__ == "__main__":
    main()