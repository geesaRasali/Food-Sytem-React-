import React, { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";

const normalizeCategory = (value) => value?.trim().toLowerCase();

const FoodDisplay = ({ category }) => {
  const { food_list } = useContext(StoreContext);

  return (
    <div className="mt-14" id="food-display">
      <h2 className="text-[clamp(1.5rem,2.4vw,2.6rem)] font-extrabold leading-[1.12] tracking-[-0.02em] text-slate-900">
        Top dishes <span className="text-orange-500">near you</span>
      </h2>
      <p className="mb-7 mt-2 text-[clamp(1rem,1.05vw,1.35rem)] font-medium text-slate-600">
        Fresh favorites selected to match your cravings.
      </p>
      <div className="mt-0 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4.5 min-[1200px]:grid-cols-5">
        {food_list && food_list.length > 0 ? (
          food_list.map((item) => {
            if (
              category === "All" ||
              normalizeCategory(category) === normalizeCategory(item.category)
            ) {
              return (
                <FoodItem
                  key={item._id}
                  id={item._id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  image={item.image}
                />
              );
            }
            return null;
          })
        ) : (
          <p className="col-span-full text-slate-500">No food items available</p>
        )}
      </div>
    </div>
  );
};

export default FoodDisplay;
