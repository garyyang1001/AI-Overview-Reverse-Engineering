/**
 * Download utilities for exporting files
 */

/**
 * Trigger download of a blob as a file
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to body to ensure it works in all browsers
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Download file from URL with progress tracking
 */
export const downloadFileWithProgress = async (
  url: string,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Unable to read response body');
    }

    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      receivedLength += value.length;
      
      if (onProgress && total > 0) {
        const progress = (receivedLength / total) * 100;
        onProgress(progress);
      }
    }

    // Combine chunks into single array
    const chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      chunksAll.set(chunk, position);
      position += chunk.length;
    }

    // Create blob and download
    const blob = new Blob([chunksAll]);
    downloadBlob(blob, filename);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

/**
 * Generate filename with timestamp
 */
export const generateFilename = (
  prefix: string,
  extension: string,
  jobId?: string
): string => {
  const date = new Date().toISOString().split('T')[0];
  const parts = [prefix];
  
  if (jobId) {
    parts.push(jobId.substring(0, 8));
  }
  
  parts.push(date);
  
  return `${parts.join('-')}.${extension}`;
};