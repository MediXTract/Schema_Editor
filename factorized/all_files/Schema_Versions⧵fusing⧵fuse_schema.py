import json
from datetime import datetime

def fuse_schemas(main_schema_path, performance_schema_path, output_path):
    """
    Fuse main schema with performance data schema
    
    Args:
        main_schema_path: Path to the main schema JSON with variable definitions
        performance_schema_path: Path to the performance data JSON
        output_path: Path where the fused schema will be saved
    """
    
    print("="*60)
    print("MediXtract Schema Fusion Tool")
    print("="*60)
    
    # Read main schema
    print(f"\n1. Reading main schema from: {main_schema_path}")
    try:
        with open(main_schema_path, 'r', encoding='utf-8') as f:
            main_schema = json.load(f)
        print(f"   ✓ Loaded main schema successfully")
    except FileNotFoundError:
        print(f"   ✗ ERROR: File not found - {main_schema_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"   ✗ ERROR: Invalid JSON in main schema - {e}")
        return False
    
    # Read performance schema
    print(f"\n2. Reading performance data from: {performance_schema_path}")
    try:
        with open(performance_schema_path, 'r', encoding='utf-8') as f:
            performance_schema = json.load(f)
        print(f"   ✓ Loaded performance data successfully")
    except FileNotFoundError:
        print(f"   ✗ ERROR: File not found - {performance_schema_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"   ✗ ERROR: Invalid JSON in performance schema - {e}")
        return False
    
    # Get properties from main schema
    if 'properties' in main_schema:
        properties = main_schema['properties']
    else:
        properties = main_schema
        main_schema = {'properties': properties}
    
    print(f"\n3. Processing schemas...")
    print(f"   - Main schema variables: {len(properties)}")
    print(f"   - Performance data variables: {len(performance_schema)}")
    
    # Track statistics
    fused_count = 0
    created_count = 0
    variables_with_performance = []
    missing_variables = []
    
    # Fuse the schemas
    for var_name in performance_schema.keys():
        if var_name in properties:
            # Variable exists in main schema - just add performance data
            if 'performance' in performance_schema[var_name]:
                converted_performance = convert_performance_structure(
                    performance_schema[var_name]['performance']
                )
                properties[var_name]['performance'] = converted_performance
                fused_count += 1
                variables_with_performance.append(var_name)
        else:
            # Variable missing from main schema - create placeholder
            missing_variables.append(var_name)
            placeholder = create_placeholder_variable(var_name)
            
            if 'performance' in performance_schema[var_name]:
                converted_performance = convert_performance_structure(
                    performance_schema[var_name]['performance']
                )
                placeholder['performance'] = converted_performance
            
            properties[var_name] = placeholder
            created_count += 1
            variables_with_performance.append(var_name)
    
    print(f"   ✓ Successfully fused {fused_count} existing variables")
    print(f"   ✓ Created {created_count} placeholder variables for missing entries")
    
    # Write fused schema
    print(f"\n4. Writing fused schema to: {output_path}")
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(main_schema, f, indent=2, ensure_ascii=False)
        print(f"   ✓ Fused schema saved successfully")
    except Exception as e:
        print(f"   ✗ ERROR: Could not write output file - {e}")
        return False
    
    # Print summary
    print("\n" + "="*60)
    print("FUSION SUMMARY")
    print("="*60)
    print(f"Total variables in main schema: {len(properties)}")
    print(f"  - Already existed: {fused_count}")
    print(f"  - Created as placeholders: {created_count}")
    print(f"Variables with performance data: {len(variables_with_performance)}")
    print(f"Coverage: {(len(variables_with_performance)/len(properties)*100):.1f}%")
    
    # Count patients
    patients = set()
    for var_name in variables_with_performance[:1]:  # Check first variable
        if 'performance' in properties[var_name]:
            patients = set(properties[var_name]['performance'].keys())
            break
    
    if patients:
        print(f"Total patients: {len(patients)}")
        print(f"Patient IDs: {', '.join(sorted(patients))}")
    
    # Show missing variables details
    if missing_variables:
        print("\n" + "="*60)
        print("MISSING VARIABLES (Created as Placeholders)")
        print("="*60)
        print(f"\nThe following {len(missing_variables)} variables were NOT in the main schema")
        print("and have been created with placeholder definitions:\n")
        
        for i, var_name in enumerate(sorted(missing_variables), 1):
            # Count how many patients have data for this variable
            patient_count = 0
            if 'performance' in properties[var_name]:
                patient_count = len(properties[var_name]['performance'])
            
            print(f"{i:2d}. {var_name:40s} ({patient_count} patients)")
        
        print("\n" + "-"*60)
        print("RECOMMENDATIONS:")
        print("-"*60)
        print("These placeholder variables have minimal definitions:")
        print("  - anyOf: [string, null]")
        print("  - description: 'Placeholder for [variable_name]'")
        print("  - group_id: 'unknown'")
        print("\nYou should update these variables with proper:")
        print("  ✓ Data types (anyOf structure)")
        print("  ✓ Descriptions")
        print("  ✓ Group IDs")
        print("  ✓ Options (if enum type)")
        print("  ✓ Notes")
        
        # Export list of missing variables to a file
        missing_file = 'missing_variables.txt'
        try:
            with open(missing_file, 'w', encoding='utf-8') as f:
                f.write("Missing Variables Report\n")
                f.write("="*60 + "\n\n")
                f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                f.write(f"Total missing variables: {len(missing_variables)}\n\n")
                f.write("List of missing variables:\n")
                f.write("-"*60 + "\n")
                for var_name in sorted(missing_variables):
                    patient_count = 0
                    if 'performance' in properties[var_name]:
                        patient_count = len(properties[var_name]['performance'])
                    f.write(f"{var_name:40s} ({patient_count} patients)\n")
            print(f"\n✓ Missing variables list saved to: {missing_file}")
        except Exception as e:
            print(f"\n⚠ Could not save missing variables list: {e}")
    
    print("\n" + "="*60)
    print("\n✓ Fusion completed successfully!")
    
    return True


def create_placeholder_variable(var_name):
    """
    Create a placeholder variable definition for missing variables
    """
    return {
        "anyOf": [
            {
                "type": "string"
            },
            {
                "type": "null"
            }
        ],
        "default": None,
        "description": f"Placeholder for {var_name} - Please update with proper definition",
        "group_id": "unknown",
        "notes": "This variable was automatically created as a placeholder because it existed in performance data but not in the main schema. Please update with proper definition, type, and metadata."
    }


def convert_performance_structure(performance_data):
    """
    Convert performance data from the format:
    {
        "patient_D": { "matched": true }
        "patient_E": { "unmatched": { "correction": true } }
    }
    
    To the sparse boolean format:
    {
        "patient_D": { "match": true, "last_updated": "..." }
        "patient_E": { "correction": true, "last_updated": "..." }
    }
    """
    converted = {}
    timestamp = datetime.now().isoformat() + 'Z'
    
    for patient_id, patient_data in performance_data.items():
        patient_performance = {}
        
        # Handle "matched" status
        if 'matched' in patient_data and patient_data['matched']:
            patient_performance['match'] = True
        
        # Handle "blank" status
        elif 'blank' in patient_data and patient_data['blank']:
            # Blank means both human and MediXtract have no data
            # We'll mark this as pending or you can choose to skip it
            pass  # Skip blank entries or set pending: true
        
        # Handle "unmatched" with nested properties
        elif 'unmatched' in patient_data:
            unmatched_data = patient_data['unmatched']
            
            # Map the property names to our format
            property_mapping = {
                'correction': 'correction',
                'standardized': 'standardized',
                'filled_blank': 'filled_blank',
                'improved_comment': 'improved_comment',
                'missing_docs': 'missing_doc',
                'contradictions': 'contradictions',
                'questioned': 'questioned'
            }
            
            for old_key, new_key in property_mapping.items():
                if old_key in unmatched_data and unmatched_data[old_key]:
                    patient_performance[new_key] = True
        
        # Only add to converted if there's actual performance data
        if patient_performance:
            patient_performance['last_updated'] = timestamp
            converted[patient_id] = patient_performance
    
    return converted


def main():
    """Main execution function"""
    
    # Define file paths
    main_schema_file = 'schema_main_variables_to_be_fused.json'
    performance_schema_file = 'schema_performances_to_be_fused.json'
    output_file = 'schema_v01_fused.json'
    
    # Execute fusion
    success = fuse_schemas(main_schema_file, performance_schema_file, output_file)
    
    if not success:
        print("\n✗ Fusion failed. Please check the error messages above.")
        exit(1)
    
    print(f"\n✓ Output file: {output_file}")
    print("✓ Ready to use with the visualization tool!")


if __name__ == "__main__":
    main()