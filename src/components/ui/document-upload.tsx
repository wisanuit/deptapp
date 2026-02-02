"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Upload, X, FileText, Image, Loader2, 
  CreditCard, Home, FileCheck, Receipt, MoreHorizontal 
} from "lucide-react";

interface Document {
  id?: string;
  name: string;
  type: string;
  url: string;
}

interface DocumentUploadProps {
  documents: Document[];
  onAdd: (doc: Omit<Document, "id">) => void;
  onRemove: (index: number) => void;
  folder?: string;
}

const documentTypes = [
  { value: "ID_CARD", label: "บัตรประชาชน", icon: CreditCard },
  { value: "HOUSE_REGISTRATION", label: "ทะเบียนบ้าน", icon: Home },
  { value: "CONTRACT", label: "สัญญา", icon: FileCheck },
  { value: "RECEIPT", label: "ใบเสร็จ", icon: Receipt },
  { value: "OTHER", label: "อื่นๆ", icon: MoreHorizontal },
];

export function DocumentUpload({ 
  documents, 
  onAdd, 
  onRemove,
  folder = "documents"
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("ID_CARD");
  const [docName, setDocName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("รองรับเฉพาะไฟล์รูปภาพและ PDF");
      return;
    }

    // ตรวจสอบขนาด (สูงสุด 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกินไป (สูงสุด 5MB)");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const typeInfo = documentTypes.find(t => t.value === selectedType);
        onAdd({
          name: docName || file.name.split(".")[0] || typeInfo?.label || "เอกสาร",
          type: selectedType,
          url: data.url,
        });
        setDocName("");
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      } else {
        const data = await res.json();
        setError(data.error || "อัปโหลดล้มเหลว");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setUploading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = documentTypes.find(t => t.value === type);
    const Icon = typeInfo?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeLabel = (type: string) => {
    return documentTypes.find(t => t.value === type)?.label || type;
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  return (
    <div className="space-y-4">
      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border"
            >
              {isImage(doc.url) ? (
                <img 
                  src={doc.url} 
                  alt={doc.name} 
                  className="w-12 h-12 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {getTypeIcon(doc.type)}
                  {getTypeLabel(doc.type)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Form */}
      <div className="space-y-3 p-4 border-2 border-dashed border-border rounded-xl">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">ประเภทเอกสาร</label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">ชื่อเอกสาร (ไม่บังคับ)</label>
            <input
              type="text"
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              placeholder="เช่น บัตรประชาชนด้านหน้า"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center justify-center gap-2 w-full py-3 border border-primary text-primary rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">กำลังอัปโหลด...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span className="text-sm font-medium">เลือกไฟล์เพื่ออัปโหลด</span>
            </>
          )}
        </label>

        <p className="text-xs text-center text-muted-foreground">
          รองรับไฟล์รูปภาพ (JPG, PNG, GIF) และ PDF (สูงสุด 5MB)
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
