"use client";

import { AiOutlineTikTok } from "react-icons/ai";
import { FaFacebookF } from "react-icons/fa";
import { AiOutlineInstagram } from "react-icons/ai";

export default function Footer() {
  return (
    <footer className="w-full bg-green-900 text-white text-center py-4 mt-6">
      <div className="flex justify-center space-x-4 mb-2">
        <a href="https://www.tiktok.com/@sirinthra1367?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer">
          <AiOutlineTikTok className="h-6 w-6 text-green-300 hover:text-green-100" />
        </a>
        <a href="https://web.facebook.com/sirinthrasport/" target="_blank" rel="noopener noreferrer">
          <FaFacebookF className="h-6 w-6 text-green-300 hover:text-green-100" />
        </a>
        <a href="https://www.instagram.com/sirinthra.stadium?igsh=dTlwb296c3QycW5h" target="_blank" rel="noopener noreferrer">
          <AiOutlineInstagram className="h-6 w-6 text-green-300 hover:text-green-100" />
        </a>
      </div>
      <p className="text-sm">Copyright © 2026 สนามฟุตบอลหญ้าเทียม Sirinthra Stadium สิรินทรา</p>
    </footer>
  );
}