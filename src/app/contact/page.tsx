"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-gray-900"
      style={{
        backgroundImage: "url(/images/soccer-field-blur.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundBlendMode: "overlay",
      }}
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
            <p className="text-gray-600">สนามฟุตบอลกรีนฟิลด์</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">ที่ตั้ง</h3>
            <p className="text-gray-600">123 ถนนบอลสวยงาม, เขตสนามบอล, กรุงเทพฯ 10110</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">เบอร์โทรศัพท์</h3>
            <p className="text-gray-600">02-123-4567</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">เพจ Facebook</h3>
            <iframe
              src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fexamplefootballfield&tabs=timeline&width=340&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true"
              width="340"
              height="500"
              style={{ border: "none", overflow: "hidden" }}
              scrolling="no"
              frameBorder="0"
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              className="w-full sm:w-[340px] mx-auto"
            ></iframe>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}