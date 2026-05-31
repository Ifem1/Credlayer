import { NextRequest, NextResponse } from "next/server";
import { getNotifications, markNotificationRead } from "@/lib/supabase/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
      return NextResponse.json({ success: false, error: "Invalid wallet" }, { status: 400 });
    }
    const notifications = await getNotifications(wallet);
    return NextResponse.json({ success: true, data: notifications });
  } catch (err) {
    console.error("GET /api/notifications/[wallet] error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    await markNotificationRead(id, wallet);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/notifications error:", err);
    return NextResponse.json({ success: false, error: "Failed to mark read" }, { status: 500 });
  }
}
