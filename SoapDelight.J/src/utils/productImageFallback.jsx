import React, { useState } from "react";
import { FaRegImage } from "react-icons/fa";

const CATEGORY_LABELS = {
  soap: "手作皂",
  "手作皂": "手作皂",
  candle: "香薰蠟",
  "香薰蠟": "香薰蠟",
  "personal care": "個人護理",
  "個人護理": "個人護理",
  gift: "精選禮物",
  "精選禮物": "精選禮物",
};

export const isValidProductImage = (image) => {
  if (typeof image !== "string") return false;
  const trimmedImage = image.trim();
  return (
    trimmedImage.length > 0 &&
    trimmedImage !== "undefined" &&
    trimmedImage !== "null"
  );
};

export const getProductImages = (product) => {
  const image = product?.image;
  if (Array.isArray(image)) {
    return image.filter(isValidProductImage);
  }
  return isValidProductImage(image) ? [image.trim()] : [];
};

export const getProductImage = (product) => getProductImages(product)[0] || "";

export const getProductImageStatus = (product) =>
  getProductImage(product) ? "真實相片" : "預設圖";

export const getProductPlaceholderLabel = (category) => {
  const categoryKey = String(category || "").trim().toLowerCase();
  return CATEGORY_LABELS[categoryKey] || String(category || "商品");
};

const ProductImageFallback = ({ category, className = "" }) => {
  const categoryLabel = getProductPlaceholderLabel(category);

  return (
    <div
      className={`flex h-full min-h-full w-full flex-col items-center justify-center gap-3 rounded-[inherit] border border-dashed border-zinc-200 bg-[#f7f8f4] p-5 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 ${className}`}
      aria-label="相片稍後補上"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm dark:bg-zinc-950 dark:text-zinc-500">
        <FaRegImage size={22} />
      </span>
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
        {categoryLabel}
      </span>
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-100">
        相片稍後補上
      </span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        商品相片整理中
      </span>
    </div>
  );
};

export const ProductImage = ({
  product,
  alt,
  className = "",
  fallbackClassName = "",
  ...imageProps
}) => {
  const [failed, setFailed] = useState(false);
  const src = failed ? "" : getProductImage(product);

  if (!src) {
    return (
      <ProductImageFallback
        category={product?.category}
        className={fallbackClassName}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt || product?.name || "商品圖片"}
      className={className}
      onError={() => setFailed(true)}
      {...imageProps}
    />
  );
};

export default ProductImageFallback;
