import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import milkImg from "../../assets/milk.png";
import pizzaImg from "../../assets/pizza.png";
import breadImg from "../../assets/bread.png";
import bugger from "../../assets/bugger.png";
import koththu from "../../assets/koththu.png";
import desserts from "../../assets/desserts .png";
import { FaShoppingCart, FaSearch } from "react-icons/fa";

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const sliderImages = [
    {
      src: milkImg,
      alt: "Fresh milk bottles",
      circleColor: "#FFE8D9",
    },
    {
      src: pizzaImg,
      alt: "Pizza",
      circleColor: "#E7F8EC",
    },
    {
      src: breadImg,
      alt: "Artisan bread",
      circleColor: "#FFF3D6",
    },
    {
      src: bugger,
      alt: "Artisan bugger",
      circleColor: "#FFE4CC",
    },
    {
      src: koththu,
      alt: "Koththu",
      circleColor: "#FFD6D6",
    },
    {
      src: desserts,
      alt: "Desserts",
      circleColor: "#FFD6D6",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === sliderImages.length - 1 ? 0 : prevIndex + 1,
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [sliderImages.length]);

  return (
    <section className="flex flex-col w-full min-h-screen relative overflow-hidden bg-linear-to-r from-[#FFF7ED] via-[#FFE8D9] to-[#FB923C]">
      <div className="absolute inset-0 bg-linear-to-r from-white/40 to-transparent pointer-events-none z-0"></div>

     
      <div className="relative z-30 w-full px-4 sm:px-6 md:px-14 lg:px-20 pt-4">
        <div className="max-w-7xl mx-auto bg-linear-to-r from-[#cf6b1d] via-[#7C4A1D] to-[#F97316] text-white text-center py-3 text-sm font-medium tracking-wide border border-orange-200 rounded-2xl shadow-[0_10px_24px_rgba(124,74,29,0.35)]">
          <span className="font-bold">
            🍔 Free Delivery on Orders Above LKR 15000 – Limited Time Offer 🎉
          </span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between flex-1 px-6 md:px-14 lg:px-20 pt-8 md:pt-10 pb-10">
        
        <div className="w-full md:w-1/2 flex flex-col items-start justify-start max-w-[620px] pt-6">
          <div className="bg-white/80 text-[#F97316] px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-sm border border-orange-100 inline-block">
            Premium Quality
          </div>

          <h1 className="text-[2.8rem] sm:text-[3.2rem] md:text-[4rem] font-extrabold text-[#111827] leading-[1.08] tracking-tight mb-6">
            Freshly Cooked
            <br />
            Meal{" "}
            <span className="bg-linear-to-r from-[#EA580C] to-[#FB923C] bg-clip-text text-transparent">
              Delivered
            </span>
            <br />
            <span className="bg-linear-to-r from-[#EA580C] to-[#FB923C] bg-clip-text text-transparent">
              Fast
            </span>
          </h1>

          <p className="text-[1.05rem] md:text-[1.1rem] leading-8 text-gray-700 mb-8 max-w-[610px]">
            Explore our delicious menu filled with freshly prepared meals.
            <br />
            Order your favourite dishes online and enjoy fast
            <br />
            delivery straight to your doorstep.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full sm:w-auto">
            <button className="flex items-center justify-center gap-2 font-semibold px-8 py-4 rounded-2xl transition-all duration-300 text-base bg-[#F97316] text-white shadow-[0_10px_20px_rgba(249,115,22,0.22)] hover:bg-[#EA580C] w-full sm:w-auto min-w-40">
              <FaShoppingCart className="text-sm" />
              Order Now
            </button>

            <Link
              to="/menu"
              className="inline-flex items-center justify-center rounded-2xl border border-orange-300 bg-white px-8 py-4 text-lg font-semibold text-slate-900 transition hover:bg-orange-50"
            >
              View Menu →
            </Link>
          </div>

          <div className="relative w-full max-w-[620px] mb-8">
            <input
              type="text"
              placeholder="Search for your favorite dishes..."
              className="w-full px-6 py-4 rounded-2xl border border-orange-200 bg-white text-base text-[#111827] outline-none transition-all duration-300 focus:border-[#F97316] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.10)]"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 text-[#F97316] cursor-pointer text-xl flex items-center justify-center p-2">
              <FaSearch />
            </button>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-gray-700">
            <span className="whitespace-nowrap">✓ Freshly Cooked Meals</span>
            <span className="whitespace-nowrap">✓ Fast Delivery</span>
            <span className="whitespace-nowrap">
              ✓ Best Quality Ingredients
            </span>
          </div>
        </div>

        {/* Right section */}
        <div className="w-full md:w-1/2 relative mt-10 md:mt-0 flex items-center justify-center">
          <div className="relative w-full h-[350px] sm:h-[450px] md:h-[600px] flex items-center justify-center">
            <div className="absolute top-5 right-5 bg-red-600 text-white font-bold p-2.5 rounded-full z-20 flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 shadow-[0_6px_14px_rgba(220,38,38,0.4)] rotate-10">
              <span className="font-bold leading-tight text-center text-xs md:text-base">
                30% OFF
              </span>
              <span className="text-[0.6rem] md:text-[0.7rem] text-center font-bold leading-tight">
                Selected Items
              </span>
            </div>

            <div
              className="absolute w-[130%] h-[130%] rounded-full transition-all duration-1000 blur-[140px] opacity-60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
              style={{
                backgroundColor: sliderImages[currentImageIndex].circleColor,
              }}
            ></div>

            <div className="absolute w-[85%] h-[85%] rounded-full bg-white/20 blur-[90px] z-0"></div>

            <div className="relative w-full h-full max-w-[700px] z-10">
              {sliderImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute top-0 left-0 w-full h-full transition-all duration-1000 ${
                    index === currentImageIndex
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-5 scale-95"
                  }`}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="h-full w-full object-contain drop-shadow-[0_14px_24px_rgba(0,0,0,0.15)]"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
              ))}
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-20">
              {sliderImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full border-0 cursor-pointer p-0 transition-all duration-300 ${
                    index === currentImageIndex
                      ? "bg-[#EA580C] scale-110"
                      : "bg-white/70"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center text-gray-700 text-xs opacity-90 z-20">
        <span>Scroll for more</span>
        <div className="w-5 h-5 border-r-2 border-b-2 border-orange-500 rotate-45 mt-2"></div>
      </div>
    </section>
  );
};

export default Hero;
0