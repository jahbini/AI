#!/bin/bash
# extract.sh - Extracts H3 headers, first paragraph, merges bullets, and correctly escapes quotes.

awk '
  BEGIN { RS="\n+"; FS="\n"; seen=1; inside_page=0; paragraph=""; header=""; skip_next=0; }
    /^### / {
        if (header && paragraph){ 
            gsub(/"/, "\\\"", header); 
            gsub(/"/, "\\\"", paragraph);
            print "{\"header\": \"" header "\", \"text\": \"" paragraph "\"},";
            } 
          header=$0;
          paragraph=""; 
          seen=0;
          next
         }
    /^- / {if (seen == 0) paragraph = paragraph " " $0; next}  # Merge bullet points into paragraph
    /^[^#]/ {if (seen == 0) {paragraph=paragraph" "$0; seen=1}; next}  # Capture first paragraph only
    END { if (header && paragraph) 
                gsub(/"/, "\\\"", header);
                gsub(/"/, "\\\"", paragraph);
                print "{\"header\": \"" header "\", \"text\": \"" paragraph "\"}";
          }

'
