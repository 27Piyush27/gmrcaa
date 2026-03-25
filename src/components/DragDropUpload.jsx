import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileIcon, X, Image, FileText } from "lucide-react";

export function DragDropUpload({ onFilesSelected, accept = "*", maxFiles = 5, maxSizeMB = 10 }) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback((newFiles) => {
    const validFiles = newFiles.filter(f => f.size <= maxSizeMB * 1024 * 1024).slice(0, maxFiles - files.length);
    const updated = [...files, ...validFiles];
    setFiles(updated);
    if (onFilesSelected) onFilesSelected(updated);
  }, [files, maxSizeMB, maxFiles, onFilesSelected]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, [processFiles]);

  const handleFileInput = useCallback((e) => {
    const selected = Array.from(e.target.files);
    processFiles(selected);
  }, [processFiles]);

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    if (onFilesSelected) onFilesSelected(updated);
  };

  const getFileIcon = (type) => {
    if (type?.startsWith("image/")) return <Image className="w-4 h-4 text-blue-500" />;
    if (type?.includes("pdf")) return <FileText className="w-4 h-4 text-red-500" />;
    return <FileIcon className="w-4 h-4 text-muted-foreground" />;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{ 
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? "hsl(var(--accent))" : undefined
        }}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          isDragging 
            ? "border-accent bg-accent/5" 
            : "border-border/60 hover:border-foreground/30 hover:bg-secondary/30"
        }`}
        onClick={() => document.getElementById("file-upload-input")?.click()}
      >
        <input
          id="file-upload-input"
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="space-y-3">
          <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
            isDragging ? "bg-accent/10" : "bg-secondary"
          }`}>
            <Upload className={`w-6 h-6 ${isDragging ? "text-accent" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-sm font-medium">
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse • Max {maxSizeMB}MB per file • Up to {maxFiles} files
            </p>
          </div>
        </div>
      </motion.div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <motion.div
              key={`${file.name}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card"
            >
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="w-6 h-6 rounded-full hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
