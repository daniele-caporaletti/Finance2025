
import React from 'react';
import { 
  TrendingUp, Bus, Gift, Banknote, Wrench, Home, Heart, CreditCard, 
  Percent, Smile, FileText, GraduationCap, PartyPopper, Utensils, 
  Tag, ArrowRightLeft, ShoppingBag, CircleHelp, Briefcase
} from 'lucide-react';

export const getCategoryIcon = (category: string, className = "w-5 h-5") => {
  switch (category.toUpperCase()) {
    case 'INVESTMENT': return <TrendingUp className={className} />;
    case 'TRANSPORTATION': return <Bus className={className} />;
    case 'GIFT': return <Gift className={className} />;
    case 'SALARY': return <Banknote className={className} />;
    case 'MAINTENANCE': return <Wrench className={className} />;
    case 'HOUSING': return <Home className={className} />;
    case 'HEALTH': return <Heart className={className} />;
    case 'SUBSCRIPTION': return <CreditCard className={className} />;
    case 'INTEREST': return <Percent className={className} />;
    case 'WELLNESS': return <Smile className={className} />;
    case 'TAXES': return <FileText className={className} />;
    case 'STUDY': return <GraduationCap className={className} />;
    case 'ENTERTAINMENT': return <PartyPopper className={className} />;
    case 'RESTAURANT': return <Utensils className={className} />;
    case 'SALES': return <Tag className={className} />;
    case 'TRANSFER': return <ArrowRightLeft className={className} />;
    case 'SHOPPING': return <ShoppingBag className={className} />;
    default: return <CircleHelp className={className} />;
  }
};

export const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
        'INVESTMENT': 'bg-blue-100 text-blue-800',
        'TRANSPORTATION': 'bg-orange-100 text-orange-800',
        'GIFT': 'bg-pink-100 text-pink-800',
        'SALARY': 'bg-emerald-100 text-emerald-800',
        'MAINTENANCE': 'bg-stone-100 text-stone-800',
        'HOUSING': 'bg-cyan-100 text-cyan-800',
        'HEALTH': 'bg-red-100 text-red-800',
        'SUBSCRIPTION': 'bg-indigo-100 text-indigo-800',
        'INTEREST': 'bg-lime-100 text-lime-800',
        'WELLNESS': 'bg-teal-100 text-teal-800',
        'TAXES': 'bg-gray-100 text-gray-800',
        'STUDY': 'bg-sky-100 text-sky-800',
        'ENTERTAINMENT': 'bg-violet-100 text-violet-800',
        'RESTAURANT': 'bg-amber-100 text-amber-800',
        'SALES': 'bg-green-100 text-green-800',
        'TRANSFER': 'bg-slate-100 text-slate-800',
        'SHOPPING': 'bg-fuchsia-100 text-fuchsia-800'
    };
    return colors[category] || 'bg-slate-100 text-slate-800';
};
