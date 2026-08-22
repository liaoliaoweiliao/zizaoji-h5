#!/usr/bin/env python3
"""带CORS头的HTTP服务器，解决海报Canvas导出跨域问题"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8084
    server = HTTPServer(('0.0.0.0', port), CORSRequestHandler)
    print(f'CORS服务器启动在端口 {port}')
    server.serve_forever()
