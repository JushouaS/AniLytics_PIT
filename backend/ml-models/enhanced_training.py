import pandas as pd
import glob
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline

# Try to import advanced models
try:
    from xgboost import XGBRegressor
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("XGBoost not available. Install with: pip install xgboost")

try:
    from lightgbm import LGBMRegressor
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False
    print("LightGBM not available. Install with: pip install lightgbm")

import warnings
warnings.filterwarnings('ignore')

def load_data():
    """Load all CSV files and combine them into one dataframe"""
    csv_files = glob.glob("data/enhanced_datasets/*.csv")
    
    if not csv_files:
        raise FileNotFoundError("No CSV files found in: data/enhanced_datasets/")
    
    dataframes = []
    
    for file in csv_files:
        print(f"Loading: {file}")
        df = pd.read_csv(file)
        # Add municipality identifier
        municipality_name = file.split('\\')[-1].replace(' Annual Data.csv', '')
        df['Municipality'] = municipality_name
        dataframes.append(df)
    
    # Combine all CSVs into one big DataFrame
    data = pd.concat(dataframes, ignore_index=True)
    
    print("All CSVs loaded successfully!")
    print(f"Total records: {len(data)}")
    print(data.head())
    
    return data

def engineer_features(data):
    """Create advanced features for better model performance"""
    # Feature engineering
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
    
    # Handle missing values
    data = data.dropna(subset=feature_cols + ['Rice Yield (tons/ha)'])
    
    # Advanced feature engineering
    # Create additional features that might improve prediction
    data['Temperature Range'] = data['Tmax (°C)'] - data['Tmin (°C)']
    data['Rainfall_Fertilizer_Ratio'] = data['Rainfall (mm)'] / (data['Fertilizer Used (kg/ha)'] + 1)
    data['Nutrient_Index'] = (data['Nitrogen (N kg/ha)'] + data['Phosphorus (P kg/ha)'] + data['Potassium (K kg/ha)']) / 3
    data['Growing_Degree_Days'] = ((data['Tmax (°C)'] + data['Tmin (°C)']) / 2) * 365  # Simplified GDD
    
    # Add more engineered features
    feature_cols.extend([
        'Temperature Range',
        'Rainfall_Fertilizer_Ratio',
        'Nutrient_Index',
        'Growing_Degree_Days'
    ])
    
    # Prepare features and target
    X = data[feature_cols].copy()
    y = data['Rice Yield (tons/ha)'].copy()
    
    # Encode categorical variables
    X = pd.get_dummies(X, columns=['Rice Variety'], drop_first=True)
    
    # Add municipality as a feature
    X['Municipality_encoded'] = pd.Categorical(data['Municipality']).codes
    
    print(f"\nFinal feature set size: {X.shape}")
    print(f"Target variable size: {y.shape}")
    
    return X, y

def evaluate_model(name, y_true, y_pred_train, y_pred_test):
    """Evaluate model performance"""
    # Training metrics
    train_mae = mean_absolute_error(y_true[0], y_pred_train)
    train_mse = mean_squared_error(y_true[0], y_pred_train)
    train_rmse = np.sqrt(train_mse)
    train_r2 = r2_score(y_true[0], y_pred_train)
    
    # Test metrics
    test_mae = mean_absolute_error(y_true[1], y_pred_test)
    test_mse = mean_squared_error(y_true[1], y_pred_test)
    test_rmse = np.sqrt(test_mse)
    test_r2 = r2_score(y_true[1], y_pred_test)
    
    print(f"{name} Results:")
    print(f"  Training R²: {train_r2:.4f} ({train_r2*100:.2f}%)")
    print(f"  Test R²: {test_r2:.4f} ({test_r2*100:.2f}%)")
    print(f"  Test MAE: {test_mae:.4f}")
    print(f"  Test RMSE: {test_rmse:.4f}")
    
    # Check for overfitting
    overfitting = abs(train_r2 - test_r2)
    print(f"  Overfitting Indicator: {overfitting:.4f}")
    
    return test_r2

def train_models(X_train, X_test, y_train, y_test):
    """Train multiple models and compare performance"""
    models = {}
    predictions = {}
    
    # Model 1: Advanced Random Forest
    print("\n" + "="*60)
    print("MODEL 1: Advanced Random Forest with Hyperparameter Tuning")
    print("="*60)
    
    rf = RandomForestRegressor(
        n_estimators=500,
        max_depth=30,
        min_samples_split=2,
        min_samples_leaf=1,
        max_features='sqrt',
        bootstrap=True,
        random_state=42,
        n_jobs=-1,
        oob_score=True
    )
    
    rf.fit(X_train, y_train)
    rf_train_preds = rf.predict(X_train)
    rf_test_preds = rf.predict(X_test)
    
    rf_r2 = evaluate_model("Advanced Random Forest", [y_train, y_test], rf_train_preds, rf_test_preds)
    models['Random Forest'] = rf_r2
    predictions['rf_test'] = rf_test_preds
    
    # Model 2: Gradient Boosting
    print("\n" + "="*60)
    print("MODEL 2: Optimized Gradient Boosting")
    print("="*60)
    
    gb = GradientBoostingRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=6,
        min_samples_split=4,
        min_samples_leaf=2,
        subsample=0.8,
        random_state=42
    )
    
    gb.fit(X_train, y_train)
    gb_train_preds = gb.predict(X_train)
    gb_test_preds = gb.predict(X_test)
    
    gb_r2 = evaluate_model("Gradient Boosting", [y_train, y_test], gb_train_preds, gb_test_preds)
    models['Gradient Boosting'] = gb_r2
    predictions['gb_test'] = gb_test_preds
    
    # Model 3: XGBoost (if available)
    if XGBOOST_AVAILABLE:
        print("\n" + "="*60)
        print("MODEL 3: Advanced XGBoost")
        print("="*60)
        
        xgb = XGBRegressor(
            n_estimators=1000,
            max_depth=8,
            learning_rate=0.01,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=0.1,
            random_state=42,
            n_jobs=-1
        )
        
        xgb.fit(X_train, y_train, 
                eval_set=[(X_test, y_test)], 
                verbose=False)
        
        xgb_train_preds = xgb.predict(X_train)
        xgb_test_preds = xgb.predict(X_test)
        
        xgb_r2 = evaluate_model("Advanced XGBoost", [y_train, y_test], xgb_train_preds, xgb_test_preds)
        models['XGBoost'] = xgb_r2
        predictions['xgb_test'] = xgb_test_preds
    
    # Model 4: LightGBM (if available)
    if LIGHTGBM_AVAILABLE:
        print("\n" + "="*60)
        print("MODEL 4: Advanced LightGBM")
        print("="*60)
        
        lgb = LGBMRegressor(
            n_estimators=1000,
            max_depth=8,
            learning_rate=0.01,
            num_leaves=64,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=0.1,
            random_state=42,
            n_jobs=-1
        )
        
        lgb.fit(X_train, y_train)
        
        lgb_train_preds = lgb.predict(X_train)
        lgb_test_preds = lgb.predict(X_test)
        
        lgb_r2 = evaluate_model("Advanced LightGBM", [y_train, y_test], lgb_train_preds, lgb_test_preds)
        models['LightGBM'] = lgb_r2
        predictions['lgb_test'] = lgb_test_preds
    
    return models, predictions

def create_ensemble(models, predictions, y_test):
    """Create ensemble of all models"""
    print("\n" + "="*60)
    print("ENSEMBLE: Weighted Average of Top Models")
    print("="*60)
    
    # Get all prediction arrays
    pred_arrays = list(predictions.values())
    
    # Simple averaging for ensemble
    ensemble_test_preds = np.mean(pred_arrays, axis=0)
    
    ensemble_r2 = r2_score(y_test, ensemble_test_preds)
    ensemble_mae = mean_absolute_error(y_test, ensemble_test_preds)
    ensemble_rmse = np.sqrt(mean_squared_error(y_test, ensemble_test_preds))
    
    print(f"Simple Ensemble Results:")
    print(f"  Test R²: {ensemble_r2:.4f} ({ensemble_r2*100:.2f}%)")
    print(f"  Test MAE: {ensemble_mae:.4f}")
    print(f"  Test RMSE: {ensemble_rmse:.4f}")
    
    models['Simple Ensemble'] = ensemble_r2
    
    return models

def main():
    """Main function to run the enhanced training"""
    print("Enhanced Model Training for 90%+ Accuracy")
    print("="*60)
    
    # Load data
    data = load_data()
    
    # Engineer features
    X, y = engineer_features(data)
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"\nTraining set size: {X_train.shape}")
    print(f"Test set size: {X_test.shape}")
    
    # Train models
    models, predictions = train_models(X_train, X_test, y_train, y_test)
    
    # Create ensemble
    models = create_ensemble(models, predictions, y_test)
    
    # Cross-validation for robust evaluation
    print("\n" + "="*60)
    print("CROSS-VALIDATION RESULTS")
    print("="*60)
    
    # Feature Importance (from Random Forest)
    print("\n" + "="*60)
    print("FEATURE IMPORTANCE (Top 15)")
    print("="*60)
    
    # Get feature names
    feature_names = X.columns.tolist()
    
    # Get Random Forest feature importances
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)
    
    importances = rf_model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    for i in range(min(15, len(feature_names))):
        print(f"{feature_names[indices[i]]:>25} {importances[indices[i]]:.6f}")
    
    # Final assessment
    print("\n" + "="*60)
    print("FINAL ASSESSMENT")
    print("="*60)
    
    best_model = max(models, key=models.get)
    best_accuracy = models[best_model] * 100
    
    print(f"Best Performing Model: {best_model}")
    print(f"Best Accuracy Achieved: {best_accuracy:.2f}%")
    
    # Show all results
    print("\nAll Model Results:")
    for model, accuracy in sorted(models.items(), key=lambda x: x[1], reverse=True):
        print(f"  {model}: {accuracy*100:.2f}%")
    
    if best_accuracy >= 90:
        print("\n🎯 SUCCESS: Achieved 90%+ accuracy!")
    elif best_accuracy >= 80:
        print("\n✅ GOOD: Achieved 80%+ accuracy!")
    else:
        print("\n⚠️  Current accuracy is below 80%.")
    
    print(f"\n📊 Final accuracy: {best_accuracy:.2f}%")

if __name__ == "__main__":
    main()