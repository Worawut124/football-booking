"use client";

import Link from "next/link";
import { AiOutlineTikTok } from "react-icons/ai";
import { FaFacebookF } from "react-icons/fa";
import { AiOutlineInstagram } from "react-icons/ai";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Heart,
  Star,
  Sparkles,
  Trophy,
  Users,
  Calendar,
  Shield
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Stadium Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-green-600 rounded-full p-2">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                Sirinthra Stadium
              </h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              สนามฟุตบอลหญ้าเทียมคุณภาพสูง พร้อมสิ่งอำนวยความสะดวกครบครัน สำหรับนักกีฬาทุกระดับ
            </p>
            <div className="flex items-center gap-2 text-green-300">
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm ml-2">สนามคุณภาพ 5 ดาว</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-300 flex items-center gap-2">
              <Users className="h-5 w-5" />
              เมนูหลัก
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-300 hover:text-green-300 transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                  หน้าแรก
                </Link>
              </li>
              <li>
                <Link href="/booking" className="text-gray-300 hover:text-green-300 transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                  จองสนาม
                </Link>
              </li>
              <li>
                <Link href="/competition-list" className="text-gray-300 hover:text-green-300 transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                  การแข่งขัน
                </Link>
              </li>
              <li>
                <Link href="/Products" className="text-gray-300 hover:text-green-300 transition-colors duration-200 flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                  สินค้า
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-300 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              ติดต่อเรา
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    สน.3054 ตำบล เหล่าปอแดง<br />
                    อำเภอเมืองสกลนคร สกลนคร<br />
                    ประเทศไทย
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-400" />
                <a href="tel:096-354-7894" className="text-gray-300 hover:text-green-300 transition-colors">
                  096-354-7894
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-green-400" />
                <span className="text-gray-300 text-sm">เปิดทุกวัน 09:00 - 22:00</span>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-300 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              ติดตามเรา
            </h3>
            <p className="text-gray-300 text-sm">
              ติดตามข่าวสาร กิจกรรม และโปรโมชั่นพิเศษ
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.tiktok.com/@sirinthra1367?is_from_webapp=1&sender_device=pc"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/10 backdrop-blur-sm rounded-full p-3 hover:bg-green-600 transition-all duration-300 transform hover:scale-110"
              >
                <AiOutlineTikTok className="h-6 w-6 text-green-300 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://web.facebook.com/sirinthrasport/"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/10 backdrop-blur-sm rounded-full p-3 hover:bg-blue-600 transition-all duration-300 transform hover:scale-110"
              >
                <FaFacebookF className="h-6 w-6 text-green-300 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://www.instagram.com/sirinthra.stadium?igsh=dTlwb296c3QycW5h"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/10 backdrop-blur-sm rounded-full p-3 hover:bg-pink-600 transition-all duration-300 transform hover:scale-110"
              >
                <AiOutlineInstagram className="h-6 w-6 text-green-300 group-hover:text-white transition-colors" />
              </a>
            </div>
            
            {/* Newsletter */}
            <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">รับข่าวสาร</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                สมัครรับข้อมูลข่าวสารและโปรโมชั่นพิเศษ
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="อีเมลของคุณ"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white text-sm font-medium transition-colors">
                  สมัคร
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 mb-6"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-300">
            <Heart className="h-4 w-4 text-red-400 animate-pulse" />
            <span className="text-sm">
              Copyright © {currentYear} สนามฟุตบอลหญ้าเทียม Sirinthra Stadium สิรินทรา
            </span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-green-300 transition-colors">
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link href="/terms" className="hover:text-green-300 transition-colors">
              ข้อกำหนดการใช้งาน
            </Link>
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-green-400" />
              <span>ปลอดภัย 100%</span>
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        <div className="absolute bottom-6 right-6">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-green-600 hover:bg-green-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
          >
            <svg className="h-5 w-5 text-white group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
