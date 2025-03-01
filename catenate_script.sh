#!/bin/bash

# example: bash catenate_script.sh `find $ROUTES -name '+page.svx' `  >allpages.md

# Check if at least one file is provided
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 file1.md file2.md ... > output.mdx"
    exit 1
fi

first_file=false  # Flag to track the first file

for file in "$@"; do
    if [[ -f "$file" ]]; then  # Ensure file exists
        # Extract 'fields.title' from the front matter, removing any quotes
        title=$(awk '
            BEGIN {found=0}
            /^fields:/ {found=1; next}  # Detect the start of the "fields" block
            found && /^[[:space:]]*title:/ {
                gsub(/^[[:space:]]*title:[[:space:]]*/, "");  # Remove leading "title:"
                gsub(/^["'\''"]|["'\''"]$/, "");  # Strip single or double quotes
                print; exit;
            }
        ' "$file")

        # Default to filename if no title is found
        if [[ -z "$title" ]]; then
            title="$file"
        fi

        echo "*******($file)*******"
        echo "# $title"  # Use both extracted title and filename
        echo ""  # Add an empty line

        if $first_file; then
            # Process first file: Keep front matter, clean script & style tags, strip formatting
            awk '
                BEGIN {skip=0}
                /^<script>/ {skip=1; print ""; next}
                /<\/script>/ {skip=0; print ""; next}
                /^<style>/ {skip=1; print ""; next}
                /<\/style>/ {skip=0; print ""; next}
                !skip
            ' "$file" | sed 's/\*\*//g; s/__//g; s/\*//g; s/_//g'  # Remove bold/italic markers

            first_file=false
        else
            # Remove front matter, clean script & style tags, strip formatting
            awk '
                BEGIN {skip=0; p=0}
                NR==1 && /^---$/ {p=1; next}
                p && /^---$/ {p=0; next}
                /^<script>/ {skip=1; print ""; next}
                /<\/script>/ {skip=0; print ""; next}
                /^<style>/ {skip=1; print ""; next}
                /<\/style>/ {skip=0; print ""; next}
                !skip && !p
            ' "$file" | sed 's/\*\*//g; s/__//g; s/\*//g; s/_//g'  # Remove bold/italic markers
        fi

        echo -e "\n"  # Add a newline for separation
    else
        echo "Skipping $file (not found)" >&2  # Print error to stderr
    fi
done
