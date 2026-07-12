import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const TrueFocus = ({
  sentence = "True Focus",
  manualMode = false,
  blurAmount = 5,
  borderColor = "white",
  glowColor = "white",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  containerClassName = "",
  wordClassName = "",
}) => {
  const words = sentence.split(" ");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState(null);
  const containerRef = useRef(null);
  const wordRefs = useRef([]);
  const [focusRect, setFocusRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const cornerBaseStyle = {
    borderColor,
    filter: `drop-shadow(0px 0px 4px ${glowColor})`,
    transition: "none",
  };

  useEffect(() => {
    if (!manualMode) {
      const interval = setInterval(
        () => {
          setCurrentIndex((prev) => (prev + 1) % words.length);
        },
        (animationDuration + pauseBetweenAnimations) * 1000,
      );

      return () => clearInterval(interval);
    }
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return;

    if (!wordRefs.current[currentIndex] || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex].getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
  }, [currentIndex, words.length]);

  
  const handleMouseEnter = (index) => {
    if (manualMode) {
      setLastActiveIndex(index);
      setCurrentIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (manualMode) {
      setCurrentIndex(lastActiveIndex);
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center gap-4 ${containerClassName}`}
      ref={containerRef}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={(el) => (wordRefs.current[index] = el)}
            className={`relative cursor-pointer text-4xl font-black text-black transition-[filter,color] duration-300 ease-in-out ${wordClassName}`}
            style={{
              filter: manualMode
                ? isActive
                  ? `blur(0px)`
                  : `blur(${blurAmount}px)`
                : isActive
                  ? `blur(0px)`
                  : `blur(${blurAmount}px)`,
              transition: `filter ${animationDuration}s ease`,
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {word}
          </span>
        );
      })}

      <motion.div
        className="pointer-events-none absolute left-0 top-0 box-content"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex >= 0 ? 1 : 0,
        }}
        transition={{
          duration: animationDuration,
        }}
      >
        <span
          className="absolute -left-2.5 -top-2.5 h-4 w-4 rounded-[3px] border-[3px] border-r-0 border-b-0"
          style={cornerBaseStyle}
        ></span>
        <span
          className="absolute -right-2.5 -top-2.5 h-4 w-4 rounded-[3px] border-[3px] border-l-0 border-b-0"
          style={cornerBaseStyle}
        ></span>
        <span
          className="absolute -bottom-2.5 -left-2.5 h-4 w-4 rounded-[3px] border-[3px] border-r-0 border-t-0"
          style={cornerBaseStyle}
        ></span>
        <span
          className="absolute -bottom-2.5 -right-2.5 h-4 w-4 rounded-[3px] border-[3px] border-l-0 border-t-0"
          style={cornerBaseStyle}
        ></span>
      </motion.div>
    </div>
  );
};

export default TrueFocus;
