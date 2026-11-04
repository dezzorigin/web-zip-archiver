import { NextResponse } from 'next/server';

const API_HEADERS = {
 "accept": "*/*",
 "content-type": "application/json",
 "origin": "https://saveweb2zip.com",
 "referer": "https://saveweb2zip.com/",
 "user-agent": "Mozilla/5.0 (Linux; Android 14; SM-A225F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
 "accept-language": "en-US,en;q=0.9",
 "cache-control": "no-cache",
 "pragma": "no-cache",
};

export async function POST(request: Request) {
 try {
 const body = await request.json();
 const { url, renameAssets, saveStructure, alternativeAlgorithm, mobileVersion } = body;

 if (!url || !/^https:\/\//i.test(url)) {
 return NextResponse.json({ error: "Sertakan URL lengkap yang valid (harus dimulai dengan https://)." }, { status: 400 });
 }

 const payload = {
 url,
 renameAssets: !!renameAssets,
 saveStructure: !!saveStructure,
 alternativeAlgorithm: !!alternativeAlgorithm,
 mobileVersion: !!mobileVersion
 };

 const response = await fetch("https://copier.saveweb2zip.com/api/copySite", {
 method: "POST",
 headers: API_HEADERS,
 body: JSON.stringify(payload),
 });

 if (!response.ok) {
 throw new Error(`API responded with status ${response.status}`);
 }

 const data = await response.json();
 return NextResponse.json(data);
 } catch (error) {
 return NextResponse.json(
 { error: "Gagal memulai proses cloning: " + (error as Error).message },
 { status: 500 }
 );
 }
}
