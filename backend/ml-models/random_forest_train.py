# random_forest_train.py

# 1. Import libraries
import pandas as pd
import glob
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import matplotlib.pyplot as plt
import joblib
import numpy as np

# 2. Load all CSVs and combine
csv_files = glob.glob("data/datasets/*.csv")  # adjust path if needed
df_list = [pd.read_csv(f) for f in csv_files]
df = pd.concat(df_list, ignore_index=True)

# 3. Select features and target
feature_cols = [
    'Year',
    'Rainfall (mm)',
    'Tmax (°C)',
    'Tmin (°C)',
    'Humidity (%)',
    'Sunshine Hours (hrs/day)',
    'Soil Moisture (%)',
    'Soil pH',
    'Nitrogen (N kg/ha)',
    'Phosphorus (P kg/ha)',
    'Potassium (K kg/ha)',
    'Fertilizer Used (kg/ha)',
    'Rice Variety',
    'Pest Incidence (%)'
]

X = df[feature_cols]
y = df['Rice Yield (tons/ha)']

# 4. Encode categorical column
X = pd.get_dummies(X, columns=['Rice Variety'], drop_first=True)

# 5. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 6. Train Random Forest
rf = RandomForestRegressor(n_estimators=200, random_state=42)
rf.fit(X_train, y_train)

# 7. Predict & Evaluate
rf_preds = rf.predict(X_test)
print("Random Forest Evaluation:")
print("MAE:", mean_absolute_error(y_test, rf_preds))
print("MSE:", mean_squared_error(y_test, rf_preds))
rmse = np.sqrt(mean_squared_error(y_test, rf_preds))
print("RMSE:", rmse)
print("R2:", r2_score(y_test, rf_preds))

# 8. Feature importance plot
importances = rf.feature_importances_
feature_names = X.columns

plt.figure(figsize=(10,6))
plt.barh(feature_names, importances)
plt.xlabel("Feature Importance")
plt.title("Random Forest Feature Importance")
plt.tight_layout()
plt.show()

# 9. Save trained model
joblib.dump(rf, "random_forest_model.pkl")
print("Random Forest model saved as 'random_forest_model.pkl'")

from sklearn.linear_model import LinearRegression
import joblib

# 1. Create your model
model = LinearRegression()

# 2. Fit/train your model
model.fit(X_train, y_train)

# 3. NOW you can save it
joblib.dump(model, "model.pkl")
