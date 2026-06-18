import re
from collections import Counter

css_filename = "hmitiles.css"  # Adjusted path since your script is inside the 'tools' folder
# css_filename = "../core/hmitiles.css"  # Adjusted path since your script is inside the 'tools' folder

def find_css_class_duplicates(filename):
    print(f"Finding duplicates in {filename}")
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            content = file.read()
            
        # 1. Clean up comments entirely
        content_no_comments = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        
        # 2. Find everything before an opening brace '{'
        raw_selectors = re.findall(r'([^{]+)\s*\{', content_no_comments)
        
        cleaned_selectors = []
        for selector in raw_selectors:
            # Clean formatting spaces and line breaks
            clean_selector = " ".join(selector.split()).strip()
            
            # Split grouped selectors separated by commas
            sub_selectors = clean_selector.split(',')
            for sub in sub_selectors:
                final_name = sub.strip()
                
                # CRITICAL RULE: Only care about real CSS targets 
                # (Starts with '.' for classes, '#' for IDs, or letters for HTML tags like body, select)
                if final_name and (final_name.startswith('.') or final_name.startswith('#') or final_name[0].isalpha()):
                    # Ignore at-rules like @media or @keyframes
                    if not final_name.startswith('@'):
                        cleaned_selectors.append(final_name)
                    
        # 3. Count duplicates
        selector_counts = Counter(cleaned_selectors)
        duplicates = {sel: count for sel, count in selector_counts.items() if count > 1}
        
        if duplicates:
            print(f"=== Found {len(duplicates)} Actual Duplicate Selectors in '{filename}' ===")
            for selector, count in sorted(duplicates.items(), key=lambda item: item[1], reverse=True):
                print(f" -> [{count} times]: {selector}")
        else:
            print(f"Success! No genuine duplicate selectors found in '{filename}'.")
            
    except FileNotFoundError:
        print(f"Error: The file '{filename}' was not found. Check your relative path folders.")

if __name__ == "__main__":
    find_css_class_duplicates(css_filename)
