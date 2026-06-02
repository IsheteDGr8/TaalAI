import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix

# 1. Generate predictions from your validation data
# Assuming X_val is your validation spectrograms and y_val are the true labels
predictions = model.predict(X_val)
y_pred = np.argmax(predictions, axis=1)
y_true = np.argmax(y_val, axis=1) # If one-hot encoded

# 2. Define your Taal classes
class_names = ['Teentaal', 'Bhajani', 'Dadra']

# 3. Create and plot the matrix
cm = confusion_matrix(y_true, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='YlOrBr', 
            xticklabels=class_names, yticklabels=class_names)

plt.title('Validation Confusion Matrix', fontsize=16, fontweight='bold')
plt.ylabel('Actual Taal', fontsize=12)
plt.xlabel('Predicted Taal', fontsize=12)

# Save the image
plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')
plt.show()