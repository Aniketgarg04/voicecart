import { useState, useEffect } from 'react';
import { User, Mail, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import useShoppingStore from '../store/useShoppingStore';

export default function OnboardingModal() {
  const userDetails = useShoppingStore((s) => s.userDetails);
  const setUserDetails = useShoppingStore((s) => s.setUserDetails);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [errors, setErrors] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  // Show modal if userDetails are completely missing
  useEffect(() => {
    if (!userDetails || !userDetails.name) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [userDetails]);

  if (!isVisible) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save to store (and local storage)
    setUserDetails(formData);
    setIsVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up relative">
        
        {/* Header Graphic */}
        <div className="bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 h-24 p-6 relative">
          <div className="absolute -bottom-8 left-6 w-16 h-16 bg-[var(--bg-surface)] rounded-xl flex items-center justify-center shadow-lg">
            <User className="w-8 h-8 text-indigo-500" />
          </div>
        </div>

        {/* Content */}
        <div className="pt-12 px-6 pb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Welcome to VoiceCart</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Let's get to know you! Please enter your details below so we can generate your final bills correctly.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  className={`w-full pl-10 pr-4 py-2.5 bg-[var(--bg-page)] border ${errors.name ? 'border-red-500' : 'border-[var(--border-color)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  className={`w-full pl-10 pr-4 py-2.5 bg-[var(--bg-page)] border ${errors.email ? 'border-red-500' : 'border-[var(--border-color)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: null });
                  }}
                  className={`w-full pl-10 pr-4 py-2.5 bg-[var(--bg-page)] border ${errors.phone ? 'border-red-500' : 'border-[var(--border-color)]'} rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <button
              type="submit"
              className="mt-4 w-full pro-btn pro-btn-primary py-3.5 flex items-center justify-center gap-2 text-sm"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[10px] text-[var(--text-muted)] text-center flex items-center justify-center gap-1 mt-2">
              <ShieldCheck className="w-3 h-3" /> Your information is stored securely on your device.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
