"use client";

import { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";

const BACKEND_URL = "http://localhost:4000";

/**
 * Resolve an image to a valid <img> src:
 *  - Full URL (http/https) or Vite asset path (/…)  → use as-is
 *  - Plain backend filename (no slashes)              → prefix backend URL
 *  - Falsy                                            → null
 */
const getImageSrc = (image) => {
  if (!image) return null;
  if (
    image.startsWith("http") ||
    image.startsWith("data:") ||
    image.startsWith("/")
  ) {
    return image;
  }
  return `${BACKEND_URL}/images/${image}`;
};

const ExploreMenu = ({ category, setCategory }) => {
  const { categories } = useContext(StoreContext);

  // StoreContext always provides a merged list:
  //   static menu_list (original 9) + any admin-added backend categories
  const menuItems = (categories || []).map((cat) => ({
    menu_name: cat.name,
    menu_image: getImageSrc(cat.image),
  }));

  return (
    <section id="explore-menu" className="mb-14 w-full">
      <div className="rounded-[30px] bg-[#f2f4f7] px-6 py-10 sm:px-8 lg:px-10">
        <div className="mb-10">
          <h2 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-4xl">
            Explore our <span className="text-orange-500">menu</span>
          </h2>
          <p className="mt-4 max-w-7xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Choose from a diverse menu featuring a delectable array of dishes.
            Our mission is to satisfy your cravings and elevate your dining
            experience, one delicious meal at a time.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-x-1 gap-y-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 lg:gap-x-1 lg:gap-y-4">
          {menuItems.map((item) => {
            const isActive = category === item.menu_name;

            return (
              <button
                key={item.menu_name}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  setCategory((prev) =>
                    prev === item.menu_name ? "All" : item.menu_name,
                  )
                }
                className="group flex flex-col items-center text-center transition-all duration-300"
              >
                <div
                  className={`relative rounded-full border border-slate-200 bg-white p-0.5 transition-all duration-300 ${
                    isActive
                      ? "ring-3 ring-orange-500/80 shadow-[0_10px_24px_rgba(249,115,22,0.25)]"
                      : "shadow-sm group-hover:-translate-y-1 group-hover:shadow-[0_10px_20px_rgba(15,23,42,0.12)]"
                  }`}
                >
                  <div className="rounded-full bg-white p-0.5">
                    {item.menu_image ? (
                      <img
                        src={item.menu_image}
                        alt={item.menu_name}
                        className="h-22 w-22 rounded-full object-cover sm:h-30 sm:w-30 lg:h-30 lg:w-30"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-22 w-22 rounded-full bg-zinc-100 sm:h-30 sm:w-30 flex items-center justify-center">
                        <span className="text-2xl font-bold text-zinc-300">
                          {item.menu_name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <span
                  className={`mt-1.5 text-sm font-bold transition-colors duration-300 sm:text-base lg:text-base ${
                    isActive
                      ? "text-orange-500"
                      : "text-slate-700 group-hover:text-orange-500"
                  }`}
                >
                  {item.menu_name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ExploreMenu;