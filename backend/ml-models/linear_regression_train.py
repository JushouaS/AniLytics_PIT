import pandas as pd
import glob

# Load ALL CSV files from folder into one dataframe
csv_files = glob.glob("data/datasets/*.csv")   # ← ONLY THIS

if not csv_files:
    raise FileNotFoundError("No CSV files found in: data/datasets/")

dataframes = []

for file in csv_files:
    print(f"Loading: {file}")
    df = pd.read_csv(file)
    dataframes.append(df)

# Combine all CSVs into one big DataFrame
data = pd.concat(dataframes, ignore_index=True)

print("All CSVs loaded successfully!")
print(data.head())

df.info()
df.describe()
df.isnull().sum()

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
   
X = pd.get_dummies(X, columns=['Rice Variety'], drop_first=True)

from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
from sklearn.linear_model import LinearRegression

lr = LinearRegression()
lr.fit(X_train, y_train)

from sklearn.ensemble import RandomForestRegressor

rf = RandomForestRegressor(n_estimators=200, random_state=42)
rf.fit(X_train, y_train)

lr_preds = lr.predict(X_test)
rf_preds = rf.predict(X_test)

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

def evaluate(true, pred):
    print("MAE:", mean_absolute_error(true, pred))
    print("MSE:", mean_squared_error(true, pred))
    print("RMSE:", np.sqrt(mean_squared_error(true, pred)))
    print("R2:", r2_score(true, pred))

print("Linear Regression Results:")
evaluate(y_test, lr_preds)

print("\nRandom Forest Results:")
evaluate(y_test, rf_preds)

# Compare R²
print("Linear Regression R²:", r2_score(y_test, lr_preds))
print("Random Forest R²:", r2_score(y_test, rf_preds))

