#!/usr/bin/env python3
"""
Flatten all files from the script's directory (recursively) into ./all_files.

- Skips the ./all_files directory itself.
- Replaces any previous contents of ./all_files.
- If duplicate filenames occur, appends " (1)", " (2)", ... before the extension.
"""

import os
import shutil
from pathlib import Path

def ensure_clean_folder(folder: Path) -> None:
    """Delete the folder if it exists, then recreate it."""
    if folder.exists():
        # Remove previous content entirely
        shutil.rmtree(folder)
    folder.mkdir(parents=True, exist_ok=True)

def unique_destination_name(dst_dir: Path, filename: str) -> Path:
    """
    Return a unique destination path in dst_dir for filename.
    If a collision occurs, append ' (1)', ' (2)', ... before the extension.
    """
    candidate = dst_dir / filename
    if not candidate.exists():
        return candidate

    stem = candidate.stem
    suffix = candidate.suffix
    i = 1
    while True:
        candidate = dst_dir / f"{stem} ({i}){suffix}"
        if not candidate.exists():
            return candidate
        i += 1

def copy_all_files_to_target(base_dir: Path, target_dir: Path) -> int:
    """
    Walk base_dir recursively, skipping target_dir, and copy every file found
    into target_dir. Returns the number of files copied.
    """
    files_copied = 0
    target_name = target_dir.name

    # Walk the tree
    for root, dirs, files in os.walk(base_dir):
        # Prune the target_dir so we don't descend into it
        # (modify dirs in-place to prevent os.walk from entering that directory)
        if target_name in dirs:
            dirs.remove(target_name)

        for fname in files:
            src_path = Path(root) / fname

            # Skip if source is inside target_dir for any reason (extra safety)
            try:
                src_path.relative_to(target_dir)
                # If this doesn't raise, it's inside target; skip
                continue
            except ValueError:
                pass

            # Create a unique destination name to avoid collisions
            dst_path = unique_destination_name(target_dir, fname)

            # Copy with metadata
            shutil.copy2(src_path, dst_path)
            files_copied += 1

    return files_copied

def main():
    base_dir = Path(__file__).resolve().parent
    target_dir = base_dir / "all_files"

    print(f"Base directory: {base_dir}")
    print(f"Target directory: {target_dir}")

    ensure_clean_folder(target_dir)
    count = copy_all_files_to_target(base_dir, target_dir)

    print(f"Done. {count} files collected into '{target_dir.name}'.")

if __name__ == "__main__":
    main()
