"""
Shuffle File Operations Helper

This module provides helper functions to work with files in Shuffle workflows,
solving the read-only file system issue (#687) by using the Shuffle file API.

Usage:
    from shuffle_tools.file_operations import write_file, read_file, list_files, delete_file
    
    # Write a CSV file
    import csv
    import io
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerows([['Name', 'Age'], ['John', 30], ['Jane', 25]])
    csv_content = output.getvalue()
    
    # Write to file using Shuffle API
    write_file('users.csv', csv_content)
    
    # Read file back
    content = read_file('users.csv')
    print(content)
"""

import os
import json
import base64
import requests
from typing import Optional, Dict, Any, List


class ShuffleFileOperations:
    """Helper class for file operations in Shuffle workflows"""
    
    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize the file operations helper
        
        Args:
            base_url: Base URL for Shuffle API. If None, will try to detect from environment
        """
        self.base_url = base_url or self._get_base_url()
        self.session = requests.Session()
        
        # Try to get authentication from environment if available
        auth_header = os.getenv('SHUFFLE_AUTH_HEADER')
        if auth_header:
            self.session.headers.update({'Authorization': auth_header})
    
    def _get_base_url(self) -> str:
        """Get the base URL for Shuffle API from environment variables"""
        # Try common environment variables
        base_url = (
            os.getenv('SHUFFLE_BASE_URL') or 
            os.getenv('BASE_URL') or 
            os.getenv('BACKEND_URL') or
            'http://shuffle-backend:5001'  # Default for Docker
        )
        return base_url.rstrip('/')
    
    def write_file(self, filename: str, content: str, encoding: str = 'utf-8') -> Dict[str, Any]:
        """
        Write content to a file using Shuffle's file API
        
        Args:
            filename: Name of the file to write
            content: Content to write to the file
            encoding: Encoding to use ('utf-8' or 'base64')
            
        Returns:
            Dict with operation result
            
        Raises:
            Exception: If the file write operation fails
        """
        url = f"{self.base_url}/api/v1/files/write"
        
        payload = {
            'filename': filename,
            'content': content,
            'mode': 'text',
            'encoding': encoding
        }
        
        try:
            response = self.session.post(url, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to write file '{filename}': {str(e)}")
    
    def write_binary_file(self, filename: str, data: bytes) -> Dict[str, Any]:
        """
        Write binary data to a file
        
        Args:
            filename: Name of the file to write
            data: Binary data to write
            
        Returns:
            Dict with operation result
        """
        content_b64 = base64.b64encode(data).decode('utf-8')
        return self.write_file(filename, content_b64, encoding='base64')
    
    def read_file(self, filename: str) -> str:
        """
        Read content from a file
        
        Args:
            filename: Name of the file to read
            
        Returns:
            File content as string
            
        Raises:
            Exception: If the file read operation fails
        """
        url = f"{self.base_url}/api/v1/files/read/{filename}"
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            if not result.get('success'):
                raise Exception(f"File read failed: {result.get('message', 'Unknown error')}")
            
            content = result['content']
            if result.get('encoding') == 'base64':
                content = base64.b64decode(content).decode('utf-8')
            
            return content
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to read file '{filename}': {str(e)}")
    
    def read_binary_file(self, filename: str) -> bytes:
        """
        Read binary data from a file
        
        Args:
            filename: Name of the file to read
            
        Returns:
            File content as bytes
        """
        url = f"{self.base_url}/api/v1/files/read/{filename}"
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            if not result.get('success'):
                raise Exception(f"File read failed: {result.get('message', 'Unknown error')}")
            
            content = result['content']
            if result.get('encoding') == 'base64':
                return base64.b64decode(content)
            else:
                return content.encode('utf-8')
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to read binary file '{filename}': {str(e)}")
    
    def list_files(self) -> List[Dict[str, Any]]:
        """
        List all files in the Shuffle files directory
        
        Returns:
            List of file information dictionaries
        """
        url = f"{self.base_url}/api/v1/files/list"
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            if not result.get('success'):
                raise Exception(f"File list failed: {result.get('message', 'Unknown error')}")
            
            return result.get('files', [])
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to list files: {str(e)}")
    
    def delete_file(self, filename: str) -> Dict[str, Any]:
        """
        Delete a file
        
        Args:
            filename: Name of the file to delete
            
        Returns:
            Dict with operation result
        """
        url = f"{self.base_url}/api/v1/files/delete/{filename}"
        
        try:
            response = self.session.delete(url, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to delete file '{filename}': {str(e)}")
    
    def file_exists(self, filename: str) -> bool:
        """
        Check if a file exists
        
        Args:
            filename: Name of the file to check
            
        Returns:
            True if file exists, False otherwise
        """
        try:
            files = self.list_files()
            return any(f['name'] == filename for f in files)
        except:
            return False


# Global instance for easy access
_file_ops = ShuffleFileOperations()

# Convenience functions
def write_file(filename: str, content: str, encoding: str = 'utf-8') -> Dict[str, Any]:
    """Write content to a file using Shuffle's file API"""
    return _file_ops.write_file(filename, content, encoding)

def write_binary_file(filename: str, data: bytes) -> Dict[str, Any]:
    """Write binary data to a file"""
    return _file_ops.write_binary_file(filename, data)

def read_file(filename: str) -> str:
    """Read content from a file"""
    return _file_ops.read_file(filename)

def read_binary_file(filename: str) -> bytes:
    """Read binary data from a file"""
    return _file_ops.read_binary_file(filename)

def list_files() -> List[Dict[str, Any]]:
    """List all files in the Shuffle files directory"""
    return _file_ops.list_files()

def delete_file(filename: str) -> Dict[str, Any]:
    """Delete a file"""
    return _file_ops.delete_file(filename)

def file_exists(filename: str) -> bool:
    """Check if a file exists"""
    return _file_ops.file_exists(filename)


# CSV helper functions
def write_csv_file(filename: str, rows: List[List[Any]], headers: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Write data to a CSV file
    
    Args:
        filename: Name of the CSV file
        rows: List of rows to write
        headers: Optional headers for the CSV
        
    Returns:
        Dict with operation result
    """
    import csv
    import io
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    if headers:
        writer.writerow(headers)
    
    writer.writerows(rows)
    csv_content = output.getvalue()
    
    return write_file(filename, csv_content)

def read_csv_file(filename: str, has_headers: bool = True) -> List[List[str]]:
    """
    Read data from a CSV file
    
    Args:
        filename: Name of the CSV file
        has_headers: Whether the CSV has headers
        
    Returns:
        List of rows from the CSV
    """
    import csv
    import io
    
    content = read_file(filename)
    reader = csv.reader(io.StringIO(content))
    
    rows = list(reader)
    
    if has_headers and rows:
        return rows[1:]  # Skip headers
    
    return rows
