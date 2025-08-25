"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "../components/Footer";

export default function ContactPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-gray-900"
    >
      <Card className="w-full max-w-md sm:max-w-lg shadow-2xl bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-green-700">
            ติดต่อเรา
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">ข้อมูลการติดต่อสนามฟุตบอล</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">ชื่อสนาม</h3>
            <p className="text-gray-600">Sirinthra Stadium </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">ที่ตั้ง</h3>
            <p className="text-gray-600">สน.3054 ตำบล เหล่าปอแดง อำเภอเมืองสกลนคร สกลนคร , Sakhon Nakhon, Thailand, Sakon Nakhon</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">เบอร์โทรศัพท์</h3>
            <p className="text-gray-600">096-354-7894</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">เพจ Facebook</h3>
            <a
              href="https://web.facebook.com/sirinthrasport/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800 font-medium underline"
            >
              เยี่ยมชมเพจ Facebook ของเรา
            </a>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">แผนที่</h3>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d672.4230186825993!2d104.2021061237397!3d17.09960087994801!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x313cf5c498a0ae03%3A0xc37b1ed5cc157397!2z4Liq4LiZ4Liy4Lih4Lir4LiN4LmJ4Liy4LmA4LiX4Li14Lii4LihIOC4quC4tOC4o-C4tOC4meC4l-C4o-C4siDguKrguYDguJXguYDguJTguLXguKLguKE!5e1!3m2!1sen!2sth!4v1756140219918!5m2!1sen!2sth"
              width="100%"
              height="300"
              style={{ border: "0" }}
              allowFullScreen={true}
              loading="lazy"
              className="rounded-md"
            ></iframe>
          </div>
        </CardContent>
      </Card>
      
    </div>
    
  );
  
}