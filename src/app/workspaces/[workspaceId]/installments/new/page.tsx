'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ShoppingBag, Search, User, Package, CreditCard, FileText, Percent, X, Check, Calendar, ImageIcon, Plus, UserPlus, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { DocumentUpload } from '@/components/ui/document-upload'

interface Contact {
    id: string
    name: string
    phone: string | null
    email: string | null
    imageUrl: string | null
    userId: string | null
    type: 'BORROWER' | 'LENDER' | 'BOTH'
}

interface Product {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    price: number | null
    category: string | null
    sku: string | null
}

interface InterestPolicy {
    id: string
    name: string
    mode: 'MONTHLY' | 'DAILY'
    monthlyRate: number | null
    dailyRate: number | null
}

interface FormData {
    contactId: string
    productId: string
    productName: string
    productDescription: string
    productImageUrl: string
    totalAmount: string
    downPayment: string
    numberOfTerms: string
    startDate: string
    interestPolicyId: string
}

// Avatar component
function Avatar({ name, size = "md", imageUrl }: { name: string; size?: "sm" | "md" | "lg"; imageUrl?: string | null }) {
    const initials = name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?";
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base"
    };

    if (imageUrl) {
        return (
            <Image src={imageUrl} alt={name} width={48} height={48} className={`${sizeClasses[size]} rounded-full object-cover`} unoptimized />
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center font-semibold`}>
            {initials}
        </div>
    );
}

export default function NewInstallmentPage() {
    const params = useParams()
    const router = useRouter()
    const workspaceId = params.workspaceId as string

    const [contacts, setContacts] = useState<Contact[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [policies, setPolicies] = useState<InterestPolicy[]>([])
    const [loading, setLoading] = useState(false)
    const [documents, setDocuments] = useState<{ name: string; type: string; url: string }[]>([])

    // Contact search dropdown
    const [contactSearch, setContactSearch] = useState('')
    const [showContactDropdown, setShowContactDropdown] = useState(false)
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
    const contactDropdownRef = useRef<HTMLDivElement>(null)

    // Product search dropdown
    const [productSearch, setProductSearch] = useState('')
    const [showProductDropdown, setShowProductDropdown] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isCustomProduct, setIsCustomProduct] = useState(false)
    const productDropdownRef = useRef<HTMLDivElement>(null)

    // New contact modal
    const [showNewContactModal, setShowNewContactModal] = useState(false)
    const [newContactData, setNewContactData] = useState({ name: '', phone: '', email: '' })
    const [creatingContact, setCreatingContact] = useState(false)

    // New product modal
    const [showNewProductModal, setShowNewProductModal] = useState(false)
    const [newProductData, setNewProductData] = useState({ name: '', description: '', price: '', category: '', imageUrl: '', sku: '', stockQty: '1' })
    const [creatingProduct, setCreatingProduct] = useState(false)
    const defaultCategories = ['โทรศัพท์มือถือ', 'แท็บเล็ต', 'คอมพิวเตอร์', 'เครื่องใช้ไฟฟ้า', 'เฟอร์นิเจอร์', 'จักรยานยนต์', 'อุปกรณ์อิเล็กทรอนิกส์', 'อื่นๆ']
    const [productCategories, setProductCategories] = useState<string[]>(defaultCategories)
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

    const [formData, setFormData] = useState<FormData>({
        contactId: '',
        productId: '',
        productName: '',
        productDescription: '',
        productImageUrl: '',
        totalAmount: '',
        downPayment: '',
        numberOfTerms: '12',
        startDate: new Date().toISOString().split('T')[0],
        interestPolicyId: '',
    })

    const fetchData = useCallback(async () => {
        try {
            const [contactsRes, policiesRes, productsRes] = await Promise.all([
                fetch(`/api/workspaces/${workspaceId}/contacts`),
                fetch(`/api/workspaces/${workspaceId}/interest-policies`),
                fetch(`/api/workspaces/${workspaceId}/products`)
            ])

            if (contactsRes.ok) {
                const data = await contactsRes.json()
                // API ส่ง contacts เป็น array โดยตรง
                setContacts(Array.isArray(data) ? data : (data.contacts || []))
            }

            if (policiesRes.ok) {
                const data = await policiesRes.json()
                // API ส่ง policies เป็น array โดยตรง
                setPolicies(Array.isArray(data) ? data : (data.policies || []))
            }

            if (productsRes.ok) {
                const data = await productsRes.json()
                setProducts(data.products || [])
                // รวมหมวดหมู่จาก API กับหมวดหมู่เริ่มต้น และลบที่ซ้ำ
                const apiCategories = data.categories || []
                const allCategories = Array.from(new Set([...apiCategories, ...defaultCategories]))
                setProductCategories(allCategories as string[])
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        }
    }, [workspaceId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Click outside to close dropdowns
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (contactDropdownRef.current && !contactDropdownRef.current.contains(event.target as Node)) {
                setShowContactDropdown(false)
            }
            if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
                setShowProductDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // กรองเฉพาะลูกค้าที่เป็นผู้กู้ (BORROWER) หรือ ทั้งคู่ (BOTH) เหมือนหน้าสัญญากู้
    // และไม่รวมผู้ติดต่อที่เป็นบัญชีผู้ใช้ (มี userId) ที่สร้างมาตอนสมัครสมาชิก
    const borrowers = contacts.filter((c) =>
        (c.type === "BORROWER" || c.type === "BOTH") && !c.userId
    )

    const filteredContacts = borrowers.filter(contact =>
        contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
        contact.phone?.includes(contactSearch) ||
        contact.email?.toLowerCase().includes(contactSearch.toLowerCase())
    )

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.category?.toLowerCase().includes(productSearch.toLowerCase())
    )

    const handleSelectContact = (contact: Contact) => {
        setSelectedContact(contact)
        setFormData(prev => ({ ...prev, contactId: contact.id }))
        setContactSearch('')
        setShowContactDropdown(false)
    }

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product)
        setIsCustomProduct(false)
        setFormData(prev => ({
            ...prev,
            productId: product.id,
            productName: product.name,
            productDescription: product.description || '',
            productImageUrl: product.imageUrl || '',
            totalAmount: product.price ? product.price.toString() : prev.totalAmount
        }))
        setProductSearch('')
        setShowProductDropdown(false)
    }

    const handleUseCustomProduct = () => {
        setSelectedProduct(null)
        setIsCustomProduct(true)
        setFormData(prev => ({
            ...prev,
            productId: '',
            productName: productSearch,
            productDescription: '',
            productImageUrl: '',
        }))
        setShowProductDropdown(false)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePolicySelect = (policyId: string) => {
        setFormData(prev => ({ ...prev, interestPolicyId: policyId }))
    }

    // Create new contact
    const handleCreateContact = async () => {
        if (!newContactData.name) {
            alert('กรุณาระบุชื่อลูกค้า')
            return
        }

        setCreatingContact(true)
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newContactData),
            })

            if (res.ok) {
                const contact = await res.json()
                setContacts(prev => [...prev, contact])
                handleSelectContact(contact)
                setShowNewContactModal(false)
                setNewContactData({ name: '', phone: '', email: '' })
            } else {
                const data = await res.json()
                alert(data.error || 'เกิดข้อผิดพลาด')
            }
        } catch (error) {
            console.error('Failed to create contact:', error)
            alert('เกิดข้อผิดพลาด')
        } finally {
            setCreatingContact(false)
        }
    }

    // Create new product
    const handleCreateProduct = async () => {
        console.log('handleCreateProduct called', newProductData)
        if (!newProductData.name) {
            alert('กรุณาระบุชื่อสินค้า')
            return
        }

        setCreatingProduct(true)
        try {
            console.log('Sending request to create product...')
            const res = await fetch(`/api/workspaces/${workspaceId}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProductData),
            })
            console.log('Response status:', res.status)

            if (res.ok) {
                const product = await res.json()
                console.log('Product created:', product)
                setProducts(prev => [...prev, product])
                handleSelectProduct(product)
                setShowNewProductModal(false)
                setNewProductData({ name: '', description: '', price: '', category: '', imageUrl: '', sku: '', stockQty: '1' })
            } else {
                const data = await res.json()
                console.error('Error response:', data)
                alert(data.error || 'เกิดข้อผิดพลาด')
            }
        } catch (error) {
            console.error('Failed to create product:', error)
            alert('เกิดข้อผิดพลาด')
        } finally {
            setCreatingProduct(false)
        }
    }

    // Calculate finance amount and monthly payment
    const totalAmount = parseFloat(formData.totalAmount) || 0
    const downPayment = parseFloat(formData.downPayment) || 0
    const numberOfTerms = parseInt(formData.numberOfTerms) || 1
    const financeAmount = Math.max(0, totalAmount - downPayment)

    const selectedPolicy = policies.find(p => p.id === formData.interestPolicyId)
    const interestRate = selectedPolicy?.monthlyRate || selectedPolicy?.dailyRate || 0

    // Simple interest calculation for monthly payment
    const totalInterest = financeAmount * (interestRate / 100) * numberOfTerms
    const totalPayable = financeAmount + totalInterest
    const monthlyPayment = numberOfTerms > 0 ? totalPayable / numberOfTerms : 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.contactId) {
            alert('กรุณาเลือกลูกค้า')
            return
        }
        if (!formData.productName) {
            alert('กรุณาระบุชื่อสินค้า')
            return
        }
        if (!formData.totalAmount || totalAmount <= 0) {
            alert('กรุณาระบุราคาสินค้า')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/installments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactId: formData.contactId,
                    itemName: formData.productName,
                    itemDescription: formData.productDescription,
                    itemImageUrl: formData.productImageUrl,
                    totalAmount,
                    downPayment,
                    numberOfTerms,
                    startDate: formData.startDate,
                    interestPolicyId: formData.interestPolicyId || null,
                    documents
                }),
            })

            if (res.ok) {
                router.push(`/workspaces/${workspaceId}/installments`)
            } else {
                const data = await res.json()
                alert(data.error || 'เกิดข้อผิดพลาด')
            }
        } catch (error) {
            console.error('Failed to create installment:', error)
            alert('เกิดข้อผิดพลาด')
        } finally {
            setLoading(false)
        }
    }

    const isFormValid = formData.contactId && formData.productName && totalAmount > 0

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Facebook-style Header */}
            <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/workspaces/${workspaceId}/installments`}
                                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-500">
                                    <ShoppingBag className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h1 className="font-semibold text-base">สร้างระบบผ่อนสินค้าใหม่</h1>
                                    <p className="text-xs text-muted-foreground">กรอกข้อมูลสินค้าและเงื่อนไขการผ่อน</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link href={`/workspaces/${workspaceId}/installments`}>
                                <Button variant="ghost" size="sm" className="rounded-full">
                                    ยกเลิก
                                </Button>
                            </Link>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || !isFormValid}
                                size="sm"
                                className="rounded-full bg-purple-600 hover:bg-purple-700"
                            >
                                {loading ? 'กำลังสร้าง...' : 'สร้างระบบผ่อน'}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - 2 Column Layout */}
            <main className="container mx-auto px-4 py-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left Column - Forms */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Customer Section */}
                            <div className="bg-card rounded-xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-purple-600" />
                                        <h2 className="font-semibold">ลูกค้า</h2>
                                    </div>
                                    <Link href={`/workspaces/${workspaceId}/contacts/new`}>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full gap-1"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                            เพิ่มผู้ติดต่อใหม่
                                        </Button>
                                    </Link>
                                </div>

                                {borrowers.length === 0 ? (
                                    <div className="text-center py-8 bg-muted/50 rounded-lg">
                                        <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                                        <p className="text-muted-foreground mb-4">ยังไม่มีผู้ติดต่อที่เป็นลูกค้า (ผู้กู้)</p>
                                        <Link href={`/workspaces/${workspaceId}/contacts/new`}>
                                            <Button variant="outline" className="rounded-lg">
                                                เพิ่มผู้ติดต่อใหม่
                                            </Button>
                                        </Link>
                                    </div>
                                ) : selectedContact ? (
                                    <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={selectedContact.name} size="lg" imageUrl={selectedContact.imageUrl} />
                                            <div>
                                                <p className="font-medium">{selectedContact.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedContact.type === "BORROWER" ? "📥 ลูกค้า" : "🔄 ทั้งคู่"}
                                                    {selectedContact.phone && ` • ${selectedContact.phone}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-full bg-purple-600 text-white">
                                                <Check className="h-4 w-4" />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedContact(null)
                                                    setFormData(prev => ({ ...prev, contactId: '' }))
                                                }}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative" ref={contactDropdownRef}>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                placeholder="ค้นหาลูกค้า..."
                                                value={contactSearch}
                                                onChange={(e) => setContactSearch(e.target.value)}
                                                onFocus={() => setShowContactDropdown(true)}
                                                className="pl-10 rounded-xl"
                                            />
                                        </div>

                                        {showContactDropdown && (
                                            <div className="absolute z-10 w-full mt-2 bg-card border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                                                {filteredContacts.length === 0 ? (
                                                    <div className="p-4 text-center">
                                                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                        <p className="text-muted-foreground mb-3">ไม่พบลูกค้า {`"${contactSearch}"`}</p>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => {
                                                                setNewContactData({ name: contactSearch, phone: '', email: '' })
                                                                setShowNewContactModal(true)
                                                                setShowContactDropdown(false)
                                                            }}
                                                            className="rounded-full gap-1"
                                                        >
                                                            <UserPlus className="h-4 w-4" />
                                                            สร้างลูกค้า {`"${contactSearch}"`}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {filteredContacts.map((contact) => (
                                                            <div
                                                                key={contact.id}
                                                                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted ${formData.contactId === contact.id ? 'bg-purple-500/10' : ''
                                                                    }`}
                                                                onClick={() => handleSelectContact(contact)}
                                                            >
                                                                <Avatar name={contact.name} size="md" imageUrl={contact.imageUrl} />
                                                                <div className="flex-1">
                                                                    <p className="font-medium">{contact.name}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {contact.type === "BORROWER" ? "📥 ลูกค้า" : "🔄 ทั้งคู่"}
                                                                        {contact.phone && ` • ${contact.phone}`}
                                                                    </p>
                                                                </div>
                                                                {formData.contactId === contact.id && (
                                                                    <Check className="h-5 w-5 text-purple-600" />
                                                                )}
                                                            </div>
                                                        ))}

                                                        {/* Add new contact option */}
                                                        <Link
                                                            href={`/workspaces/${workspaceId}/contacts/new`}
                                                            className="flex items-center gap-3 p-3 border-t hover:bg-muted transition-colors text-purple-600"
                                                        >
                                                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-purple-600 flex items-center justify-center">
                                                                <User className="h-5 w-5" />
                                                            </div>
                                                            <span className="font-medium">+ เพิ่มผู้ติดต่อใหม่</span>
                                                        </Link>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Product Section */}
                            <div className="bg-card rounded-xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-5 w-5 text-purple-600" />
                                        <h2 className="font-semibold">ข้อมูลสินค้า</h2>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowNewProductModal(true)}
                                        className="rounded-full gap-1"
                                    >
                                        <Plus className="h-4 w-4" />
                                        เพิ่มในแคตาล็อค
                                    </Button>
                                </div>

                                {/* Product Selection */}
                                {selectedProduct || isCustomProduct ? (
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                                            <div className="flex items-center gap-3">
                                                {formData.productImageUrl ? (
                                                    <Image
                                                        src={formData.productImageUrl}
                                                        alt={formData.productName}
                                                        width={48}
                                                        height={48}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-purple-600" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium">{formData.productName || 'สินค้าที่กำหนดเอง'}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {selectedProduct ? 'จากแคตาล็อค' : 'กำหนดเอง'}
                                                        {selectedProduct?.sku && ` • SKU: ${selectedProduct.sku}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {selectedProduct && (
                                                    <Link href={`/workspaces/${workspaceId}/products`}>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-blue-600 hover:text-blue-700"
                                                            title="แก้ไขในแคตาล็อค"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedProduct(null)
                                                        setIsCustomProduct(false)
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            productId: '',
                                                            productName: '',
                                                            productDescription: '',
                                                            productImageUrl: '',
                                                            totalAmount: ''
                                                        }))
                                                    }}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {/* แสดงฟอร์มแก้ไขรายละเอียดสำหรับสัญญานี้ (ไม่แก้ในแคตาล็อค) */}
                                        <p className="text-xs text-muted-foreground mt-2 mb-2">
                                            💡 แก้ไขรายละเอียดด้านล่างสำหรับสัญญานี้เท่านั้น (ไม่กระทบแคตาล็อค)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative mb-4" ref={productDropdownRef}>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                placeholder="ค้นหาสินค้าจากแคตาล็อค หรือพิมพ์ชื่อสินค้าใหม่..."
                                                value={productSearch}
                                                onChange={(e) => setProductSearch(e.target.value)}
                                                onFocus={() => setShowProductDropdown(true)}
                                                className="pl-10 rounded-xl"
                                            />
                                        </div>

                                        {showProductDropdown && (
                                            <div className="absolute z-10 w-full mt-2 bg-card border rounded-xl shadow-lg max-h-80 overflow-y-auto">
                                                {filteredProducts.length === 0 && !productSearch ? (
                                                    <div className="p-4 text-center text-muted-foreground">
                                                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm mb-2">ยังไม่มีสินค้าในแคตาล็อค</p>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => {
                                                                setShowNewProductModal(true)
                                                                setShowProductDropdown(false)
                                                            }}
                                                            className="rounded-full gap-1"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            เพิ่มสินค้าแรก
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {filteredProducts.map((product) => (
                                                            <button
                                                                key={product.id}
                                                                type="button"
                                                                onClick={() => handleSelectProduct(product)}
                                                                className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                                                            >
                                                                {product.imageUrl ? (
                                                                    <Image
                                                                        src={product.imageUrl}
                                                                        alt={product.name}
                                                                        width={40}
                                                                        height={40}
                                                                        className="w-10 h-10 rounded-lg object-cover"
                                                                        unoptimized
                                                                    />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1">
                                                                    <p className="font-medium">{product.name}</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {product.category && `${product.category} • `}
                                                                        {product.price ? `฿${product.price.toLocaleString()}` : 'ไม่ระบุราคา'}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        ))}

                                                        {productSearch && (
                                                            <>
                                                                <div className="border-t" />
                                                                <button
                                                                    type="button"
                                                                    onClick={handleUseCustomProduct}
                                                                    className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left text-purple-600"
                                                                >
                                                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                                                        <Package className="h-5 w-5 text-purple-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium">ใช้ {`"${productSearch}"`} (ไม่บันทึกในแคตาล็อค)</p>
                                                                    </div>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNewProductData(prev => ({ ...prev, name: productSearch }))
                                                                        setShowNewProductModal(true)
                                                                        setShowProductDropdown(false)
                                                                    }}
                                                                    className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left text-green-600"
                                                                >
                                                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                                        <Plus className="h-5 w-5 text-green-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium">เพิ่ม {`"${productSearch}"`} ในแคตาล็อค</p>
                                                                    </div>
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {/* Product Image */}
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">รูปภาพสินค้า</Label>
                                        <div className="flex items-center gap-4">
                                            {/* {formData.productImageUrl ? (
                        <div className="relative w-32 h-32 rounded-xl overflow-hidden border">
                          <img
                            src={formData.productImageUrl}
                            alt="Product"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, productImageUrl: '' }))}
                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center bg-muted/30">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )} */}
                                            <ImageUpload
                                                value={formData.productImageUrl}
                                                onChange={(url) => setFormData(prev => ({ ...prev, productImageUrl: url || '' }))}
                                                folder="products"
                                                placeholder="อัปโหลดรูปสินค้า"
                                            />
                                        </div>
                                    </div>

                                    {/* Product Name */}
                                    <div>
                                        <Label htmlFor="productName" className="text-sm font-medium">ชื่อสินค้า *</Label>
                                        <Input
                                            id="productName"
                                            name="productName"
                                            value={formData.productName}
                                            onChange={handleInputChange}
                                            placeholder="เช่น iPhone 15 Pro Max 256GB"
                                            className="mt-1.5 rounded-xl"
                                            required
                                        />
                                    </div>

                                    {/* Product Description */}
                                    <div>
                                        <Label htmlFor="productDescription" className="text-sm font-medium">รายละเอียดสินค้า</Label>
                                        <Textarea
                                            id="productDescription"
                                            name="productDescription"
                                            value={formData.productDescription}
                                            onChange={handleInputChange}
                                            placeholder="รายละเอียดเพิ่มเติม สี รุ่น ฯลฯ"
                                            className="mt-1.5 rounded-xl"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Price & Terms Section */}
                            <div className="bg-card rounded-xl shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <CreditCard className="h-5 w-5 text-purple-600" />
                                    <h2 className="font-semibold">ราคาและงวดผ่อน</h2>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="totalAmount" className="text-sm font-medium">ราคาสินค้า (บาท) *</Label>
                                        <Input
                                            id="totalAmount"
                                            name="totalAmount"
                                            type="number"
                                            value={formData.totalAmount}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                            className="mt-1.5 rounded-xl"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="downPayment" className="text-sm font-medium">เงินดาวน์ (บาท)</Label>
                                        <Input
                                            id="downPayment"
                                            name="downPayment"
                                            type="number"
                                            value={formData.downPayment}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                            className="mt-1.5 rounded-xl"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="numberOfTerms" className="text-sm font-medium">จำนวนงวด</Label>
                                        <Input
                                            id="numberOfTerms"
                                            name="numberOfTerms"
                                            type="number"
                                            value={formData.numberOfTerms}
                                            onChange={handleInputChange}
                                            placeholder="12"
                                            className="mt-1.5 rounded-xl"
                                            min="1"
                                            max="120"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="startDate" className="text-sm font-medium">วันที่เริ่มต้น</Label>
                                        <div className="relative mt-1.5">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                id="startDate"
                                                name="startDate"
                                                type="date"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                className="pl-10 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Interest Policy Section */}
                            <div className="bg-card rounded-xl shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Percent className="h-5 w-5 text-purple-600" />
                                    <h2 className="font-semibold">นโยบายดอกเบี้ย</h2>
                                    <span className="text-sm text-muted-foreground">(ไม่บังคับ)</span>
                                </div>

                                {policies.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Percent className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">ยังไม่มีนโยบายดอกเบี้ย</p>
                                        <Link
                                            href={`/workspaces/${workspaceId}/interest-policies/new`}
                                            className="text-purple-600 hover:underline text-sm"
                                        >
                                            สร้างนโยบายดอกเบี้ย
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* No interest option */}
                                        <label
                                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${!formData.interestPolicyId
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                                                    : 'border-transparent bg-muted/50 hover:bg-muted'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="interestPolicy"
                                                checked={!formData.interestPolicyId}
                                                onChange={() => handlePolicySelect('')}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!formData.interestPolicyId ? 'border-purple-500 bg-purple-500' : 'border-muted-foreground'
                                                }`}>
                                                {!formData.interestPolicyId && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">ไม่คิดดอกเบี้ย</p>
                                                <p className="text-sm text-muted-foreground">ผ่อนชำระเฉพาะเงินต้น</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-semibold text-purple-600">0%</span>
                                            </div>
                                        </label>

                                        {policies.map((policy) => (
                                            <label
                                                key={policy.id}
                                                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.interestPolicyId === policy.id
                                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                                                        : 'border-transparent bg-muted/50 hover:bg-muted'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="interestPolicy"
                                                    checked={formData.interestPolicyId === policy.id}
                                                    onChange={() => handlePolicySelect(policy.id)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.interestPolicyId === policy.id ? 'border-purple-500 bg-purple-500' : 'border-muted-foreground'
                                                    }`}>
                                                    {formData.interestPolicyId === policy.id && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{policy.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {policy.mode === 'MONTHLY' ? 'คิดรายเดือน' : 'คิดรายวัน'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-lg font-semibold text-purple-600">
                                                        {policy.mode === 'MONTHLY'
                                                            ? `${policy.monthlyRate}%`
                                                            : `${policy.dailyRate}%`}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground block">
                                                        /{policy.mode === 'MONTHLY' ? 'เดือน' : 'วัน'}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Documents Section */}
                            <div className="bg-card rounded-xl shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                    <h2 className="font-semibold">เอกสารแนบ</h2>
                                    <span className="text-sm text-muted-foreground">(ไม่บังคับ)</span>
                                </div>

                                <DocumentUpload
                                    documents={documents}
                                    onAdd={(doc) => setDocuments(prev => [...prev, doc])}
                                    onRemove={(index) => setDocuments(prev => prev.filter((_, i) => i !== index))}
                                    folder="installments"
                                />
                            </div>
                        </div>

                        {/* Right Column - Summary */}
                        <div className="space-y-6">
                            <div className="bg-card rounded-xl shadow-sm p-6 sticky top-20">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-purple-600" />
                                    สรุปการผ่อน
                                </h3>

                                {/* Customer Info */}
                                {selectedContact && (
                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl mb-4">
                                        <Avatar name={selectedContact.name} size="md" imageUrl={selectedContact.imageUrl} />
                                        <div>
                                            <p className="font-medium text-sm">{selectedContact.name}</p>
                                            <p className="text-xs text-muted-foreground">ลูกค้า</p>
                                        </div>
                                    </div>
                                )}

                                {/* Product Info */}
                                {formData.productName && (
                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl mb-4">
                                        {formData.productImageUrl ? (
                                            <Image
                                                src={formData.productImageUrl}
                                                alt={formData.productName}
                                                width={40}
                                                height={40}
                                                className="w-10 h-10 rounded-lg object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                                <Package className="h-5 w-5 text-purple-600" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-sm">{formData.productName}</p>
                                            <p className="text-xs text-muted-foreground">สินค้า</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 border-t pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">ราคาสินค้า</span>
                                        <span className="font-medium">
                                            {totalAmount.toLocaleString('th-TH')} บาท
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">เงินดาวน์</span>
                                        <span className="font-medium text-green-600">
                                            -{downPayment.toLocaleString('th-TH')} บาท
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm pt-2 border-t">
                                        <span className="text-muted-foreground">ยอดผ่อน</span>
                                        <span className="font-semibold text-purple-600">
                                            {financeAmount.toLocaleString('th-TH')} บาท
                                        </span>
                                    </div>

                                    {selectedPolicy && (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">ดอกเบี้ยรวม (ประมาณ)</span>
                                                <span className="font-medium text-orange-600">
                                                    +{totalInterest.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">ยอดรวมทั้งหมด</span>
                                                <span className="font-medium">
                                                    {totalPayable.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">จำนวนงวด</span>
                                        <span className="font-medium">{numberOfTerms} งวด</span>
                                    </div>
                                </div>

                                {/* Monthly Payment Highlight */}
                                <div className="mt-4 p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white">
                                    <p className="text-sm opacity-90">ผ่อนเดือนละ (ประมาณ)</p>
                                    <p className="text-2xl font-bold">
                                        ฿{monthlyPayment.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                                    </p>
                                </div>

                                {/* Policy Info */}
                                {selectedPolicy && (
                                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Percent className="h-4 w-4 text-purple-600" />
                                            <span className="font-medium">{selectedPolicy.name}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {selectedPolicy.mode === 'MONTHLY'
                                                ? `ดอกเบี้ย ${selectedPolicy.monthlyRate}% ต่อเดือน`
                                                : `ดอกเบี้ย ${selectedPolicy.dailyRate}% ต่อวัน`}
                                        </p>
                                    </div>
                                )}

                                {/* Submit Button (Mobile) */}
                                <div className="mt-6 lg:hidden">
                                    <Button
                                        type="submit"
                                        disabled={loading || !isFormValid}
                                        className="w-full rounded-full bg-purple-600 hover:bg-purple-700"
                                    >
                                        {loading ? 'กำลังสร้าง...' : 'สร้างระบบผ่อน'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            {/* New Contact Modal */}
            {showNewContactModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-purple-600" />
                                เพิ่มลูกค้าใหม่
                            </h3>
                            <button
                                onClick={() => setShowNewContactModal(false)}
                                className="p-2 hover:bg-muted rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="newContactName" className="text-sm font-medium">ชื่อลูกค้า *</Label>
                                <Input
                                    id="newContactName"
                                    value={newContactData.name}
                                    onChange={(e) => setNewContactData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="ชื่อ-นามสกุล"
                                    className="mt-1.5 rounded-xl"
                                />
                            </div>
                            <div>
                                <Label htmlFor="newContactPhone" className="text-sm font-medium">เบอร์โทรศัพท์</Label>
                                <Input
                                    id="newContactPhone"
                                    value={newContactData.phone}
                                    onChange={(e) => setNewContactData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="0812345678"
                                    className="mt-1.5 rounded-xl"
                                />
                            </div>
                            <div>
                                <Label htmlFor="newContactEmail" className="text-sm font-medium">อีเมล</Label>
                                <Input
                                    id="newContactEmail"
                                    type="email"
                                    value={newContactData.email}
                                    onChange={(e) => setNewContactData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@example.com"
                                    className="mt-1.5 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowNewContactModal(false)}
                                className="flex-1 rounded-full"
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCreateContact}
                                disabled={creatingContact || !newContactData.name}
                                className="flex-1 rounded-full bg-purple-600 hover:bg-purple-700"
                            >
                                {creatingContact ? 'กำลังสร้าง...' : 'สร้างลูกค้า'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Product Modal */}
            {showNewProductModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Plus className="h-5 w-5 text-purple-600" />
                                เพิ่มสินค้าในแคตาล็อค
                            </h3>
                            <button
                                onClick={() => setShowNewProductModal(false)}
                                className="p-2 hover:bg-muted rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="newProductName" className="text-sm font-medium">ชื่อสินค้า *</Label>
                                <Input
                                    id="newProductName"
                                    value={newProductData.name}
                                    onChange={(e) => setNewProductData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="เช่น iPhone 15 Pro Max"
                                    className="mt-1.5 rounded-xl"
                                />
                            </div>
                            <div>
                                <Label htmlFor="newProductCategory" className="text-sm font-medium">หมวดหมู่</Label>
                                <div className="relative mt-1.5">
                                    <Input
                                        id="newProductCategory"
                                        value={newProductData.category}
                                        onChange={(e) => setNewProductData(prev => ({ ...prev, category: e.target.value }))}
                                        onFocus={() => setShowCategoryDropdown(true)}
                                        placeholder="เลือกหรือพิมพ์หมวดหมู่ใหม่"
                                        className="rounded-xl"
                                    />
                                    {showCategoryDropdown && productCategories.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-card border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                                            {productCategories
                                                .filter(cat => cat.toLowerCase().includes(newProductData.category.toLowerCase()))
                                                .map((category) => (
                                                    <button
                                                        key={category}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewProductData(prev => ({ ...prev, category }))
                                                            setShowCategoryDropdown(false)
                                                        }}
                                                        className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm"
                                                    >
                                                        {category}
                                                    </button>
                                                ))}
                                            {newProductData.category && !productCategories.includes(newProductData.category) && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCategoryDropdown(false)}
                                                    className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm text-purple-600 border-t"
                                                >
                                                    <Plus className="h-4 w-4 inline mr-2" />
                                                    สร้างหมวดหมู่ {`"${newProductData.category}"`}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* หมวดหมู่ยอดนิยม */}
                                {productCategories.length > 0 && !showCategoryDropdown && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {productCategories.slice(0, 5).map((category) => (
                                            <button
                                                key={category}
                                                type="button"
                                                onClick={() => setNewProductData(prev => ({ ...prev, category }))}
                                                className={`px-2 py-1 rounded-full text-xs transition-colors ${newProductData.category === category
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                                    }`}
                                            >
                                                {category}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="newProductPrice" className="text-sm font-medium">ราคา (บาท)</Label>
                                <Input
                                    id="newProductPrice"
                                    type="number"
                                    value={newProductData.price}
                                    onChange={(e) => setNewProductData(prev => ({ ...prev, price: e.target.value }))}
                                    placeholder="0"
                                    className="mt-1.5 rounded-xl"
                                    min="0"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="newProductSku" className="text-sm font-medium">รหัสสินค้า (SKU)</Label>
                                    <Input
                                        id="newProductSku"
                                        value={newProductData.sku}
                                        onChange={(e) => setNewProductData(prev => ({ ...prev, sku: e.target.value }))}
                                        placeholder="SKU001"
                                        className="mt-1.5 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="newProductStock" className="text-sm font-medium">สต๊อกเริ่มต้น</Label>
                                    <Input
                                        id="newProductStock"
                                        type="number"
                                        value={newProductData.stockQty}
                                        onChange={(e) => setNewProductData(prev => ({ ...prev, stockQty: e.target.value }))}
                                        placeholder="1"
                                        className="mt-1.5 rounded-xl"
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="newProductDescription" className="text-sm font-medium">รายละเอียด</Label>
                                <Textarea
                                    id="newProductDescription"
                                    value={newProductData.description}
                                    onChange={(e) => setNewProductData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="รายละเอียดเพิ่มเติม..."
                                    className="mt-1.5 rounded-xl"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-medium mb-2 block">รูปภาพสินค้า</Label>
                                <ImageUpload
                                    value={newProductData.imageUrl}
                                    onChange={(url) => setNewProductData(prev => ({ ...prev, imageUrl: url || '' }))}
                                    folder="products"
                                    placeholder="อัปโหลดรูปสินค้า"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowNewProductModal(false)}
                                className="flex-1 rounded-full"
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCreateProduct}
                                disabled={creatingProduct || !newProductData.name}
                                className="flex-1 rounded-full bg-purple-600 hover:bg-purple-700"
                            >
                                {creatingProduct ? 'กำลังสร้าง...' : 'เพิ่มสินค้า'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
