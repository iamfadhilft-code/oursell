import { Language } from '@/types/pos';

export interface Translations {
  // Navigation
  dashboard: string;
  register: string;
  inventory: string;
  barcodes: string;
  purchasing: string;
  orders: string;
  customers: string;
  shifts: string;
  analytics: string;
  staff: string;
  expenses: string;
  settings: string;
  devcore: string;
  logout: string;
  kioskMode: string;

  // Header & Register
  searchPlaceholder: string;
  online: string;
  offline: string;
  cashier: string;
  shift: string;
  heldCarts: string;
  viewAll: string;
  recall: string;
  stock: string;
  lowStock: string;
  outOfStock: string;
  addToCart: string;
  
  // Cart & Billing
  cartSummary: string;
  currentBill: string;
  linkCustomer: string;
  addCustomer: string;
  subtotal: string;
  discount: string;
  coupon: string;
  tax: string;
  donation: string;
  totalPayable: string;
  holdBill: string;
  clearCart: string;
  chargePay: string;
  
  // Payments
  paymentModalTitle: string;
  totalDue: string;
  cash: string;
  card: string;
  upi: string;
  khata: string;
  split: string;
  amountReceived: string;
  changeDue: string;
  exactAmount: string;
  cardAuthCode: string;
  scanUpiQr: string;
  storeCreditBalance: string;
  finalizeSale: string;
  printReceipt: string;
  whatsappBill: string;
  
  // Backoffice & Modules
  addProduct: string;
  editProduct: string;
  barcode: string;
  sku: string;
  costPrice: string;
  sellingPrice: string;
  actions: string;
  save: string;
  cancel: string;
  delete: string;
  restock: string;
  damageAdjustment: string;
  
  // Shifts
  openShiftTitle: string;
  openingFloat: string;
  closeShiftTitle: string;
  cashCounted: string;
  expectedCash: string;
  variance: string;
  balanced: string;
  over: string;
  short: string;
  printZReport: string;

  // Dev Core
  devCoreTitle: string;
  pendingApplications: string;
  activeBrands: string;
  acceptBrand: string;
  rejectBrand: string;
  status: string;
  approved: string;
  pending: string;
  rejected: string;

  // Landing Page
  heroTitle: string;
  heroSub: string;
  registerYourBrand: string;
  logYourBrand: string;
  interactiveDemo: string;
  tryScan: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    dashboard: "Dashboard",
    register: "Register",
    inventory: "Inventory",
    barcodes: "Barcode Studio",
    purchasing: "Purchasing",
    orders: "Orders & Returns",
    customers: "Customers (Khata)",
    shifts: "Shifts & Float",
    analytics: "Analytics",
    staff: "Staff Management",
    expenses: "Petty Expenses",
    settings: "Settings",
    devcore: "Dev Core Portal",
    logout: "Logout",
    kioskMode: "Self-Checkout Kiosk",

    searchPlaceholder: "Search catalog, SKU, or scan barcode (F1)...",
    online: "Online",
    offline: "Offline Mode",
    cashier: "Cashier",
    shift: "Shift",
    heldCarts: "Parked Carts",
    viewAll: "View All",
    recall: "Recall",
    stock: "Stock",
    lowStock: "Low Stock!",
    outOfStock: "Out of Stock",
    addToCart: "Add to Cart",

    cartSummary: "Current Order",
    currentBill: "Bill #",
    linkCustomer: "Link Customer / Phone",
    addCustomer: "Add Customer",
    subtotal: "Subtotal",
    discount: "Discount",
    coupon: "Coupon Code",
    tax: "Tax (GST)",
    donation: "Donation (Palestine Relief)",
    totalPayable: "Total Payable",
    holdBill: "Hold Bill",
    clearCart: "Clear Cart",
    chargePay: "CHARGE / PAY (Space)",

    paymentModalTitle: "Process Payment & Tender",
    totalDue: "Total Due",
    cash: "Cash",
    card: "Card",
    upi: "UPI / QR",
    khata: "Khata / Credit",
    split: "Split Tender",
    amountReceived: "Cash Received",
    changeDue: "Change Due",
    exactAmount: "Exact Amount",
    cardAuthCode: "Card Auth Reference",
    scanUpiQr: "Scan UPI QR Code to Pay",
    storeCreditBalance: "Credit Balance",
    finalizeSale: "Complete & Print Receipt",
    printReceipt: "Print 80mm Receipt",
    whatsappBill: "Share WhatsApp E-Bill",

    addProduct: "Add New Product",
    editProduct: "Edit Product",
    barcode: "Barcode",
    sku: "SKU",
    costPrice: "Cost Price",
    sellingPrice: "Selling Price",
    actions: "Actions",
    save: "Save Changes",
    cancel: "Cancel",
    delete: "Delete",
    restock: "Restock Inventory",
    damageAdjustment: "Damage / Scrap Adjustment",

    openShiftTitle: "Open Cash Register Shift",
    openingFloat: "Opening Float Amount",
    closeShiftTitle: "Close Shift & Z-Report",
    cashCounted: "Physical Cash Counted",
    expectedCash: "Expected System Cash",
    variance: "Cash Variance",
    balanced: "Balanced",
    over: "Cash Over",
    short: "Cash Short",
    printZReport: "Print Z-Report Summary",

    devCoreTitle: "Dev Core Super-Admin Command Tower",
    pendingApplications: "Pending Brand Applications",
    activeBrands: "Active Brand Tenancies",
    acceptBrand: "Accept Brand (Approve)",
    rejectBrand: "Reject Application",
    status: "Status",
    approved: "Approved",
    pending: "Pending Review",
    rejected: "Rejected",

    heroTitle: "The Intelligent Operating System for Retail.",
    heroSub: "Cloud-speed billing, offline resilience, and automated multi-store inventory control. Engineered for modern high-volume retailers.",
    registerYourBrand: "Register Your Brand",
    logYourBrand: "Log Your Brand",
    interactiveDemo: "Live Terminal Simulation",
    tryScan: "Click items to simulate barcode scan:",
  },

  ml: {
    dashboard: "ഡാഷ്‌ബോർഡ്",
    register: "ബില്ലിംഗ് രജിസ്റ്റർ",
    inventory: "ഇൻവെന്ററി",
    barcodes: "ബാർകോഡ് സ്റ്റുഡിയോ",
    purchasing: "പർച്ചേസിംഗ്",
    orders: "ഓർഡറുകൾ & റിട്ടേൺ",
    customers: "ഉപഭോക്താക്കൾ (ഖാത)",
    shifts: "ഷിഫ്റ്റുകൾ & കാഷ്",
    analytics: "അനലിറ്റിക്സ്",
    staff: "ജീവനക്കാർ",
    expenses: "ചെലവുകൾ",
    settings: "സെറ്റിംഗ്സ്",
    devcore: "ദേവ് കോർ പോർട്ടൽ",
    logout: "ലോഗ് ഔട്ട്",
    kioskMode: "കിയോസ്‌ക് മോഡ്",

    searchPlaceholder: "ഉൽപ്പന്നങ്ങൾ, ബാർകോഡ് തിരയുക (F1)...",
    online: "ഓൺലൈൻ",
    offline: "ഓഫ്‌ലൈൻ മോഡ്",
    cashier: "കാഷ്യർ",
    shift: "ഷിഫ്റ്റ്",
    heldCarts: "ഹോൾഡ് കാർട്ടുകൾ",
    viewAll: "എല്ലാം കാണുക",
    recall: "റീകോൾ",
    stock: "സ്റ്റോക്ക്",
    lowStock: "സ്റ്റോക്ക് കുറവാണ്!",
    outOfStock: "സ്റ്റോക്ക് തീർന്നു",
    addToCart: "കാർട്ടിലേക്ക് ചേർക്കുക",

    cartSummary: "നിലവിലെ ഓർഡർ",
    currentBill: "ബിൽ നമ്പർ",
    linkCustomer: "ഉപഭോക്താവിനെ ബന്ധിപ്പിക്കുക",
    addCustomer: "പുതിയ ഉപഭോക്താവ്",
    subtotal: "സബ്‌ടോട്ടൽ",
    discount: "ഡിസ്‌കൗണ്ട്",
    coupon: "കൂപ്പൺ കോഡ്",
    tax: "നികുതി (GST)",
    donation: "സംഭാവന (പലസ്തീൻ റിലീഫ്)",
    totalPayable: "ആകെ തുക",
    holdBill: "ബിൽ ഹോൾഡ് ചെയ്യുക",
    clearCart: "കാർട്ട് ശൂന്യമാക്കുക",
    chargePay: "പണം നൽകുക / പേ (Space)",

    paymentModalTitle: "പേയ്‌മെന്റ് സ്വീകരിക്കുക",
    totalDue: "നൽകേണ്ട തുക",
    cash: "പണം (Cash)",
    card: "കാർഡ്",
    upi: "UPI / QR",
    khata: "ഖാത / ക്രെഡിറ്റ്",
    split: "സ്പ്ലിറ്റ് പേയ്‌മെന്റ്",
    amountReceived: "ലഭിച്ച തുക",
    changeDue: "ബാക്കി നൽകേണ്ടത്",
    exactAmount: "കൃത്യമായ തുക",
    cardAuthCode: "കാർഡ് റഫറൻസ്",
    scanUpiQr: "UPI ക്യുആർ കോഡ് സ്കാൻ ചെയ്യുക",
    storeCreditBalance: "ക്രെഡിറ്റ് ബാലൻസ്",
    finalizeSale: "പൂർത്തിയാക്കുക & രസീത്",
    printReceipt: "80mm രസീത് പ്രിന്റ് ചെയ്യുക",
    whatsappBill: "വാട്സാപ്പ് ബിൽ അയക്കുക",

    addProduct: "പുതിയ ഉൽപ്പന്നം ചേർക്കുക",
    editProduct: "ഉൽപ്പന്നം തിരുത്തുക",
    barcode: "ബാർകോഡ്",
    sku: "എസ്‌കെയു",
    costPrice: "വാങ്ങിയ വില",
    sellingPrice: "വിൽപ്പന വില",
    actions: "നടപടികൾ",
    save: "സേവ് ചെയ്യുക",
    cancel: "റദ്ദാക്കുക",
    delete: "ഡിലീറ്റ് ചെയ്യുക",
    restock: "സ്റ്റോക്ക് ചേർക്കുക",
    damageAdjustment: "ഡാമേജ് ക്രമീകരണം",

    openShiftTitle: "ഷിഫ്റ്റ് ആരംഭിക്കുക",
    openingFloat: "തുടക്കത്തിലെ കാഷ്",
    closeShiftTitle: "ഷിഫ്റ്റ് ക്ലോസ് & Z-റിപ്പോർട്ട്",
    cashCounted: "എണ്ണിയ തുക",
    expectedCash: "പ്രതീക്ഷിക്കുന്ന തുക",
    variance: "വ്യത്യാസം",
    balanced: "തുല്യം (Balanced)",
    over: "കൂടുതൽ (Over)",
    short: "കുറവ് (Short)",
    printZReport: "Z-റിപ്പോർട്ട് പ്രിന്റ് ചെയ്യുക",

    devCoreTitle: "ദേവ് കോർ സൂപ്പർ അഡ്മിൻ",
    pendingApplications: "അപേക്ഷകൾ",
    activeBrands: "സജീവ ബ്രാൻഡുകൾ",
    acceptBrand: "അംഗീകരിക്കുക",
    rejectBrand: "നിരസിക്കുക",
    status: "നില",
    approved: "അംഗീകരിച്ചു",
    pending: "പരിശോധനയിൽ",
    rejected: "നിരസിച്ചു",

    heroTitle: "റീട്ടെയിൽ ബിസിനസിനായുള്ള ഇന്റലിജന്റ് ഓപ്പറേറ്റിംഗ് സിസ്റ്റം.",
    heroSub: "ക്ലൗഡ് വേഗതയിലുള്ള ബില്ലിംഗ്, ഓഫ്‌ലൈൻ സുരക്ഷ, ഓട്ടോമേറ്റഡ് ഇൻവെന്ററി നിയന്ത്രണം.",
    registerYourBrand: "നിങ്ങളുടെ ബ്രാൻഡ് രജിസ്റ്റർ ചെയ്യുക",
    logYourBrand: "ബ്രാൻഡ് ലോഗിൻ ചെയ്യുക",
    interactiveDemo: "തത്സമയ ടെർമിനൽ പരീക്ഷണം",
    tryScan: "ബാർകോഡ് സ്കാനിംഗ് പരീക്ഷിക്കാൻ ക്ലിക്ക് ചെയ്യുക:",
  },

  ar: {
    dashboard: "لوحة التحكم",
    register: "نقطة البيع (الكاشير)",
    inventory: "المخزون والمنتجات",
    barcodes: "استوديو الباركود",
    purchasing: "المشتريات والموردين",
    orders: "الفواتير والمرتجعات",
    customers: "العملاء والحسابات",
    shifts: "الورديات والخزينة",
    analytics: "التقارير والتحليلات",
    staff: "إدارة الموظفين",
    expenses: "المصروفات النثرية",
    settings: "الإعدادات",
    devcore: "بوابة التحكم الرئيسية",
    logout: "تسجيل الخروج",
    kioskMode: "شاشة الخدمة الذاتية",

    searchPlaceholder: "البحث عن صنف، باركود، أو تصنيف (F1)...",
    online: "متصل بالإنترنت",
    offline: "الوضع غير المتصل",
    cashier: "الكاشير",
    shift: "الوردية",
    heldCarts: "الفواتير المعلقة",
    viewAll: "عرض الكل",
    recall: "استرجاع",
    stock: "المخزون",
    lowStock: "مخزون منخفض!",
    outOfStock: "نفذت الكمية",
    addToCart: "إضافة للسلة",

    cartSummary: "الطلب الحالي",
    currentBill: "رقم الفاتورة",
    linkCustomer: "ربط العميل / الجوال",
    addCustomer: "عميل جديد",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    coupon: "كوبون التخفيض",
    tax: "ضريبة القيمة المضافة",
    donation: "تبرع (إغاثة فلسطين)",
    totalPayable: "الإجمالي للدفع",
    holdBill: "تعليق الفاتورة",
    clearCart: "إفراغ السلة",
    chargePay: "دفع / محاسبة (Space)",

    paymentModalTitle: "إتمام الدفع واختيار الوسيلة",
    totalDue: "المبلغ المستحق",
    cash: "نقداً (كاش)",
    card: "بطاقة مصرفية",
    upi: "دفع رقمي / QR",
    khata: "آجل / رصيد العميل",
    split: "دفع مجزأ",
    amountReceived: "المبلغ المستلم",
    changeDue: "المتبقي للعميل",
    exactAmount: "المبلغ بالضبط",
    cardAuthCode: "رقم مرجع البطاقة",
    scanUpiQr: "امسح الرمز للدفع",
    storeCreditBalance: "الرصيد المتاح",
    finalizeSale: "تأكيد وطباعة الإيصال",
    printReceipt: "طباعة إيصال حراري 80mm",
    whatsappBill: "إرسال الفاتورة عبر واتساب",

    addProduct: "إضافة منتج جديد",
    editProduct: "تعديل المنتج",
    barcode: "الباركود",
    sku: "رمز الصنف (SKU)",
    costPrice: "سعر التكلفة",
    sellingPrice: "سعر البيع",
    actions: "الإجراءات",
    save: "حفظ البيانات",
    cancel: "إلغاء",
    delete: "حذف",
    restock: "إضافة كمية للمخزون",
    damageAdjustment: "تسوية تالف / هالك",

    openShiftTitle: "فتح وردية الخزينة",
    openingFloat: "رصيد البداية (العهدة)",
    closeShiftTitle: "إغلاق الوردية والتقرير النهائي",
    cashCounted: "النقد الفعلي بالدرج",
    expectedCash: "النقد المتوقع بالنظام",
    variance: "الفارق النقدي",
    balanced: "مطابق تماماً",
    over: "فائض نقدي",
    short: "عجز نقدي",
    printZReport: "طباعة تقرير Z-Report",

    devCoreTitle: "برج القيادة للمنصة Dev Core",
    pendingApplications: "طلبات المتاجر المعلقة",
    activeBrands: "المتاجر المشتركة النشطة",
    acceptBrand: "قبول وتفعيل المتجر",
    rejectBrand: "رفض الطلب",
    status: "الحالة",
    approved: "مقبول",
    pending: "قيد المراجعة",
    rejected: "مرفوض",

    heroTitle: "نظام التشغيل الذكي للمبيعات وتجارة التجزئة.",
    heroSub: "محاسبة فائقة السرعة، استمرارية دون إنترنت، وتحكم آلي بالمخزون متعدد الفروع.",
    registerYourBrand: "سجل متجرك الآن",
    logYourBrand: "دخول المتجر",
    interactiveDemo: "محاكاة فورية لنقطة البيع",
    tryScan: "انقر على المنتجات لتجربة المسح الفوري:",
  },
};
