import PusherServer from "pusher";

if (!process.env.PUSHER_APP_ID) throw new Error("Missing PUSHER_APP_ID");
if (!process.env.NEXT_PUBLIC_PUSHER_KEY) throw new Error("Missing NEXT_PUBLIC_PUSHER_KEY");
if (!process.env.PUSHER_SECRET) throw new Error("Missing PUSHER_SECRET");
if (!process.env.NEXT_PUBLIC_PUSHER_CLUSTER) throw new Error("Missing NEXT_PUBLIC_PUSHER_CLUSTER");

export const pusherServer = new PusherServer({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
});