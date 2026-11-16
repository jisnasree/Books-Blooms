
import { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";


function ContactUs() {
  return (
    <>
      <Header />

      <div className="min-h-screen bg-gray-50 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Contact Us
          </h1>

          <p className="text-gray-600 mb-12">
            We would love to hear from you!
            Feel free to reach out to us.
          </p>

          <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Our Address
              </h2>
              
            <p className="text-gray-600 leading-7">
              Books & Blooms
              <br />
              #24, 2nd Cross, Indiranagar
              <br />
              Bengaluru, Karnataka – 560038
              <br />
              India
            </p>
            </div>

            {/* Phone */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Phone Number
              </h2>
              <a
                href="tel:+1234567890"
                className="text-gray-600 hover:text-green-700"
              >
                +1 234 567 890
              </a>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default ContactUs;
