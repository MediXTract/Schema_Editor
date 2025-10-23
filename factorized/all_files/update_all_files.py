#!/usr/bin/env python3
"""
Flatten all files from the script's directory (recursively) into ./all_files.

- Skips the ./all_files directory itself.
- Replaces any previous contents of ./all_files.
- Destination filenames include the source's relative folder path, e.g.
  "core⧵FilterBar.js" instead of just "FilterBar.js".
- If duplicate filenames occur, appends " (1)", " (2)", ... before the extension.
"""

import os
import shutil
from pathlib import Path

# Choose how to encode folder separators inside the FLAT filename.
# "⧵" (U+29F5) looks like a backslash but is a safe, legal character on major filesystems.
# If you prefer ASCII, set to "__" or "--".
SEPARATOR = "⧵"

def ensure_clean_folder(folder: Path) -> None:
    """Delete the folder if it exists, then recreate it."""
    if folder.exists():
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

def encoded_flat_name(base_dir: Path, src_path: Path) -> str:
    """
    Encode the file's path relative to base_dir into a single flat filename,
    joining path components with SEPARATOR.

    Example:
        base_dir / "core/FilterBar.js" -> "core⧵FilterBar.js"
        base_dir / "src/components/FilterBar.js" -> "src⧵components⧵FilterBar.js"
    """
    rel = src_path.relative_to(base_dir)
    # Join all parts (including the original filename) using the chosen separator.
    parts = list(rel.parts)
    flat = SEPARATOR.join(parts)

    # Some OSes may still reject control characters; strip them just in case.
    # (Backslash '/' are not present anymore, we've replaced separators already.)
    flat = "".join(ch for ch in flat if ch.isprintable())

    # Optional: cap very long names if your filesystem has tight limits.
    # if len(flat) > 240:
    #     name, ext = os.path.splitext(flat)
    #     flat = name[:240 - len(ext)] + ext

    return flat

def copy_all_files_to_target(base_dir: Path, target_dir: Path) -> int:
    """
    Walk base_dir recursively, skipping target_dir, and copy every file found
    into target_dir. Returns the number of files copied.
    """
    files_copied = 0
    target_name = target_dir.name

    for root, dirs, files in os.walk(base_dir):
        # Prune the target_dir so we don't descend into it
        if target_name in dirs:
            dirs.remove(target_name)

        for fname in files:
            src_path = Path(root) / fname

            # Skip if source is inside target_dir for any reason (extra safety)
            try:
                src_path.relative_to(target_dir)
                continue  # inside target; skip
            except ValueError:
                pass

            # Build the encoded "flat" filename from the relative path
            encoded_name = encoded_flat_name(base_dir, src_path)

            # Create a unique destination name to avoid collisions
            dst_path = unique_destination_name(target_dir, encoded_name)

            # Copy with metadata
            shutil.copy2(src_path, dst_path)
            files_copied += 1

    return files_copied

def main():
    base_dir = Path(__file__).resolve().parent
    target_dir = base_dir / "all_files"

    print(f"Base directory: {base_dir}")
    print(f"Target directory: {target_dir}")
    print(f"Using separator: {SEPARATOR!r} in encoded filenames")

    ensure_clean_folder(target_dir)
    count = copy_all_files_to_target(base_dir, target_dir)

    print(f"Done. {count} files collected into '{target_dir.name}'.")

if __name__ == "__main__":
    main()
