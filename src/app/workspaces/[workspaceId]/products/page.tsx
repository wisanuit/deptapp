"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { FeatureLockModal, type UsageData } from "@/components/ui/feature-lock";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  ArrowLeft,
  Package,
  Plus,
  Search,
  MoreHorizontal,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  X,
  Edit,
  Trash2,
  Box,
  BarChart3,
  Filter,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  cost?: number;
  category?: string;
  sku?: string;
  barcode?: string;
  unit?: string;
  stockQty: number;
  minStock: number;
  maxStock?: number;
  isActive: boolean;
  createdAt: string;
}

export default function ProductsPage() {
  const params = useParams();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [processing, setProcessing] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    price: "",
    cost: "",
    category: "",
    sku: "",
    barcode: "",
    unit: "ชิ้น",
    stockQty: "0",
    minStock: "0",
  });

  const [editProductForm, setEditProductForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    price: "",
    cost: "",
    category: "",
    sku: "",
    barcode: "",
    unit: "ชิ้น",
    minStock: "0",
  });

  const [stockForm, setStockForm] = useState({
    type: "IN",
    quantity: "",
    reference: "",
    note: "",
    cost: "",
  });

  const fetchProducts = useCallback(async () => {
    try {
      const searchParams = new URLSearchParams();
      if (search) searchParams.set("search", search);
      if (selectedCategory) searchParams.set("category", selectedCategory);

      const res = await fetch(
        `/api/workspaces/${workspaceId}/products?${searchParams}`
      );
      const data = await res.json();
      setProducts(data.products || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, search, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ตรวจสอบ limit ก่อนเปิด modal เพิ่มสินค้า
  const checkLimitAndOpenModal = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/check-limit?feature=PRODUCTS`);
      const data = await res.json();
      
      if (!data.allowed) {
        setUsageData(data);
        setShowLockModal(true);
      } else {
        setShowAddProduct(true);
      }
    } catch (error) {
      // ถ้าเช็คไม่ได้ ให้เปิด modal ได้เลย
      console.error("Error checking limit:", error);
      setShowAddProduct(true);
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.name) {
      toast.error("กรุณาระบุชื่อสินค้า");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });

      if (res.ok) {
        toast.success("เพิ่มสินค้าสำเร็จ");
        setShowAddProduct(false);
        setProductForm({
          name: "",
          description: "",
          imageUrl: "",
          price: "",
          cost: "",
          category: "",
          sku: "",
          barcode: "",
          unit: "ชิ้น",
          stockQty: "0",
          minStock: "0",
        });
        fetchProducts();
      } else {
        const error = await res.json();
        toast.error(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditProductForm({
      name: product.name,
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      price: product.price?.toString() || "",
      cost: product.cost?.toString() || "",
      category: product.category || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      unit: product.unit || "ชิ้น",
      minStock: product.minStock?.toString() || "0",
    });
    setShowEditProduct(true);
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !editProductForm.name) {
      toast.error("กรุณาระบุชื่อสินค้า");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/products/${editingProduct.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editProductForm),
        }
      );

      if (res.ok) {
        toast.success("แก้ไขสินค้าสำเร็จ");
        setShowEditProduct(false);
        setEditingProduct(null);
        fetchProducts();
      } else {
        const error = await res.json();
        toast.error(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setProcessing(false);
    }
  };

  const handleStockMovement = async () => {
    if (!selectedProduct || !stockForm.quantity) {
      toast.error("กรุณาระบุจำนวน");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/products/${selectedProduct.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stockForm),
        }
      );

      if (res.ok) {
        toast.success("อัพเดทสต๊อกสำเร็จ");
        setShowStockModal(false);
        setSelectedProduct(null);
        setStockForm({
          type: "IN",
          quantity: "",
          reference: "",
          note: "",
          cost: "",
        });
        fetchProducts();
      } else {
        const error = await res.json();
        toast.error(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setProcessing(false);
    }
  };

  const openStockModal = (product: Product, type: string) => {
    setSelectedProduct(product);
    setStockForm({ ...stockForm, type });
    setShowStockModal(true);
  };

  // Summary stats
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stockQty <= p.minStock);
  // ใช้ cost ถ้ามี หรือ price เป็น fallback
  const totalValue = products.reduce(
    (sum, p) => sum + ((p.cost ?? p.price) || 0) * p.stockQty,
    0
  );
  const totalStock = products.reduce((sum, p) => sum + p.stockQty, 0);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link
                href={`/workspaces/${workspaceId}`}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-base">จัดการสต๊อกสินค้า</h1>
                  <p className="text-xs text-muted-foreground">
                    {totalProducts} รายการ
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={checkLimitAndOpenModal}
              className="rounded-full bg-orange-600 hover:bg-orange-700 gap-2"
            >
              <Plus className="h-4 w-4" />
              เพิ่มสินค้า
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Box className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProducts}</p>
                <p className="text-xs text-muted-foreground">สินค้าทั้งหมด</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  lowStockProducts.length > 0
                    ? "bg-red-100 dark:bg-red-900"
                    : "bg-green-100 dark:bg-green-900"
                }`}
              >
                <AlertTriangle
                  className={`h-5 w-5 ${
                    lowStockProducts.length > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${
                    lowStockProducts.length > 0 ? "text-red-600" : ""
                  }`}
                >
                  {lowStockProducts.length}
                </p>
                <p className="text-xs text-muted-foreground">สต๊อกต่ำ</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-xs text-muted-foreground">หมวดหมู่</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  ฿{totalValue.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  มูลค่าสต๊อก ({totalStock.toLocaleString()} ชิ้น)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาสินค้า..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-full bg-card text-sm"
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-700 dark:text-red-400">
                สินค้าสต๊อกต่ำ
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map((p) => (
                <Badge
                  key={p.id}
                  variant="outline"
                  className="bg-red-100 text-red-700 border-red-200"
                >
                  {p.name} ({p.stockQty}/{p.minStock})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <p className="text-muted-foreground">กำลังโหลด...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">ยังไม่มีสินค้า</p>
            <p className="text-sm text-muted-foreground mb-4">
              เริ่มเพิ่มสินค้าแรกของคุณ
            </p>
            <Button
              onClick={() => setShowAddProduct(true)}
              className="rounded-full bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มสินค้า
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => {
              const isLowStock = product.stockQty <= product.minStock;

              return (
                <div
                  key={product.id}
                  className={`bg-card rounded-xl shadow-sm overflow-hidden ${
                    isLowStock ? "ring-2 ring-red-500" : ""
                  }`}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-muted/50 flex items-center justify-center relative">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Package className="h-16 w-16 text-muted-foreground opacity-30" />
                    )}
                    {isLowStock && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        สต๊อกต่ำ
                      </div>
                    )}
                    {product.category && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                        {product.category}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground mb-2">
                        SKU: {product.sku}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-2xl font-bold">{product.stockQty}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.unit || "ชิ้น"}
                        </p>
                      </div>
                      {product.price && (
                        <div className="text-right">
                          <p className="text-lg font-semibold text-orange-600">
                            ฿{product.price.toLocaleString()}
                          </p>
                          {product.cost && (
                            <p className="text-xs text-muted-foreground">
                              ทุน ฿{product.cost.toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stock Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-lg gap-1"
                        onClick={() => openStockModal(product, "IN")}
                      >
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        รับเข้า
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-lg gap-1"
                        onClick={() => openStockModal(product, "OUT")}
                      >
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        จ่ายออก
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg"
                        onClick={() => openEditModal(product)}
                        title="แก้ไขสินค้า"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                เพิ่มสินค้าใหม่
              </h3>
              <button
                onClick={() => setShowAddProduct(false)}
                className="p-2 hover:bg-muted rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* รูปภาพสินค้า */}
              <div>
                <Label className="text-sm font-medium">รูปภาพสินค้า</Label>
                <div className="mt-1.5">
                  <ImageUpload
                    value={productForm.imageUrl}
                    onChange={(url) => setProductForm({ ...productForm, imageUrl: url || "" })}
                    folder="products"
                    placeholder="อัปโหลดรูปสินค้า"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">ชื่อสินค้า *</Label>
                <Input
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  placeholder="ชื่อสินค้า"
                  className="mt-1.5 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">ราคาขาย</Label>
                  <Input
                    type="number"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: e.target.value })
                    }
                    placeholder="0"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">ต้นทุน</Label>
                  <Input
                    type="number"
                    value={productForm.cost}
                    onChange={(e) =>
                      setProductForm({ ...productForm, cost: e.target.value })
                    }
                    placeholder="0"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">รหัสสินค้า (SKU)</Label>
                  <Input
                    value={productForm.sku}
                    onChange={(e) =>
                      setProductForm({ ...productForm, sku: e.target.value })
                    }
                    placeholder="SKU001"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">บาร์โค้ด</Label>
                  <Input
                    value={productForm.barcode}
                    onChange={(e) =>
                      setProductForm({ ...productForm, barcode: e.target.value })
                    }
                    placeholder="1234567890123"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">หมวดหมู่</Label>
                  <Input
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({ ...productForm, category: e.target.value })
                    }
                    placeholder="เช่น อิเล็กทรอนิกส์"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">หน่วย</Label>
                  <Input
                    value={productForm.unit}
                    onChange={(e) =>
                      setProductForm({ ...productForm, unit: e.target.value })
                    }
                    placeholder="ชิ้น"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">สต๊อกเริ่มต้น</Label>
                  <Input
                    type="number"
                    value={productForm.stockQty}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stockQty: e.target.value })
                    }
                    placeholder="0"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">สต๊อกขั้นต่ำ</Label>
                  <Input
                    type="number"
                    value={productForm.minStock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, minStock: e.target.value })
                    }
                    placeholder="0"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">รายละเอียด</Label>
                <Textarea
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({ ...productForm, description: e.target.value })
                  }
                  placeholder="รายละเอียดสินค้า..."
                  className="mt-1.5 rounded-xl"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddProduct(false)}
                className="flex-1 rounded-full"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleAddProduct}
                disabled={processing}
                className="flex-1 rounded-full bg-orange-600 hover:bg-orange-700"
              >
                {processing ? "กำลังบันทึก..." : "เพิ่มสินค้า"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                แก้ไขสินค้า
              </h3>
              <button
                onClick={() => {
                  setShowEditProduct(false);
                  setEditingProduct(null);
                }}
                className="p-2 hover:bg-muted rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* รูปภาพสินค้า */}
              <div>
                <Label className="text-sm font-medium">รูปภาพสินค้า</Label>
                <div className="mt-1.5">
                  <ImageUpload
                    value={editProductForm.imageUrl}
                    onChange={(url) => setEditProductForm({ ...editProductForm, imageUrl: url || "" })}
                    folder="products"
                    placeholder="อัปโหลดรูปสินค้า"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">ชื่อสินค้า *</Label>
                <Input
                  value={editProductForm.name}
                  onChange={(e) =>
                    setEditProductForm({ ...editProductForm, name: e.target.value })
                  }
                  placeholder="ชื่อสินค้า"
                  className="mt-1.5 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">ราคาขาย</Label>
                  <Input
                    type="number"
                    value={editProductForm.price}
                    onChange={(e) =>
                      setEditProductForm({ ...editProductForm, price: e.target.value })
                    }
                    placeholder="0"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">ต้นทุน</Label>
                  <Input
                    type="number"
                    value={editProductForm.cost}
                    onChange={(e) =>
                      setEditProductForm({ ...editProductForm, cost: e.target.value })
                    }
                    placeholder="0"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">รหัสสินค้า (SKU)</Label>
                  <Input
                    value={editProductForm.sku}
                    onChange={(e) =>
                      setEditProductForm({ ...editProductForm, sku: e.target.value })
                    }
                    placeholder="SKU001"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">บาร์โค้ด</Label>
                  <Input
                    value={editProductForm.barcode}
                    onChange={(e) =>
                      setEditProductForm({ ...editProductForm, barcode: e.target.value })
                    }
                    placeholder="1234567890123"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">หมวดหมู่</Label>
                  <Input
                    value={editProductForm.category}
                    onChange={(e) =>
                      setEditProductForm({ ...editProductForm, category: e.target.value })
                    }
                    placeholder="เช่น อิเล็กทรอนิกส์"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">หน่วย</Label>
                  <Input
                    value={editProductForm.unit}
                    onChange={(e) =>
                      setEditProductForm({ ...editProductForm, unit: e.target.value })
                    }
                    placeholder="ชิ้น"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">สต๊อกขั้นต่ำ</Label>
                <Input
                  type="number"
                  value={editProductForm.minStock}
                  onChange={(e) =>
                    setEditProductForm({ ...editProductForm, minStock: e.target.value })
                  }
                  placeholder="0"
                  className="mt-1.5 rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  สต๊อกปัจจุบัน: {editingProduct.stockQty} {editingProduct.unit || "ชิ้น"}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">รายละเอียด</Label>
                <Textarea
                  value={editProductForm.description}
                  onChange={(e) =>
                    setEditProductForm({ ...editProductForm, description: e.target.value })
                  }
                  placeholder="รายละเอียดสินค้า..."
                  className="mt-1.5 rounded-xl"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditProduct(false);
                  setEditingProduct(null);
                }}
                className="flex-1 rounded-full"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleEditProduct}
                disabled={processing}
                className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700"
              >
                {processing ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {stockForm.type === "IN" && (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    รับสินค้าเข้าสต๊อก
                  </>
                )}
                {stockForm.type === "OUT" && (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    จ่ายสินค้าออกจากสต๊อก
                  </>
                )}
                {stockForm.type === "ADJUST" && (
                  <>
                    <RotateCcw className="h-5 w-5 text-blue-600" />
                    ปรับยอดสต๊อก
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowStockModal(false)}
                className="p-2 hover:bg-muted rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Product Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl mb-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden relative">
                {selectedProduct.imageUrl ? (
                  <Image
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover rounded-lg"
                    unoptimized
                  />
                ) : (
                  <Package className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">
                  สต๊อกปัจจุบัน: {selectedProduct.stockQty}{" "}
                  {selectedProduct.unit || "ชิ้น"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {stockForm.type !== "ADJUST" && (
                <div className="flex gap-2 mb-4">
                  {["IN", "OUT", "SALE", "RETURN", "DAMAGE"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setStockForm({ ...stockForm, type })}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        stockForm.type === type
                          ? "bg-orange-600 text-white"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {type === "IN" && "รับเข้า"}
                      {type === "OUT" && "จ่ายออก"}
                      {type === "SALE" && "ขาย"}
                      {type === "RETURN" && "รับคืน"}
                      {type === "DAMAGE" && "เสียหาย"}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">
                  {stockForm.type === "ADJUST" ? "ยอดสต๊อกใหม่ *" : "จำนวน *"}
                </Label>
                <Input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, quantity: e.target.value })
                  }
                  placeholder="0"
                  className="mt-1.5 rounded-xl text-2xl font-bold text-center h-14"
                  min="0"
                />
              </div>

              {(stockForm.type === "IN" || stockForm.type === "RETURN") && (
                <div>
                  <Label className="text-sm font-medium">ต้นทุนต่อหน่วย</Label>
                  <Input
                    type="number"
                    value={stockForm.cost}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, cost: e.target.value })
                    }
                    placeholder="0"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">เลขที่อ้างอิง</Label>
                <Input
                  value={stockForm.reference}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, reference: e.target.value })
                  }
                  placeholder="เช่น เลขที่ใบรับสินค้า"
                  className="mt-1.5 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">หมายเหตุ</Label>
                <Textarea
                  value={stockForm.note}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, note: e.target.value })
                  }
                  placeholder="หมายเหตุ..."
                  className="mt-1.5 rounded-xl"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowStockModal(false)}
                className="flex-1 rounded-full"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleStockMovement}
                disabled={processing || !stockForm.quantity}
                className={`flex-1 rounded-full ${
                  stockForm.type === "IN" || stockForm.type === "RETURN"
                    ? "bg-green-600 hover:bg-green-700"
                    : stockForm.type === "ADJUST"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processing ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Lock Modal */}
      <FeatureLockModal
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
        feature="PRODUCTS"
        currentUsage={usageData?.currentUsage}
        limit={usageData?.limit}
      />
    </div>
  );
}
