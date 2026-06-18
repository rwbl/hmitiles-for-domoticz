import re

def clean_hmi_css():
    # 1. Read your large, messy CSS file
    try:
        with open("../core/hmitiles.css", "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print("Error: Put this script in the same folder as hmitiles.css!")
        return

    # 2. Define the unified header and Table of Contents
    header = """/* ==========================================================================
   Project: HMITiles-for-Domoticz StyleSheet Core
   Author: Robert W.B. Linn (c) 2026 MIT
   Version: 1.0.0-Beta
   Description: Clean, industry-inspired layout rules for smart home HMI panels.
   
   TABLE OF CONTENTS:
   1.0 GLOBAL LAYOUT RESET & BASE STYLES
   2.0 MASTER CONTAINER & GRID LAYOUT MODULES (.hmi-panel)
   3.0 PANEL CARD FRAME COMPONENTS (.hmi-pack-card)
   4.0 STATUS BADGES & CLICK INTERACTIVES (.hmi-badge)
   5.0 HARDWARE CONTROLS (SLIDERS, SETPOINT BUTTONS)
   6.0 PROGRESS BAR & LEVEL GAUGE COMPONENTS (.hmi-bar-fill)
   7.0 DYNAMIC INDUSTRIAL ALARM BOUNDARY HOOKS ([data-alarm])
   8.0 NATIVE SVG SPARKLINE TREND GRAPH MODULES
   ========================================================================== */\n\n"""

    # 3. Strip out old messy comment blocks to start fresh
    clean_content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # 4. Standardize spacing around brackets and properties
    clean_content = re.sub(r'\s*\{\s*', ' {\n    ', clean_content)
    clean_content = re.sub(r';\s*', ';\n    ', clean_content)
    clean_content = re.sub(r'\s*\}\s*', '\n}\n\n', clean_content)
    clean_content = re.sub(r';\n\s*\n\s*\}', ';\n}', clean_content)
    
    # 5. Write the freshly formatted output
    with open("hmitiles_clean.css", "w", encoding="utf-8") as f:
        f.write(header + clean_content.strip())
        
    print("Success! Cleaned file saved as: hmitiles_clean.css")

if __name__ == "__main__":
    clean_hmi_css()
