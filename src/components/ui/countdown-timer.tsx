"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  expiresAt: string;
  onExpired: () => void;
}

export default function CountdownTimer({ expiresAt, onExpired }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
  }>({ minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ minutes, seconds });
      } else {
        setTimeLeft({ minutes: 0, seconds: 0 });
        onExpired();
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const isExpiringSoon = timeLeft.minutes < 5;
  const isExpired = timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isExpired) {
    return (
      <div className="text-center p-4 bg-red-100 border border-red-300 rounded-lg">
        <p className="text-red-600 font-semibold">หมดเวลาชำระเงิน</p>
        <p className="text-sm text-red-500">กรุณาทำการจองใหม่</p>
      </div>
    );
  }

  return (
    <div className={`text-center p-4 border rounded-lg ${
      isExpiringSoon 
        ? 'bg-red-50 border-red-300' 
        : 'bg-blue-50 border-blue-300'
    }`}>
      <p className={`font-semibold ${
        isExpiringSoon ? 'text-red-600' : 'text-blue-600'
      }`}>
        เวลาที่เหลือในการชำระเงิน
      </p>
      <div className={`text-2xl font-bold mt-2 ${
        isExpiringSoon ? 'text-red-600' : 'text-blue-600'
      }`}>
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </div>
      <p className={`text-sm mt-1 ${
        isExpiringSoon ? 'text-red-500' : 'text-blue-500'
      }`}>
        {isExpiringSoon ? 'กรุณาชำระเงินด่วน!' : 'กรุณาชำระเงินภายในเวลาที่กำหนด'}
      </p>
    </div>
  );
}
