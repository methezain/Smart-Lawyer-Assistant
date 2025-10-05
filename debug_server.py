#!/usr/bin/env python3

# Mock server to capture the exact request data from frontend
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse

class RequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        # Log request details
        print(f"\n{'='*50}")
        print(f"POST {self.path}")
        print(f"Headers: {dict(self.headers)}")
        
        # Read the request body
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        content_type = self.headers.get('content-type', '')
        
        print(f"\nContent-Type: {content_type}")
        print(f"Content-Length: {content_length}")
        
        if 'multipart/form-data' in content_type:
            print("\nMultipart form data received:")
            # This is a simplified parser - in reality you'd use a proper multipart parser
            boundary = content_type.split('boundary=')[1]
            parts = post_data.split(f'--{boundary}'.encode())
            
            for i, part in enumerate(parts[1:-1]):  # Skip first empty and last boundary parts
                if b'Content-Disposition' in part:
                    lines = part.split(b'\r\n')
                    disposition_line = None
                    content_line_index = None
                    
                    for j, line in enumerate(lines):
                        if b'Content-Disposition' in line:
                            disposition_line = line.decode('utf-8', errors='ignore')
                        elif line == b'' and content_line_index is None:
                            content_line_index = j + 1
                            break
                    
                    if disposition_line and content_line_index:
                        # Extract field name
                        if 'name="' in disposition_line:
                            field_name = disposition_line.split('name="')[1].split('"')[0]
                            
                            # Get content (everything after the empty line, excluding final \r\n)
                            content_lines = lines[content_line_index:]
                            if content_lines and content_lines[-1] == b'':
                                content_lines = content_lines[:-1]
                            
                            content = b'\r\n'.join(content_lines)
                            
                            # Check if it's a file
                            if 'filename=' in disposition_line:
                                filename = disposition_line.split('filename="')[1].split('"')[0]
                                print(f"  {field_name}: [FILE: {filename}, size: {len(content)} bytes]")
                            else:
                                # Regular field
                                try:
                                    content_str = content.decode('utf-8')
                                    print(f"  {field_name}: {content_str}")
                                except:
                                    print(f"  {field_name}: [Binary data, size: {len(content)} bytes]")
        
        else:
            try:
                data = json.loads(post_data.decode())
                print(f"\nJSON Data: {json.dumps(data, indent=2)}")
            except:
                print(f"\nRaw Data: {post_data}")
        
        print(f"\n{'='*50}")
        
        # Send response with CORS headers
        self.send_response(400)  # Send a 400 to see error handling
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        # Send a mock validation error response
        response = {
            "status": "error",
            "message": "Validation failed - Mock server for debugging",
            "timestamp": "2025-10-05T10:57:27.766608",
            "errors": [
                {
                    "code": "MOCK_ERROR",
                    "field": "debug",
                    "message": "This is a mock server to capture request data"
                }
            ]
        }
        self.wfile.write(json.dumps(response).encode())

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8010), RequestHandler)
    print("Mock server running on http://localhost:8010")
    print("Modify frontend API base URL to use this server to capture requests")
    server.serve_forever()