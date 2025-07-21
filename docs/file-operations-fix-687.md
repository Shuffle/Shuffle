# Fix for Issue #687: Read-only File System Error in Python Execution

## Problem Description

Users encountered a "Read-only file system" error when trying to write files in Python code within Shuffle workflows. This occurred because:

1. Python code executes in Docker containers that may have read-only filesystems
2. The containers lacked proper volume mounts for file operations
3. No API was available for file operations from within workflow executions

## Solution Overview

This fix provides multiple layers of solution:

### 1. Container Volume Mounts (Backend Fix)

**File**: `functions/onprem/worker/worker.go`

- Added automatic writable volume mounts for all containers:
  - `/tmp/shuffle-files` - Persistent file storage (mapped to host `SHUFFLE_FILE_LOCATION`)
  - `/tmp/python-workspace` - Temporary workspace (100MB tmpfs)

### 2. File Operations API (Backend API)

**File**: `backend/go-app/main.go`

New API endpoints for file operations:
- `POST /api/v1/files/write` - Write files with text or binary content
- `GET /api/v1/files/read/{filename}` - Read file content
- `GET /api/v1/files/list` - List all files
- `DELETE /api/v1/files/delete/{filename}` - Delete files

### 3. Python Helper Library

**Files**: 
- `backend/app_gen/python-lib/shuffle_tools/__init__.py`
- `backend/app_gen/python-lib/shuffle_tools/file_operations.py`

Provides easy-to-use Python functions:
```python
from shuffle_tools import write_file, read_file, write_csv_file

# Write a CSV file
write_csv_file('output.csv', rows, headers)

# Write text file
write_file('data.json', json.dumps(data))

# Read file
content = read_file('data.json')
```

### 4. Frontend Code Examples

**Files**: 
- `frontend/src/components/ShuffleCodeEditor.jsx`
- `frontend/src/components/ShuffleCodeEditor1.jsx`

Added helpful code snippets in the code editor for:
- Writing CSV files
- Writing text files
- Reading files
- Managing files

## Usage Examples

### Original Problem Code (Would Fail)
```python
{% python %}
import csv
rows = [[ $shuffle_tools_1 ]] 
with open('okta.csv', 'w') as f:
    write = csv.writer(f)
    write.writerows(rows)
{% endpython %}
```

### Fixed Code (Works)
```python
{% python %}
from shuffle_tools import write_csv_file
import json

# Get data from previous node
data = json.loads(r"""$shuffle_tools_1""")

# Convert to CSV format
rows = []
for item in data:
    rows.append([item.get('field1', ''), item.get('field2', '')])

# Write CSV file using Shuffle's file API
headers = ['Field 1', 'Field 2']
result = write_csv_file('okta.csv', rows, headers)
print(f"CSV file created: {result}")
{% endpython %}
```

### Alternative Using Direct API
```python
{% python %}
import csv
import io
import requests
import json

# Create CSV content in memory
output = io.StringIO()
writer = csv.writer(output)

# Get data from previous node
data = json.loads(r"""$shuffle_tools_1""")
writer.writerows(data)
csv_content = output.getvalue()

# Write using Shuffle's file API
import os
base_url = os.getenv('BASE_URL', 'http://shuffle-backend:5001')
response = requests.post(f'{base_url}/api/v1/files/write', json={
    'filename': 'okta.csv',
    'content': csv_content,
    'encoding': 'utf-8'
})

print(f"File write result: {response.json()}")
{% endpython %}
```

## Benefits

1. **Backward Compatibility**: Existing workflows continue to work
2. **Easy Migration**: Simple import statement fixes the issue
3. **Flexible**: Supports both text and binary files
4. **Secure**: Proper filename sanitization and access controls
5. **Persistent**: Files are stored in the configured Shuffle files directory
6. **API Access**: Files can be accessed via REST API for integration

## Configuration

### Environment Variables

- `SHUFFLE_FILE_LOCATION`: Directory for persistent file storage (default: `/tmp/shuffle-files`)
- `BASE_URL`: Shuffle backend URL for API calls (auto-detected in most cases)

### Docker Compose

The fix automatically uses the existing `SHUFFLE_FILE_LOCATION` volume mount from docker-compose.yml:

```yaml
volumes:
  - ${SHUFFLE_FILE_LOCATION}:/shuffle-files:z
```

### Kubernetes

Uses the existing volume mounts from the Helm chart:

```yaml
volumeMounts:
  - mountPath: /shuffle-files
    name: shuffle-file-location
```

## Testing

Test the fix with this simple workflow:

```python
{% python %}
from shuffle_tools import write_file, read_file, list_files

# Write a test file
result = write_file('test.txt', 'Hello from Shuffle!')
print(f"Write result: {result}")

# Read it back
content = read_file('test.txt')
print(f"File content: {content}")

# List all files
files = list_files()
print(f"Available files: {[f['name'] for f in files]}")
{% endpython %}
```

## Migration Guide

To migrate existing workflows that have file operation issues:

1. **Replace direct file operations** with shuffle_tools functions
2. **Update import statements** to include shuffle_tools
3. **Test the workflow** to ensure files are created correctly
4. **Access files** via the Shuffle files directory or API

The fix is designed to be minimally invasive while providing a robust solution for file operations in Shuffle workflows.
