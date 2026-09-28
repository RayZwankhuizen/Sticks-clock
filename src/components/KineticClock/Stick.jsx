import React, { useEffect, useState, useRef } from 'react';

export const Stick = ({ 
  x, 
  y, 
  targetAngle, 
  isRevealing, 
  speed = 1,
  direction = 1,
  delay = 0,
  initialAngle = 0
}) => {
  const [currentAngle, setCurrentAngle] = useState(initialAngle);
  const animationRef = useRef(null);
  const isRevealingRef = useRef(isRevealing);
  
  useEffect(() => {
    isRevealingRef.current = isRevealing;
  }, [isRevealing]);

  // Organic rotation when not revealing
  useEffect(() => {
    if (isRevealing) {
      // Stop random rotation and move to target
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Smooth transition to target angle
      const timer = setTimeout(() => {
        setCurrentAngle(targetAngle);
      }, delay);
      
      return () => clearTimeout(timer);
    } else {
      // Continuous organic rotation
      let lastTime = performance.now();
      
      const animate = (currentTime) => {
        if (isRevealingRef.current) return;
        
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        
        // Organic speed variation using sine waves
        const timeOffset = currentTime / 1000;
        const speedVariation = 1 + Math.sin(timeOffset * speed * 0.5 + delay) * 0.3;
        const baseSpeed = 15 + speed * 10;
        
        setCurrentAngle(prev => {
          const newAngle = prev + (direction * baseSpeed * speedVariation * deltaTime);
          return newAngle % 360;
        });
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isRevealing, targetAngle, speed, direction, delay]);

  return (
    <div
      className={`stick ${isRevealing ? 'revealing revealed' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -50%) rotate(${currentAngle}deg)`,
      }}
    />
  );
};

export default Stick;
