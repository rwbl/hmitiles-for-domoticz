import os
from pathlib import Path
from datetime import datetime

# Folder A is the absolute Master reference point
FOLDER_A = Path(r"c:\Daten\github\HMITiles-for-Domoticz")

# Point this EXACTLY to the parent folder containing your active runtime blueprint folder structure on the server
# (e.g., if your workspace files sit inside domoticz\blueprints, point it there directly)
FOLDER_B = Path(r"c:\Daten\projects\homeautomation\domoticz\domoticz-hmitiles")

# TESTS
#FOLDER_A = Path(r"c:\Daten\projects\homeautomation\domoticz\domoticz-hmitiles2\templates")
#FOLDER_B = Path(r"c:\Daten\projects\homeautomation\domoticz\domoticz-hmitiles\blueprints")


def compare_master_to_target():
    print("=====================================================================")
    print("Fast Master-to-Target Relative Path Verification (Filtering Git Metadata)")
    print(f"Folder A (MASTER): {FOLDER_A}")
    print(f"Folder B (TARGET): {FOLDER_B}")
    print("=====================================================================\n")

    if not FOLDER_A.exists():
        print(f"Error: Master directory path not found -> {FOLDER_A}")
        return
    if not FOLDER_B.exists():
        print(f"Warning: Target directory path not found -> {FOLDER_B}")
        print("Ensure Folder B points to the actual subfolder containing your active widgets code!\n")

    identical_count = 0
    modified_count = 0
    missing_count = 0

    # 1. Loop through files inside Master Folder A
    for path_a in FOLDER_A.rglob('*'):
        if not path_a.is_file():
            continue

        # CRITICAL PROTECTION FIX: Ignore any hidden .git tracking configuration metadata entries
        if '.git' in path_a.parts:
            continue

        # 2. Extract the relative path structure (e.g., "10-hmitiles-workbench/hmitiles.js")
        rel_path = path_a.relative_to(FOLDER_A)
        
        # 3. Direct projection link: construct the exact file target path inside Folder B
        path_b = FOLDER_B / rel_path
        
        stat_a = path_a.stat()
        time_a = datetime.fromtimestamp(stat_a.st_mtime).strftime('%Y-%m-%d %H:%M:%S')

        # Scenario A: The exact structural path does not exist inside your target project tree
        if not path_b.exists():
            print(f"[-] MISSING IN TARGET: {rel_path}")
            print(f"    -> Master Size: {stat_a.st_size} bytes | Modified: {time_a}\n")
            missing_count += 1
            continue

        # Scenario B: The file is found. Perform an instantaneous static property check
        stat_b = path_b.stat()
        size_match = stat_a.st_size == stat_b.st_size
        mtime_match = round(stat_a.st_mtime, 1) == round(stat_b.st_mtime, 1)

        if size_match and mtime_match:
            identical_count += 1
        else:
            time_b = datetime.fromtimestamp(stat_b.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
            print(f"[*] MISMATCHED / MODIFIED: {rel_path}")
            print(f"    -> Master: {stat_a.st_size} bytes | Modified: {time_a}")
            print(f"    -> Target: {stat_b.st_size} bytes | Modified: {time_b}\n")
            modified_count += 1

    print("=== Verification Audit Complete ===")
    print(f"Total Master files processed from Folder A: {identical_count + modified_count + missing_count}")
    print(f" - Identical / Synchronized files:         {identical_count}")
    print(f" - Modified / Mismatched files:            {modified_count}")
    print(f" - Missing entirely in Folder B:           {missing_count}")

if __name__ == "__main__":
    compare_master_to_target()
