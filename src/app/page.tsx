"use client";

import { useState } from "react";
import {
  Package,
  Truck,
  MapPin,
  Search,
  ArrowRight,
  Globe,
  Clock,
  ShieldCheck,
  Menu,
  X,
  Box,
  Headphones,
} from "lucide-react";

export default function Home() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [message, setMessage] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  function trackPackage(e: React.FormEvent) {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      setMessage("Please enter a tracking number.");
      return;
    }

    setMessage(
      "Tracking service is being configured. Live shipment lookup will be available soon."
    );
  }

  return (
    <main>
      {/* HEADER */}

      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container flex items-center justify-between h-20">

          <a href="/" className="flex items-center gap-2">
            <span className="text-3xl font-black text-[#4D148C]">
              Fed<span className="text-[#FF6600]">Ex</span>
            </span>
            <span className="font-bold text-gray-700 text-sm">
              Delivery
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold">
            <a href="#shipping" className="hover:text-purple-800">Shipping</a>
            <a href="#tracking" className="hover:text-purple-800">Tracking</a>
            <a href="#services" className="hover:text-purple-800">Services</a>
            <a href="#locations" className="hover:text-purple-800">Locations</a>
            <a href="#support" className="hover:text-purple-800">Support</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button className="text-sm font-bold">Log In</button>
            <button className="orange-button">Create Account</button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle navigation"
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>

        </div>

        {mobileMenu && (
          <div className="md:hidden bg-white border-t p-6 space-y-5 flex flex-col font-bold">
            <a href="#shipping" onClick={() => setMobileMenu(false)}>Shipping</a>
            <a href="#tracking" onClick={() => setMobileMenu(false)}>Tracking</a>
            <a href="#services" onClick={() => setMobileMenu(false)}>Services</a>
            <a href="#locations" onClick={() => setMobileMenu(false)}>Locations</a>
            <a href="#support" onClick={() => setMobileMenu(false)}>Support</a>
          </div>
        )}
      </header>

      {/* HERO */}

      <section className="bg-[#4D148C] text-white">
        <div className="container py-24 grid md:grid-cols-2 gap-12 items-center">

          <div>
            <p className="text-orange-400 font-bold uppercase tracking-widest text-sm mb-5">
              Shipping made simple
            </p>

            <h1 className="text-5xl md:text-6xl font-black leading-tight mb-7">
              Ship. Manage.
              <br />
              Track. Deliver.
            </h1>

            <p className="text-lg text-purple-100 leading-relaxed mb-9 max-w-lg">
              Your shipping and delivery management platform.
              Send packages, manage shipments and follow deliveries
              from one convenient place.
            </p>

            <div className="flex flex-wrap gap-4">
              <a href="/shipping" className="orange-button">
  Ship Now <ArrowRight className="inline ml-2" size={18} />
              </a>

              <a
                href="#tracking"
                className="border border-white px-7 py-4 font-bold hover:bg-white hover:text-purple-900"
              >
                Track Package
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-lg p-5 md:p-8 text-gray-800 shadow-2xl">

              <h2 className="text-2xl font-bold mb-2">
                Where is my package?
              </h2>

              <p className="text-gray-500 text-sm mb-6">
                Enter your tracking number to find your shipment.
              </p>

              <form onSubmit={trackPackage}>
                <label className="block font-bold text-sm mb-2">
                  Tracking Number
                </label>

                <div className="flex border-2 border-gray-300 focus-within:border-purple-800">
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full p-4 outline-none min-w-0"
                  />

                  <button
                    type="submit"
                    className="bg-[#FF6600] text-white px-5"
                    aria-label="Track package"
                  >
                    <Search />
                  </button>
                </div>

                <button
                  type="submit"
                  className="purple-button w-full mt-5"
                >
                  Track Shipment
                </button>
              </form>

              {message && (
                <p className="mt-4 text-sm text-purple-800 font-medium">
                  {message}
                </p>
              )}

              <div className="border-t mt-7 pt-5 text-sm text-gray-500">
                Need help finding your tracking number?
                <a href="#support" className="text-purple-800 font-bold ml-1">
                  Contact Support
                </a>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* QUICK ACTIONS */}

      <section className="bg-gray-100 py-10" id="shipping">
        <div className="container grid grid-cols-1 sm:grid-cols-3 gap-5">

          {[
            {
              icon: Package,
              title: "Ship a Package",
              description: "Create and manage a shipment.",
              link: "/shipping",
            },
            {
              icon: Search,
              title: "Track a Shipment",
              description: "Check your package progress.",
              link: "#tracking",
            },
            {
              icon: MapPin,
              title: "Find Locations",
              description: "Explore available shipping locations.",
              link: "#locations",
            },
          ].map((item) => (
            <a
              href={item.link}
              key={item.title}
              className="bg-white p-7 flex items-center gap-5 hover:shadow-lg transition"
            >
              <item.icon size={38} className="text-[#4D148C]" />

              <div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {item.description}
                </p>
              </div>

              <ArrowRight className="ml-auto text-orange-500" />
            </a>
          ))}

        </div>
      </section>

      {/* SERVICES */}

      <section className="section" id="services">
        <div className="container">

          <div className="text-center mb-12">
            <p className="text-orange-600 font-bold uppercase text-sm mb-3">
              Our Services
            </p>

            <h2 className="text-4xl font-black">
              Shipping solutions for everyone
            </h2>

            <p className="text-gray-500 mt-4">
              Flexible delivery services for personal and business needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-7">

            {[
              {
                icon: Truck,
                title: "Express Delivery",
                description: "Priority delivery for time-sensitive shipments.",
              },
              {
                icon: Box,
                title: "Standard Shipping",
                description: "Reliable shipping for everyday packages.",
              },
              {
                icon: Globe,
                title: "International Shipping",
                description: "Manage shipments across international destinations.",
              },
            ].map((service) => (
              <div
                key={service.title}
                className="border border-gray-200 p-9 hover:shadow-xl transition"
              >
                <service.icon size={45} className="text-[#4D148C] mb-7" />

                <h3 className="text-xl font-bold mb-4">
                  {service.title}
                </h3>

                <p className="text-gray-500 leading-relaxed mb-7">
                  {service.description}
                </p>

                <a
                  href="#shipping"
                  className="text-purple-800 font-bold flex items-center gap-2"
                >
                  Learn More <ArrowRight size={17} />
                </a>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}

      <section className="section bg-gray-100">
        <div className="container">

          <div className="text-center mb-12">
            <h2 className="text-4xl font-black">
              Delivery you can manage
            </h2>

            <p className="text-gray-500 mt-4">
              Everything you need to manage your shipping experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {[
              {
                icon: Clock,
                title: "Flexible Delivery",
                description: "Choose delivery options that suit your needs.",
              },
              {
                icon: ShieldCheck,
                title: "Secure Shipments",
                description: "Manage shipment records and delivery information.",
              },
              {
                icon: Package,
                title: "Easy Tracking",
                description: "Follow shipment progress through tracking updates.",
              },
              {
                icon: Headphones,
                title: "Customer Support",
                description: "Get assistance with your shipping needs.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center p-5">
                <item.icon
                  size={45}
                  className="mx-auto text-[#4D148C] mb-5"
                />

                <h3 className="font-bold text-lg mb-3">
                  {item.title}
                </h3>

                <p className="text-gray-500 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* TRACKING SECTION */}

      <section className="section bg-white" id="tracking">
        <div className="container text-center max-w-3xl">

          <Package size={48} className="mx-auto text-[#4D148C] mb-5" />

          <h2 className="text-4xl font-black mb-5">
            Your package, your control.
          </h2>

          <p className="text-gray-500 mb-8">
            Track shipments and access delivery information
            from a single platform.
          </p>

          <form
            onSubmit={trackPackage}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="border-2 border-gray-300 p-4 flex-1 outline-none focus:border-purple-800"
            />

            <button className="orange-button">
              Track Package
            </button>
          </form>

          {message && (
            <p className="mt-4 text-sm text-purple-800">{message}</p>
          )}

        </div>
      </section>

      {/* LOCATIONS */}

      <section className="section bg-[#4D148C] text-white" id="locations">
        <div className="container text-center">

          <MapPin size={45} className="mx-auto mb-5 text-orange-400" />

          <h2 className="text-4xl font-black mb-5">
            Find a shipping location
          </h2>

          <p className="text-purple-100 mb-8">
            Explore available shipping and collection locations.
          </p>

          <a href="#support" className="orange-button inline-block">
            Explore Locations <ArrowRight className="inline ml-2" />
          </a>

        </div>
      </section>

      {/* FOOTER */}

      <footer className="bg-[#252525] text-white pt-16 pb-8" id="support">
        <div className="container">

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

            <div>
              <h3 className="text-2xl font-black mb-5">
                Fed<span className="text-orange-500">Ex</span> Delivery
              </h3>

              <p className="text-gray-400 text-sm leading-relaxed">
                An independent shipping and delivery management platform.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-5">Shipping</h4>
              <div className="space-y-3 text-gray-400 text-sm">
                <p><a href="#shipping">Create Shipment</a></p>
                <p><a href="#services">Shipping Services</a></p>
                <p><a href="#tracking">Track Package</a></p>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-5">Company</h4>
              <div className="space-y-3 text-gray-400 text-sm">
                <p><a href="#services">Our Services</a></p>
                <p><a href="#locations">Locations</a></p>
                <p><a href="#support">Contact</a></p>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-5">Support</h4>
              <div className="space-y-3 text-gray-400 text-sm">
                <p>Customer Support</p>
                <p>Shipping Help</p>
                <p>Delivery Information</p>
              </div>
            </div>

          </div>

          <div className="border-t border-gray-700 pt-7 text-center text-gray-400 text-xs">
            © {new Date().getFullYear()} FedEx Delivery. All rights reserved.
          
          
          </div>

        </div>
      </footer>

    </main>
  );
}