
import { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";

function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [notice, setNotice] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setNotice("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    setNotice(
      "Your form is ready, but message submission has not been connected yet."
    );
  }

  return (
    <>
    <Header />
    <main className="min-h-screen bg-[#FBFAF7] px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Page heading */}
        <div className="mb-12 text-center">
          <p className="font-medium uppercase tracking-widest text-rose-700">
            We would love to hear from you
          </p>

          <h1 className="mt-3 text-4xl font-bold text-[#45332F]">
            Contact Us
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
            Have a question about a book, an order, or your account?
            Send us a message, and we are here to help.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          {/* Contact information */}
          <section className="rounded-2xl bg-[#285943] p-8 text-white">
            <h2 className="text-2xl font-semibold">
              Get in Touch
            </h2>

            <p className="mt-4 leading-7 text-rose-50">
              Whether you are looking for your next favorite read
              or need help with an order, we are here to help.
            </p>

            <div className="mt-10 space-y-7">
              <div className="flex gap-4">
                <span className="text-2xl">✉</span>
                <div>
                  <h3 className="font-semibold">Email Support</h3>
                  <p className="mt-1 text-sm leading-6 text-rose-50">
                    For questions about books, orders, and your account.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="text-2xl">📚</span>
                <div>
                  <h3 className="font-semibold">Book Assistance</h3>
                  <p className="mt-1 text-sm leading-6 text-rose-50">
                    Need help finding a book? Tell us what you are looking for.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact form */}
          <section className="rounded-2xl border border-rose-100 bg-white p-8 md:col-span-2">
            <h2 className="text-2xl font-semibold text-[#45332F]">
              Send Us a Message
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Subject
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  placeholder="Write your message here..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#285943] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#214834] sm:w-auto"
              >
                Send Message
              </button>

              {notice && (
                <p role="status" className="text-sm text-rose-700">
                  {notice}
                </p>
              )}
            </form>
          </section>
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}

export default ContactUs;
