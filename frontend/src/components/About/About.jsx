"use client";
 import React from "react";
  import Footer from "../Footer/Footer"; 
  import aboutDining from "../../assets/about-dining.png"; 
  import aboutVideo from "../../assets/about-video.mp4"; 
  
  const About = () => {
    return (
      <section className="bg-linear-to-b from-[#fff8f2] via-[#fffaf6] to-[#fffdfb] text-slate-900"> 
     
     {/*VIDEO */} 
     <section className="relative h-[75vh] min-h-125 w-full overflow-hidden"> 
    <video className="absolute inset-0 h-full w-full object-cover" src={aboutVideo} autoPlay muted loop playsInline /> 
    <div className="absolute inset-0 bg-black/50" /> 
    <div className="relative z-10 flex h-full items-center justify-center text-center px-6"> 
    <div className="text-white max-w-3xl"> <h1 className="text-4xl sm:text-5xl font-extrabold"> About Urban Foods </h1> 
    <p className="mt-4 text-lg text-white/90"> A modern online food ordering experience designed for speed, simplicity, and satisfaction. </p> 
        </div> 
    </div>
</section> 

 <section className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
     <div className="overflow-hidden rounded-[30px] shadow-lg"> <img src={aboutDining} alt="Online Food System" className="w-full h-112.5 object-cover" />
      </div>
       <div> <h2 className="text-3xl font-extrabold text-slate-900"> Welcome to Urban Foods </h2> <p className="mt-4 text-slate-600 leading-7">
         Urban Foods is a modern online food management system designed to make food ordering simple, fast, and enjoyable. 
         Customers can browse menus, select meals, and place orders easily through a smooth and user-friendly platform. </p> 
         
         <p className="mt-4 text-slate-600 leading-7"> Our system connects customers with delicious meals while helping restaurants manage orders, menus, and deliveries more efficiently. 
            Every step — from selecting dishes to receiving food — is designed to provide a better experience. </p> 
            <p className="mt-4 text-slate-600 leading-7"> Urban Foods combines restaurant-quality food with smart technology to create a seamless and reliable food ordering journey. </p>
             <div className="mt-6">
                 <a href="/Menu" className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition" > Explore Menu </a> 
                 </div> 
            </div> 
        </section> 
        <section className="bg-white py-16"> 
            <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
             <div className="p-6 rounded-2xl shadow-md hover:shadow-lg transition"> 
                <h3 className="font-bold text-lg text-orange-500"> Easy Ordering </h3>
                 <p className="mt-2 text-sm text-slate-600"> Browse menus and place orders quickly with a simple interface. </p>
                  </div> 
                    <div className="p-6 rounded-2xl shadow-md hover:shadow-lg transition"> 
                        <h3 className="font-bold text-lg text-orange-500"> Fast Delivery </h3> 
                    <p className="mt-2 text-sm text-slate-600"> Get your favorite meals delivered fresh and on time. </p> 
                    </div> 
            <div className="p-6 rounded-2xl shadow-md hover:shadow-lg transition"> 
                <h3 className="font-bold text-lg text-orange-500"> Smart System </h3> 
                <p className="mt-2 text-sm text-slate-600"> Efficient food and order management for better service. </p> 
                </div> 
                  </div> 
                    </section> 
    </section>
  );
};

export default About;