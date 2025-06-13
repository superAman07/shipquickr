'use client';

import { useState, useEffect, useRef } from 'react';
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
    <div className="flex py-1.5 items-start text-gray-700 dark:text-gray-300"> 
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
  const newsContainerRef = useRef<HTMLDivElement>(null);
  const animationContentRef = useRef<HTMLDivElement>(null); 

   useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/user/news');
        const fetchedNews: NewsArticle[] = response.data;
        if (fetchedNews && fetchedNews.length > 0) { 
          setNews([...fetchedNews, ...fetchedNews]); 
        } else {
          setNews([]);  
        }

      } catch (error) {
        console.error("Error fetching news:", error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, []);

    useEffect(() => {
    const newsContentElement = animationContentRef.current;
    const containerElement = newsContainerRef.current;

    if (newsContentElement && containerElement && news.length > 0 && !loading) {
      const contentHeight = newsContentElement.scrollHeight;
      const containerHeight = containerElement.clientHeight;
      
      if (contentHeight > containerHeight) {
        const scrollableHeight = contentHeight / 2;  
        const duration = (scrollableHeight / 50) * 2;  
        newsContentElement.style.animation = `scroll-up ${Math.max(5, duration)}s linear infinite`;  
      } else {
        newsContentElement.style.animation = 'none';
      }
    } else if (newsContentElement) {
        newsContentElement.style.animation = 'none';  
    }
  }, [news, loading]);

  return (
    <div className="h-full flex flex-col">  
      <div className="mb-3">  
        <h2 className="text-xl font-bold text-[#495057] dark:text-gray-100">Shipment News</h2>
        <hr className="mt-4 border-gray-300 dark:border-gray-700" /> 
      </div>
       
      <div 
        ref={newsContainerRef} 
        className="flex-grow overflow-hidden relative min-h-0" 
      >
        {loading ? (
          <div className="flex items-center justify-center h-full"> 
            <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading news...</span>
          </div>
        ) : news.length > 0 ? (
          <div ref={animationContentRef} className="animate-scroll-up-custom">  
            {news.map((item, index) => ( 
              <NewsItemDisplay key={`${item.id}-${index}`} content={item.description} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">  
            <p className="text-gray-500 dark:text-gray-400 text-sm">No news available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}