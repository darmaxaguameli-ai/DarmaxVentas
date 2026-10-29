import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll de la ventana principal
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // También resetear contenedores principales de layouts con scroll interno (como <main>)
    const scrollContainers = document.querySelectorAll('main, [data-scroll-container]');
    scrollContainers.forEach(container => {
      container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
