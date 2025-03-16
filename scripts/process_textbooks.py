"""
Process OpenStax textbooks and build the vector database.

This script:
1. Processes PDF textbooks from a source directory
2. Extracts and cleans text
3. Splits content into appropriate chunks
4. Builds and saves a FAISS vector index

Usage:
    python -m scripts.process_textbooks --source_dir "/path/to/textbooks" --output_dir "data"
"""

import os
import argparse
import logging
import glob
from tqdm import tqdm
import time

# Set up imports for the app modules
import sys
sys.path.append('.')  # Add the current directory to the path

from app.utils.document_processor import DocumentProcessor
from app.core.rag_system import RAGSystem

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("textbook_processing.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def process_textbooks(source_dir: str, output_dir: str, rebuild: bool = False):
    """
    Process all textbooks in the source directory and build the vector index.
    
    Args:
        source_dir: Directory containing PDF textbooks
        output_dir: Directory to save the vector index and chunk data
        rebuild: Whether to rebuild the index from scratch
    """
    start_time = time.time()
    logger.info(f"Starting textbook processing from {source_dir}")
    
    # Initialize processors
    doc_processor = DocumentProcessor(chunk_size=800, chunk_overlap=100)
    
    # Initialize RAG system with custom paths
    index_path = os.path.join(output_dir, "vector_index")
    chunk_data_path = os.path.join(output_dir, "chunks.json")
    
    rag_system = RAGSystem(
        index_path=index_path,
        chunk_data_path=chunk_data_path,
        load_on_init=not rebuild  # Only load existing index if not rebuilding
    )
    
    # Find all PDF files in the source directory
    pdf_files = glob.glob(os.path.join(source_dir, "**", "*.pdf"), recursive=True)
    logger.info(f"Found {len(pdf_files)} PDF files")
    
    if not pdf_files:
        logger.warning(f"No PDF files found in {source_dir}")
        return
    
    # Process each PDF file
    all_chunks = []
    
    for pdf_file in tqdm(pdf_files, desc="Processing textbooks"):
        try:
            logger.info(f"Processing {os.path.basename(pdf_file)}")
            
            # Extract chunks and metadata
            chunks, metadata = doc_processor.process_document(pdf_file)
            logger.info(f"Extracted {len(chunks)} chunks from {metadata['filename']}")
            
            all_chunks.extend(chunks)
            
        except Exception as e:
            logger.error(f"Error processing {pdf_file}: {str(e)}")
    
    # Build or update the index
    if rebuild or not os.path.exists(index_path):
        logger.info(f"Building new index with {len(all_chunks)} total chunks")
        success = rag_system.create_index(all_chunks)
    else:
        logger.info(f"Adding {len(all_chunks)} new chunks to existing index")
        success = rag_system.add_chunks(all_chunks)
    
    if success:
        logger.info("Successfully built vector index")
    else:
        logger.error("Failed to build vector index")
    
    elapsed_time = time.time() - start_time
    logger.info(f"Textbook processing completed in {elapsed_time:.2f} seconds")

def main():
    """Main function to parse arguments and execute processing."""
    parser = argparse.ArgumentParser(description="Process textbooks and build vector index")
    parser.add_argument("--source_dir", type=str, required=True, help="Directory containing PDF textbooks")
    parser.add_argument("--output_dir", type=str, default="data", help="Directory to save the vector index")
    parser.add_argument("--rebuild", action="store_true", help="Rebuild the index from scratch")
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Process textbooks
    process_textbooks(args.source_dir, args.output_dir, args.rebuild)

if __name__ == "__main__":
    main()