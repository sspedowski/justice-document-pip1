#!/usr/bin/env python3
"""
PDF Demo Script - Tests PDF processing with existing files
"""

import os
import sys
from pathlib import Path

# Add the current directory to the Python path so we can import our module
sys.path.insert(0, '.')

def find_pdf_files():
    """Find PDF files in the project"""
    pdf_files = []
    
    # Check uploads directory
    uploads_dir = Path("server/uploads")
    if uploads_dir.exists():
        pdf_files.extend(list(uploads_dir.glob("*.pdf")))
    
    # Check current directory
    current_dir = Path(".")
    pdf_files.extend(list(current_dir.glob("*.pdf")))
    
    return pdf_files

def main():
    print("PDF Processing Demo")
    print("==================")
    
    # Find available PDF files
    pdf_files = find_pdf_files()
    
    if not pdf_files:
        print("No PDF files found in the project.")
        print("Available locations checked:")
        print("- ./server/uploads/")
        print("- ./")
        print("\nTo test PDF processing, place a PDF file in one of these locations.")
        return
    
    print(f"Found {len(pdf_files)} PDF file(s):")
    for i, pdf_file in enumerate(pdf_files, 1):
        print(f"{i}. {pdf_file}")
    
    # Import and test our PDF processing module
    try:
        from update_pdf_links import update_pdf_links
        
        # Use the first PDF file for demo
        input_file = str(pdf_files[0])
        output_file = f"processed_{Path(input_file).name}"
        
        print(f"\nProcessing: {input_file}")
        print(f"Output will be: {output_file}")
        
        success = update_pdf_links(input_file, output_file)
        
        if success:
            print("\n✅ PDF processing demo completed successfully!")
            print(f"Check the output file: {output_file}")
        else:
            print("\n❌ PDF processing demo failed.")
            
    except ImportError as e:
        print(f"\n❌ Could not import PDF processing module: {e}")
        print("Make sure PyPDF2 is installed: pip install PyPDF2")
    except Exception as e:
        print(f"\n❌ Error during PDF processing: {e}")

if __name__ == "__main__":
    main()
