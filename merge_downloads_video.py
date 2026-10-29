#!/usr/bin/env python3
"""
merge_downloads_video.py

Merges specifically the MiniMax_H3 sequence from 00012 to 00031 in ~/Downloads
into a single seamless video.
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    downloads = Path(os.path.expanduser("~/Downloads"))
    if not downloads.exists():
        print(f"Error: {downloads} does not exist.")
        sys.exit(1)

    # Specific sequence: 00012 to 00031
    start_seq = 12
    end_seq = 31

    selected_files = []
    for num in range(start_seq, end_seq + 1):
        filename = f"MiniMax_H3_{num:05d}_.mp4"
        filepath = downloads / filename
        if not filepath.exists():
            # Check if only (1) version exists
            alt_filepath = downloads / f"MiniMax_H3_{num:05d}_(1).mp4"
            if alt_filepath.exists():
                filepath = alt_filepath
            else:
                print(f"[Warning] Clip missing: {filename}")
                continue
        selected_files.append(filepath)

    if not selected_files:
        print("No matching video clips found to merge.")
        sys.exit(1)

    print(f"Found {len(selected_files)} clips to merge in sequence (00012 -> 00031):")
    for idx, f in enumerate(selected_files, 1):
        size_mb = f.stat().st_size / (1024 * 1024)
        print(f"  [{idx:02d}] {f.name} ({size_mb:.2f} MB)")

    output_file = downloads / "merged_MiniMax_00012_to_00031.mp4"
    concat_list = downloads / "ffmpeg_concat_temp.txt"

    try:
        with open(concat_list, "w", encoding="utf-8") as f:
            for vf in selected_files:
                escaped = str(vf.resolve()).replace("'", "'\\''")
                f.write(f"file '{escaped}'\n")

        print(f"\nMerging into: {output_file.name} ...")
        
        # 1. Fast direct stream copy (instant, lossless)
        cmd_copy = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(concat_list),
            "-c", "copy",
            str(output_file)
        ]
        res = subprocess.run(cmd_copy, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        if res.returncode == 0 and output_file.exists() and output_file.stat().st_size > 0:
            out_mb = output_file.stat().st_size / (1024 * 1024)
            print(f"\n[SUCCESS] Direct stream copy completed: {output_file} ({out_mb:.2f} MB)")
        else:
            print("\nStream copy fallback: re-encoding clips for seamless stitching...")
            cmd_reencode = [
                "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                "-i", str(concat_list),
                "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                "-c:a", "aac", "-b:a", "192k",
                str(output_file)
            ]
            res_reencode = subprocess.run(cmd_reencode)
            if res_reencode.returncode == 0:
                out_mb = output_file.stat().st_size / (1024 * 1024)
                print(f"\n[SUCCESS] Re-encoded merge completed: {output_file} ({out_mb:.2f} MB)")
            else:
                print("\n[ERROR] FFmpeg merge failed.")
                sys.exit(1)

    finally:
        if concat_list.exists():
            concat_list.unlink()

if __name__ == "__main__":
    main()
