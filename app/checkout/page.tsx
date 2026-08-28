"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import SafeImage from "@/components/ui/SafeImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StoreNavbar from "@/components/store/StoreNavbar";
import StoreFooter from "@/components/store/StoreFooter";
import SearchDrawer from "@/components/store/SearchDrawer";
import CartDrawer, { type CartItemType } from "@/components/store/CartDrawer";
import OrderSuccessView, { type OrderSuccessData } from "@/components/store/OrderSuccessView";
import {
  ArrowLeft,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  Trash2,
  MessageCircle,
  Truck,
  Store,
  ExternalLink,
} from "lucide-react";
import { getVolumeTierInfo, getWhatsAppUrl, isDivisasPaymentMethod } from "@/lib/whatsapp";
import { STORE_OFFICES, PICKUP_ESTIMATED_TIME, type StoreOfficeKey } from "@/lib/store-locations";

interface BankAccountInfo {
  id: string;
  payment_type: string;
  bank_name: string;
  account_name: string;
  id_number?: string;
  phone_number?: string;
  email?: string;
  account_num?: string;
  notes?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [bcvRate, setBcvRate] = useState<number>(1);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authTab, setAuthTab] = useState<"login" | "register" | "forgot">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authConfirmEmail, setAuthConfirmEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotPin, setForgotPin] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [showPinStep, setShowPinStep] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [pinError, setPinError] = useState("");
  const [resendingPin, setResendingPin] = useState(false);
  const [resendPinSuccess, setResendPinSuccess] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Customer & Delivery Form Fields
  const [customerName, setCustomerName] = useState("");
  const [customerLastname, setCustomerLastname] = useState("");
  const [docType, setDocType] = useState("V");
  const [docNumber, setDocNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [savedUserAddress, setSavedUserAddress] = useState("");
  const [shippingCompany, setShippingCompany] = useState("MRW");
  const [customShippingCompany, setCustomShippingCompany] = useState("");
  const [notes, setNotes] = useState("");

  // Modalidad de Entrega (Envío vs Retiro en Tienda)
  const [deliveryMethod, setDeliveryMethod] = useState<"envio" | "retiro">("envio");
  const [selectedOffice, setSelectedOffice] = useState<StoreOfficeKey>("maracay");

  // Sync shippingCompany & address when delivery mode changes
  useEffect(() => {
    if (deliveryMethod === "retiro") {
      const office = STORE_OFFICES[selectedOffice];
      setShippingCompany(office.shippingCompanyValue);
      setAddress(office.address);
    } else {
      if (shippingCompany.startsWith("Retiro en Tienda")) {
        setShippingCompany("MRW");
      }
      if (selectedPaymentType.includes("Efectivo")) {
        setSelectedPaymentType("Pago Móvil");
      }
      setAddress(savedUserAddress);
    }
  }, [deliveryMethod, selectedOffice]);

  // Payment Form Fields
  const [selectedPaymentType, setSelectedPaymentType] = useState("Pago Móvil");
  const [reference, setReference] = useState("");
  const [paymentPhoto, setPaymentPhoto] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Bank Info state
  const [bankAccounts, setBankAccounts] = useState<BankAccountInfo[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);

  // Anti-bot security states
  const [hpField, setHpField] = useState("");
  const [formLoadedAt] = useState<number>(() => Date.now());

  // Checkout submitting state
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [completedOrderData, setCompletedOrderData] = useState<OrderSuccessData | null>(null);

  // Load Cart, Check Auth & BCV Rate
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cenicola_cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {
      setCart([]);
    }

    // Check logged in customer session
    setAuthLoading(true);
    fetch("/api/store/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.customer) {
          setIsAuthenticated(true);
          setCustomerName(data.customer.name || "");
          setCustomerLastname(data.customer.lastname || "");
          setDocType(data.customer.doc_type || "V");
          const docNum = data.customer.doc_number || "";
          setDocNumber(docNum.startsWith("TEMP-") ? "" : docNum);
          setPhone(data.customer.phone || "");
          setAddress(data.customer.address || "");
          setSavedUserAddress(data.customer.address || "");
          setAuthEmail(data.customer.email || "");
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setAuthLoading(false));

    // Fetch Products & BCV rate
    fetch("/api/store/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.bcv_rate) setBcvRate(data.bcv_rate);
      })
      .catch(() => null);

    // Fetch Bank accounts
    setBanksLoading(true);
    fetch("/api/store/banks")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBankAccounts(data);
        } else if (data?.data && Array.isArray(data.data)) {
          setBankAccounts(data.data);
        }
      })
      .catch(() => null)
      .finally(() => setBanksLoading(false));
  }, []);

  const saveCart = (newCart: CartItemType[]) => {
    setCart(newCart);
    try {
      localStorage.setItem("cenicola_cart", JSON.stringify(newCart));
    } catch {
      // ignore
    }
  };

  const handleUpdateQuantity = (variant_id: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(variant_id);
      return;
    }
    const updated = cart.map((item) =>
      item.variant_id === variant_id ? { ...item, quantity: Math.min(qty, item.stock_online) } : item
    );
    saveCart(updated);
  };

  const handleRemoveItem = (variant_id: string) => {
    const updated = cart.filter((item) => item.variant_id !== variant_id);
    saveCart(updated);
  };

  // Auth Submission (Login, Register or Forgot Password)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setResendPinSuccess("");
    setAuthSubmitting(true);

    try {
      if (authTab === "forgot") {
        if (!authEmail.trim()) {
          throw new Error("Ingresa tu correo electrónico para recuperar tu clave.");
        }

        if (forgotStep === 1) {
          const res = await fetch("/api/store/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: authEmail.trim() }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Error al solicitar el código de recuperación.");

          setForgotStep(2);
          setResendPinSuccess("Un código PIN de 6 dígitos ha sido enviado a tu correo.");
        } else {
          if (!forgotPin.trim() || forgotPin.trim().length !== 6) {
            throw new Error("Ingresa el código PIN de 6 dígitos que recibiste en tu correo.");
          }
          if (!forgotNewPassword || forgotNewPassword.trim().length < 8) {
            throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
          }

          const res = await fetch("/api/store/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: authEmail.trim(),
              pinCode: forgotPin.trim(),
              newPassword: forgotNewPassword.trim(),
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Error al restablecer la contraseña.");

          setAuthTab("login");
          setAuthPassword(forgotNewPassword.trim());
          setResendPinSuccess("¡Tu contraseña ha sido restablecida con éxito! Ya puedes iniciar sesión.");
          setForgotStep(1);
          setForgotPin("");
          setForgotNewPassword("");
        }
        return;
      }

      if (authTab === "login") {
        const res = await fetch("/api/store/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.requiresVerification || data.require_pin) {
            setShowPinStep(true);
            setAuthError("");
            setPinError("");
            setPinCode("");
            return;
          }
          throw new Error(data.error || "Error al iniciar sesión.");
        }

        if (data.requiresVerification || data.require_pin) {
          setShowPinStep(true);
          setAuthError("");
          setPinError("");
          setPinCode("");
          return;
        }

        setIsAuthenticated(true);
        if (data.customer) {
          setCustomerName(data.customer.name || "");
          setCustomerLastname(data.customer.lastname || "");
          setDocType(data.customer.doc_type || "V");
          const loginDocNum = data.customer.doc_number || "";
          setDocNumber(loginDocNum.startsWith("TEMP-") ? "" : loginDocNum);
          setPhone(data.customer.phone || "");
          setAddress(data.customer.address || "");
          setSavedUserAddress(data.customer.address || "");
        }
      } else {
        // Register step 1 -> check email & password confirmation
        if (authEmail.trim().toLowerCase() !== authConfirmEmail.trim().toLowerCase()) {
          throw new Error("Los correos electrónicos ingresados no coinciden.");
        }

        if (authPassword !== authConfirmPassword) {
          throw new Error("Las contraseñas ingresadas no coinciden.");
        }

        // Register step 1 -> trigger PIN verification
        const res = await fetch("/api/store/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: customerName,
            lastname: customerLastname,
            doc_type: docType,
            doc_number: docNumber,
            phone,
            email: authEmail,
            password: authPassword,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al registrar cuenta.");

        if (data.requiresVerification || data.require_pin) {
          setShowPinStep(true);
          setAuthError("");
          setPinError("");
          setPinCode("");
        } else {
          setIsAuthenticated(true);
        }
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Confirm PIN Code Submission
  const handleVerifyPinSubmit = async () => {
    setPinError("");
    setPinSubmitting(true);

    try {
      const res = await fetch("/api/store/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, pin_code: pinCode.trim() }),
      });
      const data = await res.json().catch(() => ({ error: "Error de respuesta del servidor al verificar PIN." }));
      if (!res.ok) throw new Error(data.error || "Código PIN inválido.");

      setShowPinStep(false);
      setIsAuthenticated(true);
      if (data.customer) {
        setCustomerName(data.customer.name || "");
        setCustomerLastname(data.customer.lastname || "");
        setDocType(data.customer.doc_type || "V");
        const pinDocNum = data.customer.doc_number || "";
        setDocNumber(pinDocNum.startsWith("TEMP-") ? "" : pinDocNum);
        setPhone(data.customer.phone || "");
      }
    } catch (err: unknown) {
      setPinError(err instanceof Error ? err.message : "Error al verificar el código PIN.");
    } finally {
      setPinSubmitting(false);
    }
  };

  const handleResendPin = async () => {
    if (!authEmail) return;
    setResendingPin(true);
    setResendPinSuccess("");
    setPinError("");

    try {
      const res = await fetch("/api/store/auth/resend-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error || "Error al reenviar el código PIN");
      } else {
        setResendPinSuccess(data.message || "Un nuevo código PIN ha sido enviado a tu correo");
        setPinCode("");
      }
    } catch {
      setPinError("Error de conexión al reenviar PIN");
    } finally {
      setResendingPin(false);
    }
  };

  // Upload Payment Receipt Photo
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/store/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir la imagen.");

      setPaymentPhoto(data.url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "No se pudo subir la foto.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Determine if selected payment method uses Divisas discount
  const isDivisasPayment = isDivisasPaymentMethod(selectedPaymentType);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Compute cart with Payment Method (BCV vs Divisa) & Volume Tier Pricing (Sum of all items in cart)
  const cartWithTiers = cart.map((item) => {
    const activeBasePrice = isDivisasPayment
      ? item.price_divisas_usd && item.price_divisas_usd > 0
        ? item.price_divisas_usd
        : item.price_usd
      : item.price_usd;

    const tierInfo = getVolumeTierInfo(
      item.quantity,
      {
        variant_id: item.variant_id,
        product_id: item.product_id,
        name: item.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price_usd: activeBasePrice,
        price_bundle_usd: isDivisasPayment && item.price_bundle_divisas_usd
          ? item.price_bundle_divisas_usd
          : item.price_bundle_usd,
        price_mayor_usd: isDivisasPayment && item.price_mayor_divisas_usd
          ? item.price_mayor_divisas_usd
          : item.price_mayor_usd,
      },
      totalCartCount
    );

    const subtotalUsd = tierInfo.effectiveUnitPrice * item.quantity;

    return {
      ...item,
      tierInfo,
      effectiveUnitPrice: tierInfo.effectiveUnitPrice,
      subtotalUsd,
    };
  });

  const totalUsd = cartWithTiers.reduce((sum, i) => sum + i.subtotalUsd, 0);
  const totalVes = totalUsd * bcvRate;

  // Breakdown metrics for customer transparency
  const totalRegularBcvUsd = cart.reduce((sum, i) => sum + i.price_usd * i.quantity, 0);
  const totalDivisasDiscountUsd = isDivisasPayment
    ? cart.reduce((sum, i) => {
        const divPrice =
          i.price_divisas_usd && i.price_divisas_usd > 0 ? i.price_divisas_usd : i.price_usd;
        return sum + (i.price_usd - divPrice) * i.quantity;
      }, 0)
    : 0;
  const totalVolumeDiscountUsd = cartWithTiers.reduce((sum, i) => {
    const activeBase = isDivisasPayment
      ? i.price_divisas_usd && i.price_divisas_usd > 0
        ? i.price_divisas_usd
        : i.price_usd
      : i.price_usd;
    const regularCost = activeBase * i.quantity;
    return sum + (regularCost - i.subtotalUsd);
  }, 0);

  // Selected Bank account info list (matches selected payment method)
  const matchingBankAccounts = bankAccounts.filter((b) => {
    const pType = b.payment_type.toLowerCase();
    const sel = selectedPaymentType.toLowerCase();
    if (sel.includes("pago móvil") || sel.includes("pago movil")) return pType === "pago_movil";
    if (sel.includes("zelle")) return pType === "zelle";
    if (sel.includes("transferencia")) return pType === "transferencia";
    if (sel.includes("usdt") || sel.includes("binance")) return pType === "usdt";
    if (sel.includes("panama") || sel.includes("panamá")) return pType === "banesco_panama" || pType === "panama";
    return pType === sel;
  });

  // Direct Web Checkout Submit
  const handleDirectWebCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setOrderError("Por favor inicia sesión o regístrate para completar tu pedido.");
      return;
    }

    const isCashPayment = selectedPaymentType.toLowerCase().includes("efectivo");
    const effectiveAddress = deliveryMethod === "retiro" ? STORE_OFFICES[selectedOffice].address : address;
    const finalShippingAgency =
      deliveryMethod === "retiro"
        ? STORE_OFFICES[selectedOffice].shippingCompanyValue
        : shippingCompany === "Otra"
        ? customShippingCompany || "Otra"
        : shippingCompany;

    if (!customerName || !customerLastname || !docNumber || !phone || !effectiveAddress) {
      setOrderError("Por favor completa todos los datos obligatorios de contacto.");
      return;
    }

    if (!isCashPayment && !reference) {
      setOrderError("Por favor ingresa el número de referencia del pago realizado.");
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError("");

    const effectiveRef = isCashPayment ? "EFECTIVO EN TIENDA" : reference.trim();

    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_lastname: customerLastname,
          doc_type: docType,
          doc_number: docNumber,
          customer_phone: phone,
          customer_email: authEmail,
          address: effectiveAddress,
          shipping_company: finalShippingAgency,
          notes,
          payment: {
            payment_type: selectedPaymentType,
            reference: effectiveRef,
            payment_photo: paymentPhoto,
          },
          items: cartWithTiers.map((i) => ({
            variant_id: i.variant_id,
            quantity: i.quantity,
            price_usd: i.effectiveUnitPrice,
          })),
          hp_field: hpField,
          form_loaded_at: formLoadedAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo procesar la orden.");

      setCompletedOrderData({
        orderNumber: data.order_number,
        customerName: `${customerName} ${customerLastname}`.trim(),
        customerEmail: authEmail,
        paymentMethod: selectedPaymentType,
        reference: effectiveRef,
        shippingCompany: finalShippingAgency,
        address: effectiveAddress,
        totalUsd: totalUsd,
        totalVes: totalVes,
        bcvRate: bcvRate,
        items: cartWithTiers.map((i) => ({
          name: i.name,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
          unitPrice: i.effectiveUnitPrice,
          subtotalUsd: i.subtotalUsd,
          photo: i.photo,
        })),
      });

      // Clear local cart
      localStorage.removeItem("cenicola_cart");
      setCart([]);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: unknown) {
      setOrderError(err instanceof Error ? err.message : "Error al procesar el pedido.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // WhatsApp Order Submission
  const handleSendWhatsApp = () => {
    if (!customerName || !phone) {
      alert("Ingresa tu Nombre y Teléfono antes de enviar por WhatsApp.");
      return;
    }

    const finalShippingAgency =
      deliveryMethod === "retiro"
        ? STORE_OFFICES[selectedOffice].shippingCompanyValue
        : shippingCompany === "Otra"
        ? customShippingCompany || "Otra"
        : shippingCompany;

    const effectiveAddress = deliveryMethod === "retiro" ? STORE_OFFICES[selectedOffice].address : address;

    const payload = {
      customerName: `${customerName} ${customerLastname}`.trim(),
      customerPhone: phone,
      docNumber: `${docType}-${docNumber}`,
      address: `${finalShippingAgency}: ${effectiveAddress}`,
      paymentMethod: selectedPaymentType,
      reference: selectedPaymentType.toLowerCase().includes("efectivo") ? "EFECTIVO EN TIENDA" : reference,
      notes,
      bcvRate,
      items: cartWithTiers.map((i) => ({
        variant_id: i.variant_id,
        product_name: i.name,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        unit_price_usd: i.effectiveUnitPrice,
        tier: i.tierInfo.tier,
        subtotal_usd: i.subtotalUsd,
      })),
      totalUsd,
      totalVes,
    };

    const waPhoneOverride = deliveryMethod === "retiro" ? STORE_OFFICES[selectedOffice].whatsappPhone : undefined;
    const waUrl = getWhatsAppUrl(payload, waPhoneOverride);
    window.open(waUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-black selection:text-white">
      <StoreNavbar
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenSearch={() => setSearchDrawerOpen(true)}
        onOpenCart={() => setCartDrawerOpen(true)}
      />

      {completedOrderData ? (
        <main className="flex-1 bg-white">
          <OrderSuccessView
            orderData={completedOrderData}
            onGoToOrders={() =>
              router.push(`/cuenta?success=order_created&order=${completedOrderData.orderNumber}`)
            }
            onContinueShopping={() => router.push("/catalogo")}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
        {/* Header Navigation */}
        <div className="flex justify-between items-center pb-2 text-xs uppercase tracking-wider">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-black transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>VOLVER A LA COLECCIÓN</span>
          </Link>

          <span className="text-slate-400 font-semibold tracking-wider">
            FINALIZAR PEDIDO
          </span>
        </div>

        <form onSubmit={handleDirectWebCheckout} className="space-y-6">
          {/* SECTION 1: RESUMEN DE TU PEDIDO */}
          <section className="border border-slate-200 p-6 sm:p-8 space-y-6 bg-white rounded-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-black">
                1. RESUMEN DE TU PEDIDO ({cart.reduce((s, i) => s + i.quantity, 0)} PRENDAS)
              </h2>
              <button
                type="button"
                onClick={() => setCartDrawerOpen(true)}
                className="text-[11px] text-slate-500 hover:text-black underline uppercase tracking-wider cursor-pointer"
              >
                EDITAR
              </button>
            </div>

            {/* Itemized List */}
            <div className="divide-y divide-slate-100">
              {cartWithTiers.map((item) => (
                <div key={item.variant_id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-14 aspect-[3/4] bg-slate-100 shrink-0 overflow-hidden border border-slate-200 rounded-xs">
                      <SafeImage src={item.photo} alt={item.name} fill sizes="60px" className="object-cover" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-black uppercase tracking-wider line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase">
                        TALLA: <span className="font-semibold text-black">{item.size}</span>
                        {item.color && ` | COLOR: ${item.color}`}
                      </p>
                      <p className="text-[10px] text-slate-500 font-normal">
                        Cantidad: <span className="font-semibold text-black">{item.quantity}</span> x ${item.effectiveUnitPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5">
                    <span className="font-bold text-black text-sm block">
                      ${item.subtotalUsd.toFixed(2)}
                    </span>
                    {item.tierInfo.tier !== "detal" && (
                      <span className="text-[9px] font-semibold text-black bg-slate-100 px-1.5 py-0.5 uppercase tracking-wider block rounded-xs">
                        {item.tierInfo.badgeLabel}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Totals & Detailed Discount Breakdown (USD & VES) */}
            <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal base (BCV):</span>
                <span>${totalRegularBcvUsd.toFixed(2)}</span>
              </div>

              {isDivisasPayment && totalDivisasDiscountUsd > 0 && (
                <div className="flex justify-between items-center text-black font-normal bg-slate-50 p-2.5 border border-slate-200 uppercase tracking-wider text-[11px] rounded-xs">
                  <span>DESCUENTO DIVISA APLICADO:</span>
                  <span className="font-semibold">-${totalDivisasDiscountUsd.toFixed(2)}</span>
                </div>
              )}

              {totalVolumeDiscountUsd > 0 && (
                <div className="flex justify-between items-center text-black font-normal bg-slate-50 p-2.5 border border-slate-200 uppercase tracking-wider text-[11px] rounded-xs">
                  <span>DESCUENTO PAQUETE/DOCENA APLICADO:</span>
                  <span className="font-semibold">-${totalVolumeDiscountUsd.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-black">
                <span className="font-bold uppercase tracking-wider text-sm">TOTAL GENERAL:</span>
                <div className="text-right">
                  <span className="font-extrabold text-2xl tracking-tight block">
                    ${totalUsd.toFixed(2)}
                  </span>
                  {!isDivisasPayment && (
                    <span className="text-xs text-slate-500 font-mono block">
                      (Bs. {totalVes.toFixed(2)} a Tasa BCV: {bcvRate.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: DATOS DE ENVÍO Y CONTACTO / AUTENTICACIÓN */}
          <section className="border border-slate-200 p-6 sm:p-8 space-y-6 bg-white rounded-xs">
            <div className="pb-3 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-black">
                2. DATOS DE ENVÍO Y CONTACTO
              </h2>
              {isAuthenticated && (
                <span className="text-[10px] bg-slate-100 text-black font-semibold px-2 py-0.5 rounded-xs uppercase tracking-wider border border-slate-200">
                  Sesión Iniciada
                </span>
              )}
            </div>

            {authLoading ? (
              <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
              </div>
            ) : showPinStep ? (
              /* PIN CODE VERIFICATION FORM - CENTERED ELEGANT CARD */
              <div className="bg-slate-50 p-5 border border-slate-200 rounded-xs space-y-4 my-2">
                <div className="text-center space-y-1">
                  <KeyRound className="w-6 h-6 text-black mx-auto" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-black">
                    Verificación por Código PIN
                  </h3>
                  <p className="text-xs text-slate-600">
                    Ingresa el código PIN de 6 dígitos enviado a <strong className="text-black font-mono">{authEmail}</strong>:
                  </p>
                </div>

                {pinError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs text-center font-medium">
                    {pinError}
                  </div>
                )}

                {resendPinSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs text-center font-medium">
                    {resendPinSuccess}
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center border border-slate-300 focus:border-black p-3 text-lg font-mono font-bold tracking-[0.5em] text-black focus:outline-none bg-white rounded-xs"
                    placeholder="123456"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPinStep(false)}
                    className="w-1/2 border border-slate-300 bg-white text-black text-xs font-semibold uppercase tracking-wider py-3 rounded-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyPinSubmit}
                    disabled={pinSubmitting}
                    className="w-1/2 bg-black text-white text-xs font-semibold uppercase tracking-wider py-3 rounded-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {pinSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Código"}
                  </button>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleResendPin}
                    disabled={resendingPin}
                    className="text-[11px] text-slate-500 hover:text-black font-semibold uppercase tracking-wider underline transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {resendingPin ? "Reenviando Código..." : "¿No recibiste el PIN? Reenviar Código"}
                  </button>
                </div>
              </div>
            ) : !isAuthenticated ? (
              /* LOGIN / REGISTER TABS - CLEAN MINIMALIST WHITE */
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-2 text-slate-700 text-xs font-medium uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Inicia Sesión o Regístrate para Completar el Pedido</span>
                </div>

                {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                    {authError.includes("ya se encuentra registrado") && (
                      <div className="pt-1 flex gap-3 text-[11px] font-semibold underline">
                        <button
                          type="button"
                          onClick={() => { setAuthTab("login"); setAuthError(""); }}
                          className="text-red-900 hover:text-black cursor-pointer"
                        >
                          → Iniciar Sesión
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthTab("forgot"); setForgotStep(1); setAuthError(""); }}
                          className="text-red-900 hover:text-black cursor-pointer"
                        >
                          → Recuperar Contraseña
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {resendPinSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{resendPinSuccess}</span>
                  </div>
                )}

                {/* Google Sign-In Button */}
                {authTab !== "forgot" && (
                  <>
                    <a
                      href="/api/store/auth/google?redirect=/checkout"
                      className="w-full border border-slate-300 bg-white text-black py-2.5 px-4 text-xs font-semibold uppercase tracking-wider hover:bg-slate-50 transition-colors flex items-center justify-center gap-2.5 rounded-xs"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continuar con Google</span>
                    </a>

                    <div className="relative flex items-center justify-center my-1">
                      <div className="border-t border-slate-200 w-full" />
                      <span className="bg-white px-2.5 text-[10px] text-slate-400 uppercase tracking-widest absolute">o con tu correo</span>
                    </div>
                  </>
                )}

                <div className="flex border-b border-slate-200 text-xs font-medium uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => { setAuthTab("login"); setAuthError(""); setResendPinSuccess(""); }}
                    className={`py-2 px-4 border-b-2 cursor-pointer transition-colors ${
                      authTab === "login"
                        ? "border-black font-semibold text-black"
                        : "border-transparent text-slate-400 hover:text-black"
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab("register"); setAuthError(""); setResendPinSuccess(""); }}
                    className={`py-2 px-4 border-b-2 cursor-pointer transition-colors ${
                      authTab === "register"
                        ? "border-black font-semibold text-black"
                        : "border-transparent text-slate-400 hover:text-black"
                    }`}
                  >
                    Crear Cuenta
                  </button>
                  {authTab === "forgot" && (
                    <button
                      type="button"
                      className="py-2 px-4 border-b-2 border-black font-semibold text-black"
                    >
                      Recuperar Clave
                    </button>
                  )}
                </div>

                {authTab === "forgot" ? (
                  <div className="space-y-3 text-xs pt-1">
                    <p className="text-slate-600 text-[11px]">
                      {forgotStep === 1
                        ? "Ingresa tu correo para recibir un código PIN de 6 dígitos y restablecer tu clave."
                        : "Ingresa el código PIN recibido en tu correo y tu nueva contraseña."}
                    </p>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        maxLength={100}
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        disabled={forgotStep === 2}
                        className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white font-mono"
                        placeholder="tuemail@gmail.com"
                        required
                      />
                    </div>

                    {forgotStep === 2 && (
                      <>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">Código PIN (6 dígitos) *</label>
                          <input
                            type="text"
                            maxLength={6}
                            value={forgotPin}
                            onChange={(e) => setForgotPin(e.target.value.replace(/\D/g, ""))}
                            className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white font-mono text-center tracking-widest text-sm font-bold"
                            placeholder="123456"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">Nueva Contraseña (Mínimo 8 caracteres) *</label>
                          <input
                            type="password"
                            maxLength={100}
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white font-mono"
                            placeholder="••••••••"
                            required
                          />
                        </div>
                      </>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={() => { setAuthTab("login"); setForgotStep(1); setAuthError(""); }}
                        className="text-[11px] text-slate-500 hover:text-black underline cursor-pointer"
                      >
                        ← Volver a Iniciar Sesión
                      </button>
                      {forgotStep === 2 && (
                        <button
                          type="button"
                          onClick={() => setForgotStep(1)}
                          className="text-[11px] text-slate-500 hover:text-black underline cursor-pointer"
                        >
                          Reenviar PIN
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    {authTab === "register" && (
                      <>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">Nombre</label>
                          <input
                            type="text"
                            maxLength={50}
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white"
                            placeholder="Ej. María"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">Apellido</label>
                          <input
                            type="text"
                            maxLength={50}
                            value={customerLastname}
                            onChange={(e) => setCustomerLastname(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white"
                            placeholder="Ej. Pérez"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">Cédula / RIF</label>
                          <div className="flex gap-2">
                            <select
                              value={docType}
                              onChange={(e) => setDocType(e.target.value)}
                              className="px-2 py-2 border border-slate-300 text-xs text-black bg-white font-semibold focus:outline-none focus:border-black rounded-xs"
                            >
                              <option value="V">V-</option>
                              <option value="J">J-</option>
                              <option value="E">E-</option>
                              <option value="P">P-</option>
                            </select>
                            <input
                              type="text"
                              maxLength={12}
                              value={docNumber}
                              onChange={(e) => setDocNumber(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white font-mono"
                              placeholder="12345678"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">Teléfono</label>
                          <input
                            type="tel"
                            maxLength={20}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white font-mono"
                            placeholder="Ej. 04121234567"
                          />
                        </div>
                      </>
                    )}

                    <div className={authTab === "login" ? "sm:col-span-2" : ""}>
                      <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        maxLength={100}
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white font-mono"
                        placeholder="maria@gmail.com"
                        required
                      />
                    </div>

                    {authTab === "register" && (
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">Confirmar Correo Electrónico *</label>
                        <input
                          type="email"
                          maxLength={100}
                          value={authConfirmEmail}
                          onChange={(e) => setAuthConfirmEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white font-mono"
                          placeholder="Repite tu correo electrónico"
                          required
                        />
                      </div>
                    )}

                    <div className={authTab === "login" ? "sm:col-span-2" : ""}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] uppercase tracking-wider text-black font-normal">Contraseña (Mínimo 8 caracteres) *</label>
                        {authTab === "login" && (
                          <button
                            type="button"
                            onClick={() => { setAuthTab("forgot"); setForgotStep(1); setAuthError(""); }}
                            className="text-[10px] text-slate-500 hover:text-black underline cursor-pointer"
                          >
                            ¿Olvidaste tu contraseña?
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        maxLength={100}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white font-mono"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    {authTab === "register" && (
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">Confirmar Contraseña *</label>
                        <input
                          type="password"
                          maxLength={100}
                          value={authConfirmPassword}
                          onChange={(e) => setAuthConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white font-mono"
                          placeholder="Repite tu contraseña"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAuthSubmit}
                  disabled={authSubmitting}
                  className="w-full bg-black text-white py-3 px-4 text-xs font-normal uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 rounded-xs cursor-pointer"
                >
                  {authSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : authTab === "forgot" ? (
                    forgotStep === 1 ? "Enviar PIN de Recuperación" : "Restablecer Contraseña"
                  ) : authTab === "register" ? (
                    "Crear Cuenta"
                  ) : (
                    "Iniciar Sesión"
                  )}
                </button>
              </div>
            ) : (
              /* LOGGED IN CUSTOMER FIELDS WITH DELIVERY MODE SELECTOR */
              <div className="space-y-5 pt-1">
                {/* Switcher de Modalidad de Entrega */}
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider text-black font-semibold">
                    MODALIDAD DE ENTREGA *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("envio")}
                      className={`p-3.5 border text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs transition-all cursor-pointer ${
                        deliveryMethod === "envio"
                          ? "border-black bg-black text-white shadow-xs font-bold"
                          : "border-slate-300 bg-white text-slate-700 hover:border-black"
                      }`}
                    >
                      <Truck className="w-4 h-4 shrink-0" />
                      <span>Envío por Agencia</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("retiro")}
                      className={`p-3.5 border text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs transition-all cursor-pointer ${
                        deliveryMethod === "retiro"
                          ? "border-black bg-black text-white shadow-xs font-bold"
                          : "border-slate-300 bg-white text-slate-700 hover:border-black"
                      }`}
                    >
                      <Store className="w-4 h-4 shrink-0" />
                      <span>Retiro en Tienda</span>
                    </button>
                  </div>
                </div>

                {/* Customer Contact Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                      NOMBRE *
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white"
                      placeholder="Ej. María"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                      APELLIDO *
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={customerLastname}
                      onChange={(e) => setCustomerLastname(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white"
                      placeholder="Ej. Pérez"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                      CÉDULA / RIF *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="px-2 py-2 border border-slate-300 text-xs text-black bg-slate-50 font-semibold focus:outline-none focus:border-black rounded-xs"
                      >
                        <option value="V">V-</option>
                        <option value="J">J-</option>
                        <option value="E">E-</option>
                        <option value="P">P-</option>
                      </select>
                      <input
                        type="text"
                        maxLength={12}
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white font-mono"
                        placeholder="12345678"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                      TELÉFONO DE CONTACTO *
                    </label>
                    <input
                      type="tel"
                      maxLength={20}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white font-mono"
                      placeholder="Ej. 04121234567"
                      required
                    />
                  </div>
                </div>

                {/* Conditional Shipping Agency Selector vs Pickup Store Selector */}
                {deliveryMethod === "envio" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                        EMPRESA DE ENVÍO / AGENCIA *
                      </label>
                      <select
                        value={shippingCompany}
                        onChange={(e) => setShippingCompany(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 text-xs font-semibold text-black bg-white focus:outline-none focus:border-black rounded-xs uppercase tracking-wider"
                      >
                        <option value="MRW">MRW</option>
                        <option value="Zoom">Zoom</option>
                        <option value="Tealca">Tealca</option>
                        <option value="Domesa">Domesa</option>
                        <option value="LAE">LAE</option>
                        <option value="Otra">Otra...</option>
                      </select>
                    </div>
                    {shippingCompany === "Otra" && (
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                          ESPECIFICAR EMPRESA DE ENVÍO *
                        </label>
                        <input
                          type="text"
                          maxLength={50}
                          value={customShippingCompany}
                          onChange={(e) => setCustomShippingCompany(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white"
                          placeholder="Ej. Liberty Express, DHL, Fletes GAG..."
                          required
                        />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                        DIRECCIÓN DE ENVÍO / AGENCIA (MRW, ZOOM, TEALCA) *
                      </label>
                      <textarea
                        rows={2}
                        maxLength={250}
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          setSavedUserAddress(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white"
                        placeholder="Ej. Agencia MRW Sabana Grande, Caracas / o dirección de entrega..."
                        required
                      />
                    </div>
                  </div>
                ) : (
                  /* Store Pickup Office Selector Cards (Minimalist Style) */
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <label className="block text-[11px] uppercase tracking-wider text-black font-semibold">
                      SELECCIONA LA SUCURSAL DE RETIRO *
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(["maracay", "caracas"] as StoreOfficeKey[]).map((key) => {
                        const office = STORE_OFFICES[key];
                        const isAvailable = office.isAvailable;
                        const isSelected = selectedOffice === key && isAvailable;
                        return (
                          <div
                            key={key}
                            onClick={() => {
                              if (isAvailable) setSelectedOffice(key);
                            }}
                            className={`p-4 border transition-all rounded-xs space-y-1.5 ${
                              !isAvailable
                                ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed select-none"
                                : isSelected
                                ? "bg-white border-black ring-1 ring-black cursor-pointer"
                                : "bg-white border-slate-200 hover:border-black cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-xs font-bold uppercase tracking-wider ${isAvailable ? "text-black" : "text-slate-500"}`}>
                                {office.name}
                              </span>
                              {isSelected ? (
                                <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                              ) : !isAvailable ? (
                                <span className="text-[9px] font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-xs uppercase tracking-wider shrink-0">
                                  Próximamente
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-500 font-normal leading-relaxed">{office.address}</p>
                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                              {office.hours}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Información Breve de la Sede y Plazo Estimado */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xs text-xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <span className="font-bold text-black uppercase tracking-wider text-[11px]">
                          DETALLES DE RETIRO — {STORE_OFFICES[selectedOffice].shortName.toUpperCase()}
                        </span>
                        <a
                          href={STORE_OFFICES[selectedOffice].mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-black hover:underline"
                        >
                          <span>VER EN MAPA</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600 text-[11px]">
                        <span>Teléfono: <strong className="text-black font-mono">{STORE_OFFICES[selectedOffice].phone}</strong></span>
                        <span>Plazo de preparación: <strong className="text-black font-semibold uppercase">{PICKUP_ESTIMATED_TIME}</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* SECTION 3: MÉTODO DE PAGO Y NOTAS DE ENTREGA */}
          <section className="border border-slate-200 p-5 sm:p-7 space-y-4 bg-white rounded-xs">
            <div className="pb-3 border-b border-slate-200">
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-black">
                3. MÉTODO DE PAGO Y NOTAS DE ENTREGA
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                  Selecciona Método de Pago Preferido:
                </label>
                <select
                  value={selectedPaymentType}
                  onChange={(e) => setSelectedPaymentType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 text-xs font-semibold text-black bg-white focus:outline-none focus:border-black rounded-xs uppercase tracking-wider"
                >
                  {deliveryMethod === "retiro" && (
                    <option value="Efectivo en Tienda (USD Divisas)">Efectivo en Tienda (USD Divisas)</option>
                  )}
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Zelle">Zelle</option>
                  <option value="USDT">USDT (Binance)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                  Nota Opcional de Entrega
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 text-xs text-black focus:outline-none focus:border-black rounded-xs bg-white"
                  placeholder="Ej. Horario de entrega o detalles de empaque..."
                />
              </div>
            </div>

            {/* Visualización de Datos de Pago — Estilo Minimalista (Sin tarjetas anidadas) */}
            {isAuthenticated && !selectedPaymentType.includes("Efectivo") && (
              <div className="pt-2 space-y-4 border-t border-slate-100">
                <div className="space-y-3 text-xs">
                  <span className="text-[11px] font-semibold text-black uppercase tracking-wider block">
                    DATOS DE PAGO ({selectedPaymentType.toUpperCase()}):
                  </span>

                  {banksLoading ? (
                    <div className="py-2 text-slate-400 flex items-center gap-2 text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando datos...
                    </div>
                  ) : matchingBankAccounts.length > 0 ? (
                    <div className="divide-y divide-slate-100 border-t border-b border-slate-200 py-1">
                      {matchingBankAccounts.map((bank) => (
                        <div key={bank.id} className="py-3 space-y-1.5">
                          <p className="font-bold text-black uppercase tracking-wider text-xs">
                            {bank.bank_name}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-slate-700 text-xs pt-0.5">
                            {bank.account_name && (
                              <p>
                                <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold block">TITULAR:</span>
                                <span className="font-medium text-black">{bank.account_name}</span>
                              </p>
                            )}
                            {bank.id_number && (
                              <p>
                                <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold block">CÉDULA / RIF:</span>
                                <span className="font-mono text-black font-semibold">{bank.id_number}</span>
                              </p>
                            )}
                            {bank.phone_number && (
                              <p>
                                <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold block">TELÉFONO PAGO MÓVIL:</span>
                                <span className="font-mono text-black font-semibold">{bank.phone_number}</span>
                              </p>
                            )}
                            {bank.email && (
                              <p>
                                <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold block">CORREO DE PAGO:</span>
                                <span className="font-mono text-black">{bank.email}</span>
                              </p>
                            )}
                            {bank.account_num && (
                              <p className="sm:col-span-2">
                                <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold block">NÚMERO DE CUENTA:</span>
                                <span className="font-mono text-black font-semibold text-xs tracking-wider">{bank.account_num}</span>
                              </p>
                            )}
                          </div>

                          {bank.notes && (
                            <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                              {bank.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-xs">
                      Transfiere el monto exacto antes de ingresar el número de referencia.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                      N° de Referencia de Pago *
                    </label>
                    <input
                      type="text"
                      maxLength={30}
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 text-xs text-black focus:outline-none focus:border-black font-mono font-semibold rounded-xs bg-white"
                      placeholder="Ej. 123456"
                      required={!selectedPaymentType.includes("Efectivo")}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-black font-normal mb-1">
                      Foto / Captura del Comprobante
                    </label>

                    <input
                      type="file"
                      id="comprobante-file-input"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />

                    {paymentPhoto ? (
                      <div className="flex items-center gap-3 bg-slate-50 p-2 border border-slate-200 rounded-xs">
                        <div className="relative w-12 h-12 bg-white rounded-xs overflow-hidden shrink-0 border border-slate-200">
                          <Image src={paymentPhoto} alt="Comprobante" fill className="object-cover" unoptimized />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                            ✓ Comprobante Adjuntado
                          </p>
                          <p className="text-[9px] text-slate-400 truncate font-mono">
                            {paymentPhoto}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPaymentPhoto("")}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Eliminar comprobante"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="comprobante-file-input"
                        className={`w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-black text-xs font-normal text-slate-600 hover:text-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors rounded-xs bg-white ${
                          uploadingPhoto ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-black" />
                            <span>Subiendo comprobante...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 text-black" />
                            <span>Subir Captura de Pantalla / Foto</span>
                          </>
                        )}
                      </label>
                    )}

                        {uploadError && (
                          <p className="text-[10px] text-red-600 font-semibold pt-1">{uploadError}</p>
                        )}
                      </div>
                    </div>
              </div>
            )}
          </section>

          {/* ERROR ALERT */}
          {orderError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {orderError}
            </div>
          )}

          {/* SECTION 4: BOTONES DE ACCIÓN */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            {/* Invisible Anti-Bot Honeypot Trap */}
            <div style={{ opacity: 0, position: "absolute", left: "-9999px", pointerEvents: "none" }} aria-hidden="true">
              <input
                type="text"
                name="website_url_hp"
                tabIndex={-1}
                autoComplete="off"
                value={hpField}
                onChange={(e) => setHpField(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingOrder || !isAuthenticated}
              className={`w-full py-4 px-6 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-xs font-semibold ${
                isAuthenticated
                  ? "bg-black hover:bg-slate-800 text-white cursor-pointer shadow-sm hover:shadow active:scale-[0.99]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
              }`}
            >
              {isSubmittingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Procesando Pedido...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Completar pedido</span>
                </>
              )}
            </button>

            {/* SEPARADOR "o si prefieres:" */}
            <div className="relative flex py-1 items-center justify-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="shrink mx-3 text-[11px] text-slate-400 lowercase font-medium tracking-wide">
                o si prefieres:
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* BOTÓN BLANCO WHATSAPP */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={isSubmittingOrder}
              className="w-full bg-white hover:bg-slate-50 border border-black text-black font-semibold py-3.5 px-6 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-xs shadow-2xs cursor-pointer active:scale-[0.99]"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Envía por WhatsApp</span>
            </button>

            <p className="text-[11px] text-slate-500 text-center uppercase tracking-wider font-normal pt-1">
              Selecciona tu método preferido para procesar tu orden de inmediato.
            </p>
          </div>
        </form>
      </main>
      )}

      <SearchDrawer
        isOpen={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
        onSearchSubmit={(q) => router.push(`/catalogo?q=${encodeURIComponent(q)}`)}
      />

      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        bcvRate={bcvRate}
      />

      <StoreFooter />
    </div>
  );
}
