#!/bin/bash
# extract.sh - Extracts H3 headers, first paragraph, merges bullets, and correctly escapes quotes.

awk '
  BEGIN { 
      RS="\n+"; FS="\n"; seen=1; inside_page=0; paragraph=""; header=""; skip_next=0; route="";
  }
  
  # Detect route page declaration
  /^\*{7}\(routes\// { 
      route=$0; 
      gsub(/^\*{7}\(|\)\*{7}$/, "", route);  # Remove the *******() markers
      sub("^routes/", "", route);            # Remove the "routes/" prefix
      sub("/\\+page\\.svx$", "", route);     # Remove the trailing "/+page.svx"
      if (route == "" || route == "+page.svx") route = "/";  # Default to "/" if empty or just "+page.svx"
      next;
  }

  /^### / {
      if (header && paragraph){
          gsub(/"/, "\\\"", header);
          gsub(/"/, "\\\"", paragraph);
          gsub(/"/, "\\\"", route);
          print "{\"header\": \"" header "\", \"text\": \"" paragraph "\", \"route\": \"" route "\"},";
      }
      header=$0;
      paragraph="";
      seen=0;
      next;
  }
  
  /^- / { if (seen == 0) paragraph = paragraph " " $0; next; }  # Merge bullet points into paragraph
  /^[^#]/ { if (seen == 0) { paragraph=paragraph" "$0; seen=1; } next; }  # Capture first paragraph only

  END { 
      if (header && paragraph) {
          gsub(/"/, "\\\"", header);
          gsub(/"/, "\\\"", paragraph);
          gsub(/"/, "\\\"", route);
          print "{\"header\": \"" header "\", \"text\": \"" paragraph "\", \"route\": \"" route "\"}";
      }
  }
' "${1:-/dev/stdin}"
