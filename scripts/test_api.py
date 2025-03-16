"""
Simple script to test the theory generation API endpoint.
"""

import requests
import json
import sys

def test_theory_endpoint(base_url, learning_objective):
    """
    Test the theory generation endpoint with a given learning objective.
    
    Args:
        base_url: Base URL of the API (e.g., http://127.0.0.1:8000)
        learning_objective: Learning objective to use for the request
    """
    url = f"{base_url}/theory/generate_theory"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    data = {
        "learning_objective": learning_objective
    }
    
    print(f"Making POST request to {url}")
    print(f"Request data: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(url, headers=headers, json=data)
        
        print(f"Response status code: {response.status_code}")
        print(f"Response headers: {json.dumps(dict(response.headers), indent=2)}")
        
        # Try to parse as JSON
        try:
            response_json = response.json()
            print(f"Response JSON: {json.dumps(response_json, indent=2)}")
            
            # Check for specific fields
            if "summary_text" in response_json:
                print("\nSummary text exists ✅")
                print(f"Summary text length: {len(response_json['summary_text'])}")
            else:
                print("\nSummary text missing ❌")
                
            if "warning" in response_json:
                print("\nWarning exists ✅")
                print(f"Warning: {response_json['warning']}")
            else:
                print("\nNo warning field ℹ️")
                
        except ValueError:
            print("Response is not valid JSON:")
            print(response.text)
            
    except Exception as e:
        print(f"Error making request: {str(e)}")

if __name__ == "__main__":
    base_url = "http://127.0.0.1:8000"
    learning_objective = "Balance chemical reactions using the law of conservation of mass"
    
    if len(sys.argv) > 1:
        learning_objective = sys.argv[1]
        
    test_theory_endpoint(base_url, learning_objective)