import React from 'react';
import { 
  Utensils, 
  Car, 
  ShoppingBag, 
  Home, 
  Receipt, 
  Film, 
  HeartPulse, 
  BookOpen, 
  MoreHorizontal, 
  Briefcase, 
  Store, 
  TrendingUp, 
  Award, 
  PlusCircle,
  HelpCircle
} from 'lucide-react';

interface CategoryIconProps {
  iconName: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, className = "w-5 h-5", size = 20 }) => {
  switch (iconName) {
    case 'Utensils':
      return <Utensils className={className} size={size} />;
    case 'Car':
      return <Car className={className} size={size} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} size={size} />;
    case 'Home':
      return <Home className={className} size={size} />;
    case 'Receipt':
      return <Receipt className={className} size={size} />;
    case 'Film':
      return <Film className={className} size={size} />;
    case 'HeartPulse':
      return <HeartPulse className={className} size={size} />;
    case 'BookOpen':
      return <BookOpen className={className} size={size} />;
    case 'Briefcase':
      return <Briefcase className={className} size={size} />;
    case 'Store':
      return <Store className={className} size={size} />;
    case 'TrendingUp':
      return <TrendingUp className={className} size={size} />;
    case 'Award':
      return <Award className={className} size={size} />;
    case 'PlusCircle':
      return <PlusCircle className={className} size={size} />;
    case 'MoreHorizontal':
      return <MoreHorizontal className={className} size={size} />;
    default:
      return <HelpCircle className={className} size={size} />;
  }
};
