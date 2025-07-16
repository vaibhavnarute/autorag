
import React, { useState, useCallback } from 'react';
import { Upload, FileText, Image, Link, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useLanguage } from '../hooks/useLanguage';
import CloudFileUpload from './CloudFileUpload';

const FileUpload = ({ onUpload }) => {
  const { language } = useLanguage();
  const [files, setFiles] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFiles = (newFiles) => {
    const processedFiles = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...processedFiles]);
    
    // Simulate upload process
    processedFiles.forEach(fileObj => {
      simulateUpload(fileObj.id);
    });

    if (onUpload) {
      onUpload(processedFiles);
    }
  };

  const simulateUpload = (fileId) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ));
      } else {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'uploading', progress: Math.round(progress) }
            : f
        ));
      }
    }, 200);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      const urlFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: urlInput,
        type: 'url',
        status: 'pending',
        progress: 0,
        url: urlInput
      };
      
      setFiles(prev => [...prev, urlFile]);
      simulateUpload(urlFile.id);
      setUrlInput('');
    }
  };

  const handleCloudUpload = (result) => {
    // Show the uploaded file in the upload queue
    setFiles(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: result.file_name,
        type: 'cloud',
        status: 'completed',
        progress: 100,
      },
    ]);
    if (onUpload) {
      onUpload([{ name: result.file_name, type: 'cloud', status: 'completed' }]);
    }
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (file) => {
    if (file.type === 'url') return <Link className="h-5 w-5" />;
    if (file.type?.startsWith('image/')) return <Image className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'uploading': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Add Content
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
          </TabsList>
          
          <TabsContent value="files" className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Supports PDF, DOCX, TXT, CSV files up to 10MB
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
                accept=".pdf,.docx,.txt,.csv"
              />
              <div className="flex gap-2 justify-center mt-2">
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose Files
                  </label>
                </Button>
                <CloudFileUpload projectId={1} onUploadComplete={handleCloudUpload} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Website URL</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/article"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  />
                  <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                    Add URL
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                We'll extract and process the content from the webpage
              </p>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Upload images for OCR processing
              </p>
              <p className="text-sm text-gray-600 mb-4">
                JPG, PNG, WebP up to 5MB each
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="image-upload"
                accept="image/*"
              />
              <Button asChild variant="outline">
                <label htmlFor="image-upload" className="cursor-pointer">
                  Choose Images
                </label>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="font-medium text-gray-900">Upload Queue</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                  <div className="text-blue-500">
                    {getFileIcon(file)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {file.size && (
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </span>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {file.type === 'url' ? 'URL' : file.type?.split('/')[1] || 'file'}
                      </Badge>
                    </div>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="mt-2 h-1" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;
