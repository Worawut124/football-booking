import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function redactDatabaseUrl(url?: string | null) {
	if (!url) return null;
	try {
		const u = new URL(url);
		return { host: u.host, database: u.pathname.replace(/^\//, "") };
	} catch {
		return null;
	}
}

export async function GET() {
	try {
		const [competitions, announcements, products, categories, paymentConfig] = await Promise.all([
			prisma.competition.count(),
			prisma.announcement.count(),
			prisma.product.count(),
			prisma.category.count(),
			prisma.paymentConfig.count(),
		]);

		return NextResponse.json({
			ok: true,
			db: redactDatabaseUrl(process.env.DATABASE_URL ?? null),
			counts: { competitions, announcements, products, categories, paymentConfig },
		});
	} catch (error) {
		return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
	}
}
