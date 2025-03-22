import React from 'react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Twitter, Facebook, Instagram } from "lucide-react";

const Footer = () => {
    return (
        <footer className="w-full py-10 px-4 md:px-8 bg-black">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* About Section */}
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold mb-4">About Us</h3>
                    <p className="text-sm">
                        Garuda is an AI-powered career tool designed to streamline your job application process.
                    </p>
                </div>

                {/* Links Section */}
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                    <ul className="space-y-2">
                        <li><a href="#" className="text-sm hover:underline">Home</a></li>
                        <li><a href="#services" className="text-sm hover:underline">Services</a></li>
                        <li><a href="#about" className="text-sm hover:underline">About</a></li>
                    </ul>
                </div>

                {/* Newsletter Section */}
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold mb-4">Newsletter</h3>
                    <p className="text-sm mb-4">Subscribe to get the latest updates.</p>
                    <div className="flex items-center space-x-2">
                        <Input placeholder="Enter your email" className="flex-1" />
                        <Button>Subscribe</Button>
                    </div>
                </div>

                {/* Social Media Section */}
                <div className="flex flex-col ml-12">
                    <h3 className="text-lg font-bold mb-4">Follow Us</h3>
                    <div className="flex space-x-4">
                        <a href="#" className="hover:text-gray-400">
                            <Twitter size={24} />
                        </a>
                        <a href="#" className="hover:text-gray-400">
                            <Facebook size={24} />
                        </a>
                        <a href="#" className="hover:text-gray-400">
                            <Instagram size={24} />
                        </a>
                    </div>
                </div>
            </div>

            <div className="mt-10 border-t border-gray-700 pt-4 text-center">
                <p className="text-sm">&copy; {new Date().getFullYear()} Garuda All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;