import React, { useCallback, useRef, useState } from 'react'
import { Upload, X, FileSpreadsheet } from 'lucide-react'

interface FileDropzoneProps {
  onFileSelect: (file: File) => void
  maxSizeMB?: number
  accept?: string
}

const MAX_SIZE_MB = 50

export function FileDropzone({
  onFileSelect,
  maxSizeMB = MAX_SIZE_MB,
  accept = '.xlsx',
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validate = (file: File): string | null => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return 'Solo se aceptan archivos .xlsx o .xls'
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `El archivo no puede superar ${maxSizeMB} MB`
    }
    return null
  }

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file)
      if (err) {
        setError(err)
        return
      }
      setError(null)
      setSelectedFile(file)
      onFileSelect(file)
    },
    [onFileSelect, maxSizeMB],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const removeFile = () => {
    setSelectedFile(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="w-full">
      {selectedFile ? (
        // Estado: archivo cargado
        <div className="flex items-center gap-3 px-4 py-3 border border-success/40 bg-success/5 rounded-lg">
          <FileSpreadsheet className="text-success shrink-0" size={20} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={removeFile}
            aria-label="Quitar archivo"
            className="p-1 rounded-full text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        // Estado: zona de drop
        <div
          role="button"
          tabIndex={0}
          aria-label="Área para arrastrar archivos Excel"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={[
            'flex flex-col items-center justify-center gap-2 px-6 py-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            isDragging
              ? 'border-secondary bg-secondary/5'
              : 'border-gray-300 bg-gray-50 hover:border-secondary hover:bg-secondary/5',
          ].join(' ')}
        >
          <Upload className="text-gray-400" size={28} />
          <p className="text-sm text-gray-600 font-medium">
            Arrastra tu archivo .xlsx aquí
          </p>
          <p className="text-xs text-gray-400">o haz clic para seleccionar</p>
          <p className="text-xs text-gray-400">Máximo {maxSizeMB} MB</p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  )
}

export default FileDropzone
