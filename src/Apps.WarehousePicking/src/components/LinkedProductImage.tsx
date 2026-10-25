import { useEffect, useState } from "react";
import { getClient } from "@microsoft/power-apps/data";
import { dataSourcesInfo } from "../../.power/schemas/appschemas/dataSourcesInfo";
import { bytesToDataUrl } from "@/utils/Binary";

const client = getClient(dataSourcesInfo);

type LinkedProductImageProps = {
  productId: string;
  alt: string;
  className: string;
};

export function LinkedProductImage({ productId, alt, className }: LinkedProductImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setImageUrl(null);

    client
      .downloadFileFromRecord("lab_products", productId, "lab_productimage")
      .then((result) => {
        if (active && result.success && result.data?.length) {
          setImageUrl(bytesToDataUrl(result.data, "image/jpeg"));
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [productId]);

  if (!imageUrl) return null;

  return <img src={imageUrl} alt={alt} className={className} onError={() => setImageUrl(null)} />;
}