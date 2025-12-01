#!/usr/bin/env python3
"""
Script to generate real yield data from CSV datasets
"""

import json
import sys
import os
import csv

# Define the mapping from municipalities to CSV files
MUNICIPALITY_MAPPING = {
    'abucay': 'Abucay Annual Data.csv',
    'alabat': 'Alabat Annual Data.csv',
    'ambulong': 'Ambulong Annual Data.csv',
    'aparri': 'Aparri Annual Data.csv',
    'baguio': 'Baguio Annual Data.csv',
    'baler_radar': 'Baler Radar Annual Data.csv',
    'basco_radar': 'Basco Radar Annual Data.csv',
    'borongan': 'Borongan Annual Data.csv',
    'butuan': 'Butuan Annual Data.csv',
    'clsu': 'CLSU Annual Data.csv',
    'cabanatuan': 'Cabanatuan Annual Data.csv',
    'calapan': 'Calapan Annual Data.csv',
    'calayan': 'Calayan Annual Data.csv',
    'casiguran': 'Casiguran Annual Data.csv',
    'catarman': 'Catarman Annual Data.csv',
    'catbalogan': 'Catbalogan Annual Data.csv',
    'clark': 'Clark Annual Data.csv',
    'coron': 'Coron Annual Data.csv',
    'cotabato': 'Cotabato Annual Data.csv',
    'cubi_point': 'Cubi Point Annual Data.csv',
    'cuyo': 'Cuyo Annual Data.csv',
    'daet': 'Daet Annual Data.csv',
    'dagupan': 'Dagupan Annual Data.csv',
    'dauis': 'Dauis Annual Data.csv',
    'davao_city': 'Davao City Annual Data.csv',
    'dipolog': 'Dipolog Annual Data.csv',
    'dumaguete': 'Dumaguete Annual Data.csv',
    'el_salvador': 'El Salvador Annual Data.csv',
    'general_santos': 'General Santos Annual Data.csv',
    'guiuan': 'Guiuan Annual Data.csv',
    'hinatuan': 'Hinatuan Annual Data.csv',
    'iba': 'Iba Annual Data.csv',
    'infanta': 'Infanta Annual Data.csv',
    'itbayat': 'Itbayat Annual Data.csv',
    'juban': 'Juban Annual Data.csv',
    'laoag': 'Laoag Annual Data.csv',
    'legazpi': 'Legazpi Annual Data.csv',
    'maasin': 'Maasin Annual Data.csv',
    'mactan': 'Mactan Annual Data.csv',
    'malaybalay': 'Malaybalay Annual Data.csv',
    'masbate': 'Masbate Annual Data.csv',
    'naia': 'NAIA Annual Data.csv',
    'port_area': 'Port Area Annual Data.csv',
    'puerto_princesa': 'Puerto Princesa Annual Data.csv',
    'romblon': 'Romblon Annual Data.csv',
    'roxas_city': 'Roxas City Annual Data.csv',
    'san_jose': 'San Jose Annual Data.csv',
    'sangley_point': 'Sangley Point Annual Data.csv',
    'science_garden': 'Science Garden Annual Data.csv',
    'sinait': 'Sinait Annual Data.csv',
    'surigao': 'Surigao Annual Data.csv',
    'tacloban': 'Tacloban Annual Data.csv',
    'tanay': 'Tanay Annual Data.csv',
    'tayabas': 'Tayabas Annual Data.csv',
    'tuguegarao': 'Tuguegarao Annual Data.csv',
    'virac_synop': 'Virac Synop Annual Data.csv',
    'zamboanga': 'Zamboanga Annual Data.csv'
}

# Map to actual available files (based on your actual dataset)
FILE_MAPPING = {
    'Abucay Annual Data.csv': 'Abucay Annual Data.csv',
    'Alabat Annual Data.csv': 'Alabat Annual Data.csv',
    'Ambulong Annual Data.csv': 'Ambulong Annual Data.csv',
    'Aparri Annual Data.csv': 'Aparri Annual Data.csv',
    'Baguio Annual Data.csv': 'Baguio Annual Data.csv',
    'Baler Radar Annual Data.csv': 'Baler Radar Annual Data.csv',
    'Basco Radar Annual Data.csv': 'Basco Radar Annual Data.csv',
    'Borongan Annual Data.csv': 'Borongan Annual Data.csv',
    'Butuan Annual Data.csv': 'Butuan Annual Data.csv',
    'CLSU Annual Data.csv': 'CLSU Annual Data.csv',
    'Cabanatuan Annual Data.csv': 'Cabanatuan Annual Data.csv',
    'Calapan Annual Data.csv': 'Calapan Annual Data.csv',
    'Calayan Annual Data.csv': 'Calayan Annual Data.csv',
    'Casiguran Annual Data.csv': 'Casiguran Annual Data.csv',
    'Catarman Annual Data.csv': 'Catarman Annual Data.csv',
    'Catbalogan Annual Data.csv': 'Catbalogan Annual Data.csv',
    'Clark Annual Data.csv': 'Clark Annual Data.csv',
    'Coron Annual Data.csv': 'Coron Annual Data.csv',
    'Cotabato Annual Data.csv': 'Cotabato Annual Data.csv',
    'Cubi Point Annual Data.csv': 'Cubi Point Annual Data.csv',
    'Cuyo Annual Data.csv': 'Cuyo Annual Data.csv',
    'Daet Annual Data.csv': 'Daet Annual Data.csv',
    'Dagupan Annual Data.csv': 'Dagupan Annual Data.csv',
    'Dauis Annual Data.csv': 'Dauis Annual Data.csv',
    'Davao City Annual Data.csv': 'Davao City Annual Data.csv',
    'Dipolog Annual Data.csv': 'Dipolog Annual Data.csv',
    'Dumaguete Annual Data.csv': 'Dumaguete Annual Data.csv',
    'El Salvador Annual Data.csv': 'El Salvador Annual Data.csv',
    'General Santos Annual Data.csv': 'General Santos Annual Data.csv',
    'Guiuan Annual Data.csv': 'Guiuan Annual Data.csv',
    'Hinatuan Annual Data.csv': 'Hinatuan Annual Data.csv',
    'Iba Annual Data.csv': 'Iba Annual Data.csv',
    'Infanta Annual Data.csv': 'Infanta Annual Data.csv',
    'Itbayat Annual Data.csv': 'Itbayat Annual Data.csv',
    'Juban Annual Data.csv': 'Juban Annual Data.csv',
    'Laoag Annual Data.csv': 'Laoag Annual Data.csv',
    'Legazpi Annual Data.csv': 'Legazpi Annual Data.csv',
    'Maasin Annual Data.csv': 'Maasin Annual Data.csv',
    'Mactan Annual Data.csv': 'Mactan Annual Data.csv',
    'Malaybalay Annual Data.csv': 'Malaybalay Annual Data.csv',
    'Masbate Annual Data.csv': 'Masbate Annual Data.csv',
    'NAIA Annual Data.csv': 'NAIA Annual Data.csv',
    'Port Area Annual Data.csv': 'Port Area Annual Data.csv',
    'Puerto Princesa Annual Data.csv': 'Puerto Princesa Annual Data.csv',
    'Romblon Annual Data.csv': 'Romblon Annual Data.csv',
    'Roxas City Annual Data.csv': 'Roxas City Annual Data.csv',
    'San Jose Annual Data.csv': 'San Jose Annual Data.csv',
    'Sangley Point Annual Data.csv': 'Sangley Point Annual Data.csv',
    'Science Garden Annual Data.csv': 'Science Garden Annual Data.csv',
    'Sinait Annual Data.csv': 'Sinait Annual Data.csv',
    'Surigao Annual Data.csv': 'Surigao Annual Data.csv',
    'Tacloban Annual Data.csv': 'Tacloban Annual Data.csv',
    'Tanay Annual Data.csv': 'Tanay Annual Data.csv',
    'Tayabas Annual Data.csv': 'Tayabas Annual Data.csv',
    'Tuguegarao Annual Data.csv': 'Tuguegarao Annual Data.csv',
    'Virac Synop Annual Data.csv': 'Virac Synop Annual Data.csv',
    'Zamboanga Annual Data.csv': 'Zamboanga Annual Data.csv'
}

def read_csv_data(file_path):
    """Read data from CSV file"""
    try:
        data = []
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Convert string values to appropriate types
                processed_row = {}
                for key, value in row.items():
                    # Clean up the key names
                    clean_key = key.strip().replace('(Â°C)', '').replace('(mm)', '').replace('(%)', '').replace('(hrs/day)', '').replace('(/ha)', '').replace('(tons/ha)', '').strip()
                    try:
                        # Try to convert to float if possible
                        processed_row[clean_key] = float(value) if value else 0.0
                    except ValueError:
                        # Keep as string if conversion fails
                        processed_row[clean_key] = value
                data.append(processed_row)
        return data
    except Exception as e:
        print(f"Error reading CSV file {file_path}: {e}", file=sys.stderr)
        return []

def calculate_average_yield(historical_data):
    """Calculate average yield from historical data"""
    if not historical_data:
        return 0
    return round(sum(item['yield'] for item in historical_data) / len(historical_data), 2)

def generate_municipality_data(municipality_id):
    """Generate data for a specific municipality from CSV files"""
    try:
        # Get the CSV file for this municipality
        csv_file = MUNICIPALITY_MAPPING.get(municipality_id)
        
        if not csv_file:
            return {
                'municipalityId': municipality_id,
                'averageYield': 0,
                'historicalData': []
            }
        
        # Map to actual available file
        actual_file = FILE_MAPPING.get(csv_file, csv_file)
        file_path = os.path.join(os.path.dirname(__file__), 'data', 'datasets', actual_file)
        
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"Warning: File {file_path} not found", file=sys.stderr)
            return {
                'municipalityId': municipality_id,
                'averageYield': 0,
                'historicalData': []
            }
        
        # Read data from CSV
        csv_data = read_csv_data(file_path)
        
        # Collect data from CSV file for this municipality
        all_historical_data = []
        
        # Process the data
        for row in csv_data:
            # Extract year and yield
            year = int(row.get('Year', 0))
            # The yield column in your data is 'Rice Yield'
            yield_value = row.get('Rice Yield', 0)
            
            if year and yield_value:
                all_historical_data.append({
                    'year': year,
                    'yield': float(yield_value)
                })
        
        # Calculate average yield
        average_yield = calculate_average_yield(all_historical_data)
        
        # Sort by year
        all_historical_data.sort(key=lambda x: x['year'])
        
        return {
            'municipalityId': municipality_id,
            'averageYield': average_yield,
            'historicalData': all_historical_data
        }
    except Exception as e:
        print(f"Error generating data for municipality {municipality_id}: {e}", file=sys.stderr)
        # Return default data if there's an error
        return {
            'municipalityId': municipality_id,
            'averageYield': 0,
            'historicalData': []
        }

def main():
    """Main function to generate all municipality data and save to a TypeScript file"""
    try:
        # Define the municipalities
        MUNICIPALITIES = list(MUNICIPALITY_MAPPING.keys())
        
        # Generate data for all municipalities
        all_municipalities_data = []
        
        for municipality_id in MUNICIPALITIES:
            municipality_data = generate_municipality_data(municipality_id)
            all_municipalities_data.append(municipality_data)
        
        # Save to a JSON file that can be imported in TypeScript
        # Use a different path to avoid permission issues
        output_file = os.path.join(os.path.dirname(__file__), '..', '..', 'constants', 'municipality_data.json')
        try:
            with open(output_file, 'w') as f:
                json.dump(all_municipalities_data, f, indent=2)
        except Exception as write_error:
            print(f"Warning: Could not write to {output_file}: {write_error}", file=sys.stderr)
        
        # Also output as JSON to stdout
        print(json.dumps(all_municipalities_data))
        return 0
        
    except Exception as e:
        error_result = {
            'error': str(e)
        }
        print(json.dumps(error_result), file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())