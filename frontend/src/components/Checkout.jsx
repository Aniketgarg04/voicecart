import { useState, useMemo, useRef, useEffect } from 'react';
import { ShoppingBag, CreditCard, Apple, CheckCircle2, Truck, ArrowRight, Plus, Minus, Trash2, Download } from 'lucide-react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import useShoppingStore from '../store/useShoppingStore';

export default function Checkout() {
  const items = useShoppingStore((s) => s.items);
  const catalog = useShoppingStore((s) => s.catalog);
  const userDetails = useShoppingStore((s) => s.userDetails);
  const removeItemOptimistic = useShoppingStore((s) => s.removeItemOptimistic);
  const updateQuantityOptimistic = useShoppingStore((s) => s.updateQuantityOptimistic);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  const invoiceRef = useRef(null);

  useEffect(() => {
    const handleGenerateBill = () => {
      if (!isProcessing && !isSuccess && activeItems.length > 0) {
        handlePay();
      }
    };
    window.addEventListener('generate-bill', handleGenerateBill);
    return () => window.removeEventListener('generate-bill', handleGenerateBill);
  });

  // Use the active items that the user actually wants to buy
  const activeItems = (items || []).filter((i) => !i.isCompleted);

  const { subtotal, tax, delivery, total } = useMemo(() => {
    const calculatedSubtotal = activeItems.reduce((sum, item) => {
      const itemName = (item.name || '').trim().toLowerCase();
      const match = (catalog || []).find((c) => c?.name && c.name.trim().toLowerCase() === itemName);
      const unitPrice = match?.price ? Number(match.price) : 3.5;
      return sum + unitPrice * (Number(item.quantity) || 1);
    }, 0);

    const calculatedTax = calculatedSubtotal * 0.08; // 8% flat tax for example
    const calculatedDelivery = calculatedSubtotal > 35 ? 0 : 5.99; // Free delivery over $35
    const calculatedTotal = calculatedSubtotal + calculatedTax + calculatedDelivery;

    return {
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      delivery: calculatedDelivery,
      total: calculatedTotal
    };
  }, [activeItems, catalog]);

  const handlePay = async () => {
    setIsProcessing(true);
    // Simulate payment delay
    await new Promise(r => setTimeout(r, 1500));
    
    const newOrderId = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setOrderId(newOrderId);
    setIsProcessing(false);
    setIsSuccess(true);
    
    // Automatically generate and download PDF after state updates to render the invoice
    setTimeout(() => {
      downloadPDF(newOrderId);
    }, 500);
  };

  const downloadPDF = async (generatedOrderId = orderId) => {
    if (!invoiceRef.current) return;
    
    try {
      // Temporarily ensure it's visible for canvas capture if needed, though off-screen usually works
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`VoiceCart_Invoice_${generatedOrderId}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  const handleStepQty = async (item, delta) => {
    if (!item?._id || item._id.startsWith('temp-')) return;
    updateQuantityOptimistic(item._id, delta);
    try {
      const newQty = Math.max(1, (Number(item.quantity) || 1) + delta);
      await axios.patch(`/api/items/${item._id}`, { quantity: newQty });
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const handleDelete = async (item) => {
    if (!item?._id || item._id.startsWith('temp-')) return;
    removeItemOptimistic(item._id);
    try {
      await axios.delete(`/api/items/${item._id}`);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] pro-card p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Payment Successful!</h2>
        <p className="text-[var(--text-secondary)] mb-8 max-w-md">
          Your order has been placed and is being prepared for delivery. You will receive an email confirmation shortly.
        </p>
        <button
          onClick={() => downloadPDF()}
          className="pro-btn pro-btn-secondary px-8 py-3 rounded-full text-base font-semibold mb-3 flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download Bill Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="pro-btn pro-btn-primary px-8 py-3 rounded-full text-base font-semibold"
        >
          Start New Order
        </button>

        {/* Hidden Invoice Template for PDF Generation */}
        <div className="absolute top-[-9999px] left-[-9999px]">
          <div ref={invoiceRef} className="w-[800px] p-12 bg-white text-slate-800 font-sans">
            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter">VoiceCart</h1>
                </div>
                <p className="text-slate-500">AI Grocery Hub</p>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-bold text-slate-300 mb-2">INVOICE</h2>
                <p className="font-semibold text-slate-700">{orderId}</p>
                <p className="text-slate-500">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex justify-between mb-12">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</h3>
                <p className="font-bold text-slate-800 text-lg">{userDetails?.name || 'Valued Customer'}</p>
                <p className="text-slate-600">{userDetails?.email}</p>
                <p className="text-slate-600">{userDetails?.phone}</p>
              </div>
              <div className="text-right">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Status</h3>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Paid
                </span>
              </div>
            </div>

            <table className="w-full mb-12">
              <thead>
                <tr className="border-b-2 border-slate-800 text-left">
                  <th className="py-3 font-bold text-slate-800">Item Description</th>
                  <th className="py-3 font-bold text-slate-800 text-center">Qty</th>
                  <th className="py-3 font-bold text-slate-800 text-right">Unit Price</th>
                  <th className="py-3 font-bold text-slate-800 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeItems.map(item => {
                  const itemName = (item.name || '').trim().toLowerCase();
                  const match = (catalog || []).find((c) => c?.name && c.name.trim().toLowerCase() === itemName);
                  const unitPrice = match?.price ? Number(match.price) : 3.5;
                  const itemTotal = unitPrice * item.quantity;
                  return (
                    <tr key={item._id}>
                      <td className="py-4">
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{item.category} • {item.unit}</p>
                      </td>
                      <td className="py-4 text-center text-slate-700 font-semibold">{item.quantity}</td>
                      <td className="py-4 text-right text-slate-700">${unitPrice.toFixed(2)}</td>
                      <td className="py-4 text-right font-bold text-slate-800">${itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex justify-end border-t-2 border-slate-200 pt-6">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (8%)</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery</span>
                  <span className="font-semibold">{delivery === 0 ? 'Free' : `$${delivery.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-slate-900 border-t border-slate-200 pt-3 mt-3">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-black text-xl">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-16 text-center text-slate-400 text-sm">
              <p>Thank you for shopping with VoiceCart!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] pro-card p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Your cart is empty</h3>
        <p className="text-[var(--text-secondary)] mt-2">Add some items from your shopping list to checkout.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* Left Column: Order Summary */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="pro-card p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 mb-6">
            <ShoppingBag className="w-6 h-6 text-indigo-500" />
            Order Summary
          </h2>
          
          <div className="flex flex-col gap-4">
            {activeItems.map((item) => (
              <div key={item._id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.quantity}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)]">{item.name}</h4>
                    <span className="text-xs text-[var(--text-muted)] capitalize">{item.category}</span>
                  </div>
                </div>
                <div className="text-right flex items-center justify-end gap-3">
                  <div className="flex flex-col items-end">
                    {(() => {
                      const itemName = (item.name || '').trim().toLowerCase();
                      const match = (catalog || []).find((c) => c?.name && c.name.trim().toLowerCase() === itemName);
                      const unitPrice = match?.price ? Number(match.price) : 3.5;
                      return <span className="font-bold text-lg text-[var(--text-primary)]">${(unitPrice * item.quantity).toFixed(2)}</span>;
                    })()}
                    {(() => {
                      const itemName = (item.name || '').trim().toLowerCase();
                      const match = (catalog || []).find((c) => c?.name && c.name.trim().toLowerCase() === itemName);
                      const unitPrice = match?.price ? Number(match.price) : 3.5;
                      return <span className="text-xs text-[var(--text-muted)]">${unitPrice.toFixed(2)}/ea</span>;
                    })()}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 border-l border-[var(--border-color)] pl-3 ml-1">
                    <button 
                      onClick={() => handleStepQty(item, -1)}
                      disabled={item.quantity <= 1}
                      className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleStepQty(item, 1)}
                      className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item)}
                      className="p-1.5 ml-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right Column: Payment & Total */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="pro-card p-6 sticky top-24">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            Payment Details
          </h2>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Subtotal ({activeItems.length} items)</span>
              <span className="font-semibold text-[var(--text-primary)]">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Estimated Tax</span>
              <span className="font-semibold text-[var(--text-primary)]">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Delivery Fee</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {delivery === 0 ? <span className="text-emerald-500">Free</span> : `$${delivery.toFixed(2)}`}
              </span>
            </div>
            <div className="pt-4 border-t border-[var(--border-color)] flex justify-between items-center">
              <span className="text-lg font-bold text-[var(--text-primary)]">Total</span>
              <span className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full pro-btn pro-btn-primary py-4 text-base font-bold shadow-lg shadow-indigo-500/25 relative overflow-hidden group"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Pay ${total.toFixed(2)}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>


          <p className="text-xs text-center text-[var(--text-muted)] mt-6 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Secure SSL Encryption
          </p>
        </div>
      </div>
    </div>
  );
}
