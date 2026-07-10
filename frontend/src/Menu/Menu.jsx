import { useState } from "react";
import { assets, food_list } from "../assets/assets";
import ExploreMenu from "../components/ExploreMenu/ExploreMenu";

const headingFontClass = "font-serif";

const FoodItem = ({ item, quantity, onAdd, onRemove }) => {
  return (
    <article className="group overflow-hidden rounded-[28px] border border-orange-100/80 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(249,115,22,0.15)]">
      <div className="relative m-2 aspect-[4/3] overflow-hidden rounded-[20px]">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/15 via-black/5 to-transparent" />

        {quantity === 0 ? (
          <button
            onClick={() => onAdd(item._id)}
            className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-800 shadow-md transition hover:scale-110"
          >
            +
          </button>
        ) : (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white px-2 py-1 shadow-md">
            <button
              onClick={() => onRemove(item._id)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200"
            >
              −
            </button>

            <span className="min-w-5 text-center text-xs font-bold text-slate-800">
              {quantity}
            </span>

            <button
              onClick={() => onAdd(item._id)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-500 hover:bg-green-200"
            >
              +
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3
            className={`${headingFontClass} line-clamp-1 text-[1.6rem] font-semibold text-slate-900`}
          >
            {item.name}
          </h3>

          <img
            src={assets.rating_starts}
            alt="Rating"
            className="mt-1 h-[14px] w-[70px] shrink-0"
          />
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-slate-500">
          {item.description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <p
            className={`${headingFontClass} text-[1.25rem] font-bold text-orange-500 sm:text-[1.35rem]`}
          >
            LKR {item.price}
          </p>

          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-500">
            Fresh
          </span>
        </div>
      </div>
    </article>
  );
};

const Menu = () => {
  const [cartItems, setCartItems] = useState({});
  const [category, setCategory] = useState("All");
  

  const addToCart = (id) => {
    setCartItems((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => {
      const current = prev[id] ?? 0;

      if (current <= 1) {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [id]: current - 1,
      };
    });
  };

  const visibleFoods = food_list.filter(
    (item) => category === "All" || item.category === category,
  );

  return (
    <section className="min-h-screen bg-linear-to-b from-[#fff7ef] via-[#fffaf5] to-[#fffdfb]">
      <div className="w-full px-4 py-12 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <ExploreMenu category={category} setCategory={setCategory} />

        <div className="mb-8 mt-4">
  <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
  Top dishes <span className="text-orange-500">near you</span>
</h2>
          <p className="mt-2 text-sd text-slate-700 sm:text-xl">
            Fresh favorites selected to match your cravings.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleFoods.map((item) => (
            <FoodItem
              key={item._id}
              item={item}
              quantity={cartItems[item._id] ?? 0}
              onAdd={addToCart}
              onRemove={removeFromCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Menu;
