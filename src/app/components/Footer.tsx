"use client";

import { AiOutlineTikTok } from "react-icons/ai";
import { FaFacebookF } from "react-icons/fa";
import { AiOutlineInstagram } from "react-icons/ai";

export default function Footer() {
  return (
    <footer className="w-full bg-green-900 text-white py-4 mt-0">
      <div className="flex flex-col items-center space-y-2 md:flex-row md:justify-center md:space-y-0 md:space-x-6">
        {/* ข้อความลิขสิทธิ์ */}
        <p className="text-sm text-center md:text-left">
          Copyright © 2026 สนามฟุตบอลหญ้าเทียม Sirinthra Stadium สิรินทรา
        </p>

        {/* ไอคอนโซเชียล */}
        <div className="flex space-x-4">
          <a
            href="https://www.tiktok.com/@sirinthra1367?is_from_webapp=1&sender_device=pc"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AiOutlineTikTok className="h-6 w-6 text-green-300 hover:text-green-100" />
          </a>
          <a
            href="https://web.facebook.com/sirinthrasport/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaFacebookF className="h-6 w-6 text-green-300 hover:text-green-100" />
          </a>
          <a
            href="https://www.instagram.com/sirinthra.stadium?igsh=dTlwb296c3QycW5h"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AiOutlineInstagram className="h-6 w-6 text-green-300 hover:text-green-100" />
          </a>
        </div>
      </div>
    </footer>
  );
}
