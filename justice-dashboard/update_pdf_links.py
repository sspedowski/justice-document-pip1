#!/usr/bin/env python3
"""
PDF Link Updater and Bookmark Creator
Applies hyperlink corrections and adds bookmarks to PDF files

Requirements:
    pip install PyPDF2

Usage:
    python update_pdf_links.py input.pdf [output.pdf]
"""

import sys
import os
from pathlib import Path

# Safe import with proper error handling
try:
    import PyPDF2
except ImportError:
    print("\n❌ ERROR: PyPDF2 is not installed.")
    print("\nTo install the required dependency, run:")
    print("    pip install PyPDF2")
    print("\nOr if using conda:")
    print("    conda install -c conda-forge pypdf2")
    print("\nThen try running this script again.")
    sys.exit(1)

def update_pdf_links(input_file, output_file=None):
    """
    Updates PDF links and adds bookmarks
    
    Args:
        input_file (str): Path to input PDF
        output_file (str): Path to output PDF (optional)
    """
    
    if not os.path.exists(input_file):
        print(f"\nError: Input file '{input_file}' not found.")
        print("\nTroubleshooting steps:")
        print("1. Check if the file exists in these locations:")
        print("   • server/uploads/")
        print("   • uploads/")
        print("   • current directory")
        print("2. Verify file permissions")
        print("3. Try using the full absolute path")
        print("\nExample: python update_pdf_links.py C:\\Users\\ssped\\Documents\\input.pdf")
        return False
    
    if output_file is None:
        base_name = Path(input_file).stem
        output_file = f"{base_name}_updated.pdf"
    
    try:
        print(f"Processing PDF: {input_file}")
        
        # Read the input PDF
        with open(input_file, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            writer = PyPDF2.PdfWriter()
            
            print(f"Found {len(reader.pages)} pages")
            
            # Copy pages and update annotations
            for page_num, page in enumerate(reader.pages):
                print(f"Processing page {page_num + 1}...")
                
                # Check for annotations and update links
                if '/Annots' in page:
                    annotations = page['/Annots']
                    for annot_ref in annotations:
                        try:
                            annot = annot_ref.get_object()
                            if annot and '/A' in annot:
                                action = annot['/A']
                                if '/URI' in action:
                                    old_uri = str(action['/URI'])
                                    # Update specific patterns
                                    if 'old-link.pdf' in old_uri:
                                        action[PyPDF2.generic.NameObject('/URI')] = PyPDF2.generic.TextStringObject(output_file)
                                        print(f"Updated link: {old_uri} -> {output_file}")
                        except Exception as e:
                            print(f"Warning: Could not process annotation on page {page_num + 1}: {e}")
                
                writer.add_page(page)
            
            # Add bookmarks for legal document structure
            print("Adding bookmarks...")
            
            # Calculate approximate bookmark positions based on page count
            total_pages = len(reader.pages)
            
            if total_pages >= 3:
                bookmark_positions = {
                    "1. Executive Summary": 0,
                    "2. Police Misconduct Analysis": max(1, total_pages // 4),
                    "3. CPA Misconduct Documentation": max(2, total_pages // 2),
                    "4. CPS Misconduct Evidence": max(3, (3 * total_pages) // 4),
                    "5. Legal Conclusions": max(4, total_pages - 2)
                }
                
                for title, page_num in bookmark_positions.items():
                    if page_num < total_pages:
                        writer.add_outline_item(title, page_num)
                        print(f"Added bookmark: {title} (page {page_num + 1})")
            
            # Write the updated PDF
            with open(output_file, 'wb') as output:
                writer.write(output)
        
        print(f"Successfully updated PDF saved as: {output_file}")
        return True
        
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return False

def main():
    """Main function to handle command line arguments"""
    
    if len(sys.argv) < 2:
        print("Usage: python update_pdf_links.py <input_file> [output_file]")
        print("Example: python update_pdf_links.py old.pdf 'MCL, Federal Law- Misconduct Analysis (2).pdf'")
        return
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Default output name if not specified
    if output_file is None:
        output_file = "MCL, Federal Law- Misconduct Analysis (2).pdf"
    
    success = update_pdf_links(input_file, output_file)
    
    if success:
        print("\nPDF processing completed successfully!")
        print(f"Input: {input_file}")
        print(f"Output: {output_file}")
    else:
        print("PDF processing failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
