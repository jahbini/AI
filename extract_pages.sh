#!/bin/bash
# extract_pages.sh - Extracts full pages (title + content until next page marker)

awk '
BEGIN { RS="\n+"; FS="\n"; inside_page=0; page_text=""; last_title=""; skip_next=0; }

/^\*\*\*\*\*/ { 
    if (inside_page && page_text != "" && last_title != "") { 
        gsub(/"/, "\\\"", last_title);
        gsub(/"/, "\\\"", page_text); 
        print "{\"header\": \"" last_title "\", \"text\": \"" page_text "\"},"; 
    }
    inside_page=1; page_text=""; last_title=""; skip_next=1;  
    next;
}

/^# / { 
    if (skip_next == 1) {  
        last_title = substr($0, 3);  # ✅ Capture only the first line of title
        skip_next=0;  
        next; 
    }
}

/^- / { 
    page_text = (page_text == "" ? "" : page_text " ") substr($0, 3); 
    next; 
}

/^## / { 
    page_text = (page_text == "" ? "" : page_text " ") substr($0, 4); 
    next; 
}

!/^#/ && !/^-/ { 
    page_text = (page_text == "" ? "" : page_text " ") $0; 
}

END { 
    if (inside_page && page_text != "" && last_title != "") { 
        gsub(/"/, "\\\"", last_title);
        gsub(/"/, "\\\"", page_text); 
        print "{\"header\": \"" last_title "\", \"text\": \"" page_text "\"}"; 
    }
}
' "$1"
