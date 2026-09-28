WAVENTRA VETRIC - MULTIPLE PRODUCT IMAGE UPDATE

Changed full files:

CLIENT
- client/pages/admin/edit-product/[id].js
- client/pages/product/[id].js
- client/lib/api.js

SERVER
- server/models/Product.js
- server/controllers/productController.js
- server/routes/productRoutes.js
- server/middlewares/uploadMiddleware.js

What this adds:
1. Product model supports up to 8 image URLs.
2. Admin Edit Product supports multiple image selection/upload.
3. Existing product images can be removed from the gallery list.
4. New images are uploaded to Cloudinary through the backend.
5. Product detail page already had gallery support; it now automatically cycles images every 3.5 seconds and still supports arrows/thumbnails.
6. apiFetch now supports FormData without forcing application/json headers.
7. Existing single image URL remains supported.

IMPORTANT:
Render/server environment must already contain:
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

The existing project already uses Cloudinary, so no new paid service is required by this change.

Upload limit:
- Maximum 8 images per product
- Maximum 5 MB per image
- JPEG, PNG, WEBP, GIF

API endpoint added:
POST /api/products/:id/images
Field name: images
Authentication: Admin required
