import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import ReactJson from 'react-json-view-ssr';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

const HighlightedValueInSearch = ({ value, searchTerm, theme }) => {
  const containerRef = useRef(null);
  const preRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  const isJson = useCallback((str) => {
    if (typeof str === 'object' && str !== null) return true;
    if (typeof str !== 'string') return false;
    
    const trimmed = str.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
    
    try { 
      JSON.parse(trimmed); 
      return true; 
    } catch { 
      return false; 
    }
  }, []);

  const getJsonValue = useCallback((val) => {
    try {
      return typeof val === 'object' ? val : JSON.parse(val.trim());
    } catch {
      return null;
    }
  }, []);

  const highlightInJson = useCallback((jsonStr, term) => {
    if (!term) return jsonStr;
    
    try {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedTerm})`, 'gi');
      const highlightId = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return jsonStr.replace(regex, `<mark id="${highlightId}" style="background: rgba(255,255,0,0.4); padding: 0 2px; border-radius: 2px;">$1</mark>`);
    } catch {
      return jsonStr;
    }
  }, []);

  const isPythonCode = useCallback((str) => {
    if (typeof str !== 'string') return false;
    
    const pythonPatterns = [
      'import ', 'from ', 'def ', 'class ', 'if __name__',
      'print(', 'return ', 'elif ', 'except:', 'try:', 'with ',
      'lambda ', 'yield ', 'async def', 'await '
    ];

    const trimmed = str.trim();
    return pythonPatterns.some(pattern => trimmed.includes(pattern)) && 
          (trimmed.includes('def') || trimmed.includes('class'));
  }, []);

  useEffect(() => {
    if (!searchTerm || !containerRef.current || !preRef.current) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      try {
        const container = containerRef.current;
        const firstHighlight = preRef.current?.querySelector('mark');
        
        if (firstHighlight && container) {
          const containerRect = container.getBoundingClientRect();
          const highlightRect = firstHighlight.getBoundingClientRect();
          const scrollTop = highlightRect.top - containerRect.top + container.scrollTop - (container.clientHeight / 2);
          
          container.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
        }
      } catch (error) {
        console.warn('Auto-scroll failed:', error);
      }
    }, 100);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [searchTerm, value]);

  const RegularText = useCallback(({ value: textValue, searchTerm: term }) => {
    if (!textValue) return <span>No content</span>;
    
    const stringValue = String(textValue);
    
    // Check if it's Python code
    if (isPythonCode(stringValue)) {
      const lines = stringValue.split('\n');
      const isNodeView = lines[0]?.startsWith('Node:');
      const nodeTitle = isNodeView ? lines[0] : null;
      const codeContent = isNodeView ? lines.slice(1).join('\n') : stringValue;

      return (
        <div style={{ 
          backgroundColor: '#1e1e1e',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          {nodeTitle && (
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#E0E0E0',
              fontSize: '14px',
              fontWeight: 500,
            }}>
              {nodeTitle}
            </div>
          )}
          
          <div style={{
            padding: '8px',
            maxHeight: '400px',
            overflow: 'auto',
          }}>
            <CodeMirror
              value={codeContent}
              theme={vscodeDark}
              extensions={[python()]}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: false,
                highlightActiveLineGutter: false,
                highlightSpecialChars: false,
                drawSelection: false,
              }}
              editable={false}
              style={{
                fontSize: '13px',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
              }}
              height="auto"
            />
          </div>
        </div>
      );
    }
    
    if (!term) {
      return (
        <span style={{  
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          display: 'inline-block',
          maxWidth: '100%'
        }}>
          {stringValue}
        </span>
      );
    }

    try {
      const parts = stringValue.split(term);
      return (
        <span style={{  
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          display: 'inline-block',
          maxWidth: '100%'
        }}>
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {part}
              {index < parts.length - 1 && (
                <span style={{ 
                  backgroundColor: 'rgba(255, 255, 0, 0.3)', 
                  padding: '0 2px',
                  borderRadius: '2px',
                }}>
                  {term}
                </span>
              )}
            </React.Fragment>
          ))}
        </span>
      );
    } catch {
      return <span>{stringValue}</span>;
    }
  }, [isPythonCode]);

  if (value == null) {
    return <span style={{ color: '#888', fontStyle: 'italic' }}>null</span>;
  }

  try {
    if (isJson(value)) {
      const jsonValue = getJsonValue(value);
      
      if (jsonValue === null) {
        return <RegularText value={String(value)} searchTerm={searchTerm} />;
      }

      const jsonString = JSON.stringify(jsonValue, null, 2);
      const hasMatch = searchTerm && jsonString.toLowerCase().includes(searchTerm.toLowerCase());
      
      return (
        <div 
          ref={containerRef}
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.2)', 
            padding: '8px', 
            borderRadius: '4px', 
            maxHeight: '200px', 
            overflow: 'auto'
          }}
        >
          {hasMatch ? (
            <pre 
              ref={preRef}
              style={{ 
                fontFamily: 'Monaco, monospace', 
                fontSize: '12px', 
                color: '#d4d4d4', 
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}
              dangerouslySetInnerHTML={{ __html: highlightInJson(jsonString, searchTerm) }}
            />
          ) : (
            <ReactJson
              src={jsonValue}
              theme={theme?.palette?.jsonTheme || 'monokai'}
              name={false}
              collapsed={2}
              enableClipboard={true}
              style={{ backgroundColor: 'transparent', fontSize: '12px' }}
              displayDataTypes={false}
            />
          )}
        </div>
      );
    }

    return <RegularText value={value} searchTerm={searchTerm} />;
    
  } catch (error) {
    console.error('HighlightedValueInSearch error:', error);
    return <RegularText value={String(value)} searchTerm={searchTerm} />;
  }
};

export default React.memo(HighlightedValueInSearch);