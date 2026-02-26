import json
import os
from pathlib import Path

def update_project_prices(config_file=None, projects_file=None):
    """
    Update prices in projects.json based on dimension mappings from config file.
    
    Args:
        config_file: Path to price_config.json. Defaults to current directory.
        projects_file: Path to projects.json. Defaults to ../src/data/projects.json
    """
    
    # Set default paths relative to this script
    script_dir = Path(__file__).parent
    
    if config_file is None:
        config_file = script_dir / "price_config.json"
    else:
        config_file = Path(config_file)
    
    if projects_file is None:
        projects_file = script_dir.parent / "src" / "data" / "projects.json"
    else:
        projects_file = Path(projects_file)
    
    # Validate files exist
    if not config_file.exists():
        print(f"Error: Config file not found at {config_file}")
        return False
    
    if not projects_file.exists():
        print(f"Error: Projects file not found at {projects_file}")
        return False
    
    # Load configuration
    with open(config_file, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    dimension_price_map = config.get("dimension_price_map", {})
    
    # Load projects
    with open(projects_file, 'r', encoding='utf-8') as f:
        projects = json.load(f)
    
    # Update prices
    updated_count = 0
    unchanged_count = 0
    
    for project in projects:
        # Only update if available is true
        if project.get("available") is True:
            dimension = project.get("dimension", "")
            
            # Check if dimension matches any in the config
            if dimension in dimension_price_map:
                old_price = project.get("price")
                new_price = dimension_price_map[dimension]
                
                if old_price != new_price:
                    project["price"] = new_price
                    updated_count += 1
                    print(f"Updated {project.get('id')}: {dimension} price from {old_price} to {new_price}")
                else:
                    unchanged_count += 1
            else:
                unchanged_count += 1
        else:
            # Skip unavailable items
            unchanged_count += 1
    
    # Save updated projects
    with open(projects_file, 'w', encoding='utf-8') as f:
        json.dump(projects, f, indent=2, ensure_ascii=False)
    
    print(f"\nSummary:")
    print(f"  Total projects: {len(projects)}")
    print(f"  Updated: {updated_count}")
    print(f"  Unchanged/Skipped: {unchanged_count}")
    print(f"\nSuccessfully saved updated projects to {projects_file}")
    
    return True


if __name__ == "__main__":
    update_project_prices()
