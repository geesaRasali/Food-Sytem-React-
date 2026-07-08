"use client";

import React, { useContext, useState } from "react";
import axios from "axios";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaClock,
  FaMapMarkerAlt,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaPaperPlane,
  FaHeadset,
} from "react-icons/fa";
import { StoreContext } from "../../context/StoreContext";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

const Contact = () => {
  const { url } = useContext(StoreContext);
  const [formData, setFormData] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const response = await axios.post(`${url}/api/contact/submit`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      });

      if (!response.data?.success) {
        setSubmitError(response.data?.message || "Failed to send message");
        return;
      }

      setSubmitted(true);
      setFormData(initialForm);

      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      setSubmitError(error?.response?.data?.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen bg-zinc-50 px-4 py-14 sm:px-8 lg:px-14 transition-colors duration-200 font-sans">
      <div className="mx-auto w-full max-w-7xl">
        {/* Heading */}
        <div className="text-center">
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Get in Touch With Us
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base font-medium">
            Have a question about your order, delivery, or support? Our Urban
            Foods team is here to help you with a smooth and friendly service
            experience.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left - Form */}
          <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:p-8 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <FaPaperPlane />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-950">
                  Send us a Message
                </h2>
                <p className="mt-1 text-sm text-zinc-500 font-medium">
                  Fill out the form and our team will get back to you soon.
                </p>
              </div>
            </div>

            {submitted && (
              <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600">
                Message sent successfully. We’ll contact you soon.
              </div>
            )}

            {submitError && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100/50"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your Email"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100/50"
                />
              </div>

              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number or Subject"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100/50"
              />

              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your Message"
                required
                rows={7}
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100/50"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-7 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5 hover:bg-orange-600 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          {/* Right - Contact Info */}
          <div className="space-y-6">
            <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.06)] sm:p-8 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  <FaHeadset />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-950">
                    Contact Information
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 font-medium">
                    Reach us for support, delivery questions, or general inquiries.
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                    <FaEnvelope />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Email Address</p>
                    <p className="mt-1 text-sm text-zinc-650 font-medium">
                      support@urbanfoods.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                    <FaPhoneAlt />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Phone Number</p>
                    <p className="mt-1 text-sm text-zinc-650 font-medium">
                      +94 71 234 5678
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                    <FaClock />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Working Hours</p>
                    <p className="mt-1 text-sm text-zinc-650 font-medium">
                      Monday - Sunday : 8.00 AM - 11.00 PM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Location</p>
                    <p className="mt-1 text-sm text-zinc-650 font-medium">
                      Colombo, Sri Lanka
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)] transition-colors">
              <iframe
                title="Urban Foods Service Area"
                src="https://www.openstreetmap.org/export/embed.html?bbox=79.84%2C6.87%2C79.89%2C6.93&layer=mapnik"
                className="h-64 w-full"
                loading="lazy"
              />
            </div>

            {/* Socials */}
            <div className="rounded-[28px] border border-zinc-200 bg-white p-6 text-center shadow-[0_14px_35px_rgba(15,23,42,0.06)] transition-colors">
              <p className="text-lg font-bold text-zinc-900">Follow Us</p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-orange-500 transition hover:bg-orange-500 hover:text-white"
                >
                  <FaFacebookF />
                </a>

                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-orange-500 transition hover:bg-orange-500 hover:text-white"
                >
                  <FaTwitter />
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-orange-500 transition hover:bg-orange-500 hover:text-white"
                >
                  <FaInstagram />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
