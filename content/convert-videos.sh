#!/bin/bash

# Check if correct number of arguments are passed
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <source_directory> <destination_directory>"
    exit 1
fi

SOURCE_DIR="${1%/}" # Remove trailing slash if present
DEST_DIR="${2%/}"   # Remove trailing slash if present

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: Source directory '$SOURCE_DIR' does not exist."
    exit 1
fi

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Find all mp4 files in source directory and subdirectories
find "$SOURCE_DIR" -type f -name "*.mp4" | while read -r FILE; do
    # Get relative path of the file (e.g., /subfolder/video.mp4)
    REL_PATH="${FILE#$SOURCE_DIR}"
    
    # Construct the full output path
    OUTPUT_FILE="$DEST_DIR$REL_PATH"
    
    # Get the directory of the output file
    OUTPUT_DIR=$(dirname "$OUTPUT_FILE")
    
    # Create the subdirectory in the destination folder
    mkdir -p "$OUTPUT_DIR"
    
    echo "Converting: $FILE -> $OUTPUT_FILE"

    # FFMPEG Command
    # -vf "scale=..." : This complex filter checks orientation.
    # if (width > height) [Landscape] -> scale width=-2 (auto), height=480
    # else [Portrait/Square]          -> scale width=480, height=-2 (auto)
    # -c:v libx264 : Use H.264 codec
    # -crf 23      : Standard quality (lower is better quality, higher is lower file size)
    # -c:a copy    : Copy audio stream without re-encoding (faster)
    
    ffmpeg -n -i "$FILE" \
    -vf "scale='if(gt(iw,ih),-2,480)':'if(gt(iw,ih),480,-2)'" \
    -c:v libx264 -crf 23 -preset fast \
    -c:a copy \
    "$OUTPUT_FILE" < /dev/null

done

echo "Conversion complete."
