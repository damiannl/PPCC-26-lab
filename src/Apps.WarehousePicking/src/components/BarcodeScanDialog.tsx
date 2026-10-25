import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  Body1,
  Button,
  Caption1,
  Card,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Spinner,
  Subtitle2,
} from "@fluentui/react-components";
import { BarcodeScannerRegular } from "@fluentui/react-icons";
import { getClient } from "@microsoft/power-apps/data";
import { Lab_productsService } from "@/generated/services/Lab_productsService";
import { Lab_warehouseitemsService } from "@/generated/services/Lab_warehouseitemsService";
import { OpenFoodFactsService } from "@/generated/services/OpenFoodFactsService";
import type { Product } from "@/generated/models/OpenFoodFactsModel";
import { useToast } from "@/hooks/use-toast";
import { bytesToDataUrl, toBytes } from "@/utils/Binary";
import { errorText } from "@/utils/ErrorText";
import { dataSourcesInfo } from "../../.power/schemas/appschemas/dataSourcesInfo";
import { servicePayload, serviceResult } from "@/utils/ServicePayload";
import { useStyles } from "@/styles/BarcodeScanDialog.styles";

const client = getClient(dataSourcesInfo);

type BarcodeScanDialogProps = {
  itemId: string;
  currentProductId?: string;
  onLinked: () => void;
};

export function BarcodeScanDialog({ itemId, currentProductId, onLinked }: BarcodeScanDialogProps) {
  const styles = useStyles();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [imageBytes, setImageBytes] = useState<Uint8Array | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const lookupStartedRef = useRef(false);
  const productFoundRef = useRef(false);
  const lookupRef = useRef<(value: string) => void>(() => undefined);

  const handleLookup = async (value: string) => {
    const normalizedBarcode = value.trim();
    if (!normalizedBarcode || isLookingUp || isLoadingImage) return;

    lookupStartedRef.current = true;
    productFoundRef.current = false;
    setBarcode(normalizedBarcode);
    setLookupError("");
    setProduct(null);
    setImageDataUrl("");
    setImageBytes(null);
    setIsLookingUp(true);

    try {
      const result = await OpenFoodFactsService.GetProductByBarcode(normalizedBarcode);
      if (!result.success || !result.data) {
        setLookupError("No product found for this barcode");
        return;
      }

      setProduct(result.data);
      productFoundRef.current = true;
      setIsLookingUp(false);

      if (result.data.imageUrl) {
        setIsLoadingImage(true);
        try {
          const imageResult = await OpenFoodFactsService.GetProductImage(result.data.imageUrl);
          const bytes = imageResult.success ? toBytes(imageResult.data) : null;
          if (!bytes) throw new Error("Product image could not be loaded");
          setImageBytes(bytes);
          setImageDataUrl(bytesToDataUrl(bytes, "image/jpeg"));
        } catch {
          setImageBytes(null);
        } finally {
          setIsLoadingImage(false);
        }
      }
    } catch (error) {
      setLookupError(`Lookup failed: ${errorText(error)}`);
    } finally {
      setIsLookingUp(false);
    }
  };

  lookupRef.current = (value) => void handleLookup(value);

  useEffect(() => {
    if (open) {
      productFoundRef.current = false;
      setCameraError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !videoElement) return;

    const reader = new BrowserMultiFormatReader();
    let active = true;
    let stopScanning: (() => void) | undefined;

    reader
      .decodeFromVideoDevice(undefined, videoElement, (result) => {
        if (!active || !result || lookupStartedRef.current || productFoundRef.current) return;
        const decodedBarcode = result.getText().trim();
        if (!decodedBarcode) return;
        lookupStartedRef.current = true;
        setBarcode(decodedBarcode);
        lookupRef.current(decodedBarcode);
      })
      .then((controls) => {
        if (active) stopScanning = controls.stop;
        else controls.stop();
      })
      .catch((error: unknown) => {
        if (active) setCameraError(errorText(error));
      });

    return () => {
      active = false;
      stopScanning?.();
    };
  }, [open, videoElement]);

  const closeDialog = () => {
    setOpen(false);
    setBarcode("");
    setProduct(null);
    setLookupError("");
    setImageDataUrl("");
    setImageBytes(null);
    lookupStartedRef.current = false;
    productFoundRef.current = false;
  };

  const linkProduct = async () => {
    if (!product || !barcode) return;
    setIsLinking(true);

    try {
      let imageFailed = false;
      const escapedBarcode = barcode.replace(/'/g, "''");
      const matchingProducts = await serviceResult(Lab_productsService.getAll({
        select: ["lab_productid"],
        filter: `lab_ean eq '${escapedBarcode}'`,
        top: 1,
      }));
      let productId = matchingProducts.data?.[0]?.lab_productid;

      if (!productId) {
        await serviceResult(Lab_productsService.create(servicePayload({
          lab_name: product.name || barcode,
          lab_ean: barcode,
          lab_brand: product.brand,
          lab_quantity: product.quantity,
          lab_imageurl: product.imageUrl,
          lab_lastsyncedon: new Date().toISOString(),
        })));

        const createdProducts = await serviceResult(Lab_productsService.getAll({
          select: ["lab_productid"],
          filter: `lab_ean eq '${escapedBarcode}'`,
          top: 1,
        }));
        productId = createdProducts.data?.[0]?.lab_productid;
      }

      if (!productId) throw new Error("Could not resolve a Product record to link");

      await serviceResult(Lab_warehouseitemsService.update(itemId, servicePayload({
        "lab_productid@odata.bind": `/lab_products(${productId})`,
      })));

      if (product.imageUrl) {
        try {
          if (!imageBytes) throw new Error("Product image could not be loaded");
          const upload = await client.uploadFileToRecord(
            "lab_products",
            productId,
            "lab_productimage",
            `${barcode}.jpg`,
            imageBytes
          );
          if (!upload.success) throw upload.error ?? new Error("Image upload failed");
        } catch {
          imageFailed = true;
        }
      }

      if (imageFailed) toast.warning("Product linked to item, but its image failed to save");
      else toast.success("Product linked to item");
      onLinked();
      closeDialog();
    } catch (error) {
      toast.error(`Failed to link product: ${errorText(error)}`);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <>
      <Button
        appearance="outline"
        size="small"
        icon={<BarcodeScannerRegular />}
        data-testid="scan-barcode-button"
        onClick={() => setOpen(true)}
      >
        {currentProductId ? "Rescan Barcode" : "Scan Barcode"}
      </Button>

      <Dialog open={open} onOpenChange={(_, data) => (data.open ? setOpen(true) : closeDialog())}>
        <DialogSurface className={styles.surface}>
          <DialogBody>
            <DialogTitle>Scan Product Barcode</DialogTitle>
            <DialogContent className={styles.content}>
              <div className={styles.cameraFrame}>
                <video
                  ref={setVideoElement}
                  className={styles.video}
                  muted
                  autoPlay
                  playsInline
                  aria-label="Barcode camera view"
                />
                {cameraError && (
                  <div className={styles.cameraMessage} role="status">
                    <Body1>Camera unavailable. Type the barcode below to continue.</Body1>
                  </div>
                )}
              </div>

              <Field label="EAN / UPC barcode">
                <div className={styles.barcodeRow}>
                  <Input
                    className={styles.barcodeField}
                    value={barcode}
                    placeholder="e.g. 3017620422003"
                    inputMode="numeric"
                    autoComplete="off"
                      disabled={isLookingUp || isLoadingImage}
                    onChange={(_, data) => {
                      setBarcode(data.value);
                      setProduct(null);
                      setLookupError("");
                      setImageDataUrl("");
                      setImageBytes(null);
                      productFoundRef.current = false;
                    }}
                    data-testid="scan-ean-input"
                  />
                  <Button
                    type="button"
                    appearance="primary"
                    disabled={!barcode.trim() || isLookingUp || isLoadingImage}
                    onClick={() => void handleLookup(barcode)}
                    data-testid="scan-lookup-button"
                  >
                    {isLookingUp ? <Spinner size="tiny" /> : "Look Up"}
                  </Button>
                </div>
              </Field>

              {lookupError && <Body1 className={styles.error} role="alert">{lookupError}</Body1>}

              {product && (
                <Card className={styles.productPreview}>
                  {isLoadingImage && (
                    <div className={styles.imagePlaceholder}>
                      <Spinner size="tiny" />
                    </div>
                  )}
                  {imageDataUrl && <img src={imageDataUrl} alt={product.name ?? barcode} className={styles.image} />}
                  <div className={styles.productText}>
                    <Subtitle2 data-testid="scan-product-name">{product.name || barcode}</Subtitle2>
                    <Caption1 className={styles.muted}>
                      {[product.brand, product.quantity].filter(Boolean).join(" · ")}
                    </Caption1>
                  </div>
                </Card>
              )}
            </DialogContent>
            <DialogActions>
              <Button type="button" appearance="secondary" onClick={closeDialog}>Cancel</Button>
              <Button
                type="button"
                appearance="primary"
                disabled={!product || isLinking || isLoadingImage}
                onClick={() => void linkProduct()}
                data-testid="scan-link-button"
              >
                {isLinking ? <Spinner size="tiny" /> : "Link to Item"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}