'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, ChevronRight, Loader, Loader2 } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';

interface NewsArticle {
  id: number;
  description: string; 
}

function NewsItemDisplay({ content }: { content: string }) { 
  const sanitizedContent = DOMPurify.sanitize(content);
  
  return (
    <div className="flex items-start text-gray-700 dark:text-gray-300"> 
      <AlertCircle className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
      <div 
        className="rich-content text-sm"  
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </div>
  );
}

export default function NewsSection() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/user/news');  
        setNews(response.data);
      } catch (error) {
        console.error("Error fetching news:", error); 
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#495057] dark:text-gray-100">Shipment News</h2>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600 mr-3"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : news.length > 0 ? (
            news.map((item) => (
              <NewsItemDisplay key={item.id} content={item.description} />
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No news available at the moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}