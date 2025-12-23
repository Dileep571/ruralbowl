'use client';
import { useRouter } from 'next/navigation';

export default function CategoryCard({ category }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/products?category=${category.slug}`);
  };

  return (
    <div 
      className="category-card h-64 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105"
      onClick={handleClick}
    >
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800">{category.name}</h3>
        <p className="text-gray-600 mt-2">Explore our {category.name.toLowerCase()} vegetables</p>
      </div>
    </div>
  );
}