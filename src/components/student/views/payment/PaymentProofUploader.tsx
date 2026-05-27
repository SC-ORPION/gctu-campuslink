import React, { useState } from 'react';
import { Upload, X, Check, Loader2 } from 'lucide-react';

interface PaymentProofUploaderProps {
  onUploadComplete: (url: string) => void;
}

export default function PaymentProofUploader({ onUploadComplete }: PaymentProofUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    
    // Simulate premium upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          onUploadComplete('http://supabase.gctu-hostels/proof_of_payment.jpg');
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-[#475569]">Upload Payment Slip/Proof</label>
      
      {!file ? (
        <div className="relative border-2 border-dashed border-[#E2E8F0] rounded-xl p-8 hover:border-[#1D4ED8] transition-colors flex flex-col items-center justify-center text-center cursor-pointer">
          <input 
            type="file" 
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Upload className="text-[#94A3B8] mb-3" size={24} />
          <span className="text-xs font-semibold text-[#475569]">Click to upload files</span>
          <span className="text-[10px] text-[#94A3B8] mt-1">Accepts JPG, PNG, PDF (max 5MB)</span>
        </div>
      ) : (
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#EFF6FF] text-[#1D4ED8] rounded-lg text-xs font-bold">DOC</div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#0F172A] truncate max-w-[200px]">{file.name}</div>
                <div className="text-[10px] text-[#64748B] font-semibold">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            </div>
            
            {!uploading && progress < 100 && (
              <button 
                type="button" 
                onClick={() => setFile(null)}
                className="text-[#94A3B8] hover:text-[#DC2626] transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {uploading ? (
            <div className="space-y-2">
              <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#1D4ED8] transition-all duration-200" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-[#64748B]">
                <span>Uploading proof...</span>
                <span>{progress}%</span>
              </div>
            </div>
          ) : progress === 100 ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#059669] justify-center py-1">
              <Check size={16} />
              <span>Upload Successful</span>
            </div>
          ) : (
            <button 
              type="button"
              onClick={handleUpload}
              className="btn btn-secondary w-full"
            >
              Start Uploading Receipt
            </button>
          )}
        </div>
      )}
    </div>
  );
}
