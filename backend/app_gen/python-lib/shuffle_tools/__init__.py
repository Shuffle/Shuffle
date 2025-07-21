"""
Shuffle Tools - Helper utilities for Shuffle workflows

This package provides helper functions and utilities to make working with
Shuffle workflows easier, including solutions for common issues like
file operations in containerized environments.
"""

from .file_operations import (
    write_file,
    write_binary_file,
    read_file,
    read_binary_file,
    list_files,
    delete_file,
    file_exists,
    write_csv_file,
    read_csv_file,
    ShuffleFileOperations
)

__version__ = "1.0.0"
__author__ = "Shuffle Team"

__all__ = [
    'write_file',
    'write_binary_file', 
    'read_file',
    'read_binary_file',
    'list_files',
    'delete_file',
    'file_exists',
    'write_csv_file',
    'read_csv_file',
    'ShuffleFileOperations'
]
