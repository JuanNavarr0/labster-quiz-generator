"""
Diagnostic script to check the RAG index loading.
"""

import os
import sys
import logging

# Add the current directory to Python path
sys.path.append('.')

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    # Import the RAG system
    from app.core.rag_system import RAGSystem
    
    # Check expected index location
    data_dir = os.path.abspath("data")
    index_path = os.path.join(data_dir, "vector_index")
    chunks_path = os.path.join(data_dir, "chunks.json")
    
    logger.info(f"Checking data directory: {data_dir}")
    logger.info(f"Expected index path: {index_path}")
    logger.info(f"Expected chunks path: {chunks_path}")
    
    # Check if files exist
    logger.info(f"Index file exists: {os.path.exists(index_path)}")
    logger.info(f"Chunks file exists: {os.path.exists(chunks_path)}")
    
    # Try to initialize the RAG system
    logger.info("Attempting to initialize RAG system...")
    rag = RAGSystem(
        index_path=index_path,
        chunk_data_path=chunks_path,
        load_on_init=True
    )
    
    # Check if the index was loaded
    if rag.index is not None and hasattr(rag.index, 'ntotal'):
        logger.info(f"✅ Successfully loaded index with {rag.index.ntotal} vectors")
        logger.info(f"✅ Loaded {len(rag.chunks)} chunks")
        
        # Test retrieval
        test_query = "Balance chemical equations using the law of conservation of mass"
        logger.info(f"Testing retrieval with query: {test_query}")
        context = rag.retrieve_context(test_query)
        logger.info(f"Retrieved {len(context.chunks)} chunks with confidence {context.overall_confidence}")
        
        # Print sample chunk
        if context.chunks:
            logger.info("Sample chunk text:")
            logger.info(f"Source: {context.chunks[0].source}")
            logger.info(f"Subject: {context.chunks[0].subject}")
            logger.info(f"Text: {context.chunks[0].text[:200]}...")
    else:
        logger.error("❌ Failed to load index")
        
except Exception as e:
    logger.error(f"Error: {str(e)}")
    import traceback
    logger.error(traceback.format_exc())