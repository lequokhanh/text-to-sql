import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to handle chat scrolling behavior
 */
export function useChatScroll() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback(() => {
    // Direct method: force scroll to the maximum possible value
    if (messagesAreaRef.current) {
      const container = messagesAreaRef.current;
      
      // Calculate the maximum scroll position
      const maxScroll = container.scrollHeight - container.clientHeight;
      
      // First set the scroll without animation to ensure it works
      container.scrollTop = maxScroll + 1000; // Add extra to ensure we're at the bottom
      
      // Then follow up with smooth scroll for better UX
      setTimeout(() => {
        container.scrollTo({
          top: maxScroll + 1000, // Add extra to ensure we're at the bottom
          behavior: 'smooth'
        });
      }, 50);
    }
  }, []);

  // Handle scroll to show/hide scroll button
  useEffect(() => {
    const messagesArea = messagesAreaRef.current;
    if (!messagesArea) return undefined;

    const handleScroll = () => {
      // Show scroll button when not at the bottom (with a 100px threshold)
      const { scrollTop, scrollHeight, clientHeight } = messagesArea;
      const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isScrolledToBottom);
    };

    // Initial check
    handleScroll();
    
    // Call handleScroll when messages area is scrolled
    messagesArea.addEventListener('scroll', handleScroll);
    
    // Also check when messages might change
    const observer = new MutationObserver(handleScroll);
    observer.observe(messagesArea, { childList: true, subtree: true });
    
    return () => {
      messagesArea.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return {
    messagesEndRef,
    messagesAreaRef,
    showScrollButton,
    scrollToBottom,
  };
}