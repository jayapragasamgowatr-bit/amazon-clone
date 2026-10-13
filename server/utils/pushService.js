let webpush=null; try{webpush=require("web-push")}catch{}
const User=require("../models/User");
function configured(){return Boolean(webpush&&process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&process.env.VAPID_SUBJECT)}
if(configured()) webpush.setVapidDetails(process.env.VAPID_SUBJECT,process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
async function sendPushToUser(userId,payload){if(!configured()||!userId)return {sent:0}; const user=await User.findById(userId).select("pushSubscriptions"); if(!user?.pushSubscriptions?.length)return {sent:0}; let sent=0; const keep=[]; for(const sub of user.pushSubscriptions){try{await webpush.sendNotification(sub,JSON.stringify(payload));sent++;keep.push(sub)}catch(e){if(e.statusCode!==404&&e.statusCode!==410)keep.push(sub)}} user.pushSubscriptions=keep; await user.save(); return {sent};}
module.exports={sendPushToUser,configured};
