const STORAGE_KEY = "wv_recently_viewed_v1";
const MAX_ITEMS = 8;
function safeParse(value){try{return JSON.parse(value)}catch{return []}}
export function getRecentlyViewed(){if(typeof window==="undefined")return [];try{const value=safeParse(localStorage.getItem(STORAGE_KEY)||"[]");return Array.isArray(value)?value:[]}catch{return []}}
export function saveRecentlyViewed(product){if(typeof window==="undefined"||!product?._id)return [];const item={_id:String(product._id),name:product.name||"Product",price:Number(product.price||0),image:product.image||(Array.isArray(product.images)?product.images[0]:"")||"",images:Array.isArray(product.images)?product.images.slice(0,5):[],category:product.category||"Product",rating:Number(product.rating||0),numReviews:Number(product.numReviews||0),viewedAt:new Date().toISOString()};const current=getRecentlyViewed().filter(x=>String(x?._id)!==item._id);const next=[item,...current].slice(0,MAX_ITEMS);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next))}catch{}return next}
export function removeRecentlyViewed(productId){const next=getRecentlyViewed().filter(x=>String(x?._id)!==String(productId));if(typeof window!=="undefined"){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next))}catch{}}return next}
export function clearRecentlyViewed(){if(typeof window!=="undefined"){try{localStorage.removeItem(STORAGE_KEY)}catch{}}return []}
