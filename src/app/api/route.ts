import { NextRequest, NextResponse } from "next/server";



export async function GET(req: NextRequest) {
    console.log("req: ", req)
    const usersList = "{}"

    return NextResponse.json({usersList}, {status:200})
}
 