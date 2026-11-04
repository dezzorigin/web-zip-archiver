import { NextRequest, NextResponse } from 'next/server';

const API_HEADERS = {
 "accept": "*/*",
 "origin": "https://saveweb2zip.com",
 "referer": "https://saveweb2zip.com/",
 "user-agent": "Mozilla/5.0 (Linux; Android 14; SM-A225F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
 "accept-language": "en-US,en;q=0.9",
 "cache-control": "no-cache",
 "pragma": "no-cache",
};

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
 try {
 const md5 = req.nextUrl.searchParams.get('md5');

 if (!md5) {
 return NextResponse.json({ error: "MD5 hash Task ID tidak ditemukan." }, { status: 400 });
 }

 const response = await fetch(`https://copier.saveweb2zip.com/api/getStatus/${md5}`, {
 method: "GET",
 headers: API_HEADERS,
 });

 if (!response.ok) {
 throw new Error(`API responded with status ${response.status}`);
 }

 const data = await response.json();
 return NextResponse.json(data);
 } catch (error) {
 return NextResponse.json(
 { error: "Gagal mengambil status: " + (error as Error).message },
 { status: 500 }
 );
 }
}
