"use client";

import React, { useState, useEffect } from "react";
import { Testimonial } from "../../types";
import { getTestimonials } from "../../services/testimonialService";
import { Loader2 } from "lucide-react";

export const VerifyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 48 48"
    className="inline-block"
  >
    <polygon
      fill="#42a5f5"
      points="29.62,3 33.053,8.308 39.367,8.624 39.686,14.937 44.997,18.367 42.116,23.995 45,29.62 39.692,33.053 39.376,39.367 33.063,39.686 29.633,44.997 24.005,42.116 18.38,45 14.947,39.692 8.633,39.376 8.314,33.063 3.003,29.633 5.884,24.005 3,18.38 8.308,14.947 8.624,8.633 14.937,8.314 18.367,3.003 23.995,5.884"
    ></polygon>
    <polygon
      fill="#fff"
      points="21.396,31.255 14.899,24.76 17.021,22.639 21.428,27.046 30.996,17.772 33.084,19.926"
    ></polygon>
  </svg>
);

export const Card: React.FC<{ card: Testimonial }> = ({ card }) => (
  <div className="p-4 rounded-lg mx-4 shadow border border-gray-100 hover:shadow-lg transition-all duration-200 w-72 shrink-0 bg-white">
    <div className="flex gap-2">
      <img className="size-11 rounded-full object-cover" src={card.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"} alt={card.name || "Preview"} />
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <p className="font-medium">{card.name || "Name"}</p>
          <VerifyIcon />
        </div>
        <span className="text-xs text-slate-500">{card.handle || "@handle"}</span>
      </div>
    </div>
    <p className="text-sm pt-4 text-gray-800">
      {card.text || "Your testimonial text will appear here."}
    </p>
  </div>
);

function MarqueeRow({
  data,
  reverse = false,
  speed = 25,
}: {
  data: Testimonial[];
  reverse?: boolean;
  speed?: number;
}) {
  const doubled = React.useMemo(() => [...data, ...data], [data]);
  return (
    <div className="relative w-full mx-auto max-w-5xl overflow-hidden isolation-isolate">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-24 md:w-32 z-10 bg-gradient-to-r from-gray-50/10 to-transparent blur-md" />
      <div
        className={`flex transform-gpu min-w-[200%] ${
          reverse ? "pt-5 pb-10" : "pt-10 pb-5"
        }`}
        style={{
          animation: `marqueeScroll ${speed}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {doubled.map((c, i) => (
          <Card key={i} card={c} />
        ))}
      </div>
      <div className="pointer-events-none absolute right-0 top-0 h-full w-24 md:w-32 z-10 bg-gradient-to-l from-gray-50/10 to-transparent blur-md" />
    </div>
  );
}

export default function Marquee() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const data = await getTestimonials();
      setTestimonials(data);
      setLoading(false);
    };
    fetchTestimonials();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  // Split into two rows if more than 3 testimonials
  let row1 = testimonials;
  let row2: Testimonial[] = [];
  
  if (testimonials.length > 3) {
    const midPoint = Math.ceil(testimonials.length / 2);
    row1 = testimonials.slice(0, midPoint);
    row2 = testimonials.slice(midPoint);
  } else if (testimonials.length > 0) {
    row2 = testimonials; // Duplicate if few items to at least have two running lines
  }

  return (
    <>
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="flex flex-col gap-2">
        <MarqueeRow data={row1} reverse={false} speed={25} />
        <MarqueeRow data={row2} reverse={true} speed={25} />
      </div>
    </>
  );
}
