import { useEffect, useState } from "react";

const useMobileWidth = () => {
  const [isMobile, setIsMobile] = useState(false); // Set default to false to avoid SSR issues

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check if window is defined (to ensure we're on the client side)
    if (typeof window !== "undefined") {
      // Set initial value based on current window width
      setIsMobile(window.innerWidth < 768);

      // Add resize event listener
      window.addEventListener("resize", handleResize);

      // Cleanup the event listener on component unmount
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []); // Empty dependency array, so it runs once when the component mounts

  return {
    isMobile,
  };
};

export default useMobileWidth;
